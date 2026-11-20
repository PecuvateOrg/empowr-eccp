import assert from "node:assert/strict";
import test from "node:test";
import { hasCoachPermission } from "./coach-permissions";
import type { AdminRole, CoachPermission } from "./coach-permissions";

const roles: AdminRole[] = ["admin", "staff", "coach"];
const permissions: CoachPermission[] = [
  "view_management",
  "invite_coach",
  "review_compliance",
  "activate_coach",
  "approve_financial_exception",
  "change_roles",
];

test("admin holds every permission", () => {
  for (const permission of permissions) {
    assert.equal(hasCoachPermission("admin", permission), true);
  }
});

test("only admin can activate coaches, approve exceptions or change roles", () => {
  for (const role of roles) {
    for (const p of ["activate_coach", "approve_financial_exception", "change_roles"] as const) {
      assert.equal(hasCoachPermission(role, p), role === "admin");
    }
  }
});

test("staff can view, invite and review compliance", () => {
  assert.equal(hasCoachPermission("staff", "view_management"), true);
  assert.equal(hasCoachPermission("staff", "invite_coach"), true);
  assert.equal(hasCoachPermission("staff", "review_compliance"), true);
});

test("coaches have no management permissions", () => {
  for (const permission of permissions) {
    assert.equal(hasCoachPermission("coach", permission), false);
  }
});

test("an unknown or missing role grants nothing (fails closed)", () => {
  for (const permission of permissions) {
    assert.equal(hasCoachPermission(undefined as unknown as AdminRole, permission), false);
    assert.equal(hasCoachPermission("super_admin" as unknown as AdminRole, permission), false);
  }
});
