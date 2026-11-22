-- REVIEW ONLY. Apply through schema-of-record migration after approval.
-- Live check 2026-11-22: eccp.coaches.id is uuid; none of these tables exist yet.
begin;

create extension if not exists btree_gist with schema extensions;

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
 -- Complete successful snapshots in a row that did not contain this session.
 consecutive_missing integer not null default 0 check (consecutive_missing >= 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (source_system,source_key)
);

create table eccp.shift_assignments (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references eccp.staffing_sessions(id) on delete restrict,
 coach_id uuid not null references eccp.coaches(id) on delete restrict,
 role text not null check (role in ('head','assistant','junior_assistant','champion')),
 state text not null check (state in ('confirmed','cancelled')),
 -- Copied from the session by trigger so overlap can be enforced by constraint.
 starts_at timestamptz not null,
 ends_at timestamptz not null check (ends_at > starts_at),
 additional_paid boolean not null default false,
 reason text,
 approved_by uuid references eccp.coaches(id) on delete restrict,
 approved_at timestamptz,
 recurrence_ref uuid,
 pay_classification text,
 created_by uuid not null references eccp.coaches(id) on delete restrict,
 -- Idempotency key of the eccp.staffing_assign_shifts call that created the row.
 request_key uuid not null,
 cancelled_at timestamptz,
 cancelled_by uuid references eccp.coaches(id) on delete restrict,
 cancel_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (not additional_paid or (nullif(btrim(reason),'') is not null and approved_by is not null and approved_at is not null)),
 check ((state = 'cancelled') = (cancelled_at is not null and cancelled_by is not null)),
 -- One coach cannot hold two confirmed shifts that overlap in time
 -- (this also covers the same session twice).
 constraint shift_assignments_no_overlap exclude using gist (
  coach_id with =, tstzrange(starts_at, ends_at) with &&
 ) where (state = 'confirmed')
);
create index shift_assignments_coach_idx on eccp.shift_assignments(coach_id);
create unique index shift_assignments_request_unique on eccp.shift_assignments(request_key, session_id);
create index shift_assignments_session_idx on eccp.shift_assignments(session_id);

-- Append-only history of every assignment change.
create table eccp.shift_assignment_events (
 id bigint generated always as identity primary key,
 assignment_id uuid not null references eccp.shift_assignments(id) on delete restrict,
 actor_id uuid references eccp.coaches(id) on delete restrict,
 event_type text not null check (event_type in ('created','updated','cancelled',
  'cover_requested','cover_accepted','cover_declined','cover_withdrawn','cover_approved')),
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index shift_assignment_events_assignment_idx on eccp.shift_assignment_events(assignment_id);

-- Cover: the named replacement accepts, then management approves the swap.
create table eccp.shift_cover_requests (
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null references eccp.shift_assignments(id) on delete restrict,
 replacement_coach_id uuid not null references eccp.coaches(id) on delete restrict,
 requested_by uuid not null references eccp.coaches(id) on delete restrict,
 note text check (length(note) <= 500),
 state text not null default 'requested'
  check (state in ('requested','accepted','declined','withdrawn','approved')),
 accepted_at timestamptz,
 approved_by uuid references eccp.coaches(id) on delete restrict,
 approved_at timestamptz,
 replacement_assignment_id uuid references eccp.shift_assignments(id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((state in ('accepted','approved')) = (accepted_at is not null)),
 check ((state = 'approved') = (approved_by is not null and approved_at is not null
  and replacement_assignment_id is not null))
);
-- At most one open request per assignment.
create unique index shift_cover_requests_open_unique on eccp.shift_cover_requests(assignment_id)
 where state in ('requested','accepted');
create index shift_cover_requests_replacement_idx on eccp.shift_cover_requests(replacement_coach_id);

create table eccp.staffing_sync_runs (
 id uuid primary key default gen_random_uuid(),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 snapshot_version text,
 result text not null check (result in ('running','success','failed')),
 complete boolean not null default false,
 session_count integer check (session_count >= 0),
 missing_count integer check (missing_count >= 0),
 error_category text
);

-- Keep updated_at current.
create function eccp.staffing_touch_updated_at() returns trigger
language plpgsql set search_path = eccp, pg_temp as $$
begin new.updated_at := now(); return new; end $$;
create trigger staffing_sessions_touch before update on eccp.staffing_sessions
 for each row execute function eccp.staffing_touch_updated_at();
create trigger shift_assignments_touch before update on eccp.shift_assignments
 for each row execute function eccp.staffing_touch_updated_at();
create trigger shift_cover_requests_touch before update on eccp.shift_cover_requests
 for each row execute function eccp.staffing_touch_updated_at();

-- Assignment times always come from the session, never from the caller.
create function eccp.shift_assignment_copy_times() returns trigger
language plpgsql set search_path = eccp, pg_temp as $$
begin
 select s.starts_at, s.ends_at into strict new.starts_at, new.ends_at
 from eccp.staffing_sessions s where s.id = new.session_id;
 return new;
end $$;
create trigger shift_assignments_copy_times before insert or update of session_id, starts_at, ends_at
 on eccp.shift_assignments for each row execute function eccp.shift_assignment_copy_times();

-- A session time change moves its assignments; the overlap constraint then
-- rejects the whole update if any coach would be double-booked.
-- Security definer: the sync role has no direct write access to assignments.
create function eccp.staffing_session_propagate_times() returns trigger
language plpgsql security definer set search_path = eccp, pg_temp as $$
begin
 update eccp.shift_assignments set starts_at = new.starts_at, ends_at = new.ends_at
 where session_id = new.id;
 return new;
end $$;
create trigger staffing_sessions_propagate_times after update of starts_at, ends_at
 on eccp.staffing_sessions for each row
 when (old.starts_at is distinct from new.starts_at or old.ends_at is distinct from new.ends_at)
 execute function eccp.staffing_session_propagate_times();

-- Events can never be changed or removed, including by service_role.
create function eccp.shift_assignment_events_append_only() returns trigger
language plpgsql set search_path = eccp, pg_temp as $$
begin raise exception 'shift_assignment_events is append-only'; end $$;
create trigger shift_assignment_events_no_change before update or delete on eccp.shift_assignment_events
 for each row execute function eccp.shift_assignment_events_append_only();

alter table eccp.staffing_sessions enable row level security;
alter table eccp.shift_assignments enable row level security;
alter table eccp.shift_assignment_events enable row level security;
alter table eccp.staffing_sync_runs enable row level security;
alter table eccp.shift_cover_requests enable row level security;
revoke all on eccp.staffing_sessions, eccp.shift_assignments, eccp.shift_assignment_events, eccp.staffing_sync_runs,
 eccp.shift_cover_requests
 from public, anon, authenticated;
grant select, insert, update on eccp.staffing_sessions, eccp.staffing_sync_runs to service_role;
-- Assignments and their events are written only by reviewed security-definer
-- functions (ops/staffing-assign-function-proposed.sql), so every change is audited.
grant select on eccp.shift_assignments, eccp.shift_assignment_events, eccp.shift_cover_requests to service_role;
revoke all on function eccp.staffing_touch_updated_at(), eccp.shift_assignment_copy_times(),
 eccp.staffing_session_propagate_times(), eccp.shift_assignment_events_append_only() from public;
commit;
-- Writers, applied after this file in order: ops/staffing-assign-function-proposed.sql,
-- ops/staffing-cancel-cover-functions-proposed.sql.
