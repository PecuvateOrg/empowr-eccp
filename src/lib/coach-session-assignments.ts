import { isAvailable, type CoachAvailability, type Weekday } from "./coach-availability";

export type AssignmentStatus = "offered" | "accepted" | "declined" | "withdrawn" | "completed" | "cancelled";
export interface SessionAssignment {
  id: string;
  coachId: string;
  sessionId: string;
  date: string; // YYYY-MM-DD, Europe/London calendar date
  start: string; // HH:mm, Europe/London local wall time
  end: string;
  status: AssignmentStatus;
}
export type CoachDecision = "accept" | "decline" | "withdraw";
export type Conflict = { assignmentId: string; sessionId: string; date: string; start: string; end: string; reason: "outside_availability" };

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
function dayOfWeek(date: string): Weekday | null {
  if (!datePattern.test(date)) return null;
  const parsed = new Date(date + "T12:00:00Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  return ((parsed.getUTCDay() + 6) % 7) as Weekday;
}
export function validateAssignment(value: SessionAssignment): string[] {
  const errors: string[] = [];
  if (!value.id || !value.coachId || !value.sessionId) errors.push("Assignment identifiers required");
  if (dayOfWeek(value.date) === null) errors.push("Invalid session date");
  if (!timePattern.test(value.start) || !timePattern.test(value.end) || value.start >= value.end) errors.push("Invalid session hours");
  if (!["offered", "accepted", "declined", "withdrawn", "completed", "cancelled"].includes(value.status)) errors.push("Invalid assignment status");
  return errors;
}

/** Only actionable assignments create availability conflicts; no alert on every edit. */
export function detectAvailabilityConflicts(
  availability: CoachAvailability,
  assignments: SessionAssignment[],
  coachId: string,
): Conflict[] {
  return assignments.filter((assignment) => {
    if (assignment.coachId !== coachId || !["offered", "accepted"].includes(assignment.status)) return false;
    const weekday = dayOfWeek(assignment.date);
    return weekday === null || validateAssignment(assignment).length > 0 ||
      !isAvailable(availability, assignment.date, weekday, assignment.start, assignment.end);
  }).map((assignment) => ({
    assignmentId: assignment.id, sessionId: assignment.sessionId,
    date: assignment.date, start: assignment.start, end: assignment.end,
    reason: "outside_availability" as const,
  }));
}

/** Compare conflicts before and after an availability change to avoid duplicate notifications. */
export function newlyIntroducedConflicts(
  previous: CoachAvailability,
  next: CoachAvailability,
  assignments: SessionAssignment[],
  coachId: string,
): Conflict[] {
  const existing = new Set(detectAvailabilityConflicts(previous, assignments, coachId).map((c) => c.assignmentId));
  return detectAvailabilityConflicts(next, assignments, coachId).filter((c) => !existing.has(c.assignmentId));
}

export function applyCoachDecision(
  assignment: SessionAssignment,
  actorCoachId: string,
  decision: CoachDecision,
  reason?: string,
): SessionAssignment {
  if (assignment.coachId !== actorCoachId) throw new Error("Cannot change another coach's assignment");
  if (validateAssignment(assignment).length) throw new Error("Invalid assignment");
  if (decision === "accept" && assignment.status === "offered") return { ...assignment, status: "accepted" };
  if (decision === "decline" && assignment.status === "offered") return { ...assignment, status: "declined" };
  if (decision === "withdraw" && assignment.status === "accepted") {
    if (!reason?.trim()) throw new Error("Withdrawal reason required");
    return { ...assignment, status: "withdrawn" };
  }
  throw new Error("Assignment status does not allow this action");
}

/** Urgent withdrawal if the session begins within 24h. Caller supplies the verified UTC start instant. */
export function isUrgentWithdrawal(sessionStartUtc: string, nowUtc: string): boolean {
  const start = Date.parse(sessionStartUtc);
  const now = Date.parse(nowUtc);
  if (!Number.isFinite(start) || !Number.isFinite(now)) throw new Error("Invalid timestamp");
  return start >= now && start - now < 24 * 60 * 60 * 1000;
}
