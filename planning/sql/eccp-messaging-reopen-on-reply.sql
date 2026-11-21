-- Messaging phase 2, stage 1: a coach reply reopens the enquiry for staff.
-- Redefines eccp.message_add_entry; identical to eccp-messaging-rpcs-staging-draft.sql
-- except the status update. Grants are unchanged by create or replace.
create or replace function eccp.message_add_entry(
 p_session_token text, p_conversation_id uuid, p_body text, p_internal_note boolean, p_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path = eccp, pg_temp as $$
declare v_actor uuid; v_role text; v_kind text; v_entry uuid; v_member boolean; v_previous_conversation uuid; v_previous_body text; v_previous_note boolean;
begin
 select actor_id, actor_role into v_actor,v_role from eccp.message_actor(p_session_token);
 if v_actor is null then raise exception 'unauthorized' using errcode = 'ECM01'; end if;
 if p_idempotency_key is null then raise exception 'idempotency key required' using errcode = 'ECM00'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_actor::text || ':entry', 0));
 if length(trim(p_body)) not between 1 and 10000 then raise exception 'invalid body' using errcode = 'ECM00'; end if;
 select kind into v_kind from eccp.message_conversations where id=p_conversation_id for update;
 if v_kind is null or v_kind='safeguarding' then raise exception 'not found' using errcode = 'ECM04'; end if;
 select exists(select 1 from eccp.message_participants where conversation_id=p_conversation_id and coach_id=v_actor) into v_member;
 if not v_member and not (v_kind='staff_inbox' and v_role in ('staff','admin')) then raise exception 'forbidden' using errcode = 'ECM03'; end if;
 if p_internal_note and not (v_kind='staff_inbox' and v_role in ('staff','admin')) then raise exception 'forbidden' using errcode = 'ECM03'; end if;
 select id,conversation_id,body,internal_note into v_entry,v_previous_conversation,v_previous_body,v_previous_note
 from eccp.message_entries where author_id=v_actor and idempotency_key=p_idempotency_key;
 if v_entry is not null then
  if v_previous_conversation is distinct from p_conversation_id
   or v_previous_body is distinct from trim(p_body)
   or v_previous_note is distinct from p_internal_note
  then raise exception 'idempotency key reused with different payload' using errcode = 'ECM09'; end if;
  return v_entry;
 end if;
 if (select count(*) from eccp.message_entries where author_id=v_actor and created_at > now()-interval '1 minute') >= 15 then raise exception 'rate limited' using errcode = 'ECM29'; end if;
 insert into eccp.message_entries(conversation_id,author_id,body,internal_note,idempotency_key)
 values(p_conversation_id,v_actor,trim(p_body),p_internal_note,p_idempotency_key) returning id into v_entry;
 -- A coach reply hands the enquiry back to staff: resolved reopens as new,
 -- waiting_for_coach becomes in_progress. Staff replies and notes leave status alone.
 update eccp.message_conversations set updated_at=now(),
  status = case when v_role='coach' and status='resolved' then 'new'
                when v_role='coach' and status='waiting_for_coach' then 'in_progress'
                else status end
 where id=p_conversation_id;
 insert into eccp.message_events(conversation_id,actor_id,event_type) values(p_conversation_id,v_actor,case when p_internal_note then 'note_added' else 'replied' end);
 return v_entry;
end $$;
