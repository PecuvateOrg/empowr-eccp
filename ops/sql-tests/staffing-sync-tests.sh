#!/usr/bin/env bash
# Tests for the Members sync functions. Run AFTER staffing-assign-tests.sh and
# staffing-cancel-cover-tests.sh on the same disposable database (reuses coaches and tokens).
P="docker exec -i eccp-sqltest psql -U postgres -v ON_ERROR_STOP=1 -q -t -A"
ADMIN=11111111-1111-1111-1111-111111111111
STAFF=22222222-2222-2222-2222-222222222222
H=c0000000-0000-0000-0000-000000000001
V1=$(printf 'a%.0s' {1..64}); V2=$(printf 'b%.0s' {1..64}); V3=$(printf 'c%.0s' {1..64}); V4=$(printf 'd%.0s' {1..64})
R1=dddddddd-0000-0000-0000-000000000001; R2=dddddddd-0000-0000-0000-000000000002
R3=dddddddd-0000-0000-0000-000000000003; R4=dddddddd-0000-0000-0000-000000000004
R9=dddddddd-0000-0000-0000-000000000009

row() { # key start end status title [venue-name]
  local v=null; [ -n "$6" ] && v="{\"name\":\"$6\",\"address\":null,\"postcode\":\"AB1 2CD\"}"
  echo "{\"source_key\":\"$1\",\"offering_id\":\"off-1\",\"title\":\"$5\",\"starts_at\":\"$2\",\"ends_at\":\"$3\",\"status\":\"$4\",\"venue\":$v}"
}
K1a=$(row occurrence:1 2027-02-01T10:00:00Z 2027-02-01T12:00:00Z scheduled "Skate A" Rink)
K1b=$(row occurrence:1 2027-02-01T12:30:00Z 2027-02-01T13:30:00Z scheduled "Skate A" Rink)
K2a=$(row occurrence:2 2027-02-01T13:00:00Z 2027-02-01T14:00:00Z scheduled "Skate B" Rink)
K2b=$(row occurrence:2 2027-02-01T13:00:00Z 2027-02-01T14:00:00Z scheduled "Skate B renamed" Rink)
K3a=$(row occurrence:3 2027-02-02T10:00:00Z 2027-02-02T11:00:00Z scheduled "Skate C")
K3b=$(row occurrence:3 2027-02-02T10:00:00Z 2027-02-02T11:00:00Z cancelled "Skate C")
K4=$(row course-run:9:2027-02-03 2027-02-03T10:00:00Z 2027-02-03T11:00:00Z scheduled "Course D")
KP=$(row occurrence:past 2020-01-01T10:00:00Z 2020-01-01T11:00:00Z scheduled "Old")
K5=$(row occurrence:5 2027-02-05T10:00:00Z 2027-02-05T11:00:00Z scheduled "Skate E")

apply() { $P -c "set role service_role; select eccp.staffing_apply_snapshot('$1','$2','$3'::jsonb)" 2>&1 | grep -E '^(ERROR|\{)' | head -1; }
F() { echo "-- $1"; $P -c "set role service_role; select eccp.$2" 2>&1 | grep -E '^(ERROR|[0-9a-z{])' | head -1; }
sess() { $P -c "select reconciliation_state||' | status '||source_status||' | starts '||to_char(starts_at at time zone 'UTC','HH24:MI')||' | proposal '||coalesce(to_char(proposed_starts_at at time zone 'UTC','HH24:MI'),'none')||' | missing '||consecutive_missing||' | '||title from eccp.staffing_sessions where source_key='$1'"; }
sid() { $P -c "select id from eccp.staffing_sessions where source_key='$1'"; }
counts() { $P -c "select (select count(*) from eccp.staffing_sessions where source_system='members')||' sessions, '||(select count(*) from eccp.staffing_sync_runs)||' runs'"; }

echo "== run 1: five new sessions"
echo "-- apply: $(apply $R1 $V1 "[$K1a,$K2a,$K3a,$K4,$KP]")"
echo "-- same run id again (already_applied, nothing changes): $(apply $R1 $V1 "[$K1a,$K2a,$K3a,$K4,$KP]")"
echo "occurrence:1 -> $(sess occurrence:1)"

echo "== give head coach H shifts on occurrence:1 (10:00-12:00) and occurrence:2 (13:00-14:00)"
F "assign" "staffing_assign_shifts('$ADMIN','$H',array['$(sid occurrence:1)','$(sid occurrence:2)']::uuid[],'head',false,null,gen_random_uuid())"

echo "== run 2: occurrence:1 moves to 12:30 (would double-book H), 3 cancelled, 4 and past missing, 2 renamed, 5 new"
echo "-- apply: $(apply $R2 $V2 "[$K1b,$K2b,$K3b,$K5]")"
echo "occurrence:1 -> $(sess occurrence:1)"
echo "H's shift on occurrence:1 still starts $($P -c "select to_char(starts_at at time zone 'UTC','HH24:MI') from eccp.shift_assignments where session_id='$(sid occurrence:1)' and state='confirmed'")"
echo "occurrence:2 -> $(sess occurrence:2)"
echo "occurrence:3 -> $(sess occurrence:3)"
echo "course-run:9 -> $(sess course-run:9:2027-02-03)"
echo "occurrence:past -> $(sess occurrence:past)"
echo "occurrence:5 -> $(sess occurrence:5)"
echo "-- retry run 2 (already_applied): $(apply $R2 $V2 "[$K1b,$K2b,$K3b,$K5]")"
echo "course-run:9 missing count after retry (expect 1): $($P -c "select consecutive_missing from eccp.staffing_sessions where source_key='course-run:9:2027-02-03'")"

echo "== review"
F "staff accepts a review (ECS03)" "staffing_accept_session_review('$STAFF','$(sid occurrence:1)')"
F "admin accepts occurrence:1 move: double-books H (ECS23)" "staffing_accept_session_review('$ADMIN','$(sid occurrence:1)')"
echo "after refusal: $(sess occurrence:1)"
F "accepting a session not under review (ECS06)" "staffing_accept_session_review('$ADMIN','$(sid occurrence:2)')"

echo "== run 3: course-run:9 missing a second time -> review"
echo "-- apply: $(apply $R3 $V3 "[$K1b,$K2b,$K3b,$K5]")"
echo "course-run:9 -> $(sess course-run:9:2027-02-03)"
echo "== run 4: course-run:9 back -> missing count 0, review stays"
echo "-- apply: $(apply $R4 $V4 "[$K1b,$K2b,$K3b,$K4,$K5]")"
echo "course-run:9 -> $(sess course-run:9:2027-02-03)"
F "admin accepts course-run:9 (no time change)" "staffing_accept_session_review('$ADMIN','$(sid course-run:9:2027-02-03)')"
echo "course-run:9 -> $(sess course-run:9:2027-02-03)"

echo "== free H's 13:00 shift, then the occurrence:1 move is accepted and H's shift moves with it"
F "cancel H on occurrence:2" "staffing_cancel_assignment('$ADMIN',(select id from eccp.shift_assignments where session_id='$(sid occurrence:2)' and state='confirmed'),'moved to another session')"
F "admin accepts occurrence:1" "staffing_accept_session_review('$ADMIN','$(sid occurrence:1)')"
echo "occurrence:1 -> $(sess occurrence:1)"
echo "H's shift on occurrence:1 now starts $($P -c "select to_char(starts_at at time zone 'UTC','HH24:MI') from eccp.shift_assignments where session_id='$(sid occurrence:1)' and state='confirmed'")"
echo "reviewed by admin: $($P -c "select reviewed_by='a0000000-0000-0000-0000-000000000001' from eccp.staffing_sessions where source_key='occurrence:1'")"
echo "occurrence:3 cancelled in Members; its row kept: $($P -c "select count(*) from eccp.staffing_sessions where source_key='occurrence:3'")"

echo "== bad snapshots write nothing (expect ECS00 and unchanged counts)"
BEFORE=$(counts)
echo "-- duplicate key: $(apply dddddddd-0000-0000-0000-000000000010 $V1 "[$K5,$K5]")"
echo "-- end before start: $(apply dddddddd-0000-0000-0000-000000000011 $V1 "[$(row occurrence:7 2027-03-01T11:00:00Z 2027-03-01T10:00:00Z scheduled X)]")"
echo "-- unreadable time: $(apply dddddddd-0000-0000-0000-000000000012 $V1 "[$(row occurrence:7 not-a-time 2027-03-01T10:00:00Z scheduled X)]")"
echo "-- bad source key: $(apply dddddddd-0000-0000-0000-000000000013 $V1 "[$(row bogus 2027-03-01T10:00:00Z 2027-03-01T11:00:00Z scheduled X)]")"
echo "-- bad snapshot version: $(apply dddddddd-0000-0000-0000-000000000014 nothex "[$K5]")"
echo "before: $BEFORE / after: $(counts)"

echo "== failure records"
F "record failure for a new run" "staffing_record_sync_failure('$R9','members_unreachable')"
F "failure for an already successful run is ignored" "staffing_record_sync_failure('$R1','members_unreachable')"
echo "run results: $($P -c "select string_agg(right(id::text,1)||'='||result, ', ' order by id) from eccp.staffing_sync_runs where id in ('$R1','$R9')")"
F "free-text failure category refused (ECS00)" "staffing_record_sync_failure('$R9','Connection refused at 10.0.0.1')"

echo "== access (expect permission denied)"
$P -c "set role service_role; insert into eccp.staffing_sync_runs(id,result) values(gen_random_uuid(),'success')" 2>&1 | head -1
$P -c "set role service_role; insert into eccp.staffing_sessions(source_system,source_key,offering_id,title,starts_at,ends_at,source_status,last_seen_snapshot) values('members','occurrence:x','o','t',now(),now()+interval '1 hour','scheduled','v')" 2>&1 | head -1
$P -c "set role anon; select eccp.staffing_apply_snapshot('$R1','$V1','[]'::jsonb)" 2>&1 | head -1
$P -c "set role authenticated; select eccp.staffing_accept_session_review('$ADMIN','$(sid occurrence:1)')" 2>&1 | head -1
