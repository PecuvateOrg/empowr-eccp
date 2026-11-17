/**
 * Phase 1 authorization policy.
 *
 * Never infer founder privileges from is_staff, display names, or client input.
 * The trusted role must be loaded from server-side ECCP persistence.
 * Existing staff access is retained until the role migration is deployed.
 */
export type AdminRole = "founder" | "super_admin" | "admin" | "coach";

export type CoachPermission =
  | "view_management"
  | "invite_coach"
  | "review_compliance"
  | "activate_coach"
  | "approve_financial_exception";

export function hasCoachPermission(
  role: AdminRole,
  permission: CoachPermission,
): boolean {
  switch (permission) {
    case "view_management":
    case "invite_coach":
    case "review_compliance":
      return role !== "coach";
    case "activate_coach":
      return role === "founder";
    case "approve_financial_exception":
      return role === "founder" || role === "super_admin";
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
