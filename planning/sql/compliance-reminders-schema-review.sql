-- REVIEW ONLY: do not apply before Shaun/Pecuvate approves the schema and RLS.
-- Compliance completion deadlines are NOT certificate expiry dates.
-- Existing coaches table is the identity source; no email address is stored here.
create table if not exists eccp.coach_compliance_deadlines (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references eccp.coaches(id) on delete cascade,
  requirement text not null check (requirement in ('safeguarding','first_aid','dbs','training','qualification')),
  completion_status text not null default 'outstanding'
    check (completion_status in ('outstanding','complete','not_required')),
  completion_deadline date,
  updated_by uuid references eccp.coaches(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (coach_id, requirement),
  constraint outstanding_requires_deadline check (completion_status <> 'outstanding' or completion_deadline is not null)
);

create table if not exists eccp.coach_compliance_reminder_events (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references eccp.coaches(id) on delete cascade,
  requirement text not null check (requirement in ('safeguarding','first_aid','dbs','training','qualification')),
  completion_deadline date not null,
  cadence text not null check (cadence in ('manual','seven_days','one_day','overdue')),
  idempotency_key text not null unique,
  initiated_by uuid references eccp.coaches(id),
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending','sent','failed','suppressed')),
  provider_message_id text,
  error_code text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create table if not exists eccp.coach_compliance_deadline_audit (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references eccp.coaches(id) on delete cascade,
  requirement text not null,
  old_deadline date,
  new_deadline date,
  old_status text,
  new_status text,
  changed_by uuid references eccp.coaches(id),
  changed_at timestamptz not null default now()
);

-- ECCP uses a service-role-only schema. Server route handlers must enforce
-- session-cookie and permission checks; RLS alone does not protect service-role access.
alter table eccp.coach_compliance_deadlines enable row level security;
alter table eccp.coach_compliance_reminder_events enable row level security;
alter table eccp.coach_compliance_deadline_audit enable row level security;
revoke all on eccp.coach_compliance_deadlines from anon, authenticated;
revoke all on eccp.coach_compliance_reminder_events from anon, authenticated;
revoke all on eccp.coach_compliance_deadline_audit from anon, authenticated;

-- Review decisions before execution:
-- 1. Confirm eccp.coaches.id is uuid and the deployed schema matches these FKs.
-- 2. Review whether a single requirement can have multiple training instances.
-- 3. Implement audited SECURITY DEFINER RPCs with explicit actor checks and fixed search_path.
-- 4. Define transactional reservation/retry semantics for reminder events before sending.
-- 5. Add migration rollback, existing-data backfill and staging integration tests.
