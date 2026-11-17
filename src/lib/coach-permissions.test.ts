import assert from "node:assert/strict";
import test from "node:test";
import { hasCoachPermission } from "./coach-permissions.ts";
import type { AdminRole, CoachPermission } from "./coach-permissions.ts";

const roles: AdminRole[] = ["founder", "super_admin", "admin", "coach"];
const permissions: CoachPermission[] = [
  "view_management",
  "invite_coach",
  "review_compliance",
  "activate_coach",
  "approve_financial_exception",
];

test("only the founder can activate coaches", () => {
  for (const role of roles) {
    assert.equal(hasCoachPermission(role, "activate_coach"), role === "founder");
  }
});

test("coaches have no admin permissions", () => {
  for (const permission of permissions) {
    assert.equal(hasCoachPermission("coach", permission), false);
  }
});

test("Eve-style admin can review and invite, not activate or approve financial exceptions", () => {
  assert.equal(hasCoachPermission("admin", "review_compliance"), true);
  assert.equal(hasCoachPermission("admin", "invite_coach"), true);
  assert.equal(hasCoachPermission("admin", "activate_coach"), false);
  assert.equal(hasCoachPermission("admin", "approve_financial_exception"), false);
});

test("super admin can approve financial exceptions but cannot activate", () => {
  assert.equal(hasCoachPermission("super_admin", "approve_financial_exception"), true);
  assert.equal(hasCoachPermission("super_admin", "activate_coach"), false);
});
