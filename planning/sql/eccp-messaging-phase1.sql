-- ECCP messaging schema proposal. REVIEW IN STAGING ONLY. DO NOT APPLY TO PRODUCTION.
-- The application MUST enforce permissions server-side using persisted roles and membership.
-- No direct anon/authenticated access to eccp schema.
create table if not exists eccp.message_conversations (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('staff_inbox','group','safeguarding')),
 category text not null check (category in ('scheduling','training','safeguarding','general','other')),
 title text not null default '',
 external_session_id text,
 idempotency_key uuid,
 assigned_staff_id uuid references eccp.coaches(id) on delete set null,
 priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
 status text not null default 'new' check (status in ('new','in_progress','waiting_for_coach','resolved')),
 created_by uuid not null references eccp.coaches(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((kind = 'safeguarding') = (category = 'safeguarding'))
);
create table if not exists eccp.message_participants (
 conversation_id uuid not null references eccp.message_conversations(id) on delete cascade,
 coach_id uuid not null references eccp.coaches(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(conversation_id, coach_id)
);
-- Explicit designation controls safeguarding access, never inferred from role.
create table if not exists eccp.message_safeguarding_access (
 conversation_id uuid not null references eccp.message_conversations(id) on delete cascade,
 coach_id uuid not null references eccp.coaches(id) on delete cascade,
 granted_at timestamptz not null default now(),
 primary key(conversation_id, coach_id)
);
create table if not exists eccp.message_entries (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references eccp.message_conversations(id) on delete cascade,
 author_id uuid not null references eccp.coaches(id),
 body text not null check (char_length(body) between 1 and 10000),
 internal_note boolean not null default false,
 idempotency_key uuid,
 created_at timestamptz not null default now()
);
create unique index if not exists message_conversations_actor_idempotency_idx
 on eccp.message_conversations(created_by, idempotency_key) where idempotency_key is not null;
create unique index if not exists message_entries_actor_idempotency_idx
 on eccp.message_entries(author_id, idempotency_key) where idempotency_key is not null;
create index if not exists message_entries_author_rate_idx
 on eccp.message_entries(author_id, created_at);
create index if not exists message_conversations_author_rate_idx
 on eccp.message_conversations(created_by, created_at);
create index if not exists message_entries_thread_idx on eccp.message_entries(conversation_id, created_at);
create table if not exists eccp.message_events (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references eccp.message_conversations(id) on delete cascade,
 actor_id uuid not null references eccp.coaches(id),
 event_type text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists eccp.message_read_receipts (
 conversation_id uuid not null references eccp.message_conversations(id) on delete cascade,
 coach_id uuid not null references eccp.coaches(id) on delete cascade,
 last_read_at timestamptz not null default now(),
 primary key(conversation_id, coach_id)
);
revoke all on eccp.message_conversations, eccp.message_participants, eccp.message_safeguarding_access,
 eccp.message_entries, eccp.message_events, eccp.message_read_receipts from public, anon, authenticated;
-- Follow-up migration must add trusted role mapping, notification outbox, attachment metadata
-- and transactional permission-enforcing RPCs before any messaging endpoints are enabled.
