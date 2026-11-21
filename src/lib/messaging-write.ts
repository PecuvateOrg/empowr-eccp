import { cookies } from "next/headers";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { NextResponse } from "next/server";

const APP_ORIGIN = "https://eccp.empowrcic.org";
export const messagingDisabled = () => process.env.ECCP_MESSAGING_ENABLED !== "true";
export const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
export const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
/** Phase 1 is text-only: reject attachment fields and unsupported media types. */
export function textOnlyMessagingPayload(request: Request, input: Record<string, unknown>): boolean {
 const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
 if (contentType !== "application/json") return false;
 return !["attachment", "attachments", "file", "files", "media", "upload", "uploadId", "attachmentIds"].some(key => Object.prototype.hasOwnProperty.call(input, key));
}
export const messageBody = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 10000;
/** Reject cross-site and origin-less cookie-authenticated writes. */
export function trustedMessagingOrigin(request: Request): boolean {
 const origin = request.headers.get("origin");
 const fetchSite = request.headers.get("sec-fetch-site");
 if (!origin || origin === "null" || fetchSite === "cross-site") return false;
 try {
  // Never request.url: on Amplify it is the internal host, so every write would fail.
  const expected = process.env.ECCP_APP_ORIGIN || APP_ORIGIN;
  return new URL(origin).origin === new URL(expected).origin;
 } catch { return false; }
}
export async function actorForWrite(request: Request) {
 if (!trustedMessagingOrigin(request)) return { error: fail("Invalid request origin", 403) };

 const actor = await getCurrentCoach();
 if (!actor) return { error: fail("Authentication required", 401) };
 if (messagingDisabled()) return { error: fail("Messaging is not enabled", 503) };
 const token = (await cookies()).get("eccp_session")?.value;
 if (!token) return { error: fail("Authentication required", 401) };
 return { actor, token };
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

// Database error codes raised by the messaging RPCs (planning/sql/eccp-messaging-rpcs-staging-draft.sql).
const rpcErrors: Record<string, [string, number]> = {
  ECM00: ["Invalid request", 400],
  ECM01: ["Authentication required", 401],
  ECM03: ["Not authorised", 403],
  ECM04: ["Conversation not found", 404],
  ECM09: ["This request was already sent with different content", 409],
  ECM29: ["Too many messages; try again in a minute", 429],
};
export function rpcFail(error: { code?: string; message?: string }, unavailable: string) {
  const known = error.code ? rpcErrors[error.code] : undefined;
  if (known) return fail(known[0], known[1]);
  console.error("[messaging] rpc failed", error.code, error.message);
  return fail(unavailable, 503);
}
