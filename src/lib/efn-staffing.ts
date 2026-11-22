// Shift screens over EFN's /api/eccp/v1 (EFN is the staffing engine; owner decision 2026-11-20).
// Pure helpers only: what ECCP may forward, and how EFN's answers read to a person.
// Every staffing rule (grade, certificate, age, hours, double booking) is enforced by EFN.

export const shiftScreensEnabled = (env: Record<string, string | undefined> = process.env) =>
  env.ECCP_SHIFTS_ENABLED === "true";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** Coach actions ECCP forwards: POST /shifts/:id/{response|withdraw}. */
export const COACH_ACTIONS = ["response", "withdraw"] as const;
/** Staff actions ECCP forwards: POST /staff/{sessions|positions}/:id/<action>. */
const STAFF_ACTIONS: Record<string, readonly string[]> = {
  sessions: ["positions", "review"],
  positions: ["assign", "cover"],
};
export function staffPath(parts: string[]): string | null {
  const [kind, id, action] = parts;
  if (parts.length !== 3 || !isUuid(id) || !STAFF_ACTIONS[kind]?.includes(action)) return null;
  return `/staff/${kind}/${id}/${action}`;
}

// EFN answers errors as { error: <code or sentence> }. Codes become plain text here; EFN's own
// 4xx sentences are already plain and pass through; anything else is a generic message.
const CODES: Record<string, string> = {
  not_linked: "This coach isn't set up for paid work yet. Link them to their EFN freelancer record in the EFN dashboard first.",
  coach_not_found: "Coach not found.",
  not_found: "Shift not found.",
  session_not_found: "Session not found.",
  position_not_found: "That place no longer exists. Reload the page.",
  not_staff: "Only Empowr staff can do this.",
  admin_only: "Only an admin can do this.",
  unknown_role: "That role isn't recognised.",
  bad_scope: "Choose this date or the whole series.",
  cover_is_one_date: "Cover is for one date at a time.",
  session_cancelled: "This session is cancelled.",
  staffing_locked: "Staffing for this term is locked.",
  no_date_of_birth: "This coach has no date of birth on record, so their age can't be checked.",
  age_not_eligible: "This coach's age doesn't fit the role on that date.",
  double_booked: "This coach already has a session at that time.",
  filled: "This place is already filled.",
  grade_not_eligible: "This coach's grade doesn't allow that role.",
  certificate_expired: "This coach has no certificate valid on that date.",
  no_head_coach: "A junior can only be added once a head coach is on the session.",
  young_worker_night: "Under-18s can't work between 22:00 and 06:00.",
  young_worker_hours: "That would take this under-18 over 8 hours that day or 40 hours that week.",
  bad_date: "Those dates aren't valid.",
};
const GENERIC = "Scheduling is unavailable. Try again shortly.";
export function efnMessage(status: number, error: unknown): string {
  if (typeof error === "string" && CODES[error]) return CODES[error];
  if (status >= 400 && status < 500 && typeof error === "string" && error.length <= 200 && /\s/.test(error)) return error;
  return GENERIC;
}
/** A skipped date in a series assignment: "Sat 5 Dec: <reason>". */
export const skippedText = (s: { date: string; reason: string }) =>
  `${new Date(s.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}: ${CODES[s.reason] ?? s.reason}`;

// UK time, explicitly: the server renders in UTC.
const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const whenText = (startsAt: string, endsAt: string) =>
  `${dayFmt.format(new Date(startsAt))} · ${timeFmt.format(new Date(startsAt))}–${timeFmt.format(new Date(endsAt))}`;
export type Venue = { name: string | null; address: string | null; postcode: string | null };
export const venueText = (v: Venue | null) => (v?.name ? [v.name, v.postcode].filter(Boolean).join(", ") : "Venue to be confirmed");

/** yyyy-mm-dd in London, `days` from now. */
export function londonDate(days = 0, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(now.getTime() + days * 86_400_000));
}
