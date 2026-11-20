import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { actorForWrite, fail, messageBody, ordinaryConversation, uuid, isParticipant } from "@/lib/messaging-write";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
 const auth = await actorForWrite();
 if (auth.error) return auth.error;
 const { id } = await context.params;
 if (!uuid(id)) return fail("Invalid conversation", 400);
 const found = await ordinaryConversation(id);
 if (found.error) return found.error;
 const actor = auth.actor!;
 // Staff inbox is shared with staff; groups require explicit membership.
 if (!(await isParticipant(id, actor.id)) && !(found.conversation!.kind === "staff_inbox" && actor.is_staff))
   return fail("Conversation not found", 404);
 let payload: unknown;
 try { payload = await request.json(); } catch { return fail("Invalid JSON", 400); }
 if (!payload || typeof payload !== "object" || !messageBody((payload as Record<string, unknown>).body)) return fail("Invalid message", 400);
 const { data, error } = await getDb().rpc("message_add_entry", {
   p_actor_id: actor.id, p_conversation_id: id, p_body: (payload as { body: string }).body.trim(),
   p_internal_note: false, p_is_staff: actor.is_staff,
 });
 if (error) return fail("Reply unavailable", 503);
 return NextResponse.json({ messageId: data }, { status: 201 });
}
