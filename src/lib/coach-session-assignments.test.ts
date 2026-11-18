import assert from "node:assert/strict";
import test from "node:test";
import { applyCoachDecision, detectAvailabilityConflicts, isUrgentWithdrawal, newlyIntroducedConflicts, type SessionAssignment } from "./coach-session-assignments";
import type { CoachAvailability } from "./coach-availability";

const weekly: CoachAvailability = { weekly: [{ weekday: 0, start: "09:00", end: "17:00" }], exceptions: [] };
const assignment: SessionAssignment = { id: "a1", coachId: "c1", sessionId: "s1", date: "2026-11-23", start: "10:00", end: "12:00", status: "offered" };
test("weekly availability allows the assigned session", () => {
  assert.deepEqual(detectAvailabilityConflicts(weekly, [assignment], "c1"), []);
});
test("a new unavailable-date exception triggers only newly introduced conflicts", () => {
  const next: CoachAvailability = { ...weekly, exceptions: [{ date: "2026-11-23", available: false }] };
  assert.deepEqual(newlyIntroducedConflicts(weekly, next, [assignment], "c1").map((c) => c.assignmentId), ["a1"]);
  assert.deepEqual(newlyIntroducedConflicts(next, next, [assignment], "c1"), []);
});
test("unrelated coaches and inactive assignments do not generate alerts", () => {
  const next: CoachAvailability = { weekly: [], exceptions: [] };
  assert.deepEqual(detectAvailabilityConflicts(next, [{ ...assignment, status: "declined" }, { ...assignment, id: "a2", coachId: "c2" }], "c1"), []);
});
test("offered session can be accepted or declined only by its coach", () => {
  assert.equal(applyCoachDecision(assignment, "c1", "accept").status, "accepted");
  assert.equal(applyCoachDecision(assignment, "c1", "decline").status, "declined");
  assert.throws(() => applyCoachDecision(assignment, "c2", "accept"));
  assert.throws(() => applyCoachDecision({ ...assignment, status: "completed" }, "c1", "accept"));
});
test("withdrawal requires a reason and an accepted session", () => {
  assert.throws(() => applyCoachDecision(assignment, "c1", "withdraw", "Ill"));
  assert.throws(() => applyCoachDecision({ ...assignment, status: "accepted" }, "c1", "withdraw"));
  assert.equal(applyCoachDecision({ ...assignment, status: "accepted" }, "c1", "withdraw", "Ill").status, "withdrawn");
});
test("24-hour withdrawal urgency uses real UTC instants", () => {
  assert.equal(isUrgentWithdrawal("2026-11-23T10:00:00Z", "2026-11-22T11:00:00Z"), true);
  assert.equal(isUrgentWithdrawal("2026-11-23T10:00:00Z", "2026-11-22T10:00:00Z"), false);
});
