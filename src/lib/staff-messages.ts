import "server-only";
import { getDb } from "./supabase";
import { staffQueueOrder, waitingForStaff } from "./coach-messages-view";

// Staff Inbox reads. Staff-inbox conversations only; safeguarding never.
// Callers must have checked can(actor, "view_management").

export type StaffQueueItem = {
  id: string; title: string; category: string; status: string; priority: string;
  coachName: string; assigneeId: string | null; assigneeName: string | null;
  updatedAt: string; lastPublicAt: string | null; lastPublicByCoach: boolean; waitingForStaff: boolean;
};

async function namesAndRoles(ids: string[]) {
  if (!ids.length) return new Map<string, { name: string; role: string }>();
  const { data, error } = await getDb().from("coaches").select("id,full_name,admin_role").in("id", ids);
  if (error) throw new Error(`coach names: ${error.message}`);
  return new Map((data ?? []).map(c => [c.id, { name: c.full_name as string, role: c.admin_role as string }]));
}

export async function staffQueue(): Promise<StaffQueueItem[]> {
  const db = getDb();
  const { data: convs, error } = await db.from("message_conversations")
    .select("id,title,category,status,priority,created_by,assigned_staff_id,updated_at")
    .eq("kind", "staff_inbox").neq("category", "safeguarding")
    .order("updated_at", { ascending: false }).limit(100);
  if (error) throw new Error(`queue: ${error.message}`);
  if (!convs?.length) return [];
  const ids = convs.map(c => c.id);
  const { data: entries, error: entryError } = await db.from("message_entries")
    .select("conversation_id,author_id,created_at").in("conversation_id", ids)
    .eq("internal_note", false).order("created_at", { ascending: false }).limit(2000);
  if (entryError) throw new Error(`queue entries: ${entryError.message}`);
  const lastPublic = new Map<string, { author: string; at: string }>();
  for (const e of entries ?? []) if (!lastPublic.has(e.conversation_id)) lastPublic.set(e.conversation_id, { author: e.author_id, at: e.created_at });
  const people = await namesAndRoles([...new Set([
    ...convs.map(c => c.created_by), ...convs.map(c => c.assigned_staff_id).filter(Boolean) as string[],
    ...[...lastPublic.values()].map(l => l.author),
  ])]);
  return convs.map(c => {
    const last = lastPublic.get(c.id);
    const item = {
      id: c.id, title: c.title, category: c.category, status: c.status, priority: c.priority,
      coachName: people.get(c.created_by)?.name ?? "Coach",
      assigneeId: c.assigned_staff_id, assigneeName: c.assigned_staff_id ? people.get(c.assigned_staff_id)?.name ?? null : null,
      updatedAt: c.updated_at, lastPublicAt: last?.at ?? null,
      lastPublicByCoach: !!last && people.get(last.author)?.role === "coach",
    };
    return { ...item, waitingForStaff: waitingForStaff(item) };
  }).sort(staffQueueOrder);
}

export type StaffEntry = { id: string; authorName: string; fromCoach: boolean; body: string; internalNote: boolean; createdAt: string };

export async function staffThreadEntries(conversationId: string): Promise<StaffEntry[]> {
  const { data, error } = await getDb().from("message_entries")
    .select("id,author_id,body,internal_note,created_at").eq("conversation_id", conversationId)
    .order("created_at", { ascending: true }).limit(200);
  if (error) throw new Error(`entries: ${error.message}`);
  const people = await namesAndRoles([...new Set((data ?? []).map(e => e.author_id))]);
  return (data ?? []).map(e => ({
    id: e.id, authorName: people.get(e.author_id)?.name ?? "Unknown", fromCoach: people.get(e.author_id)?.role === "coach",
    body: e.body, internalNote: e.internal_note, createdAt: e.created_at,
  }));
}

// People an admin may assign an enquiry to (the RPC re-checks this).
export async function assignableStaff(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await getDb().from("coaches").select("id,full_name")
    .in("admin_role", ["staff", "admin"]).order("full_name");
  if (error) throw new Error(`staff list: ${error.message}`);
  return (data ?? []).map(s => ({ id: s.id, name: s.full_name }));
}
