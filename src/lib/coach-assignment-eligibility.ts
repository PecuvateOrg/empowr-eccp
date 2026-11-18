/** Fail-closed assignment eligibility policy.
 * These fields must come from server-verified ECCP records, never a browser payload.
 */
export type CoachingGrade = "head_coach" | "assistant_coach" | "junior_assistant_coach";
export type ActivationStatus = "invited" | "in_progress" | "ready_for_activation" | "active" | "withdrawn";
export type Verification = "verified" | "pending" | "expired" | "rejected" | "unknown";
export type EligibilityEvidence = {
 grade: CoachingGrade | null;
 requiredGrade: CoachingGrade | null;
 activation: ActivationStatus | null;
 safeguarding: Verification;
 dbs: Verification;
 firstAid: Verification;
 firstAidRequired: boolean;
 availabilityConfirmed: boolean;
 overlapsAssignment: boolean;
};

export function evaluateAssignmentEligibility(evidence: EligibilityEvidence): { eligible: boolean; reasons: string[] } {
 const reasons: string[] = [];
 if (evidence.activation !== "active") reasons.push("Coach is not activated");
 if (!evidence.grade || !evidence.requiredGrade) reasons.push("Coaching grade not verified");
 else if (evidence.grade !== evidence.requiredGrade) reasons.push("Coaching grade does not match the required role");
 if (evidence.safeguarding !== "verified") reasons.push("Safeguarding training is not verified");
 if (evidence.dbs !== "verified") reasons.push("DBS status is not verified");
 if (evidence.firstAidRequired && evidence.firstAid !== "verified") reasons.push("First aid is not verified");
 if (!evidence.availabilityConfirmed) reasons.push("Coach is not confirmed available");
 if (evidence.overlapsAssignment) reasons.push("Overlapping assignment");
 return { eligible: reasons.length === 0, reasons };
}
