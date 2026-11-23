/**
 * Compliance reminder eligibility rules. Pure functions: no coach records,
 * emails, database writes or production changes.
 * Completion deadlines are separate from certificate renewal/expiry dates.
 */
export type ComplianceRequirement = "safeguarding" | "first_aid" | "dbs" | "training" | "qualification";
export type ComplianceStatus = "outstanding" | "complete" | "not_required";
export type ReminderCadence = "manual" | "seven_days" | "one_day" | "overdue";
export type ReminderRecord = {
  coachId: string;
  requirement: ComplianceRequirement;
  status: ComplianceStatus;
  deadline: string | null; // Europe/London calendar date YYYY-MM-DD
  renewalDate?: string | null; // never used as the completion deadline
};
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value+"T12:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function calendarDayDifference(deadline: string, today: string): number | null {
  if (!isCalendarDate(deadline) || !isCalendarDate(today)) return null;
  return Math.round((Date.parse(deadline+"T12:00:00Z")-Date.parse(today+"T12:00:00Z"))/86400000);
}
export function reminderEligible(record: ReminderRecord, cadence: ReminderCadence, today: string): boolean {
  if (record.status !== "outstanding" || !record.deadline) return false;
  const days = calendarDayDifference(record.deadline,today);
  if (days === null) return false;
  if (cadence === "manual") return true;
  if (cadence === "seven_days") return days === 7;
  if (cadence === "one_day") return days === 1;
  return days < 0;
}
export function reminderDedupKey(record: ReminderRecord, cadence: ReminderCadence, today: string): string {
  // Manual reminders need an independently generated request key on the server.
  return [record.coachId,record.requirement,record.deadline??"none",cadence,today].join(":");
}
