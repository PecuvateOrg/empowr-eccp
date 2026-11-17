# Phase 1: coach authorization migration

## Existing state (audited 2026-11-17)
- ECCP authenticates provisioned coaches using emailed OTP and an HTTP-only session cookie.
- The `coaches.is_staff` boolean currently gates the management UI and provisioning endpoint.
- Supabase `eccp` schema is accessed server-side using the service-role key.
- The current roster shows assessment attempts and safeguarding certificates.

## Decision
Introduce a trusted, persisted role with values `founder`, `super_admin`, `admin`, and `coach`.
Do not use names, user-supplied roles, or the old `is_staff` flag to authorize activation.
Only `founder` may activate coaches; `super_admin` may approve financial exceptions; `admin` may review compliance.

## Migration prerequisites
1. Inspect the **live** `eccp.coaches` schema, current staff identities, access policies, and existing rows.
2. Confirm founder identity against an authenticated, immutable coach ID; do not guess from email or name.
3. Back up the schema/data and define rollback steps.
4. Add a role column with a restrictive check constraint and default `coach`; backfill verified staff identities in a reviewed transaction.
5. Verify no existing staff is unintentionally locked out before replacing `is_staff` checks.
6. Update all staff layouts, route handlers and service methods to enforce the persisted role on the server.
7. Add negative authorization tests for coach, admin and super_admin activation; test founder-only success.
8. Deploy the database migration before the code that reads the new role. Do not drop `is_staff` in the first release.

## Scope of this branch
Add the **pure permission policy** only. It is not yet wired to the live auth flow, because doing so before verifying the live schema and identities risks locking staff out. No new activation endpoint is exposed.

## Future onboarding model
Track invitation, onboarding progress, compliance verification, readiness, activation and withdrawal separately from safeguarding certification. Store audit events for each verification and final approval. Avoid storing DBS document scans until access and retention policies have been reviewed.
