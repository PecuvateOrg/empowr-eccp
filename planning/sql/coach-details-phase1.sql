-- Phase 1 ECCP coach-owned details. Apply in staging only after Shaun reviews.
-- ECCP schema remains service-role only; every API route must check session.
create table if not exists eccp.coach_contact_profiles (
 coach_id uuid primary key references eccp.coaches(id) on delete cascade,
 phone text not null,
 emergency_contact_name text not null,
 emergency_contact_phone text not null,
 updated_at timestamptz not null default now()
);
create table if not exists eccp.coach_weekly_availability (
 id uuid primary key default gen_random_uuid(),
 coach_id uuid not null references eccp.coaches(id) on delete cascade,
 weekday smallint not null check (weekday between 0 and 6),
 start_time time not null,
 end_time time not null,
 check (start_time < end_time)
);
create index if not exists coach_weekly_availability_coach_idx on eccp.coach_weekly_availability(coach_id);
create table if not exists eccp.coach_availability_exceptions (
 id uuid primary key default gen_random_uuid(),
 coach_id uuid not null references eccp.coaches(id) on delete cascade,
 exception_date date not null,
 available boolean not null,
 start_time time,
 end_time time,
 unique(coach_id, exception_date),
 check ((available = false and start_time is null and end_time is null) or
        (available = true and start_time is not null and end_time is not null and start_time < end_time))
);
-- Migration does not grant access to anon/authenticated roles.
