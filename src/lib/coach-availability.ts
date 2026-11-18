/**
 * Phase 1 coach availability domain rules.
 * All times are Europe/London local wall-clock times, HH:mm.
 * Persistence and assigned-session conflict alerts require verified DB schema.
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Monday = 0
export interface WeeklyWindow { weekday: Weekday; start: string; end: string }
export interface DateException { date: string; available: boolean; start?: string; end?: string }
export interface CoachAvailability { weekly: WeeklyWindow[]; exceptions: DateException[] }

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const validWindow = (start: string, end: string) =>
  typeof start === "string" && typeof end === "string" && timePattern.test(start) && timePattern.test(end) && minutes(start) < minutes(end);

export function validateAvailability(value: CoachAvailability): string[] {
  const errors: string[] = [];
  for (const [i, window] of value.weekly.entries()) {
    if (!window || typeof window !== "object" || !Number.isInteger(window.weekday) || window.weekday < 0 || window.weekday > 6 ||
      !validWindow(window.start, window.end)) errors.push(`Invalid weekly window ${i + 1}`);
  }
  const dates = new Set<string>();
  for (const [i, exception] of value.exceptions.entries()) {
    if (!exception || typeof exception !== "object" || typeof exception.date !== "string") { errors.push(`Invalid exception ${i + 1}`); continue; }
    const parsed = new Date(`${exception.date}T12:00:00Z`);
    if (!datePattern.test(exception.date) || Number.isNaN(parsed.valueOf()) ||
      parsed.toISOString().slice(0, 10) !== exception.date) {
      errors.push(`Invalid exception date ${i + 1}`);
    }
    if (dates.has(exception.date)) errors.push(`Duplicate exception date ${exception.date}`);
    dates.add(exception.date);
    if (exception.available && (!exception.start || !exception.end ||
      !validWindow(exception.start, exception.end))) {
      errors.push(`Invalid exception hours ${i + 1}`);
    }
  }
  for (const day of [0, 1, 2, 3, 4, 5, 6] as Weekday[]) {
    const windows = value.weekly.filter((w) => w.weekday === day &&
      validWindow(w.start, w.end)).sort((a, b) => minutes(a.start) - minutes(b.start));
    for (let i = 1; i < windows.length; i++) {
      if (minutes(windows[i].start) < minutes(windows[i - 1].end)) {
        errors.push(`Overlapping windows on weekday ${day}`);
      }
    }
  }
  return errors;
}

/** Check an assigned session in local London date/time against availability. */
export function isAvailable(
  availability: CoachAvailability,
  date: string,
  weekday: Weekday,
  start: string,
  end: string,
): boolean {
  if (validateAvailability(availability).length || !validWindow(start, end)) return false;
  const exception = availability.exceptions.find((item) => item.date === date);
  if (exception) {
    return exception.available === true &&
      minutes(exception.start!) <= minutes(start) &&
      minutes(exception.end!) >= minutes(end);
  }
  return availability.weekly.some((w) =>
    w.weekday === weekday && minutes(w.start) <= minutes(start) &&
    minutes(w.end) >= minutes(end));
}
