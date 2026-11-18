-- Apply to staging only after verifying session source, timezone, and access controls.
-- SECURITY DEFINER is limited to service_role; route verifies coach cookie.
create or replace function eccp.coach_decide_assignment(
 p_coach_id uuid, p_assignment_id uuid, p_decision text, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = eccp, pg_temp as $$
declare
 current_row eccp.coach_session_assignments%rowtype;
 next_status text;
 urgent boolean := false;
begin
 if p_decision not in ('accept','decline','withdraw') then raise exception 'Invalid decision'; end if;
 select * into current_row from eccp.coach_session_assignments
 where id = p_assignment_id and coach_id = p_coach_id for update;
 if not found then raise exception 'Assignment not found'; end if;
 if p_decision = 'accept' and current_row.status = 'offered' then next_status := 'accepted';
 elsif p_decision = 'decline' and current_row.status = 'offered' then next_status := 'declined';
 elsif p_decision = 'withdraw' and current_row.status = 'accepted' then
   if p_reason is null or length(trim(p_reason)) = 0 or length(p_reason) > 500 then
     raise exception 'Withdrawal reason required';
   end if;
   next_status := 'withdrawn';
   urgent := current_row.session_start_at >= now()
     and current_row.session_start_at < now() + interval '24 hours';
 else raise exception 'Invalid assignment transition'; end if;
 update eccp.coach_session_assignments
 set status = next_status, decision_reason = nullif(trim(p_reason),''),
     updated_at = now()
 where id = current_row.id;
 if urgent then
   insert into eccp.coach_assignment_alert_outbox(assignment_id, coach_id, alert_type)
   values (current_row.id, p_coach_id, 'urgent_withdrawal');
 end if;
 return jsonb_build_object('status',next_status,'urgent',urgent);
end;
$$;
revoke all on function eccp.coach_decide_assignment(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function eccp.coach_decide_assignment(uuid,uuid,text,text) to service_role;
