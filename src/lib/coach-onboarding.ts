import { assertCoachPermission, type AdminRole } from "./coach-permissions";

/**
 * Pure Phase 1 onboarding workflow. This module does not write to Supabase.
 * Callers MUST load the actor's trusted role server-side, persist transitions
 * atomically and record an audit entry in the same transaction.
 */
export type OnboardingStatus =
  | "invited"
  | "in_progress"
  | "ready_for_activation"
  | "active"
  | "withdrawn";

export type CoachGrade =
  | "head_coach"
  | "assistant_coach"
  | "junior_assistant_coach";

export interface ComplianceChecks {
  safeguardingCompleted: boolean;
  dbsVerified: boolean;
  dbsRecheckRequired: boolean;
  efnAgreementConfirmed: boolean;
  firstAidVerified: boolean;
}

export interface CoachOnboardingRecord {
  status: OnboardingStatus;
  grade: CoachGrade;
  compliance: ComplianceChecks;
}

export function missingOnboardingRequirements(
  record: CoachOnboardingRecord,
): string[] {
  const c = record.compliance;
  const missing: string[] = [];
  if (!c.safeguardingCompleted) missing.push("safeguarding");
  if (!c.dbsVerified || c.dbsRecheckRequired) missing.push("dbs_review");
  if (!c.efnAgreementConfirmed) missing.push("efn_agreement");
  if (record.grade === "head_coach" && !c.firstAidVerified) {
    missing.push("first_aid");
  }
  return missing;
}

export type OnboardingAction =
  | "start"
  | "mark_ready"
  | "activate"
  | "withdraw";

export function transitionOnboarding(
  record: CoachOnboardingRecord,
  action: OnboardingAction,
  actorRole: AdminRole,
): CoachOnboardingRecord {
  let next: OnboardingStatus;
  switch (action) {
    case "start":
      if (record.status !== "invited") throw new Error("Invalid onboarding transition");
      next = "in_progress";
      break;
    case "mark_ready":
      assertCoachPermission(actorRole, "review_compliance");
      if (record.status !== "in_progress") throw new Error("Invalid onboarding transition");
      if (missingOnboardingRequirements(record).length) {
        throw new Error("Compliance requirements incomplete");
      }
      next = "ready_for_activation";
      break;
    case "activate":
      assertCoachPermission(actorRole, "activate_coach");
      if (record.status !== "ready_for_activation") {
        throw new Error("Coach must be ready for activation");
      }
      if (missingOnboardingRequirements(record).length) {
        throw new Error("Compliance requirements incomplete");
      }
      next = "active";
      break;
    case "withdraw":
      assertCoachPermission(actorRole, "review_compliance");
      if (record.status === "withdrawn") throw new Error("Already withdrawn");
      next = "withdrawn";
      break;
  }
  return { ...record, status: next };
}
