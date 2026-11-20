import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { actorForWrite, fail, messageBody, ordinaryConversation, uuid } from "@/lib/messaging-write";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
 const auth = await actorForWrite();
 if (auth.error) return auth.error;
 if (!auth.actor!.is_staff) return fail("Staff access required", 403);
 const { id } = await context.params;
 if (!uuid(id)) return fail("Invalid conversation", 400);
 const found = await ordinaryConversation(id);
 if (found.error) return found.error;
 if (found.conversation!.kind !== "staff_inbox") return fail("Conversation not found", 404);
 let payload: unknown;
 try { payload = await request.json(); } catch { return fail("Invalid JSON", 400); }
 if (!payload || typeof payload !== "object" || !messageBody((payload as Record<string, unknown>).body)) return fail("Invalid note", 400);
 const { data, error } = await getDb().rpc("message_add_entry", {
   p_actor_id: auth.actor!.id, p_conversation_id: id,
   p_body: (payload as { body: string }).body.trim(), p_internal_note: true, p_is_staff: true,
 });
 if (error) return fail("Internal notes unavailable", 503);
 return NextResponse.json({ noteId: data }, { status: 201 });
}
