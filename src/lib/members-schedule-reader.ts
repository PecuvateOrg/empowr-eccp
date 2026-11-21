import "server-only";

export type StaffingSession = {
  source_key: string;
  offering_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  venue: { name: string; address: string | null; postcode: string | null } | null;
  status: "scheduled" | "cancelled";
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid schedule record");
  return value as Record<string, unknown>;
}
function required(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Invalid schedule field");
  return value;
}
function nullable(value: unknown): string | null {
  return value === null ? null : required(value);
}
function session(value: unknown): StaffingSession {
  const row = record(value);
  const source_key = required(row.source_key);
  if (!/^(occurrence:[^:]+|course-run:[^:]+:\d{4}-\d{2}-\d{2})$/.test(source_key)) throw new Error("Invalid source key");
  const starts_at = required(row.starts_at);
  const ends_at = required(row.ends_at);
  if (!Number.isFinite(Date.parse(starts_at)) || !Number.isFinite(Date.parse(ends_at)) || Date.parse(ends_at) <= Date.parse(starts_at)) throw new Error("Invalid session times");
  const status = row.status;
  if (status !== "scheduled" && status !== "cancelled") throw new Error("Invalid session status");
  const v = row.venue === null ? null : record(row.venue);
  return { source_key, offering_id: required(row.offering_id), title: required(row.title), starts_at, ends_at, status,
    venue: v ? { name: required(v.name), address: nullable(v.address), postcode: nullable(v.postcode) } : null };
}

/** Read-only; never persists partial data or activates synchronisation. */
export async function readMembersSchedule(): Promise<{ snapshotVersion: string; sessions: StaffingSession[] }> {
  if (process.env.ECCP_MEMBERS_SCHEDULE_ENABLED !== "1") throw new Error("Schedule reader disabled");
  const secret = process.env.MEMBERS_ECCP_SCHEDULE_SECRET;
  if (!secret || secret.length < 32) throw new Error("Schedule reader not configured");
  const endpoint = "https://members.empowrcic.org/api/integrations/eccp/schedule";
  const sessions: StaffingSession[] = [];
  const seen = new Set<string>();
  let version: string | undefined;
  let total: number | undefined;
  for (let page = 0; page < 400; page++) {
    const url = new URL(endpoint);
    url.searchParams.set("offset", String(sessions.length));
    if (version) url.searchParams.set("snapshot_version", version);
    const response = await fetch(url, { headers: { Authorization: "Bearer " + secret }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Members schedule unavailable");
    const data = record(await response.json());
    const current = required(data.snapshot_version);
    const count = data.total;
    if (data.schema_version !== 1 || data.timezone !== "Europe/London" || !/^[a-f0-9]{64}$/.test(current) || typeof count !== "number" || !Number.isSafeInteger(count) || count < 0 || count > 100000 || data.offset !== sessions.length || !Array.isArray(data.sessions) || data.sessions.length > 250 || (version !== undefined && current !== version) || (total !== undefined && count !== total)) throw new Error("Inconsistent schedule page");
    version = current;
    total = count;
    for (const raw of data.sessions) {
      const row = session(raw);
      if (seen.has(row.source_key)) throw new Error("Duplicate schedule key");
      seen.add(row.source_key);
      sessions.push(row);
    }
    if (sessions.length > total) throw new Error("Invalid schedule total");
    if (data.complete === true && data.next_offset === null && sessions.length === total) return { snapshotVersion: version, sessions };
    if (data.complete !== false || !data.sessions.length || sessions.length >= total || data.next_offset !== sessions.length) throw new Error("Invalid schedule pagination");
  }
  throw new Error("Schedule page limit exceeded");
}
