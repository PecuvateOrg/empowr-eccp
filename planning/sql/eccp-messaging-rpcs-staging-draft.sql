-- DRAFT ONLY: staging review required before execution.
-- These functions use an ECCP session token verified against coach_sessions,
-- not a client-supplied actor ID. Requires verified coaches.admin_role migration.
-- NOTE: service_role has broad privileges: keep the key server-side only.
create or replace function eccp.message_actor(p_session_token text)
returns table(actor_id uuid, actor_role text)
language sql security definer set search_path = eccp, pg_temp as $$
 select c.id, c.admin_admin_role::text
 from eccp.coach_sessions s join eccp.coaches c on c.id = s.coach_id
 where s.refresh_token = p_session_token and s.expires_at > now()
 and c.admin_admin_role::text in ('coach','staff','admin')
 limit 1
$$;
revoke all on function eccp.message_actor(text) from public, anon, authenticated;

create or replace function eccp.message_create_staff_enquiry(
 p_session_token text, p_category text, p_title text, p_body text)
returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare v_actor uuid; v_id uuid;
begin
 select actor_id into v_actor from eccp.message_actor(p_session_token);
 if v_actor is null then raise exception 'unauthorized'; end if;
 if p_category not in ('scheduling','training','general','other')
 or length(trim(p_title)) not between 1 and 120
 or length(trim(p_body)) not between 1 and 10000 then raise exception 'invalid input'; end if;
 insert into eccp.message_conversations(kind,category,title,created_by)
 values ('staff_inbox',p_category,trim(p_title),v_actor) returning id into v_id;
 insert into eccp.message_participants(conversation_id,coach_id) values(v_id,v_actor);
 insert into eccp.message_entries(conversation_id,author_id,body) values(v_id,v_actor,trim(p_body));
 insert into eccp.message_events(conversation_id,actor_id,event_type) values(v_id,v_actor,'created');
 return v_id;
end $$;
revoke all on function eccp.message_create_staff_enquiry(text,text,text,text) from public, anon, authenticated;

create or replace function eccp.message_add_entry(
 p_session_token text, p_conversation_id uuid, p_body text, p_internal_note boolean default false)
returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare v_actor uuid; v_role text; v_kind text; v_entry uuid; v_member boolean;
begin
 select actor_id, actor_role into v_actor,v_role from eccp.message_actor(p_session_token);
 if v_actor is null then raise exception 'unauthorized'; end if;
 if length(trim(p_body)) not between 1 and 10000 then raise exception 'invalid body'; end if;
 select kind into v_kind from eccp.message_conversations where id=p_conversation_id for update;
 if v_kind is null or v_kind='safeguarding' then raise exception 'not found'; end if;
 select exists(select 1 from eccp.message_participants where conversation_id=p_conversation_id and coach_id=v_actor) into v_member;
 if not v_member and not (v_kind='staff_inbox' and v_role in ('staff','admin')) then raise exception 'forbidden'; end if;
 if p_internal_note and not (v_kind='staff_inbox' and v_role in ('staff','admin')) then raise exception 'forbidden'; end if;
 insert into eccp.message_entries(conversation_id,author_id,body,internal_note)
 values(p_conversation_id,v_actor,trim(p_body),p_internal_note) returning id into v_entry;
 update eccp.message_conversations set updated_at=now() where id=p_conversation_id;
 insert into eccp.message_events(conversation_id,actor_id,event_type) values(p_conversation_id,v_actor,case when p_internal_note then 'note_added' else 'replied' end);
 return v_entry;
end $$;
revoke all on function eccp.message_add_entry(text,uuid,text,boolean) from public, anon, authenticated;

create or replace function eccp.message_manage_staff_enquiry(
 p_session_token text, p_conversation_id uuid, p_has_assignee boolean,
 p_assignee_id uuid, p_priority text, p_status text)
returns void language plpgsql security definer set search_path = eccp, pg_temp as $$
declare v_actor uuid; v_role text; v_old jsonb; v_new jsonb;
begin
 select actor_id,actor_role into v_actor,v_role from eccp.message_actor(p_session_token);
 if v_actor is null or v_role <> 'admin' then raise exception 'admin required'; end if;
 select jsonb_build_object('assignee',assigned_staff_id,'priority',priority,'status',status)
 into v_old from eccp.message_conversations where id=p_conversation_id and kind='staff_inbox' for update;
 if v_old is null then raise exception 'not found'; end if;
 if p_has_assignee and p_assignee_id is not null and not exists
 (select 1 from eccp.coaches where id=p_assignee_id and admin_role::text in ('staff','admin'))
 then raise exception 'invalid assignee'; end if;
 if p_priority is not null and p_priority not in ('low','medium','high','urgent') then raise exception 'invalid priority'; end if;
 if p_status is not null and p_status not in ('new','in_progress','waiting_for_coach','resolved') then raise exception 'invalid status'; end if;
 update eccp.message_conversations set
 assigned_staff_id=case when p_has_assignee then p_assignee_id else assigned_staff_id end,
 priority=coalesce(p_priority,priority),status=coalesce(p_status,status),updated_at=now()
 where id=p_conversation_id;
 select jsonb_build_object('assignee',assigned_staff_id,'priority',priority,'status',status)
 into v_new from eccp.message_conversations where id=p_conversation_id;
 insert into eccp.message_events(conversation_id,actor_id,event_type,details)
 values(p_conversation_id,v_actor,'managed',jsonb_build_object('before',v_old,'after',v_new));
end $$;
revoke all on function eccp.message_manage_staff_enquiry(text,uuid,boolean,uuid,text,text) from public, anon, authenticated;

-- Explicit service-role grants only. Test role mapping and RPC exposure in staging.
grant execute on function eccp.message_actor(text) to service_role;
grant execute on function eccp.message_create_staff_enquiry(text,text,text,text) to service_role;
grant execute on function eccp.message_add_entry(text,uuid,text,boolean) to service_role;
grant execute on function eccp.message_manage_staff_enquiry(text,uuid,boolean,uuid,text,text) to service_role;
