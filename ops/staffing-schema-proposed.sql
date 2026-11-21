-- REVIEW ONLY. Apply through schema-of-record migration after approval.
begin;
create table eccp.staffing_sessions (
 id uuid primary key default gen_random_uuid(),
 source_system text not null,
 source_key text not null,
 offering_id text not null,
 title text not null,
 starts_at timestamptz not null,
 ends_at timestamptz not null check (ends_at > starts_at),
 venue jsonb,
 source_status text not null check (source_status in ('scheduled','cancelled')),
 reconciliation_state text not null default 'current' check (reconciliation_state in ('current','review')),
 last_seen_snapshot text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (source_system,source_key)
);
-- Derive the actual coaches.id type instead of assuming UUID.
do $$
declare coach_type text;
begin
 select format_type(a.atttypid,a.atttypmod) into strict coach_type
 from pg_attribute a where a.attrelid='eccp.coaches'::regclass and a.attname='id' and not a.attisdropped;
 execute format('create table eccp.shift_assignments (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references eccp.staffing_sessions(id) on delete restrict,
 coach_id %1$s not null references eccp.coaches(id) on delete restrict,
 role text not null check (role in (''head'',''assistant'',''junior_assistant'',''champion'')),
 state text not null check (state in (''confirmed'',''cancelled'')),
 additional_paid boolean not null default false,
 reason text,
 approved_by %1$s references eccp.coaches(id) on delete restrict,
 approved_at timestamptz,
 recurrence_ref uuid,
 pay_classification text,
 created_at timestamptz not null default now(),
 check (not additional_paid or (nullif(btrim(reason),'''') is not null and approved_by is not null and approved_at is not null))
 )',coach_type);
end $$;
create unique index shift_assignments_active_unique on eccp.shift_assignments(session_id,coach_id) where state='confirmed';
create index shift_assignments_coach_idx on eccp.shift_assignments(coach_id);
create table eccp.staffing_sync_runs (
 id uuid primary key default gen_random_uuid(),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 snapshot_version text,
 result text not null check (result in ('running','success','failed')),
 session_count integer check (session_count >= 0),
 error_category text
);
alter table eccp.staffing_sessions enable row level security;
alter table eccp.shift_assignments enable row level security;
alter table eccp.staffing_sync_runs enable row level security;
revoke all on eccp.staffing_sessions,eccp.shift_assignments,eccp.staffing_sync_runs from public,anon,authenticated;
grant select,insert,update on eccp.staffing_sessions,eccp.shift_assignments,eccp.staffing_sync_runs to service_role;
commit;
-- No assignment writer is enabled. Transactional overlap, eligibility,
-- audit and reconciliation procedures must be reviewed before activation.
