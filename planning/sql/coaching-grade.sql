-- Apply to staging first; backup and verify eccp.coaches before production.
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
revoke all on eccp.coaching_grade_audit from public, anon, authenticated;
