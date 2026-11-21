import { timingSafeEqual } from "node:crypto";

// Pure rules for messaging alerts (unit-tested).

export const COACH_ALERT_GAP_MS = 15 * 60 * 1000;

// At most one reply email per conversation per 15 minutes.
export function shouldEmailCoach(lastNotifiedAt: string | null, now: Date): boolean {
  if (!lastNotifiedAt) return true;
  return now.getTime() - Date.parse(lastNotifiedAt) >= COACH_ALERT_GAP_MS;
}

// Constant-time check of the Dashboard's x-staff-queue-secret header. An unset
// or short secret on our side always fails, so a missing env var can't open it.
export function queueSecretValid(given: string | null, expected: string | undefined): boolean {
  if (!expected || expected.length < 32 || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
