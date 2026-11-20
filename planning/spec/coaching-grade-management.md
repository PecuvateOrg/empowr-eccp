# ECCP coaching grade (separate from administrative access)

**Status:** approved concept, staging implementation required. Not deployed.

ECCP Management must let authorized admins assign a **coaching grade** to a coach, independently of the coach's `admin_role` (coach/staff/admin). Coaching grade is a coaching position, not a permission grant.

Initial selectable values:
- Head Coach
- Assistant Coach
- Junior Assistant Coach
- Unassigned (default; do not assume a grade)

Coaching grade appears on the signed-in coach's **My Profile**, and on the staff coach roster. Changes are made only in ECCP Management by an authorized admin, never by the coach profile form.

## Required implementation
1. Review existing `eccp.coaches` and `coach_contact_profiles` schemas in staging. Add a nullable `coaching_grade` column (or a separate role-history table) with a restrictive check constraint. Preserve `admin_role` untouched.
2. Implement an authenticated admin-only PATCH endpoint for the grade. Enforce `can(actor, 'manage_roles')` or a verified equivalent privileged permission. Validate target coach ID, grade allowlist, and audit previous/new value and actor.
3. Update management roster to show and edit grade with a clear Save/confirmation interaction and error states.
4. Show read-only grade in My Profile. Never infer Head Coach from `admin_role`, name, or email.
5. Add tests for non-admin denial, unauthorized grade escalation, grade clearing, and cross-account isolation.
6. Deploy migration to staging and test with separate admin and coach accounts. No production migration or release before review.

## UI labels
ECCP Management: **Coaching grade** — Unassigned / Head Coach / Assistant Coach / Junior Assistant Coach.
My Profile: **Coaching grade: Head Coach** (or **Not assigned yet**).
