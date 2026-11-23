import { cookies } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { openSession, SESSION_DURATION_DAYS, type Coach } from "./auth";
import { getDb } from "./supabase";

// Passkey sign-in for coaches (owner 2026-11-23; Web Build Framework types/web-app/account-page.md),
// ported from the Empowr Dashboard (lib/passkeys.ts). The email code always still works.
// Coach accounts only: staff and admins come in through Empowr Dashboard single sign-on and keep
// their passkeys on the Dashboard, so registration and sign-in both refuse any other role.
//
// OFF unless NEXT_PUBLIC_PASSKEYS_ENABLED is exactly "true". It is inlined at BUILD time, so on
// Amplify it must be in the build env, not only the runtime.
export const passkeysEnabled = process.env.NEXT_PUBLIC_PASSKEYS_ENABLED === "true";

// A passkey is bound to the hostname. Changing RP_ID later makes every saved passkey useless.
// Override both for a local or preview run (WEBAUTHN_RP_ID=localhost, WEBAUTHN_ORIGIN=http://localhost:3231).
const RP_ID = process.env.WEBAUTHN_RP_ID ?? "eccp.empowrcic.org";
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? `https://${RP_ID}`;
const CHALLENGE_COOKIE = "eccp_webauthn";
const CHALLENGE_MS = 5 * 60_000;

type PasskeyRow = { credential_id: string; coach_id: string; public_key: string; counter: number; transports: string[] };
export type PasskeyListItem = { credential_id: string; label: string; created_at: string; last_used_at: string | null };

const transportsOf = (t: string[]) => (t.length ? (t as AuthenticatorTransportFuture[]) : undefined);
export const canUsePasskeys = (coach: Coach) => coach.admin_role === "coach";

async function saveChallenge(challenge: string, coachId: string | null) {
  const db = getDb();
  await db.from("webauthn_challenges").delete().lt("expires_at", new Date().toISOString());
  const id = crypto.randomUUID();
  const { error } = await db
    .from("webauthn_challenges")
    .insert({ id, coach_id: coachId, challenge, expires_at: new Date(Date.now() + CHALLENGE_MS).toISOString() });
  if (error) throw new Error(`passkey challenge save failed: ${error.message}`);
  (await cookies()).set(CHALLENGE_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: CHALLENGE_MS / 1000,
  });
}

/** One-time: the challenge is deleted as it is read. Null if missing, expired or for someone else. */
async function takeChallenge(coachId: string | null): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(CHALLENGE_COOKIE)?.value;
  jar.delete(CHALLENGE_COOKIE);
  if (!id) return null;
  const { data, error } = await getDb()
    .from("webauthn_challenges")
    .delete()
    .eq("id", id)
    .select("coach_id, challenge, expires_at")
    .maybeSingle();
  if (error) throw new Error(`passkey challenge read failed: ${error.message}`);
  if (!data || new Date(data.expires_at).getTime() < Date.now() || data.coach_id !== coachId) return null;
  return data.challenge;
}

/** A failed read throws: "no passkeys" must never be a guess. */
export async function listPasskeys(coach: Coach): Promise<PasskeyListItem[]> {
  const { data, error } = await getDb()
    .from("coach_passkeys")
    .select("credential_id, label, created_at, last_used_at")
    .eq("coach_id", coach.id)
    .order("created_at");
  if (error) throw new Error(`passkey list failed: ${error.message}`);
  return data ?? [];
}

export async function removePasskey(coach: Coach, credentialId: string): Promise<void> {
  const { error } = await getDb().from("coach_passkeys").delete().eq("coach_id", coach.id).eq("credential_id", credentialId);
  if (error) throw new Error(`passkey remove failed: ${error.message}`);
}

export async function registrationOptions(coach: Coach) {
  if (!canUsePasskeys(coach)) throw new Error("passkeys are for coach accounts");
  const { data: existing, error } = await getDb().from("coach_passkeys").select("credential_id, transports").eq("coach_id", coach.id);
  if (error) throw new Error(`passkey lookup failed: ${error.message}`);
  const options = await generateRegistrationOptions({
    rpName: "Empowr ECCP",
    rpID: RP_ID,
    userName: coach.email,
    userDisplayName: coach.full_name,
    userID: new TextEncoder().encode(coach.id),
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((p) => ({ id: p.credential_id, transports: transportsOf(p.transports) })),
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });
  await saveChallenge(options.challenge, coach.id);
  return options;
}

export async function finishRegistration(coach: Coach, response: RegistrationResponseJSON, label: string): Promise<boolean> {
  if (!canUsePasskeys(coach)) return false;
  const expectedChallenge = await takeChallenge(coach.id);
  if (!expectedChallenge) return false;
  const v = await verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID }).catch(() => null);
  if (!v?.verified || !v.registrationInfo) return false;
  const { credential } = v.registrationInfo;
  const { error } = await getDb()
    .from("coach_passkeys")
    .insert({
      credential_id: credential.id,
      coach_id: coach.id,
      public_key: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports ?? [],
      label: label.trim().slice(0, 60) || "Passkey",
    });
  if (error) throw new Error(`passkey save failed: ${error.message}`);
  return true;
}

/** No email asked for: the device offers its own passkeys for this site. */
export async function authenticationOptions() {
  const options = await generateAuthenticationOptions({ rpID: RP_ID, userVerification: "preferred" });
  await saveChallenge(options.challenge, null);
  return options;
}

/**
 * Signs the passkey's owner in through the same openSession as the email code (30 days).
 * Returns the coach, or null if anything fails.
 */
export async function signInWithPasskey(response: AuthenticationResponseJSON): Promise<Coach | null> {
  const expectedChallenge = await takeChallenge(null);
  if (!expectedChallenge) return null;
  const db = getDb();
  const { data: pk, error } = await db
    .from("coach_passkeys")
    .select("credential_id, coach_id, public_key, counter, transports")
    .eq("credential_id", response.id)
    .maybeSingle<PasskeyRow>();
  if (error) throw new Error(`passkey lookup failed: ${error.message}`);
  if (!pk) return null;
  const v = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: pk.credential_id,
      publicKey: new Uint8Array(Buffer.from(pk.public_key, "base64url")),
      counter: Number(pk.counter),
      transports: transportsOf(pk.transports),
    },
  }).catch(() => null);
  if (!v?.verified) return null;
  // The same gate as the email code: the coach row must still exist now. And still a coach:
  // a row later made staff signs in through the Dashboard, not with an old passkey.
  const { data: coach, error: ce } = await db.from("coaches").select("id, email, full_name, admin_role").eq("id", pk.coach_id).maybeSingle<Coach>();
  if (ce) throw new Error(`coach lookup failed: ${ce.message}`);
  if (!coach || !canUsePasskeys(coach)) return null;
  const used = await db
    .from("coach_passkeys")
    .update({ counter: v.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
    .eq("credential_id", pk.credential_id);
  if (used.error) throw new Error(`passkey update failed: ${used.error.message}`);
  return (await openSession(coach.id, SESSION_DURATION_DAYS * 24)) ? coach : null;
}
