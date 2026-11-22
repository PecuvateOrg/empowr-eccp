-- REVIEW ONLY. Apply after ops/staffing-schema-proposed.sql and
-- ops/staffing-assign-function-proposed.sql, after maintainer approval and staging tests.
--
-- Audited writers for cancelling a shift and for cover. Mirrors
-- src/lib/staffing-cover-plan.ts: the named replacement accepts (eligible,
-- not the original coach), then an admin approves and the original shift is
-- swapped for the replacement's in one transaction.
--
-- PROPOSED, not yet a decision: who may raise a cover request (the original
-- coach for their own shift, or an admin). The code names no requester.
--
-- Error codes (SQLSTATE), same as the assign function:
--   ECS00 invalid input   ECS03 not authorised   ECS04 session not assignable
--   ECS05 coach not eligible   ECS06 wrong state (already cancelled, request not open, ...)
--   ECS23 conflicting allocation
begin;

-- Caller from the session token; null when there is no valid session.
create function eccp.staffing_actor(p_session_token text, out actor_id uuid, out actor_role text)
language sql stable security definer set search_path = eccp, pg_temp as $$
 select actor_id, actor_role from eccp.message_actor(p_session_token)
$$;
revoke all on function eccp.staffing_actor(text) from public, anon, authenticated;

-- 1. Cancel a confirmed shift (admin). Withdraws any open cover request.
--    Retrying a cancel that already happened returns without a second event.
create function eccp.staffing_cancel_assignment(
 p_session_token text, p_assignment_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare a record; v_actor uuid; v_role text;
 v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
 select actor_id, actor_role into v_actor, v_role from eccp.staffing_actor(p_session_token);
 if v_actor is null or v_role <> 'admin' then raise exception 'not authorised' using errcode = 'ECS03'; end if;
 if p_assignment_id is null or v_reason is null or length(v_reason) > 500 then
  raise exception 'invalid input' using errcode = 'ECS00';
 end if;
 select * into a from eccp.shift_assignments where id = p_assignment_id for update;
 if not found then raise exception 'assignment not found' using errcode = 'ECS00'; end if;
 if a.state = 'cancelled' then return a.id; end if;

 update eccp.shift_assignments
 set state = 'cancelled', cancelled_at = now(), cancelled_by = v_actor, cancel_reason = v_reason
 where id = a.id;
 insert into eccp.shift_assignment_events (assignment_id, actor_id, event_type, details)
 values (a.id, v_actor, 'cancelled', jsonb_build_object('reason', v_reason));

 with closed as (
  update eccp.shift_cover_requests set state = 'withdrawn'
  where assignment_id = a.id and state in ('requested','accepted') returning id)
 insert into eccp.shift_assignment_events (assignment_id, actor_id, event_type, details)
 select a.id, v_actor, 'cover_withdrawn', jsonb_build_object('cover_request_id', id, 'why', 'shift cancelled')
 from closed;
 return a.id;
end $$;

-- 2. Ask a named coach to cover a shift (original coach or admin).
--    Repeating an identical open request returns the same id.
create function eccp.staffing_request_cover(
 p_session_token text, p_assignment_id uuid, p_replacement_coach_id uuid, p_note text)
returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare a record; s record; v_actor uuid; v_role text; v_err text; v_open record; v_id uuid;
 v_note text := nullif(btrim(coalesce(p_note,'')),'');
begin
 select actor_id, actor_role into v_actor, v_role from eccp.staffing_actor(p_session_token);
 if v_actor is null then raise exception 'not authorised' using errcode = 'ECS03'; end if;
 if p_assignment_id is null or p_replacement_coach_id is null or length(coalesce(v_note,'')) > 500 then
  raise exception 'invalid input' using errcode = 'ECS00';
 end if;
 select * into a from eccp.shift_assignments where id = p_assignment_id for update;
 if not found then raise exception 'assignment not found' using errcode = 'ECS00'; end if;
 if v_role <> 'admin' and a.coach_id <> v_actor then
  raise exception 'not authorised' using errcode = 'ECS03';
 end if;
 if a.state <> 'confirmed' then raise exception 'shift is not confirmed' using errcode = 'ECS06'; end if;
 if p_replacement_coach_id = a.coach_id then raise exception 'invalid input' using errcode = 'ECS00'; end if;

 select * into s from eccp.staffing_sessions where id = a.session_id for share;
 if s.source_status <> 'scheduled' or s.reconciliation_state <> 'current' or s.starts_at <= now() then
  raise exception 'session not assignable' using errcode = 'ECS04';
 end if;
 select * into v_open from eccp.shift_cover_requests
 where assignment_id = a.id and state in ('requested','accepted');
 if found then
  if v_open.replacement_coach_id = p_replacement_coach_id and v_open.state = 'requested' then
   return v_open.id;
  end if;
  raise exception 'a cover request is already open for this shift' using errcode = 'ECS06';
 end if;

 v_err := eccp.staffing_eligibility_error(p_replacement_coach_id, a.role, s.starts_at);
 if v_err is not null then raise exception '%', v_err using errcode = 'ECS05'; end if;

 insert into eccp.shift_cover_requests (assignment_id, replacement_coach_id, requested_by, note)
 values (a.id, p_replacement_coach_id, v_actor, v_note) returning id into v_id;
 insert into eccp.shift_assignment_events (assignment_id, actor_id, event_type, details)
 values (a.id, v_actor, 'cover_requested', jsonb_build_object(
  'cover_request_id', v_id, 'replacement_coach_id', p_replacement_coach_id));
 return v_id;
end $$;

-- 3. The named replacement accepts (eligibility re-checked now).
create function eccp.staffing_accept_cover(p_session_token text, p_request_id uuid)
returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare r record; a record; s record; v_actor uuid; v_role text; v_err text;
begin
 select actor_id, actor_role into v_actor, v_role from eccp.staffing_actor(p_session_token);
 if v_actor is null then raise exception 'not authorised' using errcode = 'ECS03'; end if;
 select * into r from eccp.shift_cover_requests where id = p_request_id for update;
 if not found or r.replacement_coach_id <> v_actor then
  raise exception 'not authorised' using errcode = 'ECS03';
 end if;
 if r.state = 'accepted' then return r.id; end if;
 if r.state <> 'requested' then raise exception 'cover request is not open' using errcode = 'ECS06'; end if;

 select * into a from eccp.shift_assignments where id = r.assignment_id for share;
 select * into s from eccp.staffing_sessions where id = a.session_id for share;
 if a.state <> 'confirmed' then raise exception 'shift is not confirmed' using errcode = 'ECS06'; end if;
 if s.source_status <> 'scheduled' or s.reconciliation_state <> 'current' or s.starts_at <= now() then
  raise exception 'session not assignable' using errcode = 'ECS04';
 end if;
 v_err := eccp.staffing_eligibility_error(v_actor, a.role, s.starts_at);
 if v_err is not null then raise exception '%', v_err using errcode = 'ECS05'; end if;

 update eccp.shift_cover_requests set state = 'accepted', accepted_at = now() where id = r.id;
 insert into eccp.shift_assignment_events (assignment_id, actor_id, event_type, details)
 values (a.id, v_actor, 'cover_accepted', jsonb_build_object('cover_request_id', r.id));
 return r.id;
end $$;

-- 4. Close an open request: the replacement declines; the requester, the
--    original coach or an admin withdraws.
create function eccp.staffing_close_cover(p_session_token text, p_request_id uuid)
returns text language plpgsql security definer set search_path = eccp, pg_temp as $$
declare r record; a record; v_actor uuid; v_role text; v_state text;
begin
 select actor_id, actor_role into v_actor, v_role from eccp.staffing_actor(p_session_token);
 if v_actor is null then raise exception 'not authorised' using errcode = 'ECS03'; end if;
 select * into r from eccp.shift_cover_requests where id = p_request_id for update;
 if not found then raise exception 'not authorised' using errcode = 'ECS03'; end if;
 select * into a from eccp.shift_assignments where id = r.assignment_id;
 if v_actor = r.replacement_coach_id then v_state := 'declined';
 elsif v_role = 'admin' or v_actor = r.requested_by or v_actor = a.coach_id then v_state := 'withdrawn';
 else raise exception 'not authorised' using errcode = 'ECS03'; end if;
 if r.state = v_state then return v_state; end if;
 if r.state not in ('requested','accepted') then
  raise exception 'cover request is not open' using errcode = 'ECS06';
 end if;
 update eccp.shift_cover_requests set state = v_state,
  accepted_at = case when v_state = 'declined' then null else accepted_at end
 where id = r.id;
 insert into eccp.shift_assignment_events (assignment_id, actor_id, event_type, details)
 values (a.id, v_actor, ('cover_' || v_state), jsonb_build_object('cover_request_id', r.id));
 return v_state;
end $$;

-- 5. Admin approves an accepted request: original cancelled, replacement
--    created with the same role and pay terms, all in one transaction.
create function eccp.staffing_approve_cover(p_session_token text, p_request_id uuid)
returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare r record; a record; s record; v_actor uuid; v_role text; v_err text; v_new uuid;
begin
 select actor_id, actor_role into v_actor, v_role from eccp.staffing_actor(p_session_token);
 if v_actor is null or v_role <> 'admin' then raise exception 'not authorised' using errcode = 'ECS03'; end if;
 select * into r from eccp.shift_cover_requests where id = p_request_id;
 if not found then raise exception 'cover request not found' using errcode = 'ECS00'; end if;
 select * into a from eccp.shift_assignments where id = r.assignment_id;

 -- Same lock order as the assign function: per-coach advisory locks
 -- (lowest id first), then rows.
 perform pg_advisory_xact_lock(hashtextextended('staffing-assign:' || least(a.coach_id, r.replacement_coach_id)::text, 0));
 perform pg_advisory_xact_lock(hashtextextended('staffing-assign:' || greatest(a.coach_id, r.replacement_coach_id)::text, 0));
 select * into r from eccp.shift_cover_requests where id = p_request_id for update;
 select * into a from eccp.shift_assignments where id = r.assignment_id for update;

 if r.state = 'approved' then return r.replacement_assignment_id; end if;
 if r.state <> 'accepted' then raise exception 'cover request is not accepted' using errcode = 'ECS06'; end if;
 if a.state <> 'confirmed' then raise exception 'shift is not confirmed' using errcode = 'ECS06'; end if;
 select * into s from eccp.staffing_sessions where id = a.session_id for share;
 if s.source_status <> 'scheduled' or s.reconciliation_state <> 'current' or s.starts_at <= now() then
  raise exception 'session not assignable' using errcode = 'ECS04';
 end if;
 perform 1 from eccp.coaches where id = r.replacement_coach_id for share;
 v_err := eccp.staffing_eligibility_error(r.replacement_coach_id, a.role, s.starts_at);
 if v_err is not null then raise exception '%', v_err using errcode = 'ECS05'; end if;

 update eccp.shift_assignments
 set state = 'cancelled', cancelled_at = now(), cancelled_by = v_actor,
     cancel_reason = 'covered by another coach'
 where id = a.id;
 begin
  insert into eccp.shift_assignments
   (session_id, coach_id, role, state, starts_at, ends_at, additional_paid, reason,
    approved_by, approved_at, recurrence_ref, pay_classification, created_by, request_key)
  values
   (a.session_id, r.replacement_coach_id, a.role, 'confirmed', s.starts_at, s.ends_at,
    a.additional_paid, a.reason,
    case when a.additional_paid then v_actor end, case when a.additional_paid then now() end,
    a.recurrence_ref, a.pay_classification, v_actor, r.id)
  returning id into v_new;
 exception when exclusion_violation or unique_violation then
  raise exception 'conflicting allocation' using errcode = 'ECS23';
 end;

 update eccp.shift_cover_requests
 set state = 'approved', approved_by = v_actor, approved_at = now(), replacement_assignment_id = v_new
 where id = r.id;
 insert into eccp.shift_assignment_events (assignment_id, actor_id, event_type, details) values
  (a.id, v_actor, 'cancelled', jsonb_build_object('reason','covered by another coach','cover_request_id', r.id)),
  (a.id, v_actor, 'cover_approved', jsonb_build_object('cover_request_id', r.id, 'replacement_assignment_id', v_new)),
  (v_new, v_actor, 'created', jsonb_build_object('cover_request_id', r.id, 'replaces_assignment_id', a.id));
 return v_new;
end $$;

revoke all on function eccp.staffing_cancel_assignment(text,uuid,text), eccp.staffing_request_cover(text,uuid,uuid,text),
 eccp.staffing_accept_cover(text,uuid), eccp.staffing_close_cover(text,uuid), eccp.staffing_approve_cover(text,uuid)
 from public, anon, authenticated;
grant execute on function eccp.staffing_cancel_assignment(text,uuid,text), eccp.staffing_request_cover(text,uuid,uuid,text),
 eccp.staffing_accept_cover(text,uuid), eccp.staffing_close_cover(text,uuid), eccp.staffing_approve_cover(text,uuid)
 to service_role;
commit;
