// Certificate dates are calendar dates in Europe/London, not server UTC — the
// documented Netlify+Supabase date-window gotcha. A server running in UTC can
// already be into "tomorrow" in London, or (during BST) still behind it, so
// the London calendar day is read explicitly rather than derived from the
// server's own clock offset.
function londonDateParts(instant: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

// A UTC midnight standing in for a London calendar date, so later formatting
// or arithmetic can't drift it by re-applying a timezone offset.
function toUtcDate({ year, month, day }: { year: number; month: number; day: number }): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export interface CertificateDates {
  readonly completedAt: string; // ISO date (yyyy-mm-dd), for the certificates table
  readonly renewsAt: string; // ISO date (yyyy-mm-dd), for the certificates table
  readonly completedAtLabel: string; // "15 September 2026", for the PDF
  readonly renewsAtLabel: string;
}

export function computeCertificateDates(now: Date = new Date()): CertificateDates {
  const completed = toUtcDate(londonDateParts(now));
  const renews = new Date(completed);
  renews.setUTCFullYear(renews.getUTCFullYear() + 3);

  return {
    completedAt: completed.toISOString().slice(0, 10),
    renewsAt: renews.toISOString().slice(0, 10),
    completedAtLabel: formatLabel(completed),
    renewsAtLabel: formatLabel(renews),
  };
}
