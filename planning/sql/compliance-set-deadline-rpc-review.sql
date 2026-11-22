-- REVIEW ONLY. Requires Shaun/Pecuvate sign-off and the proposed
-- eccp.coach_compliance_deadlines + eccp.coach_compliance_deadline_audit tables.
-- Run only after checking the deployed coaches.id type and schema permissions.
-- Application must authenticate the actor from its session, never request JSON.
-- SECURITY INVOKER deliberately retains the ECCP service-role boundary.
create or replace function eccp.compliance_set_deadline(
  p_actor_id uuid,
  p_coach_id uuid,
  p_requirement text,
  p_deadline date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old eccp.coach_compliance_deadlines%rowtype;
  v_id uuid;
  v_role text;
begin
  if p_actor_id is null or p_coach_id is null or p_deadline is null or
     p_requirement not in ('safeguarding','first_aid','dbs','training','qualification') then
    raise exception 'Invalid compliance deadline input' using errcode = '22023';
  end if;
  -- This role check is defence in depth; server session authorisation is mandatory.
  select admin_role into v_role from eccp.coaches where id = p_actor_id;
  if v_role is distinct from 'admin' and v_role is distinct from 'staff' then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if not exists (select 1 from eccp.coaches where id = p_coach_id) then
    raise exception 'Coach not found' using errcode = '22023';
  end if;
  select * into v_old from eccp.coach_compliance_deadlines
    where coach_id = p_coach_id and requirement = p_requirement for update;
  if found then
    if v_old.completion_status <> 'outstanding' then
      raise exception 'Cannot edit a completed or not-required item' using errcode = '22023';
    end if;
    update eccp.coach_compliance_deadlines
      set completion_deadline = p_deadline, updated_by = p_actor_id, updated_at = now()
      where id = v_old.id returning id into v_id;
    if v_old.completion_deadline is distinct from p_deadline then
      insert into eccp.coach_compliance_deadline_audit
        (coach_id, requirement, old_deadline, new_deadline, old_status, new_status, changed_by)
      values (p_coach_id, p_requirement, v_old.completion_deadline, p_deadline,
        v_old.completion_status, v_old.completion_status, p_actor_id);
    end if;
  else
    insert into eccp.coach_compliance_deadlines
      (coach_id, requirement, completion_status, completion_deadline, updated_by)
    values (p_coach_id, p_requirement, 'outstanding', p_deadline, p_actor_id)
    returning id into v_id;
    insert into eccp.coach_compliance_deadline_audit
      (coach_id, requirement, old_deadline, new_deadline, old_status, new_status, changed_by)
    values (p_coach_id, p_requirement, null, p_deadline, null, 'outstanding', p_actor_id);
  end if;
  return v_id;
end;
$$;

-- EXECUTE on this function must remain restricted to service_role.
revoke all on function eccp.compliance_set_deadline(uuid,uuid,text,date)
  from public, anon, authenticated;
grant execute on function eccp.compliance_set_deadline(uuid,uuid,text,date)
  to service_role;
