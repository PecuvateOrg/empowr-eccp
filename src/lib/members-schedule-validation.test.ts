import { test } from "node:test";
import assert from "node:assert/strict";
import { collectSchedule } from "./members-schedule-validation";

const version = "a".repeat(64);
const row = (id: string) => ({ source_key: "occurrence:" + id, offering_id: "offering", title: "Example", starts_at: "2027-01-01T10:00:00Z", ends_at: "2027-01-01T11:00:00Z", status: "scheduled", venue: null });
const page = (offset: number, sessions: unknown[], total: number) => ({ schema_version: 1, timezone: "Europe/London", snapshot_version: version, offset, sessions, total, complete: offset + sessions.length === total, next_offset: offset + sessions.length === total ? null : offset + sessions.length });

test("collects all pages with stable snapshot", async () => {
  const result = await collectSchedule(async (offset, expected) => {
    assert.equal(expected, offset ? version : undefined);
    return page(offset, [row(String(offset))], 2);
  });
  assert.equal(result.sessions.length, 2);
  assert.equal(result.snapshotVersion, version);
});
test("accepts empty complete snapshot", async () => {
  assert.deepEqual((await collectSchedule(async () => page(0, [], 0))).sessions, []);
});
test("rejects duplicate keys across pages", async () => {
  await assert.rejects(collectSchedule(async offset => page(offset, [row("same")], 2)), /Duplicate/);
});
test("rejects changed snapshot and total", async () => {
  await assert.rejects(collectSchedule(async offset => ({ ...page(offset, [row(String(offset))], 2), snapshot_version: offset ? "b".repeat(64) : version })), /Inconsistent/);
  await assert.rejects(collectSchedule(async offset => page(offset, [row(String(offset))], offset ? 3 : 2)), /Inconsistent/);
});
test("rejects malformed times and statuses", async () => {
  await assert.rejects(collectSchedule(async () => page(0, [{ ...row("1"), ends_at: "invalid" }], 1)), /times/);
  await assert.rejects(collectSchedule(async () => page(0, [{ ...row("1"), status: "completed" }], 1)), /status/);
});
test("preserves explicit cancellation", async () => {
  const result = await collectSchedule(async () => page(0, [{ ...row("1"), status: "cancelled" }], 1));
  assert.equal(result.sessions[0].status, "cancelled");
});
test("rejects incomplete or failed subsequent pages", async () => {
  await assert.rejects(collectSchedule(async offset => {
    if (offset) throw new Error("Unavailable");
    return page(0, [row("1")], 2);
  }), /Unavailable/);
  await assert.rejects(collectSchedule(async () => ({ ...page(0, [row("1")], 2), next_offset: 99 })), /pagination/);
});
