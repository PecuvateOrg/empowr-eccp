-- REVIEW ONLY. Apply after ops/staffing-schema-proposed.sql, through the
-- schema-of-record migration, after maintainer approval and staging tests.
--
-- eccp.staffing_assign_shifts: the only writer of new shift assignments.
-- Mirrors src/lib/staffing-assignment-plan.ts (planAssignments) inside one
-- transaction: all sessions are assigned, or none are.
--
-- Rule sources:
--   admin only ............... manage_scheduling (src/lib/coach-permissions.ts)
--   roles head/assistant/junior_assistant, never champion ... planAssignments
--   additional pay needs reason; approver = actor ........... validateAllocation
--   grade -> role ............ company/offer/eccp.md and
--                              company/operations/coaching-programme-delivery-framework.md:
--                              a Head Coach may work as a Coach; a Junior Assistant Coach
--                              (16-17) cannot cover an adult role.
--   PROPOSED, not yet a decision: a certificate valid on the session date.
--
-- Not enforced here (release gates, see ops/staffing-integration-review.md):
--   first aid for head coaches (no database record of first aid exists yet),
--   availability (open maintainer decision), child count and coverage (no source column),
--   more than one head per session needing approval.
--
-- Error codes (SQLSTATE) for the app to map to messages:
--   ECS00 invalid input   ECS03 not authorised   ECS04 session not assignable
--   ECS05 coach not eligible   ECS09 idempotency key reused with a different request
--   ECS23 conflicting allocation (overlap or already assigned)
begin;

-- Shared eligibility rules for assignment and cover. Returns null when the
-- coach may fill the role, otherwise the reason. p_starts null = grade only.
create function eccp.staffing_eligibility_error(p_coach_id uuid, p_role text, p_starts timestamptz)
returns text language plpgsql stable security definer set search_path = eccp, pg_temp as $$
declare v_grade text;
begin
 select coaching_grade into v_grade from eccp.coaches where id = p_coach_id;
 if not found then return 'coach not found'; end if;
 if v_grade is null or not (
   (v_grade = 'head_coach' and p_role in ('head','assistant'))
   or (v_grade = 'assistant_coach' and p_role = 'assistant')
   or (v_grade = 'junior_assistant_coach' and p_role = 'junior_assistant')) then
  return 'coach not eligible for this role';
 end if;
 -- PROPOSED: certificate valid on the session date (UK time).
 if p_starts is not null and not exists (select 1 from eccp.certificates c
   where c.coach_id = p_coach_id and c.renews_at >= (p_starts at time zone 'Europe/London')::date) then
  return 'coach has no certificate valid on the session date';
 end if;
 return null;
end $$;
revoke all on function eccp.staffing_eligibility_error(uuid,text,timestamptz) from public, anon, authenticated;

create function eccp.staffing_assign_shifts(
 p_session_token text,
 p_coach_id uuid,
 p_session_ids uuid[],
 p_role text,
 p_additional_paid boolean,
 p_reason text,
 p_idempotency_key uuid)
returns uuid[]
language plpgsql security definer set search_path = eccp, pg_temp as $$
declare
 v_actor uuid; v_actor_role text;
 v_grade text; v_coach_role text;
 v_session record;
 v_ids uuid[] := '{}'; v_id uuid;
 v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
 v_paid boolean := coalesce(p_additional_paid,false);
 v_count integer;
 v_err text;
begin
 -- Who is calling comes from the session, never from the request.
 select actor_id, actor_role into v_actor, v_actor_role from eccp.message_actor(p_session_token);
 if v_actor is null or v_actor_role <> 'admin' then
  raise exception 'not authorised' using errcode = 'ECS03';
 end if;

 if p_coach_id is null or p_idempotency_key is null or p_session_ids is null
  or cardinality(p_session_ids) not between 1 and 100
  or array_position(p_session_ids, null) is not null
  or (select count(distinct x) from unnest(p_session_ids) x) <> cardinality(p_session_ids)
  or p_role is null or p_role not in ('head','assistant','junior_assistant')
  or (v_paid and v_reason is null) or length(coalesce(v_reason,'')) > 500 then
  raise exception 'invalid input' using errcode = 'ECS00';
 end if;

 -- Serialise calls for one coach, and retries of one key.
 perform pg_advisory_xact_lock(hashtextextended('staffing-assign:' || p_coach_id::text, 0));

 -- Retry: same key returns the same rows; a different request is refused.
 select count(*) into v_count from eccp.shift_assignments where request_key = p_idempotency_key;
 if v_count > 0 then
  if exists (select 1 from eccp.shift_assignments where request_key = p_idempotency_key
              and (coach_id <> p_coach_id or role <> p_role or additional_paid <> v_paid
                   or reason is distinct from v_reason or created_by <> v_actor
                   or not session_id = any(p_session_ids)))
   or v_count <> cardinality(p_session_ids) then
   raise exception 'idempotency key reused' using errcode = 'ECS09';
  end if;
  select array_agg(id order by session_id) into v_ids
  from eccp.shift_assignments where request_key = p_idempotency_key;
  return v_ids;
 end if;

 -- Lock the coach so a grade change cannot land mid-check.
 select coaching_grade, admin_role::text into v_grade, v_coach_role
 from eccp.coaches where id = p_coach_id for share;
 if not found then raise exception 'coach not found' using errcode = 'ECS05'; end if;
 v_err := eccp.staffing_eligibility_error(p_coach_id, p_role, null);
 if v_err is not null then raise exception '%', v_err using errcode = 'ECS05'; end if;

 -- Lock sessions in id order so concurrent calls cannot deadlock and a sync
 -- cannot move or cancel a session mid-check.
 for v_session in
  select s.* from eccp.staffing_sessions s
  where s.id = any(p_session_ids) order by s.id for share
 loop
  if v_session.source_status <> 'scheduled' or v_session.reconciliation_state <> 'current'
     or v_session.starts_at <= now() then
   raise exception 'session not assignable' using errcode = 'ECS04';
  end if;
  v_err := eccp.staffing_eligibility_error(p_coach_id, p_role, v_session.starts_at);
  if v_err is not null then raise exception '%', v_err using errcode = 'ECS05'; end if;

  begin
   insert into eccp.shift_assignments
    (session_id, coach_id, role, state, starts_at, ends_at, additional_paid, reason,
     approved_by, approved_at, created_by, request_key)
   values
    (v_session.id, p_coach_id, p_role, 'confirmed', v_session.starts_at, v_session.ends_at,
     v_paid, v_reason,
     case when v_paid then v_actor end, case when v_paid then now() end,
     v_actor, p_idempotency_key)
   returning id into v_id;
  exception when exclusion_violation or unique_violation then
   raise exception 'conflicting allocation' using errcode = 'ECS23';
  end;

  insert into eccp.shift_assignment_events (assignment_id, actor_id, event_type, details)
  values (v_id, v_actor, 'created', jsonb_build_object(
   'session_id', v_session.id, 'coach_id', p_coach_id, 'role', p_role,
   'additional_paid', v_paid, 'request_key', p_idempotency_key));
  v_ids := v_ids || v_id;
 end loop;

 if cardinality(v_ids) <> cardinality(p_session_ids) then
  raise exception 'session not found' using errcode = 'ECS04';
 end if;
 return v_ids;
end $$;

revoke all on function eccp.staffing_assign_shifts(text,uuid,uuid[],text,boolean,text,uuid)
 from public, anon, authenticated;
grant execute on function eccp.staffing_assign_shifts(text,uuid,uuid[],text,boolean,text,uuid)
 to service_role;
commit;
