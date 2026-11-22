import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { can, getCurrentCoach, SESSION_COOKIE } from "@/lib/auth";
import { trustedMessagingOrigin } from "@/lib/messaging-write";
import { staffingEnabled, staffingError, type Context } from "@/lib/staffing-admin";

const noStore = { "Cache-Control": "no-store" };
export const staffingFail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: noStore });
export const staffingOk = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/**
 * Guard for every admin scheduling write. The database re-checks the caller
 * from the session token, so this only stops obvious misuse early:
 * flag off -> 404, cross-site -> 403, signed out -> 401, not admin -> 403.
 */
export async function adminForStaffingWrite(request: Request) {
  if (!staffingEnabled()) return { error: staffingFail("Not found", 404) };
  if (!trustedMessagingOrigin(request)) return { error: staffingFail("Invalid request origin", 403) };
  const actor = await getCurrentCoach();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!actor || !token) return { error: staffingFail("Authentication required", 401) };
  if (!can(actor, "manage_scheduling")) return { error: staffingFail("Only an admin can do this.", 403) };
  return { actor, token };
}

export function staffingRpcFail(error: { code?: string; message?: string }, context: Context) {
  const { message, status } = staffingError(error, context);
  if (status === 503) console.error("[staffing] rpc failed", error.code);
  return staffingFail(message, status);
}
