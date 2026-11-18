/** Convert a London wall-clock session start to an unambiguous UTC instant.
 * Rejects nonexistent DST times and ambiguous fall-back hours rather than guessing.
 */
export function londonSessionStartUtc(date: string, time: string): string | null {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
 const parsed = new Date(date + "T12:00:00Z");
 if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date) return null;
 const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
 });
 const [year, month, day] = date.split("-").map(Number);
 const [hour, minute] = time.split(":").map(Number);
 const naive = Date.UTC(year, month - 1, day, hour, minute);
 const matches: string[] = [];
 for (const offsetMinutes of [-60, 0, 60]) {
  const candidate = new Date(naive - offsetMinutes * 60_000);
  const parts = Object.fromEntries(formatter.formatToParts(candidate).map((part) => [part.type, part.value]));
  if (`${parts.year}-${parts.month}-${parts.day}` === date && `${parts.hour}:${parts.minute}` === time)
   matches.push(candidate.toISOString());
 }
 const unique = [...new Set(matches)];
 return unique.length === 1 ? unique[0] : null;
}
