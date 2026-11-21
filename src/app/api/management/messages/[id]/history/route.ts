import { can, getCurrentCoach } from "@/lib/auth";
import { staffThreadEntries } from "@/lib/staff-messages";
import { fail, messagingDisabled, ordinaryConversation, uuid } from "@/lib/messaging-write";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
 const actor = await getCurrentCoach();
 if (!actor) return fail("Authentication required", 401);
 if (!can(actor, "view_management")) return fail("Staff access required", 403);
 if (messagingDisabled()) return fail("Messaging is not enabled", 503);
 const { id } = await context.params;
 if (!uuid(id)) return fail("Invalid conversation", 400);
 const found = await ordinaryConversation(id);
 if (found.error) return found.error;
 if (found.conversation!.kind !== "staff_inbox") return fail("Conversation not found", 404);
 try {
  const messages = await staffThreadEntries(id);
  return Response.json({ messages }, { headers: { "Cache-Control": "no-store" } });
 } catch (error) {
  console.error("[staff-inbox] history failed", error);
  return fail("Messages unavailable", 503);
 }
}
