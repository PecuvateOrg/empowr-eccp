import "server-only";
import { collectSchedule } from "./members-schedule-validation";

/** Read-only; never persists partial data or activates synchronisation. */
export async function readMembersSchedule() {
  if (process.env.ECCP_MEMBERS_SCHEDULE_ENABLED !== "1") throw new Error("Schedule reader disabled");
  const secret = process.env.MEMBERS_ECCP_SCHEDULE_SECRET;
  if (!secret || secret.length < 32) throw new Error("Schedule reader not configured");
  return collectSchedule(async (offset, version) => {
    const url = new URL("https://members.empowrcic.org/api/integrations/eccp/schedule");
    url.searchParams.set("offset", String(offset));
    if (version) url.searchParams.set("snapshot_version", version);
    const response = await fetch(url, { headers: { Authorization: "Bearer " + secret }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Members schedule unavailable");
    return response.json();
  });
}
