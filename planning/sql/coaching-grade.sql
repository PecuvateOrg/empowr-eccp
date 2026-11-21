-- Coaching grade (Head Coach / Assistant Coach / Junior Assistant Coach).
-- Not applied. There is no staging database: production is shared with Members,
-- EFN and Waivers, so this file only ADDS things. The app ignores it until
-- ECCP_COACHING_GRADE_ENABLED=1 is set. Apply with the migration script after
-- `pg_dump -n eccp`. A grade is a coaching position, never an access grant;
-- admin_role is untouched.

alter table eccp.coaches add column if not exists coaching_grade text;
alter table eccp.coaches drop constraint if exists coaches_coaching_grade_check;
alter table eccp.coaches add constraint coaches_coaching_grade_check
  check (coaching_grade is null or coaching_grade in ('head_coach','assistant_coach','junior_assistant_coach'));

create table if not exists eccp.coaching_grade_audit (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references eccp.coaches(id),
  changed_by uuid not null references eccp.coaches(id),
  previous_grade text,
  new_grade text,
  changed_at timestamptz not null default now()
);
create index if not exists coaching_grade_audit_coach_idx on eccp.coaching_grade_audit (coach_id, changed_at desc);
alter table eccp.coaching_grade_audit enable row level security;
revoke all on eccp.coaching_grade_audit from public, anon, authenticated;

-- Changes the grade and writes the audit row in ONE transaction, so a grade can
-- never change without its audit row. Re-checks the actor is an admin and the
-- target is a coach account, so the database holds the rule even if a route
-- forgets it. Errors: ECCP1 actor not admin, ECCP2 target not a coach, ECCP3 bad grade.
create or replace function eccp.set_coaching_grade(p_actor_id uuid, p_coach_id uuid, p_grade text)
returns text language plpgsql security definer set search_path = eccp, pg_temp as $$
declare
  v_previous text;
begin
  if not exists (select 1 from eccp.coaches where id = p_actor_id and admin_role = 'admin') then
    raise exception 'actor is not an admin' using errcode = 'ECCP1';
  end if;
  if p_grade is not null and p_grade not in ('head_coach','assistant_coach','junior_assistant_coach') then
    raise exception 'invalid coaching grade' using errcode = 'ECCP3';
  end if;
  select coaching_grade into v_previous from eccp.coaches
    where id = p_coach_id and admin_role = 'coach' for update;
  if not found then
    raise exception 'target is not a coach account' using errcode = 'ECCP2';
  end if;
  if v_previous is distinct from p_grade then
    update eccp.coaches set coaching_grade = p_grade where id = p_coach_id;
    insert into eccp.coaching_grade_audit (coach_id, changed_by, previous_grade, new_grade)
      values (p_coach_id, p_actor_id, v_previous, p_grade);
  end if;
  return p_grade;
end $$;
revoke all on function eccp.set_coaching_grade(uuid,uuid,text) from public, anon, authenticated;
grant execute on function eccp.set_coaching_grade(uuid,uuid,text) to service_role;
