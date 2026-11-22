// Pure helpers for the staffing screens. The rules themselves (eligibility,
// overlap, states) live only in the eccp.staffing_* database functions; this
// file never pre-checks them, it only shapes requests and explains refusals.

export const staffingEnabled = (env: Record<string, string | undefined> = process.env) =>
  env.ECCP_STAFFING_ENABLED === "true";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export const ROLES = ["head", "assistant", "junior_assistant"] as const;
export type ShiftRole = (typeof ROLES)[number];
export const roleLabel: Record<ShiftRole, string> = { head: "Head coach", assistant: "Assistant coach", junior_assistant: "Junior assistant" };
export const gradeLabel = (grade: string | null) =>
  grade === "head_coach" ? "Head coach" : grade === "assistant_coach" ? "Assistant coach"
  : grade === "junior_assistant_coach" ? "Junior assistant coach" : "No grade";

export type AssignRequest = { coachId: string; sessionIds: string[]; role: ShiftRole; additionalPaid: boolean; reason: string | null; idempotencyKey: string };
export function parseAssign(input: unknown): AssignRequest | null {
  if (!input || typeof input !== "object") return null;
  const i = input as Record<string, unknown>;
  if (!isUuid(i.coachId) || !isUuid(i.idempotencyKey)) return null;
  if (!Array.isArray(i.sessionIds) || i.sessionIds.length < 1 || i.sessionIds.length > 100 || !i.sessionIds.every(isUuid)) return null;
  if (typeof i.role !== "string" || !ROLES.includes(i.role as ShiftRole)) return null;
  if (typeof i.additionalPaid !== "boolean") return null;
  const reason = typeof i.reason === "string" && i.reason.trim() ? i.reason.trim() : null;
  if (reason && reason.length > 500) return null;
  if (i.additionalPaid && !reason) return null;
  return { coachId: i.coachId, sessionIds: i.sessionIds as string[], role: i.role as ShiftRole, additionalPaid: i.additionalPaid, reason, idempotencyKey: i.idempotencyKey };
}
export function parseReason(input: unknown): string | null | undefined {
  if (!input || typeof input !== "object") return undefined;
  const r = (input as Record<string, unknown>).reason;
  if (r === undefined || r === null) return null;
  if (typeof r !== "string" || r.length > 500) return undefined;
  return r.trim() || null;
}

// Database error codes (ops/staffing-*-proposed.sql) -> plain message + status.
// Only fixed text reaches the browser, never the database message itself.
const eligibility: Record<string, string> = {
  "coach not eligible for this role": "This coach's grade does not allow that role.",
  "coach has no certificate valid on the session date": "This coach has no certificate valid on the session date.",
  "coach not found": "Coach not found.",
};
export type Context = "assign" | "cancel" | "review";
export function staffingError(error: { code?: string; message?: string }, context: Context): { message: string; status: number } {
  switch (error.code) {
    case "ECS00": return { message: "That request was not valid.", status: 400 };
    case "ECS03": return { message: "Only an admin can do this.", status: 403 };
    case "ECS04": return { message: "One of those sessions can't take coaches: it is past, cancelled, under review or unknown.", status: 409 };
    case "ECS05": return { message: eligibility[error.message ?? ""] ?? "This coach can't take that role.", status: 422 };
    case "ECS06": return context === "cancel"
      ? { message: "This shift is already cancelled.", status: 409 }
      : { message: "This session is no longer waiting for review.", status: 409 };
    case "ECS09": return { message: "This form was already sent with different choices. Reload and try again.", status: 409 };
    case "ECS23": return context === "review"
      ? { message: "Accepting this change would double-book a coach. Cancel their other shift first.", status: 409 }
      : { message: "This coach already has a shift at that time.", status: 409 };
    default: return { message: "Scheduling is unavailable. Try again shortly.", status: 503 };
  }
}

// Times are shown in UK time explicitly: the server renders in UTC.
const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function shiftLabel(startsAt: string, endsAt: string): string {
  const a = new Date(startsAt), b = new Date(endsAt);
  return `${dayFmt.format(a)} · ${timeFmt.format(a)}–${timeFmt.format(b)}`;
}
export type Venue = { name: string; address: string | null; postcode: string | null } | null;
export const venueLabel = (v: Venue) => (v ? [v.name, v.postcode].filter(Boolean).join(", ") : "No venue");
