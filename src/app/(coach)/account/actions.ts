"use server";

import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { getCurrentCoach } from "@/lib/auth";
import {
  canUsePasskeys, finishRegistration, listPasskeys, passkeysEnabled, registrationOptions, removePasskey,
  type PasskeyListItem,
} from "@/lib/passkeys";
import { ALERT_KINDS, setAlertSetting, type AlertKind } from "@/lib/push";

// Every action acts only on the signed-in coach's own passkeys.

const FAILED = { error: "That couldn't be done just now. Try again in a moment." };

async function me() {
  if (!passkeysEnabled) return null;
  const coach = await getCurrentCoach();
  return coach && canUsePasskeys(coach) ? coach : null;
}

export async function myPasskeys(): Promise<{ passkeys: PasskeyListItem[] } | { error: string }> {
  const coach = await me();
  if (!coach) return FAILED;
  try {
    return { passkeys: await listPasskeys(coach) };
  } catch (e) {
    console.error("passkey list failed", e);
    return { error: "Couldn't load your passkeys. Refresh to try again." };
  }
}

export async function startAddPasskey() {
  const coach = await me();
  if (!coach) return FAILED;
  try {
    return { options: await registrationOptions(coach) };
  } catch (e) {
    console.error("passkey options failed", e);
    return FAILED;
  }
}

export async function finishAddPasskey(response: RegistrationResponseJSON, label: string): Promise<{ ok: true } | { error: string }> {
  const coach = await me();
  if (!coach) return FAILED;
  try {
    return (await finishRegistration(coach, response, label)) ? { ok: true } : { error: "The passkey couldn't be checked. Try again." };
  } catch (e) {
    console.error("passkey save failed", e);
    return FAILED;
  }
}

export async function deletePasskey(credentialId: string): Promise<{ ok: true } | { error: string }> {
  const coach = await me();
  if (!coach) return FAILED;
  try {
    await removePasskey(coach, credentialId);
    return { ok: true };
  } catch (e) {
    console.error("passkey remove failed", e);
    return FAILED;
  }
}

// Which kinds of alert this coach wants (Account page). Coach accounts only.
export async function setAlertKind(kind: AlertKind, on: boolean): Promise<{ ok: true } | { error: string }> {
  const coach = await getCurrentCoach();
  if (!coach || coach.admin_role !== "coach" || !(kind in ALERT_KINDS) || typeof on !== "boolean") return FAILED;
  try {
    await setAlertSetting(coach.id, kind, on);
    return { ok: true };
  } catch (e) {
    console.error("alert setting save failed", e);
    return FAILED;
  }
}
