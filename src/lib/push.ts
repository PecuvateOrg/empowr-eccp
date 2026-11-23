import webpush from "web-push";
import { getDb } from "./supabase";

// Phone/desktop alerts for coaches (owner 2026-11-23; Web Build Framework types/web-app/account-page.md,
// pattern _config/guides/nextjs-installable-app-and-push.md). A device turns alerts on from Account;
// ECCP sends when the event happens. Coach accounts only: staff alerts are the Dashboard's.
// Off unless both VAPID keys are set (SSM VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
export const pushEnabled = Boolean(VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

export const ALERT_KINDS = {
  replies: { label: "Replies from the staff team", hint: "When Empowr staff answer one of your messages." },
  shifts: { label: "New shifts", hint: "When staff put you on a session in ECCP." },
} as const;
export type AlertKind = keyof typeof ALERT_KINDS;
export type AlertSettings = Record<AlertKind, boolean>;
const DEFAULTS: AlertSettings = { replies: true, shifts: true };

export type DeviceSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };
type Payload = { title: string; body: string; url: string };

function configure() {
  webpush.setVapidDetails("mailto:tech@pecuvate.com", VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY!);
}

/** Accepts only what a browser's PushSubscription.toJSON() gives, with an https push service. */
export function parseSubscription(input: unknown): DeviceSubscription | null {
  const s = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const ok = (v: unknown, max: number): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
  if (!s || !ok(s.endpoint, 1000) || !ok(s.keys?.p256dh, 200) || !ok(s.keys?.auth, 100)) return null;
  try {
    if (new URL(s.endpoint).protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { endpoint: s.endpoint, keys: { p256dh: s.keys!.p256dh as string, auth: s.keys!.auth as string } };
}

export async function saveSubscription(coachId: string, sub: DeviceSubscription) {
  const { error } = await getDb()
    .from("coach_push_subscriptions")
    .upsert({ endpoint: sub.endpoint, coach_id: coachId, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
  if (error) throw new Error(`push subscription save failed: ${error.message}`);
}

export async function removeSubscription(coachId: string, endpoint: string) {
  const { error } = await getDb().from("coach_push_subscriptions").delete().eq("coach_id", coachId).eq("endpoint", endpoint);
  if (error) throw new Error(`push subscription delete failed: ${error.message}`);
}

/** A failed read throws: the Account page must not show "on" or "off" as a guess. */
export async function getAlertSettings(coachId: string): Promise<AlertSettings> {
  const { data, error } = await getDb().from("coach_alert_settings").select("replies, shifts").eq("coach_id", coachId).maybeSingle();
  if (error) throw new Error(`alert settings read failed: ${error.message}`);
  return data ?? DEFAULTS;
}

export async function setAlertSetting(coachId: string, kind: AlertKind, on: boolean) {
  const current = await getAlertSettings(coachId);
  const { error } = await getDb()
    .from("coach_alert_settings")
    .upsert({ coach_id: coachId, ...current, [kind]: on, updated_at: new Date().toISOString() });
  if (error) throw new Error(`alert settings save failed: ${error.message}`);
}

async function sendTo(subs: { endpoint: string; p256dh: string; auth: string }[], payload: Payload) {
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
      sent++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      // 404/410 = the device dropped the subscription (app removed, alerts turned off): forget it.
      if (code === 404 || code === 410) await getDb().from("coach_push_subscriptions").delete().eq("endpoint", s.endpoint);
      else console.error("[push] send failed", code, err);
    }
  }
  return sent;
}

/** One alert of this kind to every device of each coach who has that kind on. Never throws. */
export async function alertCoaches(coachIds: string[], kind: AlertKind, payload: Payload): Promise<number> {
  if (!pushEnabled || coachIds.length === 0) return 0;
  try {
    configure();
    const db = getDb();
    const { data: off, error: se } = await db.from("coach_alert_settings").select("coach_id").in("coach_id", coachIds).eq(kind, false);
    if (se) throw new Error(se.message);
    const wanted = coachIds.filter((id) => !(off ?? []).some((o) => o.coach_id === id));
    if (!wanted.length) return 0;
    const { data, error } = await db.from("coach_push_subscriptions").select("endpoint, p256dh, auth").in("coach_id", wanted);
    if (error) throw new Error(error.message);
    return await sendTo(data ?? [], payload);
  } catch (err) {
    console.error("[push] alertCoaches failed", kind, err);
    return 0;
  }
}

/** One test alert to every device this coach has, from the Account page. */
export async function sendTest(coachId: string) {
  if (!pushEnabled) return 0;
  configure();
  const { data, error } = await getDb().from("coach_push_subscriptions").select("endpoint, p256dh, auth").eq("coach_id", coachId);
  if (error) throw new Error(`push lookup failed: ${error.message}`);
  return sendTo(data ?? [], { title: "Alerts are on", body: "You'll get a message here when there's news from Empowr.", url: "/dashboard" });
}
