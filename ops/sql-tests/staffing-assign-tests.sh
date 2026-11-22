#!/usr/bin/env bash
# Tests for eccp.staffing_assign_shifts against a disposable Postgres container.
P="docker exec -i eccp-sqltest psql -U postgres -v ON_ERROR_STOP=1 -q -t -A"
A=11111111-1111-1111-1111-111111111111
H=c0000000-0000-0000-0000-000000000001
AS=c0000000-0000-0000-0000-000000000002
J=c0000000-0000-0000-0000-000000000003
N=c0000000-0000-0000-0000-000000000004
K1=aaaaaaaa-0000-0000-0000-000000000001
s() { echo "50000000-0000-0000-0000-00000000000$1"; }

$P <<'EOF'
insert into eccp.coaches(id,admin_role,coaching_grade) values
('a0000000-0000-0000-0000-000000000001','admin',null),('a0000000-0000-0000-0000-000000000002','staff',null),('a0000000-0000-0000-0000-000000000003','admin',null),
('c0000000-0000-0000-0000-000000000001','coach','head_coach'),('c0000000-0000-0000-0000-000000000002','coach','assistant_coach'),
('c0000000-0000-0000-0000-000000000003','coach','junior_assistant_coach'),('c0000000-0000-0000-0000-000000000004','coach',null);
insert into eccp.coach_sessions(coach_id,refresh_token,expires_at) values
('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',now()+interval '1 hour'),
('a0000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',now()+interval '1 hour'),
('a0000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333',now()-interval '1 hour');
insert into eccp.certificates(coach_id,renews_at) values
('c0000000-0000-0000-0000-000000000001','2027-12-31'),('c0000000-0000-0000-0000-000000000002','2026-12-15'),('c0000000-0000-0000-0000-000000000003','2027-12-31');
insert into eccp.staffing_sessions(id,source_system,source_key,offering_id,title,starts_at,ends_at,source_status,reconciliation_state,last_seen_snapshot) values
('50000000-0000-0000-0000-000000000001','m','s1','o','A','2026-12-01 10:00Z','2026-12-01 12:00Z','scheduled','current','v'),
('50000000-0000-0000-0000-000000000002','m','s2','o','B','2026-12-01 11:00Z','2026-12-01 13:00Z','scheduled','current','v'),
('50000000-0000-0000-0000-000000000003','m','s3','o','C','2026-12-01 14:00Z','2026-12-01 15:00Z','scheduled','current','v'),
('50000000-0000-0000-0000-000000000004','m','s4','o','D','2027-01-10 10:00Z','2027-01-10 11:00Z','scheduled','current','v'),
('50000000-0000-0000-0000-000000000005','m','s5','o','E','2020-01-01 10:00Z','2020-01-01 11:00Z','scheduled','current','v'),
('50000000-0000-0000-0000-000000000006','m','s6','o','F','2026-12-02 10:00Z','2026-12-02 11:00Z','cancelled','current','v'),
('50000000-0000-0000-0000-000000000007','m','s7','o','G','2026-12-03 10:00Z','2026-12-03 11:00Z','scheduled','review','v');
EOF

# C "label" "args" -> prints the result or the error code + message.
C() {
  echo "-- $1"
  $P -v VERBOSITY=verbose -c "set role service_role; select eccp.staffing_assign_shifts($2)" 2>&1 \
    | grep -E '^(ERROR|\{)' | head -1
}

C "staff token refused (ECS03)" "'22222222-2222-2222-2222-222222222222','$H',array['$(s 1)']::uuid[],'head',false,null,gen_random_uuid()"
C "expired admin token refused (ECS03)" "'33333333-3333-3333-3333-333333333333','$H',array['$(s 1)']::uuid[],'head',false,null,gen_random_uuid()"
C "bad token refused (ECS03)" "'nonsense','$H',array['$(s 1)']::uuid[],'head',false,null,gen_random_uuid()"
C "champion role refused (ECS00)" "'$A','$H',array['$(s 1)']::uuid[],'champion',false,null,gen_random_uuid()"
C "duplicate session ids refused (ECS00)" "'$A','$H',array['$(s 1)','$(s 1)']::uuid[],'head',false,null,gen_random_uuid()"
C "extra pay without reason refused (ECS00)" "'$A','$H',array['$(s 1)']::uuid[],'head',true,'  ',gen_random_uuid()"
C "assistant grade as head refused (ECS05)" "'$A','$AS',array['$(s 1)']::uuid[],'head',false,null,gen_random_uuid()"
C "junior as assistant refused (ECS05)" "'$A','$J',array['$(s 1)']::uuid[],'assistant',false,null,gen_random_uuid()"
C "no grade refused (ECS05)" "'$A','$N',array['$(s 1)']::uuid[],'assistant',false,null,gen_random_uuid()"
C "certificate expires before session refused (ECS05)" "'$A','$AS',array['$(s 4)']::uuid[],'assistant',false,null,gen_random_uuid()"
C "past session refused (ECS04)" "'$A','$H',array['$(s 5)']::uuid[],'head',false,null,gen_random_uuid()"
C "cancelled session refused (ECS04)" "'$A','$H',array['$(s 6)']::uuid[],'head',false,null,gen_random_uuid()"
C "session under review refused (ECS04)" "'$A','$H',array['$(s 7)']::uuid[],'head',false,null,gen_random_uuid()"
C "unknown session refused (ECS04)" "'$A','$H',array['$(s 9)']::uuid[],'head',false,null,gen_random_uuid()"

echo "== batch s1,s3,s2 for one coach: s2 overlaps s1, expect ECS23 and nothing written"
C "failing batch (ECS23)" "'$A','$H',array['$(s 1)','$(s 3)','$(s 2)']::uuid[],'head',false,null,gen_random_uuid()"
echo "rows after failed batch: $($P -c "select (select count(*) from eccp.shift_assignments)||' assignments, '||(select count(*) from eccp.shift_assignment_events)||' events'")"

C "good batch s1,s3 for head (2 ids)" "'$A','$H',array['$(s 1)','$(s 3)']::uuid[],'head',false,null,'$K1'"
C "retry same key, same request in another order (same 2 ids)" "'$A','$H',array['$(s 3)','$(s 1)']::uuid[],'head',false,null,'$K1'"
C "same key, different role (ECS09)" "'$A','$H',array['$(s 1)','$(s 3)']::uuid[],'assistant',false,null,'$K1'"
C "same key, fewer sessions (ECS09)" "'$A','$H',array['$(s 1)']::uuid[],'head',false,null,'$K1'"
C "head on overlapping s2 (ECS23)" "'$A','$H',array['$(s 2)']::uuid[],'assistant',false,null,gen_random_uuid()"
C "head as assistant on s4 ok (1 id)" "'$A','$H',array['$(s 4)']::uuid[],'assistant',false,null,gen_random_uuid()"
C "assistant on s2 with extra pay ok (1 id)" "'$A','$AS',array['$(s 2)']::uuid[],'assistant',true,' cover for ratios ',gen_random_uuid()"
C "junior on s1 ok (1 id)" "'$A','$J',array['$(s 1)']::uuid[],'junior_assistant',false,null,gen_random_uuid()"

echo "== final state (role|extra pay|reason|approved|created by admin)"
$P -c "select role, additional_paid, reason, approved_by is not null, created_by='a0000000-0000-0000-0000-000000000001' from eccp.shift_assignments order by starts_at, role"
echo "events: $($P -c "select count(*)||' events, all by admin: '||bool_and(actor_id='a0000000-0000-0000-0000-000000000001') from eccp.shift_assignment_events")"

echo "== direct writes by service_role (expect permission denied)"
$P -c "set role service_role; insert into eccp.shift_assignments(session_id,coach_id,role,state,starts_at,ends_at,created_by,request_key) values('$(s 3)','$AS','assistant','confirmed',now(),now(),'$AS',gen_random_uuid())" 2>&1 | head -1
$P -c "set role service_role; update eccp.shift_assignments set role='head'" 2>&1 | head -1
$P -c "set role service_role; insert into eccp.shift_assignment_events(assignment_id,event_type) select id,'updated' from eccp.shift_assignments limit 1" 2>&1 | head -1

echo "== anon / authenticated cannot call the function (expect permission denied)"
for r in anon authenticated; do
  $P -c "set role $r; select eccp.staffing_assign_shifts('$A','$H',array['$(s 3)']::uuid[],'head',false,null,gen_random_uuid())" 2>&1 | head -1
done

echo "== direct session write by service_role (expect permission denied; syncs go through staffing_apply_snapshot)"
$P -c "set role service_role; update eccp.staffing_sessions set starts_at='2026-12-01 14:30Z', ends_at='2026-12-01 15:30Z' where source_key='s3'" 2>&1 | head -1
