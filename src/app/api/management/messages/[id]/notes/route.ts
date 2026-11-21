import { can } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { actorForWrite, fail, messageBody, textOnlyMessagingPayload, ordinaryConversation, uuid } from "@/lib/messaging-write";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
 const auth = await actorForWrite(request);
 if (auth.error) return auth.error;
 if (!can(auth.actor!, "view_management")) return fail("Staff access required", 403);
 const { id } = await context.params;
 if (!uuid(id)) return fail("Invalid conversation", 400);
 const found = await ordinaryConversation(id);
 if (found.error) return found.error;
 if (found.conversation!.kind !== "staff_inbox") return fail("Conversation not found", 404);
 let payload: unknown;
 try { payload = await request.json(); } catch { return fail("Invalid JSON", 400); }
 if (!payload || typeof payload !== "object" || !messageBody((payload as Record<string, unknown>).body)) return fail("Invalid note", 400);
 if (!textOnlyMessagingPayload(request, payload as Record<string, unknown>)) return fail("Only JSON text messages are supported", 415);
 const idempotencyKey = (payload as Record<string, unknown>).idempotencyKey;
 if (!uuid(idempotencyKey)) return fail("Valid idempotencyKey required", 400);
 const { data, error } = await getDb().rpc("message_add_entry", {
   p_idempotency_key: idempotencyKey,
   p_session_token: auth.token!, p_conversation_id: id,
   p_body: (payload as { body: string }).body.trim(), p_internal_note: true,
 });
 if (error) return fail("Internal notes unavailable", 503);
 return NextResponse.json({ noteId: data }, { status: 201 });
}
