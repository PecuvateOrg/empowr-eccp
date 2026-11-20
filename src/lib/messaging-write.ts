import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const messagingDisabled = () => process.env.ECCP_MESSAGING_ENABLED !== "true";
export const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
export const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const messageBody = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 10000;
export async function actorForWrite() {
 const actor = await getCurrentCoach();
 if (!actor) return { error: fail("Authentication required", 401) };
 if (messagingDisabled()) return { error: fail("Messaging is not enabled", 503) };
 return { actor };
}
export async function ordinaryConversation(id: string) {
 const { data, error } = await getDb().from("message_conversations").select("id,kind,created_by,assigned_staff_id").eq("id", id).neq("kind", "safeguarding").maybeSingle();
 if (error) return { error: fail("Conversation unavailable", 503) };
 if (!data) return { error: fail("Conversation not found", 404) };
 return { conversation: data };
}
export async function isParticipant(id: string, actorId: string) {
 const { data, error } = await getDb().from("message_participants").select("coach_id").eq("conversation_id", id).eq("coach_id", actorId).maybeSingle();
 return !error && !!data;
}
