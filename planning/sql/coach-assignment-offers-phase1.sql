-- STAGING REVIEW ONLY. Must run after coach-scheduling-phase1.sql.
-- Application route enforces staff access; service-role-only RPC enforces data consistency.
create or replace function eccp.staff_offer_coach_assignment(
 p_coach_id uuid, p_session_id text, p_session_date date,
 p_start_time time, p_end_time time, p_start_at timestamptz
) returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare created_id uuid;
begin
 if length(trim(p_session_id)) = 0 or length(p_session_id) > 150
  or p_start_time >= p_end_time or p_start_at <= now() then
  raise exception 'Invalid session offer';
 end if;
 if (p_start_at at time zone 'Europe/London')::date <> p_session_date or
    (p_start_at at time zone 'Europe/London')::time <> p_start_time then
  raise exception 'UTC start does not match London session time';
 end if;
 if not exists(select 1 from eccp.coaches where id = p_coach_id) then
  raise exception 'Coach not found';
 end if;
 insert into eccp.coach_session_assignments
 (coach_id, external_session_id, session_date, start_time, end_time, session_start_at, status)
 values (p_coach_id, trim(p_session_id), p_session_date, p_start_time, p_end_time, p_start_at, 'offered')
 returning id into created_id;
 return created_id;
end;
$$;
revoke all on function eccp.staff_offer_coach_assignment(uuid,text,date,time,time,timestamptz)
 from public, anon, authenticated;
grant execute on function eccp.staff_offer_coach_assignment(uuid,text,date,time,time,timestamptz)
 to service_role;
-- Availability conflict alert integration is deliberately NOT live.
-- Requires transactional comparison of existing and new availability plus outbox delivery.
