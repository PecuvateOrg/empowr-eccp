import { can, getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { fail, isParticipant, ordinaryConversation, uuid, messagingDisabled } from "@/lib/messaging-write";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
 const actor = await getCurrentCoach();
 if (!actor) return fail("Authentication required", 401);
 if (messagingDisabled()) return fail("Messaging is not enabled", 503);
 const { id } = await context.params;
 if (!uuid(id)) return fail("Invalid conversation", 400);
 const found = await ordinaryConversation(id);
 if (found.error) return found.error;
 const staff = can(actor, "view_management");
 if (found.conversation!.kind === "staff_inbox") {
  if (!staff && !(await isParticipant(id, actor.id))) return fail("Conversation not found", 404);
 } else if (!(await isParticipant(id, actor.id))) return fail("Conversation not found", 404);
 const { data, error } = await getDb().from("message_entries")
  .select("id,author_id,body,internal_note,created_at")
  .eq("conversation_id", id)
  .eq("internal_note", false)
  .order("created_at", { ascending: true }).limit(200);
 if (error) return fail("Messages unavailable", 503);
 return Response.json({ messages: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
