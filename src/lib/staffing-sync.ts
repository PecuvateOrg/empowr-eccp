import type { StaffingSession } from "./members-schedule-validation";

// Members schedule -> eccp.staffing_sessions.
//
// The matching rules live only in the database function
// eccp.staffing_apply_snapshot (ops/staffing-sync-functions-proposed.sql), which
// applies them under a lock. This side only fetches a complete, validated
// snapshot and makes one call, so a plan can never be stale by the time it is applied.
//
// Off unless ECCP_STAFFING_SYNC_ENABLED is exactly "true". Nothing schedules
// this yet; activation needs maintainer approval (ops/staffing-integration-review.md).

export type Snapshot = { snapshotVersion: string; sessions: StaffingSession[] };
export type RpcResult = { data: unknown; error: { message: string } | null };
export type SyncDeps = {
  enabled: boolean;
  /** Reads every page from Members and validates it (collectSchedule). */
  readSchedule: () => Promise<Snapshot>;
  rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcResult>;
};
export type SyncOutcome =
  | { status: "disabled" }
  | { status: "applied"; summary: unknown }
  | { status: "failed"; category: SyncFailure };
export type SyncFailure = "invalid_run_id" | "members_unavailable" | "apply_failed";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Run one sync. `runId` must be chosen once per scheduled run and reused on
 * retry: the database then applies the snapshot at most once for that run.
 */
export async function runStaffingSync(runId: string, deps: SyncDeps): Promise<SyncOutcome> {
  if (!deps.enabled) return { status: "disabled" };
  if (!UUID.test(runId)) return { status: "failed", category: "invalid_run_id" };

  let snapshot: Snapshot;
  try {
    snapshot = await deps.readSchedule();
  } catch {
    return fail(runId, "members_unavailable", deps);
  }

  const { data, error } = await deps.rpc("staffing_apply_snapshot", {
    p_run_id: runId,
    p_snapshot_version: snapshot.snapshotVersion,
    p_sessions: snapshot.sessions,
  });
  if (error) return fail(runId, "apply_failed", deps);
  return { status: "applied", summary: data };
}

async function fail(runId: string, category: SyncFailure, deps: SyncDeps): Promise<SyncOutcome> {
  // Recorded in its own call: the failed apply rolled back everything it wrote.
  // Only the short code is stored, never the provider's message.
  try {
    await deps.rpc("staffing_record_sync_failure", { p_run_id: runId, p_error_category: category });
  } catch {
    // Recording is best effort; the outcome still reports the failure.
  }
  return { status: "failed", category };
}
