-- Phase 1 scheduling proposal. REVIEW AGAINST EXISTING ECCP SCHEMA IN STAGING.
-- Not deployed. These tables must not be created in production without sign-off.
create table if not exists eccp.coach_session_assignments (
 id uuid primary key default gen_random_uuid(),
 coach_id uuid not null references eccp.coaches(id),
 -- Session source is provisional until the existing session registry is confirmed.
 external_session_id text not null,
 session_date date not null,
 start_time time not null,
 end_time time not null,
 status text not null default 'offered'
   check (status in ('offered','accepted','declined','withdrawn','completed','cancelled')),
 decision_reason text,
 session_start_at timestamptz not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (start_time < end_time),
 unique (coach_id, external_session_id)
);
create index if not exists coach_session_assignments_coach_date_idx
 on eccp.coach_session_assignments (coach_id, session_date);
create table if not exists eccp.coach_assignment_alert_outbox (
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null references eccp.coach_session_assignments(id) on delete cascade,
 coach_id uuid not null references eccp.coaches(id),
 alert_type text not null check (alert_type in ('availability_conflict','urgent_withdrawal')),
 status text not null default 'pending' check (status in ('pending','sent','failed')),
 created_at timestamptz not null default now(),
 sent_at timestamptz
);
-- Production integration must use a transaction/RPC to lock assignments,
-- compare old/new availability and enqueue only newly introduced conflicts.
-- Do not deliver notifications on every edit or silently overwrite assignments.
-- Coach accept/decline/withdraw must enforce caller identity and state in SQL,
-- not only client-side. Urgent withdrawal uses session_start_at (UTC instant).
-- No grants to anon or authenticated roles. Existing service-role-only policy applies.
