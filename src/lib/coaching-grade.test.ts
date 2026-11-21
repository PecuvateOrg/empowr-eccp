import assert from "node:assert/strict";
import test from "node:test";
import { coachingGradeLabel, parseGradeRequest, toCoachingGrade } from "./coaching-grade";
import { hasCoachPermission } from "./coach-permissions";

const id = "3f2a6c1e-8b4d-4e2f-9a1b-0c5d7e9f1a2b";

test("only admins may change a coaching grade", () => {
  assert.equal(hasCoachPermission("admin", "change_roles"), true);
  assert.equal(hasCoachPermission("staff", "change_roles"), false);
  assert.equal(hasCoachPermission("coach", "change_roles"), false);
});

test("accepts each grade and null (clearing)", () => {
  for (const grade of ["head_coach", "assistant_coach", "junior_assistant_coach", null]) {
    assert.deepEqual(parseGradeRequest({ coachId: id, grade }), { coachId: id, grade });
  }
});

test("rejects grades outside the allowlist, including access roles", () => {
  for (const grade of ["admin", "staff", "Head Coach", "", undefined, 1]) {
    assert.equal(parseGradeRequest({ coachId: id, grade }), null);
  }
});

test("rejects a missing or malformed coach id", () => {
  for (const coachId of [undefined, "", "not-a-uuid", `${id}x`, 42]) {
    assert.equal(parseGradeRequest({ coachId, grade: "head_coach" }), null);
  }
  assert.equal(parseGradeRequest(null), null);
  assert.equal(parseGradeRequest("head_coach"), null);
});

test("unknown stored values display as not assigned", () => {
  assert.equal(toCoachingGrade("admin"), null);
  assert.equal(coachingGradeLabel(toCoachingGrade(undefined)), "Not assigned yet");
  assert.equal(coachingGradeLabel("head_coach"), "Head Coach");
});
