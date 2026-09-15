import { cookies } from "next/headers";
import { getDb } from "./supabase";

const SESSION_DURATION_DAYS = 30;
const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const SESSION_COOKIE = "eccp_session";

export interface Coach {
  id: string;
  email: string;
  full_name: string;
  is_staff: boolean;
}

function generateCode(): string {
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

async function hashCode(code: string, email: string): Promise<string> {
  const data = new TextEncoder().encode(`${code}:${email}`);
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// A failed query and a genuinely absent coach both yield null data. Collapsing
// them hides misconfiguration as "no such account" — the caller must be able to
// tell "this address isn't registered" from "the database refused us".
export async function findCoachByEmail(email: string): Promise<Coach | null> {
  const { data, error } = await getDb()
    .from("coaches")
    .select("id, email, full_name, is_staff")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw new Error(`coach lookup failed: ${error.message}`);
  return data ?? null;
}

export async function createOtp(email: string): Promise<string> {
  const normEmail = email.trim().toLowerCase();
  const code = generateCode();

  const { error } = await getDb()
    .from("otp_tokens")
    .insert({
      email: normEmail,
      code_hash: await hashCode(code, normEmail),
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
    });

  if (error) throw new Error(`otp insert failed: ${error.message}`);
  return code;
}

export type VerifyResult =
  | { ok: true; coach: Coach }
  | { ok: false; reason: "invalid" | "locked" };

// Unlike the Waivers/EFN copies of this pattern, a wrong code is counted.
// Without a cap, a 6-digit code sitting valid for 10 minutes is brute-forceable.
export async function verifyOtp(
  email: string,
  code: string,
): Promise<VerifyResult> {
  const db = getDb();
  const normEmail = email.trim().toLowerCase();

  const { data: row } = await db
    .from("otp_tokens")
    .select("id, code_hash, attempts")
    .eq("email", normEmail)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return { ok: false, reason: "invalid" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  // Count the attempt before judging it, so a crash or disconnect mid-verify
  // cannot be used to retry indefinitely.
  await db
    .from("otp_tokens")
    .update({ attempts: row.attempts + 1 })
    .eq("id", row.id);

  if (row.code_hash !== (await hashCode(code.trim(), normEmail))) {
    return {
      ok: false,
      reason: row.attempts + 1 >= MAX_ATTEMPTS ? "locked" : "invalid",
    };
  }

  const coach = await findCoachByEmail(normEmail);
  if (!coach) return { ok: false, reason: "invalid" };

  await db.from("otp_tokens").update({ used: true }).eq("id", row.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const { data: session } = await db
    .from("coach_sessions")
    .insert({ coach_id: coach.id, expires_at: expiresAt.toISOString() })
    .select("refresh_token")
    .single();

  if (!session) return { ok: false, reason: "invalid" };

  (await cookies()).set(SESSION_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });

  return { ok: true, coach };
}

// The only way to identify the caller. Every route handler and protected
// layout must call this — there is no middleware check, since verifying a
// session means a database round-trip the edge runtime cannot make.
export async function getCurrentCoach(): Promise<Coach | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const { data: session } = await db
    .from("coach_sessions")
    .select("coach_id")
    .eq("refresh_token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!session) return null;

  const { data: coach } = await db
    .from("coaches")
    .select("id, email, full_name, is_staff")
    .eq("id", session.coach_id)
    .maybeSingle();

  return coach ?? null;
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await getDb().from("coach_sessions").delete().eq("refresh_token", token);
  }

  cookieStore.delete(SESSION_COOKIE);
}
