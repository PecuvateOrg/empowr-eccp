import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { actorForWrite, fail, ordinaryConversation, uuid } from "@/lib/messaging-write";

const priorities = ["low","medium","high","urgent"];
const statuses = ["new","in_progress","waiting_for_coach","resolved"];
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
 if (!payload || typeof payload !== "object") return fail("Invalid request", 400);
 const input = payload as Record<string, unknown>;
 if (Object.keys(input).length === 0 || Object.keys(input).some(k => !["assigneeId","priority","status"].includes(k))) return fail("Invalid fields", 400);
 if ("assigneeId" in input && input.assigneeId !== null && !uuid(input.assigneeId)) return fail("Invalid assignee", 400);
 if ("priority" in input && !priorities.includes(input.priority as string)) return fail("Invalid priority", 400);
 if ("status" in input && !statuses.includes(input.status as string)) return fail("Invalid status", 400);
 // RPC must check persisted staff role of actor and assignee and write an audit event atomically.
 const { error } = await getDb().rpc("message_manage_staff_enquiry", {
   p_actor_id: auth.actor!.id, p_conversation_id: id,
   p_has_assignee: "assigneeId" in input, p_assignee_id: input.assigneeId ?? null,
   p_priority: input.priority ?? null, p_status: input.status ?? null,
 });
 if (error) return fail("Assignment unavailable", 503);
 return NextResponse.json({ ok: true });
}
