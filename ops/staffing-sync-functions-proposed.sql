-- APPLIED to the live database 2026-11-22 (owner approval) as Empowr CIC
-- projects/supabase/migrations/20261122183001-04_eccp_staffing_*.sql. Keep this
-- file in step with those migrations; change live only through a new migration.
--
-- Members schedule -> eccp.staffing_sessions. These functions are the only
-- writers of sessions and sync runs, and the only home of the matching rules
-- (they replace planReconciliation in src/lib/staffing-reconciliation.ts).
-- The caller fetches and validates the snapshot (collectSchedule) and makes one call.
--
-- Rules:
--   new key -> inserted as current
--   in snapshot -> consecutive_missing = 0; title/offering updated without review
--   start, end or venue changed -> stored as a proposal + review; current times,
--     venue and coaches' shifts are NOT touched until an admin accepts
--   cancelled in Members -> source_status cancelled + review; shifts untouched
--   review, once set, stays until an admin accepts it
--   missing -> counted only for future scheduled sessions, once per distinct
--     successful run; the second run in a row that misses it sets review
--   duplicate key or malformed row -> the whole call is refused, nothing written
--   sessions and assignments are never deleted
--
--   missing is only counted inside the range the snapshot covers: Members sends
--     covers_until (null = every future session); a session starting at or after
--     it is not counted, so a shorter Members range never marks sessions missing
--
-- Error codes: ECS00 invalid input, ECS03 not authorised, ECS06 wrong state,
-- ECS23 conflicting allocation.
begin;

-- 1. Apply one complete, validated snapshot. Same run id twice = no change.
create function eccp.staffing_apply_snapshot(p_run_id uuid, p_snapshot_version text, p_covers_until timestamptz, p_sessions jsonb)
returns jsonb language plpgsql security definer set search_path = eccp, pg_temp as $$
declare v_now timestamptz := now(); v_inserted int; v_review int; v_missing int; v_seen int; v_prev record;
begin
 if p_run_id is null or p_snapshot_version is null or p_snapshot_version !~ '^[a-f0-9]{64}$'
  or p_sessions is null or jsonb_typeof(p_sessions) <> 'array' or jsonb_array_length(p_sessions) > 100000
  or p_covers_until <= now() then
  raise exception 'invalid input' using errcode = 'ECS00';
 end if;

 -- One sync at a time.
 perform pg_advisory_xact_lock(hashtextextended('staffing-sync', 0));
 select * into v_prev from eccp.staffing_sync_runs where id = p_run_id;
 if found and v_prev.result = 'success' then
  return jsonb_build_object('run_id', p_run_id, 'already_applied', true);
 end if;

 -- Parse every row first; any bad row refuses the whole call.
 create temp table snap on commit drop as
 select e->>'source_key' as source_key, e->>'offering_id' as offering_id, e->>'title' as title,
  e->>'starts_at' as starts_raw, e->>'ends_at' as ends_raw, e->>'status' as status, e->'venue' as venue,
  jsonb_typeof(e) as kind
 from jsonb_array_elements(p_sessions) e;

 if exists (select 1 from snap where kind <> 'object'
   or source_key is null or source_key !~ '^(occurrence:[^:]+|course-run:[^:]+:\d{4}-\d{2}-\d{2})$'
   or nullif(btrim(offering_id),'') is null or nullif(btrim(title),'') is null
   or status is null or status not in ('scheduled','cancelled')
   or starts_raw is null or ends_raw is null
   or not (venue is null or jsonb_typeof(venue) = 'null' or (jsonb_typeof(venue) = 'object'
     and nullif(btrim(venue->>'name'),'') is not null
     and (venue->'address' is null or jsonb_typeof(venue->'address') in ('null','string'))
     and (venue->'postcode' is null or jsonb_typeof(venue->'postcode') in ('null','string')))))
  or (select count(*) from snap) <> (select count(distinct source_key) from snap) then
  raise exception 'invalid input' using errcode = 'ECS00';
 end if;
 begin
  alter table snap add column starts_at timestamptz, add column ends_at timestamptz;
  update snap set starts_at = starts_raw::timestamptz, ends_at = ends_raw::timestamptz,
   venue = case when venue is null or jsonb_typeof(venue) = 'null' then null
    else jsonb_build_object('name', venue->>'name', 'address', venue->>'address', 'postcode', venue->>'postcode') end;
 exception when others then
  raise exception 'invalid input' using errcode = 'ECS00';
 end;
 if exists (select 1 from snap where ends_at <= starts_at) then
  raise exception 'invalid input' using errcode = 'ECS00';
 end if;
 select count(*) into v_seen from snap;

 -- Known sessions seen again.
 update eccp.staffing_sessions s set
  offering_id = d.offering_id, title = d.title, last_seen_snapshot = p_snapshot_version, consecutive_missing = 0,
  source_status = d.status,
  has_proposal = d.changed,
  proposed_starts_at = case when d.changed then d.starts_at end,
  proposed_ends_at = case when d.changed then d.ends_at end,
  proposed_venue = case when d.changed then d.venue end,
  reconciliation_state = case when d.changed or d.status = 'cancelled' or d.status <> s.source_status
   or s.reconciliation_state = 'review' then 'review' else 'current' end
 from (select n.*, x.id as session_id,
        (x.starts_at <> n.starts_at or x.ends_at <> n.ends_at
         or x.venue->>'name' is distinct from n.venue->>'name'
         or x.venue->>'address' is distinct from n.venue->>'address'
         or x.venue->>'postcode' is distinct from n.venue->>'postcode') as changed
       from snap n join eccp.staffing_sessions x
        on x.source_system = 'members' and x.source_key = n.source_key) d
 where s.id = d.session_id;

 -- New sessions (after the update, so they are not compared with themselves).
 with ins as (
  insert into eccp.staffing_sessions (source_system, source_key, offering_id, title, starts_at, ends_at,
   venue, source_status, reconciliation_state, last_seen_snapshot)
  select 'members', n.source_key, n.offering_id, n.title, n.starts_at, n.ends_at, n.venue, n.status,
   case when n.status = 'cancelled' then 'review' else 'current' end, p_snapshot_version
  from snap n
  where not exists (select 1 from eccp.staffing_sessions s where s.source_system = 'members' and s.source_key = n.source_key)
  returning 1)
 select count(*) into v_inserted from ins;

 -- Missing: future scheduled sessions only; second miss in a row -> review.
 with miss as (
  update eccp.staffing_sessions s set
   consecutive_missing = s.consecutive_missing + 1,
   reconciliation_state = case when s.consecutive_missing >= 1 then 'review' else s.reconciliation_state end
  where s.source_system = 'members' and s.source_status = 'scheduled' and s.starts_at > v_now
   and (p_covers_until is null or s.starts_at < p_covers_until)
   and not exists (select 1 from snap n where n.source_key = s.source_key)
  returning 1)
 select count(*) into v_missing from miss;

 select count(*) into v_review from eccp.staffing_sessions
 where source_system = 'members' and reconciliation_state = 'review';

 insert into eccp.staffing_sync_runs (id, started_at, finished_at, snapshot_version, covers_until, result, complete,
  session_count, missing_count, inserted_count, review_count, error_category)
 values (p_run_id, v_now, clock_timestamp(), p_snapshot_version, p_covers_until, 'success', true,
  v_seen, v_missing, v_inserted, v_review, null)
 on conflict (id) do update set finished_at = excluded.finished_at, snapshot_version = excluded.snapshot_version, covers_until = excluded.covers_until,
  result = 'success', complete = true, session_count = excluded.session_count, missing_count = excluded.missing_count,
  inserted_count = excluded.inserted_count, review_count = excluded.review_count, error_category = null;

 return jsonb_build_object('run_id', p_run_id, 'already_applied', false, 'sessions', v_seen,
  'inserted', v_inserted, 'missing', v_missing, 'in_review', v_review);
end $$;

-- 2. Record a failed run (called outside the failed transaction). Never
--    overwrites a successful run. The category is a short code, never a message.
create function eccp.staffing_record_sync_failure(p_run_id uuid, p_error_category text)
returns void language plpgsql security definer set search_path = eccp, pg_temp as $$
begin
 if p_run_id is null or p_error_category is null or p_error_category !~ '^[a-z_]{1,40}$' then
  raise exception 'invalid input' using errcode = 'ECS00';
 end if;
 insert into eccp.staffing_sync_runs (id, finished_at, result, complete, error_category)
 values (p_run_id, now(), 'failed', false, p_error_category)
 on conflict (id) do update set finished_at = now(), error_category = excluded.error_category
 where eccp.staffing_sync_runs.result <> 'success';
end $$;

-- 3. Admin accepts a session under review: applies any proposed time/venue
--    (shifts move with it) and clears review. Refused, with nothing changed,
--    if the move would double-book a coach.
create function eccp.staffing_accept_session_review(p_session_token text, p_session_id uuid)
returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare s record; v_actor uuid; v_role text; c uuid;
begin
 select actor_id, actor_role into v_actor, v_role from eccp.staffing_actor(p_session_token);
 if v_actor is null or v_role <> 'admin' then raise exception 'not authorised' using errcode = 'ECS03'; end if;
 if p_session_id is null then raise exception 'invalid input' using errcode = 'ECS00'; end if;

 -- Same lock order as assign and cover: per-coach advisory locks first.
 for c in select distinct coach_id from eccp.shift_assignments
          where session_id = p_session_id and state = 'confirmed' order by coach_id loop
  perform pg_advisory_xact_lock(hashtextextended('staffing-assign:' || c::text, 0));
 end loop;
 select * into s from eccp.staffing_sessions where id = p_session_id for update;
 if not found then raise exception 'session not found' using errcode = 'ECS00'; end if;
 if s.reconciliation_state <> 'review' then raise exception 'session is not under review' using errcode = 'ECS06'; end if;

 begin
  update eccp.staffing_sessions set
   starts_at = case when has_proposal then proposed_starts_at else starts_at end,
   ends_at = case when has_proposal then proposed_ends_at else ends_at end,
   venue = case when has_proposal then proposed_venue else venue end,
   has_proposal = false, proposed_starts_at = null, proposed_ends_at = null, proposed_venue = null,
   reconciliation_state = 'current', reviewed_by = v_actor, reviewed_at = now()
  where id = s.id;
 exception when exclusion_violation then
  raise exception 'conflicting allocation' using errcode = 'ECS23';
 end;
 return s.id;
end $$;

revoke all on function eccp.staffing_apply_snapshot(uuid,text,timestamptz,jsonb), eccp.staffing_record_sync_failure(uuid,text),
 eccp.staffing_accept_session_review(text,uuid) from public, anon, authenticated;
grant execute on function eccp.staffing_apply_snapshot(uuid,text,timestamptz,jsonb), eccp.staffing_record_sync_failure(uuid,text),
 eccp.staffing_accept_session_review(text,uuid) to service_role;
commit;
