-- Staging-only upgrade; apply AFTER coach-details-phase1.sql and coach-scheduling-phase1.sql.
-- Replaces the earlier availability RPC so conflicts are recorded atomically.
-- Availability conflict alerts are queued only for newly conflicting active assignments.
-- Lock the coach row to serialize concurrent availability edits for the same coach.
create or replace function eccp.replace_coach_availability(
 p_coach_id uuid, p_weekly jsonb, p_exceptions jsonb
) returns void language plpgsql security definer set search_path = eccp, pg_temp as $$
declare
 a record;
 old_conflicts uuid[] := '{}';
 new_conflict boolean;
 old_conflict boolean;
begin
 if jsonb_typeof(p_weekly) is distinct from 'array' or
    jsonb_typeof(p_exceptions) is distinct from 'array' or
    jsonb_array_length(p_weekly) > 70 or jsonb_array_length(p_exceptions) > 366 then
   raise exception 'Invalid availability payload';
 end if;
 perform 1 from eccp.coaches where id = p_coach_id for update;
 if not found then raise exception 'Coach not found'; end if;
 -- Capture existing conflicts before replacing availability.
 for a in select * from eccp.coach_session_assignments
   where coach_id = p_coach_id and status in ('offered','accepted')
     and session_start_at >= now() for update
 loop
   select not (
     case when exists(select 1 from eccp.coach_availability_exceptions e
       where e.coach_id=p_coach_id and e.exception_date=a.session_date)
     then exists(select 1 from eccp.coach_availability_exceptions e
       where e.coach_id=p_coach_id and e.exception_date=a.session_date and e.available
       and e.start_time <= a.start_time and e.end_time >= a.end_time)
     else exists(select 1 from eccp.coach_weekly_availability w
       where w.coach_id=p_coach_id
       and w.weekday=((extract(isodow from a.session_date)::int - 1))
       and w.start_time <= a.start_time and w.end_time >= a.end_time)
     end
   ) into old_conflict;
   if old_conflict then old_conflicts := array_append(old_conflicts,a.id); end if;
 end loop;
 delete from eccp.coach_weekly_availability where coach_id=p_coach_id;
 insert into eccp.coach_weekly_availability(coach_id,weekday,start_time,end_time)
 select p_coach_id,(item->>'weekday')::smallint,(item->>'start')::time,(item->>'end')::time
 from jsonb_array_elements(p_weekly) item;
 delete from eccp.coach_availability_exceptions where coach_id=p_coach_id;
 insert into eccp.coach_availability_exceptions(coach_id,exception_date,available,start_time,end_time)
 select p_coach_id,(item->>'date')::date,(item->>'available')::boolean,
  case when (item->>'available')::boolean then (item->>'start')::time else null end,
  case when (item->>'available')::boolean then (item->>'end')::time else null end
 from jsonb_array_elements(p_exceptions) item;
 for a in select * from eccp.coach_session_assignments
   where coach_id=p_coach_id and status in ('offered','accepted')
     and session_start_at >= now()
 loop
   select not (
     case when exists(select 1 from eccp.coach_availability_exceptions e
       where e.coach_id=p_coach_id and e.exception_date=a.session_date)
     then exists(select 1 from eccp.coach_availability_exceptions e
       where e.coach_id=p_coach_id and e.exception_date=a.session_date and e.available
       and e.start_time <= a.start_time and e.end_time >= a.end_time)
     else exists(select 1 from eccp.coach_weekly_availability w
       where w.coach_id=p_coach_id
       and w.weekday=(extract(isodow from a.session_date)::int - 1)
       and w.start_time <= a.start_time and w.end_time >= a.end_time)
     end
   ) into new_conflict;
   if new_conflict and not (a.id = any(old_conflicts)) then
     insert into eccp.coach_assignment_alert_outbox(assignment_id,coach_id,alert_type)
     values (a.id,p_coach_id,'availability_conflict');
   end if;
 end loop;
end;
$$;
revoke all on function eccp.replace_coach_availability(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function eccp.replace_coach_availability(uuid,jsonb,jsonb) to service_role;
-- Queuing is not delivery. A separately reviewed worker must deliver alerts.
