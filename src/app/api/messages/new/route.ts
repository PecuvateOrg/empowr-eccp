import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { actorForWrite, fail, messageBody, uuid } from "@/lib/messaging-write";

const categories = ["scheduling", "training", "general", "other"] as const;
export async function POST(request: Request) {
 const auth = await actorForWrite(request);
 if (auth.error) return auth.error;
 let payload: unknown;
 try { payload = await request.json(); } catch { return fail("Invalid JSON", 400); }
 if (!payload || typeof payload !== "object") return fail("Invalid request", 400);
 const input = payload as Record<string, unknown>;
 if (!uuid(input.idempotencyKey)) return fail("Valid idempotencyKey required", 400);
 if (!messageBody(input.body) || !categories.some(c => c === input.category)) return fail("Invalid message or category", 400);
 if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 120) return fail("Invalid title", 400);
 // The RPC must create conversation, participant, first entry and audit event atomically.
 // No client-supplied creator, assignee or participant IDs are trusted.
 const { data, error } = await getDb().rpc("message_create_staff_enquiry", {
   p_idempotency_key: input.idempotencyKey, p_session_token: auth.token!, p_category: input.category, p_title: input.title.trim(), p_body: input.body.trim(),
 });
 if (error) return fail("Message creation unavailable", 503);
 return NextResponse.json({ conversationId: data }, { status: 201 });
}
