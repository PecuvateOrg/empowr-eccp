import "server-only";
import { getDb } from "./supabase";
import { isUnread, toCoachEntry, type ThreadEntry } from "./coach-messages-view";

// Server reads for the coach's own conversations. Every query is scoped to
// conversations the coach is a participant in; safeguarding is never returned
// and internal notes are filtered out at the query.

export type CoachConversation = {
  id: string; title: string; category: string; status: string; updatedAt: string; unread: boolean;
};

async function participantIds(coachId: string): Promise<string[]> {
  const { data, error } = await getDb().from("message_participants")
    .select("conversation_id").eq("coach_id", coachId).limit(200);
  if (error) throw new Error(`participants: ${error.message}`);
  return (data ?? []).map(r => r.conversation_id);
}

export async function listCoachConversations(coachId: string): Promise<CoachConversation[]> {
  const ids = await participantIds(coachId);
  if (!ids.length) return [];
  const db = getDb();
  const [convs, entries, receipts] = await Promise.all([
    db.from("message_conversations").select("id,title,category,status,updated_at")
      .in("id", ids).neq("kind", "safeguarding").order("updated_at", { ascending: false }).limit(100),
    // Newest message per conversation that someone else wrote (public only).
    db.from("message_entries").select("conversation_id,created_at")
      .in("conversation_id", ids).eq("internal_note", false).neq("author_id", coachId)
      .order("created_at", { ascending: false }).limit(1000),
    db.from("message_read_receipts").select("conversation_id,last_read_at")
      .eq("coach_id", coachId).in("conversation_id", ids),
  ]);
  for (const r of [convs, entries, receipts]) if (r.error) throw new Error(`conversations: ${r.error.message}`);
  const latest = new Map<string, string>();
  for (const e of entries.data ?? []) if (!latest.has(e.conversation_id)) latest.set(e.conversation_id, e.created_at);
  const read = new Map((receipts.data ?? []).map(r => [r.conversation_id, r.last_read_at as string]));
  return (convs.data ?? []).map(c => ({
    id: c.id, title: c.title, category: c.category, status: c.status, updatedAt: c.updated_at,
    unread: isUnread(latest.get(c.id) ?? null, read.get(c.id) ?? null),
  }));
}

export async function coachUnreadCount(coachId: string): Promise<number> {
  return (await listCoachConversations(coachId)).filter(c => c.unread).length;
}

export type CoachThread = { id: string; title: string; category: string; status: string; entries: ThreadEntry[] };

// Returns null when the conversation doesn't exist, is safeguarding, or the
// coach isn't a participant: the page shows the same 404 for all three.
// Opening a thread marks it read.
export async function openCoachThread(coachId: string, conversationId: string): Promise<CoachThread | null> {
  const db = getDb();
  const { data: member, error: memberError } = await db.from("message_participants")
    .select("coach_id").eq("conversation_id", conversationId).eq("coach_id", coachId).maybeSingle();
  if (memberError) throw new Error(`participant: ${memberError.message}`);
  if (!member) return null;
  const { data: conv, error: convError } = await db.from("message_conversations")
    .select("id,title,category,status").eq("id", conversationId).neq("kind", "safeguarding").maybeSingle();
  if (convError) throw new Error(`conversation: ${convError.message}`);
  if (!conv) return null;
  const { data: entries, error: entryError } = await db.from("message_entries")
    .select("id,author_id,body,created_at").eq("conversation_id", conversationId)
    .eq("internal_note", false).order("created_at", { ascending: true }).limit(200);
  if (entryError) throw new Error(`entries: ${entryError.message}`);
  const { error: readError } = await db.from("message_read_receipts").upsert(
    { conversation_id: conversationId, coach_id: coachId, last_read_at: new Date().toISOString() },
    { onConflict: "conversation_id,coach_id" },
  );
  if (readError) console.error("[messages] read receipt failed", readError.code, readError.message);
  return { ...conv, entries: (entries ?? []).map(e => toCoachEntry(e, coachId)) };
}
