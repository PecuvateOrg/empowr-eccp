import { describe, expect, it } from "vitest";
import {
  missingOnboardingRequirements,
  transitionOnboarding,
  type CoachOnboardingRecord,
} from "./coach-onboarding";

const ready: CoachOnboardingRecord = {
  status: "in_progress",
  grade: "assistant_coach",
  compliance: {
    safeguardingCompleted: true,
    dbsVerified: true,
    dbsRecheckRequired: false,
    efnAgreementConfirmed: true,
    firstAidVerified: false,
  },
};

describe("coach onboarding", () => {
  it("allows admin to mark compliant coach ready but not activate", () => {
    const marked = transitionOnboarding(ready, "mark_ready", "admin");
    expect(marked.status).toBe("ready_for_activation");
    expect(() => transitionOnboarding(marked, "activate", "admin")).toThrow();
    expect(() => transitionOnboarding(marked, "activate", "super_admin")).toThrow();
    expect(transitionOnboarding(marked, "activate", "founder").status).toBe("active");
  });

  it("requires first aid for head coaches only", () => {
    const head = { ...ready, grade: "head_coach" as const };
    expect(missingOnboardingRequirements(head)).toContain("first_aid");
    expect(() => transitionOnboarding(head, "mark_ready", "admin")).toThrow();
    expect(missingOnboardingRequirements(ready)).not.toContain("first_aid");
  });

  it("blocks activation if compliance changes after ready", () => {
    const marked = transitionOnboarding(ready, "mark_ready", "admin");
    const changed = {
      ...marked,
      compliance: { ...marked.compliance, dbsRecheckRequired: true },
    };
    expect(() => transitionOnboarding(changed, "activate", "founder")).toThrow();
  });

  it("does not let coaches self-approve readiness", () => {
    expect(() => transitionOnboarding(ready, "mark_ready", "coach")).toThrow();
  });

  it("rejects invalid transitions", () => {
    expect(() => transitionOnboarding(ready, "activate", "founder")).toThrow();
    expect(transitionOnboarding({ ...ready, status: "invited" }, "start", "coach").status).toBe("in_progress");
  });
});
