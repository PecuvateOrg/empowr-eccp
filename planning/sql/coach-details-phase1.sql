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

-- The ONE definition of replace_coach_availability (maintainers, 2026-11-20).
-- Replaces the coach's availability atomically. Exposed only to service_role; the
-- caller's coach identity is checked by the authenticated Next.js route, never
-- accepted from the browser. The coach row is locked so concurrent edits serialise.
-- Session assignments live in EFN (owner decision 2026-11-20), so there are no
-- ECCP-side assignment conflicts to check here.
create or replace function eccp.replace_coach_availability(
 p_coach_id uuid, p_weekly jsonb, p_exceptions jsonb
) returns void language plpgsql security definer set search_path = eccp, pg_temp as $$
begin
 if jsonb_typeof(p_weekly) is distinct from 'array' or
    jsonb_typeof(p_exceptions) is distinct from 'array' or
    jsonb_array_length(p_weekly) > 70 or jsonb_array_length(p_exceptions) > 366 then
   raise exception 'Invalid availability payload';
 end if;
 perform 1 from eccp.coaches where id = p_coach_id for update;
 if not found then raise exception 'Coach not found'; end if;
 delete from eccp.coach_weekly_availability where coach_id = p_coach_id;
 insert into eccp.coach_weekly_availability(coach_id,weekday,start_time,end_time)
 select p_coach_id,(item->>'weekday')::smallint,(item->>'start')::time,(item->>'end')::time
 from jsonb_array_elements(p_weekly) item;
 delete from eccp.coach_availability_exceptions where coach_id = p_coach_id;
 insert into eccp.coach_availability_exceptions(coach_id,exception_date,available,start_time,end_time)
 select p_coach_id,(item->>'date')::date,(item->>'available')::boolean,
  case when (item->>'available')::boolean then (item->>'start')::time else null end,
  case when (item->>'available')::boolean then (item->>'end')::time else null end
 from jsonb_array_elements(p_exceptions) item;
end;
$$;
revoke all on function eccp.replace_coach_availability(uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function eccp.replace_coach_availability(uuid,jsonb,jsonb) to service_role;
