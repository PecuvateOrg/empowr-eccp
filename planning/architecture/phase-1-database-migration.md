# Phase 1 — Database migration checklist and proposed SQL

**Status: NOT EXECUTED.** Maintainers apply it with their migration script, which wraps the transaction; leave `BEGIN`/`COMMIT` out. This is a reviewed migration proposal, not evidence of the live database schema.

Before applying, inspect the current `eccp.coaches` columns, constraints, indexes, and staff rows in the actual Supabase project. Back up the table and establish a rollback.

## Migration A: add a role without changing existing access

```sql
ALTER TABLE eccp.coaches
  ADD COLUMN IF NOT EXISTS admin_role text;

-- Backfill existing coaches as ordinary coaches only.
-- Do not infer roles from names or email addresses.
UPDATE eccp.coaches
SET admin_role = 'coach'
WHERE admin_role IS NULL;

ALTER TABLE eccp.coaches
  ALTER COLUMN admin_role SET DEFAULT 'coach';

ALTER TABLE eccp.coaches
  ADD CONSTRAINT coaches_admin_role_check
  CHECK (admin_role IN ('admin', 'staff', 'coach'));

-- After the backfill, so a NULL can never read as "no role".
ALTER TABLE eccp.coaches
  ALTER COLUMN admin_role SET NOT NULL;
```

**Do not run the ADD CONSTRAINT blindly** if a similarly named constraint already exists. Confirm schema first. In a separate, approved transaction, map the verified coach IDs (held privately by the maintainers) to `admin` and `staff`. Do not use email addresses from conversation history to grant privileges.

## Pre-cutover verification

- All known staff accounts have a verified role.
- Only `admin` accounts can activate coaches, approve EFN exceptions or change roles.
- Existing `is_staff` access still works while new code is staged.
- Existing safeguarding attempts, certificates, and course progress remain unchanged.
- New endpoints use server-side role checks, not request-body role claims.
- Test the old and new sign-in paths and all three roles.
- Keep rollback SQL and a table backup before deployment.

## Future onboarding schema (separate reviewed migration)

Model an onboarding lifecycle distinct from `certificates`:
`invited`, `in_progress`, `ready_for_activation`, `active`, `withdrawn`.

Store requirement verification events, DBS policy recheck dates, first-aid verification and expiry for Head Coaches, EFN agreement status, exceptions, and activation audit history. Use append-only audit records where possible. Do not collect DBS scans until document storage and retention rules have been approved.

## Rollback

Until code has switched to `admin_role`, the existing `is_staff` field remains authoritative. Roll back the proposed column only after checking no code or audit records depend on it. Never delete safeguarding records as part of rollback.
