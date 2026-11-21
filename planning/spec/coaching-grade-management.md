# ECCP coaching grade (separate from administrative access)

**Status:** built behind `ECCP_COACHING_GRADE_ENABLED` (off). SQL not applied. Not live.

ECCP Management must let authorized admins assign a **coaching grade** to a coach, independently of the coach's `admin_role` (coach/staff/admin). Coaching grade is a coaching position, not a permission grant.

Initial selectable values:
- Head Coach
- Assistant Coach
- Junior Assistant Coach
- Unassigned (default; do not assume a grade)

Coaching grade appears on the signed-in coach's **My Profile**, and on the staff coach roster. Changes are made only in ECCP Management by an authorized admin, never by the coach profile form.

## Implementation
1. `planning/sql/coaching-grade.sql`: nullable `eccp.coaches.coaching_grade` with an allowlist check, `eccp.coaching_grade_audit` (actor, previous, new, time), and `eccp.set_coaching_grade(actor, coach, grade)`, which changes the grade and writes the audit row in one transaction and re-checks that the actor is an admin and the target is a coach account. `admin_role` is untouched.
2. `PATCH /api/management/coaching-grade`: signed in, `can(actor, "change_roles")` (admin only), validated body (`parseGradeRequest`), then the function above. `grade: null` clears it.
3. ECCP Management roster cards show the grade; admins get a selector with Save and error states, staff see it read-only.
4. My Profile shows the grade read-only. Never infer a grade from `admin_role`, name or email.
5. Tests: `src/lib/coaching-grade.test.ts` (staff/coach denied, allowlist, clearing, malformed ids).

## Going live
There is no staging database; production is shared with Members, EFN and Waivers, and the SQL only adds things.
1. `pg_dump -n eccp`, then apply `coaching-grade.sql` with the migration script.
2. Set `ECCP_COACHING_GRADE_ENABLED=1` on Amplify (needs a `src/` commit to take effect).
3. Check with an admin account and a coach account: the admin sets, changes and clears a grade, and an audit row is written each time; staff get 403; the coach sees the grade on My Profile.

## UI labels
ECCP Management: **Coaching grade** — Unassigned / Head Coach / Assistant Coach / Junior Assistant Coach.
My Profile: **Coaching grade: Head Coach** (or **Not assigned yet**).
