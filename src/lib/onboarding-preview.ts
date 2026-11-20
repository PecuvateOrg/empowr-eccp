/** Presentation-only Phase 1 onboarding model. No database calls or live decisions. */
export type OnboardingStage = "invited" | "in_progress" | "ready_for_activation" | "active" | "withdrawn";
export type RequirementKey = "safeguarding" | "dbs" | "efn_agreement" | "first_aid";
export type RequirementState = "complete" | "pending" | "not_required";
export type OnboardingGrade = "head_coach" | "assistant_coach" | "junior_assistant_coach";
export interface OnboardingPreviewCoach {
  id: string;
  name: string;
  grade: OnboardingGrade;
  stage: OnboardingStage;
  requirements: Record<RequirementKey, RequirementState>;
}
export const requirementLabels: Record<RequirementKey, string> = {
  safeguarding: "Safeguarding training",
  dbs: "DBS verification",
  efn_agreement: "EFN freelancer agreement",
  first_aid: "First Aid certification",
};
export const stageLabels: Record<OnboardingStage, string> = {
  invited: "Invited",
  in_progress: "In Progress",
  ready_for_activation: "Ready for Activation",
  active: "Active",
  withdrawn: "Withdrawn",
};
export const gradeLabels: Record<OnboardingGrade, string> = {
  head_coach: "Head Coach",
  assistant_coach: "Assistant Coach",
  junior_assistant_coach: "Junior Assistant Coach",
};
export const requirementKeys: RequirementKey[] = ["safeguarding", "dbs", "efn_agreement", "first_aid"];
export function missingRequirements(coach: OnboardingPreviewCoach): RequirementKey[] {
  return requirementKeys.filter(key => coach.requirements[key] === "pending");
}
export function isReadyForActivation(coach: OnboardingPreviewCoach): boolean {
  return missingRequirements(coach).length === 0 && coach.stage !== "withdrawn";
}
/** Invented sample profiles; never use these to activate or verify a real coach. */
export const sampleOnboardingCoaches: OnboardingPreviewCoach[] = [
  { id: "sample-1", name: "Example Coach A", grade: "head_coach", stage: "in_progress",
    requirements: { safeguarding: "complete", dbs: "pending", efn_agreement: "pending", first_aid: "pending" } },
  { id: "sample-2", name: "Example Coach B", grade: "assistant_coach", stage: "ready_for_activation",
    requirements: { safeguarding: "complete", dbs: "complete", efn_agreement: "complete", first_aid: "not_required" } },
  { id: "sample-3", name: "Example Coach C", grade: "junior_assistant_coach", stage: "invited",
    requirements: { safeguarding: "pending", dbs: "pending", efn_agreement: "pending", first_aid: "not_required" } },
  { id: "sample-4", name: "Example Coach D", grade: "assistant_coach", stage: "withdrawn",
    requirements: { safeguarding: "complete", dbs: "pending", efn_agreement: "pending", first_aid: "not_required" } },
];
