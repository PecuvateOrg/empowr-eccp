import "server-only";
import { readMembersSchedule } from "./members-schedule-reader";
import { getDb } from "./supabase";
import { runStaffingSync } from "./staffing-sync";

/** Server entry point. Off unless ECCP_STAFFING_SYNC_ENABLED is "true"; nothing calls it yet. */
export function syncStaffingFromMembers(runId: string) {
  const db = getDb();
  return runStaffingSync(runId, {
    enabled: process.env.ECCP_STAFFING_SYNC_ENABLED === "true",
    readSchedule: readMembersSchedule,
    rpc: async (fn, args) => {
      const { data, error } = await db.rpc(fn, args);
      return { data, error: error ? { message: error.message } : null };
    },
  });
}
