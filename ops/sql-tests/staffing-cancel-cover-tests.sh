#!/usr/bin/env bash
# Tests for cancel and cover. Run AFTER staffing-assign-tests.sh on the same
# disposable database: it reuses that script's coaches, sessions and shifts.
P="docker exec -i eccp-sqltest psql -U postgres -v ON_ERROR_STOP=1 -q -t -A"
ADMIN=11111111-1111-1111-1111-111111111111
STAFF=22222222-2222-2222-2222-222222222222
TH=44444444-4444-4444-4444-444444444441   # head coach H (holds s1 head, s3 head, s4 assistant)
TAS=44444444-4444-4444-4444-444444444442  # assistant coach AS (holds s2 assistant, extra pay)
TH2=44444444-4444-4444-4444-444444444443  # second head coach H2 (no shifts yet)
H=c0000000-0000-0000-0000-000000000001
AS=c0000000-0000-0000-0000-000000000002
J=c0000000-0000-0000-0000-000000000003
H2=c0000000-0000-0000-0000-000000000005
s() { echo "50000000-0000-0000-0000-00000000000$1"; }

$P <<EOF
insert into eccp.coaches(id,admin_role,coaching_grade) values('$H2','coach','head_coach');
insert into eccp.certificates(coach_id,renews_at) values('$H2','2027-12-31');
insert into eccp.coach_sessions(coach_id,refresh_token,expires_at) values
('$H','$TH',now()+interval '1 hour'),('$AS','$TAS',now()+interval '1 hour'),('$H2','$TH2',now()+interval '1 hour');
EOF

# Shift id for a coach on a session.
shift() { $P -c "select id from eccp.shift_assignments where coach_id='$1' and session_id='$(s $2)' and state='confirmed'"; }
# F "label" "function(args)" -> result or the error.
F() {
  echo "-- $1"
  $P -c "set role service_role; select eccp.$2" 2>&1 | grep -E '^(ERROR|[0-9a-z{])' | head -1
}
events() { $P -c "select count(*) from eccp.shift_assignment_events"; }

S3=$(shift $H 3); S4=$(shift $H 4); S2=$(shift $AS 2)
echo "== request"
F "another coach requests cover for H's shift (ECS03)" "staffing_request_cover('$TAS','$S3','$H2',null)"
F "junior cannot cover a head role (ECS05)" "staffing_request_cover('$TH','$S3','$J',null)"
F "cover by the same coach (ECS00)" "staffing_request_cover('$TH','$S3','$H',null)"
R1=$($P -c "set role service_role; select eccp.staffing_request_cover('$TH','$S3','$H2','away that day')")
echo "-- H asks H2 to cover s3: $R1"
F "same request again returns the same id" "staffing_request_cover('$TH','$S3','$H2','away that day')"
F "second open request for the same shift (ECS06)" "staffing_request_cover('$TH','$S3','$AS',null)"

echo "== accept"
F "someone other than the named replacement accepts (ECS03)" "staffing_accept_cover('$TAS','$R1')"
F "H2 accepts" "staffing_accept_cover('$TH2','$R1')"
F "H2 accepts again (same id)" "staffing_accept_cover('$TH2','$R1')"

echo "== approve"
F "staff approves (ECS03)" "staffing_approve_cover('$STAFF','$R1')"
F "a coach approves (ECS03)" "staffing_approve_cover('$TH2','$R1')"
NEW=$($P -c "set role service_role; select eccp.staffing_approve_cover('$ADMIN','$R1')")
echo "-- admin approves: new shift $NEW"
F "approve again returns the same shift" "staffing_approve_cover('$ADMIN','$R1')"
echo "s3 now: $($P -c "select string_agg(case coach_id when '$H' then 'H' when '$H2' then 'H2' end||'='||state||'/'||role, ', ' order by state) from eccp.shift_assignments where session_id='$(s 3)'")"
echo "original cancel reason: $($P -c "select cancel_reason from eccp.shift_assignments where id='$S3'")"
echo "request state: $($P -c "select state||', replacement shift recorded: '||(replacement_assignment_id='$NEW') from eccp.shift_cover_requests where id='$R1'")"

echo "== approve refused when the replacement is double-booked; nothing changes"
R2=$($P -c "set role service_role; select eccp.staffing_request_cover('$ADMIN','$S2','$H',null)")
F "H accepts cover of s2 (H already holds s1, which overlaps)" "staffing_accept_cover('$TH','$R2')"
BEFORE=$(events)
F "admin approves (ECS23)" "staffing_approve_cover('$ADMIN','$R2')"
echo "after refusal: AS on s2 is $($P -c "select state from eccp.shift_assignments where id='$S2'"), request is $($P -c "select state from eccp.shift_cover_requests where id='$R2'"), new events: $(( $(events) - BEFORE ))"
F "H declines instead" "staffing_close_cover('$TH','$R2')"

echo "== extra pay terms carry over to the replacement"
R3=$($P -c "set role service_role; select eccp.staffing_request_cover('$TAS','$S2','$H2',null)")
F "H2 accepts" "staffing_accept_cover('$TH2','$R3')"
NEW2=$($P -c "set role service_role; select eccp.staffing_approve_cover('$ADMIN','$R3')")
echo "replacement (role|extra pay|reason|approved by admin): $($P -c "select role||'|'||additional_paid||'|'||reason||'|'||(approved_by='a0000000-0000-0000-0000-000000000001') from eccp.shift_assignments where id='$NEW2'")"

echo "== withdraw, then a new request is allowed"
R4=$($P -c "set role service_role; select eccp.staffing_request_cover('$TH','$S4','$H2',null)")
F "an unrelated coach closes it (ECS03)" "staffing_close_cover('$TAS','$R4')"
F "H withdraws" "staffing_close_cover('$TH','$R4')"
F "H2 cannot accept a withdrawn request (ECS06)" "staffing_accept_cover('$TH2','$R4')"
R5=$($P -c "set role service_role; select eccp.staffing_request_cover('$TH','$S4','$H2',null)")
echo "-- new request after withdrawal: ${R5:0:8}…"

echo "== cancel"
F "staff cancels (ECS03)" "staffing_cancel_assignment('$STAFF','$S4','ill')"
F "admin cancels without a reason (ECS00)" "staffing_cancel_assignment('$ADMIN','$S4','  ')"
F "admin cancels s4 (open request R5)" "staffing_cancel_assignment('$ADMIN','$S4','session no longer needed')"
echo "R5 is now: $($P -c "select state from eccp.shift_cover_requests where id='$R5'")"
BEFORE=$(events)
F "cancel again returns the same id" "staffing_cancel_assignment('$ADMIN','$S4','session no longer needed')"
echo "new events from the repeat: $(( $(events) - BEFORE ))"
F "cover for a cancelled shift (ECS06)" "staffing_request_cover('$TH','$S4','$H2',null)"

echo "== history for s3 (who did what, in order)"
$P -c "select event_type from eccp.shift_assignment_events where assignment_id in ('$S3','$NEW') order by id" | tr '\n' ' '; echo

echo "== direct writes by service_role (expect permission denied)"
$P -c "set role service_role; update eccp.shift_cover_requests set state='approved'" 2>&1 | head -1
$P -c "set role service_role; insert into eccp.shift_cover_requests(assignment_id,replacement_coach_id,requested_by) values('$S2','$H2','$H2')" 2>&1 | head -1
echo "== anon cannot call the functions (expect permission denied)"
$P -c "set role anon; select eccp.staffing_cancel_assignment('$ADMIN','$S2','x')" 2>&1 | head -1
$P -c "set role authenticated; select eccp.staffing_approve_cover('$ADMIN','$R1')" 2>&1 | head -1
