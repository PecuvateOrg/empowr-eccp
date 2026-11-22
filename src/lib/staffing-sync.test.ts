import { test } from "node:test";
import assert from "node:assert/strict";
import { runStaffingSync, type SyncDeps, type Snapshot } from "./staffing-sync";

// The matching rules are tested against the database function itself:
// ops/sql-tests/staffing-sync-tests.sh. These tests cover the caller only.
const runId = "dddddddd-0000-0000-0000-000000000001";
const snapshot: Snapshot = {
  snapshotVersion: "a".repeat(64),
  sessions: [{ source_key: "occurrence:1", offering_id: "1", title: "Example", starts_at: "2027-01-11T15:30:00Z",
    ends_at: "2027-01-11T16:30:00Z", venue: null, status: "scheduled" }],
};

function deps(overrides: Partial<SyncDeps> = {}) {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const d: SyncDeps = {
    enabled: true,
    readSchedule: async () => snapshot,
    rpc: async (fn, args) => { calls.push({ fn, args }); return { data: { inserted: 1 }, error: null }; },
    ...overrides,
  };
  return { d, calls };
}

test("disabled: reads nothing and writes nothing", async () => {
  let read = false;
  const { d, calls } = deps({ enabled: false, readSchedule: async () => { read = true; return snapshot; } });
  assert.deepEqual(await runStaffingSync(runId, d), { status: "disabled" });
  assert.equal(read, false);
  assert.equal(calls.length, 0);
});

test("applies the whole snapshot in one call with the caller's run id", async () => {
  const { d, calls } = deps();
  const out = await runStaffingSync(runId, d);
  assert.equal(out.status, "applied");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].fn, "staffing_apply_snapshot");
  assert.deepEqual(calls[0].args, { p_run_id: runId, p_snapshot_version: snapshot.snapshotVersion, p_sessions: snapshot.sessions });
});

test("Members unavailable: nothing applied, failure recorded with a short code", async () => {
  const { d, calls } = deps({ readSchedule: async () => { throw new Error("Members schedule unavailable at https://example"); } });
  assert.deepEqual(await runStaffingSync(runId, d), { status: "failed", category: "members_unavailable" });
  assert.deepEqual(calls.map(c => c.fn), ["staffing_record_sync_failure"]);
  assert.deepEqual(calls[0].args, { p_run_id: runId, p_error_category: "members_unavailable" });
});

test("database refuses the snapshot: failure recorded; provider message never stored", async () => {
  const calls: string[] = [];
  const { d } = deps({
    rpc: async (fn, args) => {
      calls.push(fn + ":" + JSON.stringify(args));
      return fn === "staffing_apply_snapshot" ? { data: null, error: { message: "ECS00 invalid input secret-detail" } } : { data: null, error: null };
    },
  });
  assert.deepEqual(await runStaffingSync(runId, d), { status: "failed", category: "apply_failed" });
  assert.equal(calls.length, 2);
  assert.ok(!calls[1].includes("secret-detail"));
});

test("a failure to record the failure still reports the failure", async () => {
  const { d } = deps({
    readSchedule: async () => { throw new Error("down"); },
    rpc: async () => { throw new Error("db down"); },
  });
  assert.deepEqual(await runStaffingSync(runId, d), { status: "failed", category: "members_unavailable" });
});

test("a malformed run id is refused before anything is read", async () => {
  let read = false;
  const { d, calls } = deps({ readSchedule: async () => { read = true; return snapshot; } });
  assert.deepEqual(await runStaffingSync("not-a-uuid", d), { status: "failed", category: "invalid_run_id" });
  assert.equal(read, false);
  assert.equal(calls.length, 0);
});
