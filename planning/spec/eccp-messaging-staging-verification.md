# ECCP messaging staging verification — execution checklist

**Status: NOT EXECUTED.** Do not run SQL in production or enable `ECCP_MESSAGING_ENABLED` until all checks pass.

## Preparation
1. Confirm isolated staging Supabase project, backups, service-role access, and exact `eccp` schema migrations with the application owner.
2. Apply `planning/sql/eccp-messaging-phase1.sql` and `planning/sql/eccp-messaging-rpcs-staging-draft.sql` **only to staging**, after review.
3. Confirm `eccp.coaches.admin_role`, `eccp.coach_sessions.refresh_token`, session expiry, and service-role RPC grants.
4. Use separate test accounts: coach A, coach B, staff, admin, designated safeguarding officer.

## Required test matrix
- Unauthenticated requests and expired/revoked sessions rejected.
- Coach A cannot read or reply to coach B's conversations; forged participant and assignee IDs rejected.
- Staff cannot change assignment/priority/status; admin can and an audit event records before/after.
- Ordinary inbox excludes safeguarding; designation alone authorizes safeguarding access; safeguarding write RPC rejects all ordinary endpoints.
- Internal staff notes never appear in coach reads, notifications, or exports.
- Identical idempotency key submitted concurrently creates one conversation/entry; repeated key with a *different payload* must be rejected, not silently return the earlier result.
- Different idempotency keys allow distinct requests; create quota of five per minute and entry quota of fifteen per minute enforced under concurrency.
- Same-origin POST/PATCH accepted behind staging proxy; cross-site, missing Origin, and null Origin rejected.
- Multipart, attachment fields, and non-JSON message submissions rejected.
- Resolved ordinary messages retain data for 24 months; legal holds, safeguarding, and open conversations exempt from any eventual purge; verify backup/audit treatment separately.

## Release gates
- Capture CI lint, typecheck, unit tests, build on final commit.
- Record staging test evidence and any migration errors; resolve findings before marking PR ready.
- Do not deploy automated deletion until separately reviewed and tested.
- Leave messaging feature flag OFF until explicit launch approval.

## Known issues to resolve before release
- Idempotency draft currently returns an existing result for the same key without comparing payloads. Add payload-fingerprint checks.
- Database tests require a staging connection and are **not** demonstrated by passing GitHub CI.
