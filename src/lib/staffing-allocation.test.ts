import { test } from "node:test";
import assert from "node:assert/strict";
import { selectDates, overlaps, validateAllocation, staffingRequirement, approveCover, type Allocation } from "./staffing-allocation";
const shifts = [
  { id: "a", startsAt: "2027-01-01T10:00Z", endsAt: "2027-01-01T11:00Z", children: 24 },
  { id: "b", startsAt: "2027-01-01T10:30Z", endsAt: "2027-01-01T12:00Z", children: 16 },
  { id: "c", startsAt: "2027-01-01T11:00Z", endsAt: "2027-01-01T12:00Z", children: 16 },
];
const head: Allocation = { shiftId: "a", coachId: "1", role: "head", eligible: true };
const assistant: Allocation = { shiftId: "a", coachId: "2", role: "assistant", eligible: true };
test("selected dates must exist and single assignment is one date", () => {
  assert.equal(selectDates(shifts, ["a", "c"], "term").length, 2);
  assert.throws(() => selectDates(shifts, ["a", "c"], "single"));
  assert.throws(() => selectDates(shifts, ["missing"], "custom"));
});
test("overlapping shifts rejected; adjacent shifts permitted", () => {
  assert.equal(overlaps(shifts[0], shifts[1]), true);
  assert.throws(() => validateAllocation({ ...head, shiftId: "b" }, shifts, [head]));
  validateAllocation({ ...head, shiftId: "c" }, shifts, [head]);
});
test("ineligible coach and champion rejected", () => {
  assert.throws(() => validateAllocation({ ...head, eligible: false }, shifts, []));
  assert.throws(() => validateAllocation({ ...head, role: "champion" }, shifts, []));
});
test("additional paid allocation needs approval and reason", () => {
  assert.throws(() => validateAllocation({ ...assistant, additionalPaid: true }, shifts, []));
  validateAllocation({ ...assistant, additionalPaid: true, reason: "Training", approvedBy: "manager" }, shifts, []);
});
test("minimum includes a head and excludes additional paid support", () => {
  assert.equal(staffingRequirement(24, [head, assistant]).covered, true);
  assert.equal(staffingRequirement(24, [head, { ...assistant, additionalPaid: true }]).covered, false);
  assert.equal(staffingRequirement(16, [assistant]).covered, false);
});
test("cover requires acceptance, approval and eligible replacement", () => {
  const replacement = { ...head, coachId: "3" };
  assert.throws(() => approveCover(head, replacement, false, "manager", shifts, [head]));
  assert.throws(() => approveCover(head, replacement, true, "", shifts, [head]));
  assert.deepEqual(approveCover(head, replacement, true, "manager", shifts, [head]), [replacement]);
});
