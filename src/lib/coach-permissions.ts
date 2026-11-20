/**
 * Phase 1 authorization policy (owner decision 2026-11-20).
 *
 * Three levels: admin (full privileges) > staff (scoped) > coach.
 * Never infer a role from is_staff, display names, or client input.
 * The trusted role must be loaded from server-side ECCP persistence.
 * Existing staff access is retained until the role migration is deployed.
 */
export type AdminRole = "admin" | "staff" | "coach";

export type CoachPermission =
  | "view_management"
  | "invite_coach"
  | "review_compliance"
  | "activate_coach"
  | "approve_financial_exception"
  | "change_roles";

export function hasCoachPermission(
  role: AdminRole,
  permission: CoachPermission,
): boolean {
  switch (permission) {
    case "view_management":
    case "invite_coach":
    case "review_compliance":
      return role === "admin" || role === "staff";
    case "activate_coach":
    case "approve_financial_exception":
    case "change_roles":
      return role === "admin";
  }
}

export function assertCoachPermission(
  role: AdminRole,
  permission: CoachPermission,
): void {
  if (!hasCoachPermission(role, permission)) {
    throw new Error("Not authorised for this action");
  }
}
