import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAssign, parseReason, shiftLabel, staffingEnabled, staffingError } from "./staffing-admin";

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const good = { coachId: id(1), sessionIds: [id(2), id(3)], role: "head", additionalPaid: false, reason: null, idempotencyKey: id(4) };

test("staffing is off unless the flag is exactly 'true'", () => {
  assert.equal(staffingEnabled({}), false);
  assert.equal(staffingEnabled({ ECCP_STAFFING_ENABLED: "1" }), false);
  assert.equal(staffingEnabled({ ECCP_STAFFING_ENABLED: "true" }), true);
});

test("assign request: valid shape accepted, everything else refused", () => {
  assert.deepEqual(parseAssign(good), { ...good, reason: null });
  assert.equal(parseAssign({ ...good, role: "champion" }), null);
  assert.equal(parseAssign({ ...good, sessionIds: [] }), null);
  assert.equal(parseAssign({ ...good, sessionIds: ["x"] }), null);
  assert.equal(parseAssign({ ...good, idempotencyKey: undefined }), null);
  assert.equal(parseAssign({ ...good, additionalPaid: true, reason: "  " }), null);
  assert.equal(parseAssign({ ...good, additionalPaid: true, reason: " ratios " })?.reason, "ratios");
  assert.equal(parseAssign(null), null);
});

test("cancel reason: optional, trimmed, bounded", () => {
  assert.equal(parseReason({}), null);
  assert.equal(parseReason({ reason: "  ill " }), "ill");
  assert.equal(parseReason({ reason: 5 }), undefined);
  assert.equal(parseReason({ reason: "x".repeat(501) }), undefined);
});

test("database codes become fixed messages; database text never leaks", () => {
  assert.equal(staffingError({ code: "ECS03" }, "assign").status, 403);
  assert.equal(staffingError({ code: "ECS05", message: "coach not eligible for this role" }, "assign").message, "This coach's grade does not allow that role.");
  assert.equal(staffingError({ code: "ECS05", message: "something internal" }, "assign").message, "This coach can't take that role.");
  assert.match(staffingError({ code: "ECS23" }, "review").message, /double-book/);
  assert.match(staffingError({ code: "ECS23" }, "assign").message, /already has a shift/);
  assert.match(staffingError({ code: "ECS06" }, "cancel").message, /already cancelled/);
  const unknown = staffingError({ code: "XX000", message: "connection to 10.0.0.1 refused" }, "assign");
  assert.equal(unknown.status, 503);
  assert.doesNotMatch(unknown.message, /10\.0/);
});

test("shift times are shown in UK time, including summer time", () => {
  assert.equal(shiftLabel("2027-01-11T15:30:00Z", "2027-01-11T16:30:00Z"), "Mon, 11 Jan 2027 · 15:30–16:30");
  assert.equal(shiftLabel("2027-07-12T15:30:00Z", "2027-07-12T16:30:00Z"), "Mon, 12 Jul 2027 · 16:30–17:30");
});
