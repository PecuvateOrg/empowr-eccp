-- REVIEW ONLY: do not apply without maintainer review and staging tests.
-- Staff-initiated ordinary inbox conversations, using trusted session identity.
create or replace function eccp.message_staff_start_conversation(
 p_session_token text, p_recipient_id uuid, p_category text, p_title text,
 p_body text, p_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path=eccp,pg_temp as $$
declare v_actor uuid; v_role text; v_id uuid; v_previous record;
begin
 select actor_id,actor_role into v_actor,v_role from eccp.message_actor(p_session_token);
 if v_actor is null or v_role not in ('staff','admin') then raise exception 'forbidden' using errcode='ECM03'; end if;
 if p_idempotency_key is null or p_recipient_id is null or p_recipient_id=v_actor
 or p_category not in ('scheduling','training','general','other')
 or length(trim(p_title)) not between 1 and 120
 or length(trim(p_body)) not between 1 and 10000 then raise exception 'invalid input' using errcode='ECM00'; end if;
 if not exists(select 1 from eccp.coaches where id=p_recipient_id and admin_role::text='coach')
 then raise exception 'recipient not found' using errcode='ECM04'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_actor::text || ':create',0));
 select mc.id,mc.title,mc.category,mp.coach_id as recipient,
  (select body from eccp.message_entries where conversation_id=mc.id and author_id=v_actor and internal_note=false order by created_at,id limit 1) as body
 into v_previous from eccp.message_conversations mc
 left join eccp.message_participants mp on mp.conversation_id=mc.id and mp.coach_id<>v_actor
 where mc.created_by=v_actor and mc.idempotency_key=p_idempotency_key;
 if found then
  if v_previous.title is distinct from trim(p_title) or v_previous.category is distinct from p_category
  or v_previous.recipient is distinct from p_recipient_id or v_previous.body is distinct from trim(p_body)
  then raise exception 'idempotency key reused' using errcode='ECM09'; end if;
  return v_previous.id;
 end if;
 if (select count(*) from eccp.message_conversations where created_by=v_actor and created_at>now()-interval '1 minute')>=5
 then raise exception 'rate limited' using errcode='ECM29'; end if;
 insert into eccp.message_conversations(kind,category,title,created_by,idempotency_key,status)
 values('staff_inbox',p_category,trim(p_title),v_actor,p_idempotency_key,'waiting_for_coach') returning id into v_id;
 insert into eccp.message_participants(conversation_id,coach_id) values(v_id,v_actor),(v_id,p_recipient_id);
 insert into eccp.message_entries(conversation_id,author_id,body) values(v_id,v_actor,trim(p_body));
 insert into eccp.message_events(conversation_id,actor_id,event_type,details)
 values(v_id,v_actor,'staff_initiated',jsonb_build_object('recipient_id',p_recipient_id));
 return v_id;
end $$;
revoke all on function eccp.message_staff_start_conversation(text,uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function eccp.message_staff_start_conversation(text,uuid,text,text,text,uuid) to service_role;
