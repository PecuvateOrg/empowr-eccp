import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAssignmentEligibility, type EligibilityEvidence } from "./coach-assignment-eligibility";

const valid: EligibilityEvidence = {
 grade: "assistant_coach", requiredGrade: "assistant_coach", activation: "active",
 safeguarding: "verified", dbs: "verified", firstAid: "unknown",
 firstAidRequired: false, availabilityConfirmed: true, overlapsAssignment: false,
};
test("fully verified coach is eligible for matching grade", () => {
 assert.deepEqual(evaluateAssignmentEligibility(valid), { eligible: true, reasons: [] });
});
test("unknown or incomplete evidence is rejected", () => {
 const result = evaluateAssignmentEligibility({ ...valid, activation: null, grade: null, safeguarding: "unknown", dbs: "pending" });
 assert.equal(result.eligible, false);
 assert.equal(result.reasons.length, 4);
});
test("grade mismatch, overlap and unavailable time prevent offer", () => {
 const result = evaluateAssignmentEligibility({ ...valid, requiredGrade: "head_coach", overlapsAssignment: true, availabilityConfirmed: false });
 assert.equal(result.eligible, false);
 assert.equal(result.reasons.length, 3);
});
test("head coach first aid requirement must be verified", () => {
 assert.equal(evaluateAssignmentEligibility({ ...valid, grade: "head_coach", requiredGrade: "head_coach", firstAidRequired: true }).eligible, false);
 assert.equal(evaluateAssignmentEligibility({ ...valid, grade: "head_coach", requiredGrade: "head_coach", firstAidRequired: true, firstAid: "verified" }).eligible, true);
});
