create schema eccp; create schema extensions;
create role anon; create role authenticated; create role service_role bypassrls;  -- as on Supabase
grant usage on schema eccp to anon, authenticated, service_role;
-- Live column shapes (read 2026-11-22).
create table eccp.coaches(id uuid primary key, email text, full_name text, is_staff boolean, created_at timestamptz default now(), admin_role text, coaching_grade text);
create table eccp.coach_sessions(id uuid primary key default gen_random_uuid(), coach_id uuid references eccp.coaches(id), refresh_token uuid, expires_at timestamptz, created_at timestamptz default now());
create table eccp.certificates(id uuid primary key default gen_random_uuid(), coach_id uuid references eccp.coaches(id), attempt_id uuid, certificate_number text, course_title text, pass_score int, completed_at date, renews_at date, pdf_storage_path text, issued_at timestamptz, reminder_sent_at timestamptz);
-- Live body of eccp.message_actor.
CREATE OR REPLACE FUNCTION eccp.message_actor(p_session_token text) RETURNS TABLE(actor_id uuid, actor_role text) LANGUAGE sql SECURITY DEFINER SET search_path TO 'eccp', 'pg_temp' AS $f$
 select c.id, c.admin_role::text from eccp.coach_sessions s join eccp.coaches c on c.id = s.coach_id
 where s.refresh_token::text = p_session_token and s.expires_at > now() and c.admin_role::text in ('coach','staff','admin') limit 1 $f$;
