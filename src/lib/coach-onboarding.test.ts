import assert from "node:assert/strict";
import test from "node:test";
import { missingOnboardingRequirements, transitionOnboarding, type CoachOnboardingRecord } from "./coach-onboarding";
const ready: CoachOnboardingRecord = { status: "in_progress", grade: "assistant_coach", compliance: { safeguardingCompleted: true, dbsVerified: true, dbsRecheckRequired: false, efnAgreementConfirmed: true, firstAidVerified: false } };
test("only admin activates", () => {
  const marked = transitionOnboarding(ready, "mark_ready", "staff");
  assert.equal(marked.status, "ready_for_activation");
  assert.throws(() => transitionOnboarding(marked, "activate", "staff"));
  assert.throws(() => transitionOnboarding(marked, "activate", "coach"));
  assert.equal(transitionOnboarding(marked, "activate", "admin").status, "active");
});
test("head coach needs first aid", () => {
  const head = { ...ready, grade: "head_coach" as const };
  assert.ok(missingOnboardingRequirements(head).includes("first_aid"));
  assert.throws(() => transitionOnboarding(head, "mark_ready", "staff"));
});
test("changed compliance blocks activation", () => {
  const marked = transitionOnboarding(ready, "mark_ready", "staff");
  assert.throws(() => transitionOnboarding({ ...marked, compliance: { ...marked.compliance, dbsRecheckRequired: true } }, "activate", "admin"));
});
test("coach cannot self approve", () => assert.throws(() => transitionOnboarding(ready, "mark_ready", "coach")));
