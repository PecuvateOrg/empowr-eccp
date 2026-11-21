# ECCP messaging staging verification — execution checklist

**Status: database matrix PASSED on 2026-11-21** (in one transaction on production that was then rolled back; nothing kept). There is **no staging database**: production is shared with Members, EFN and Waivers, and the messaging SQL only adds tables and functions. Messaging was switched on 2026-11-21 (#63) and verified live the same day (see below).

## Results (2026-11-21, rolled back)
Passed: idempotent replay returns the same id; a changed payload with the same key is refused (409); expired and unknown sessions are refused (401); coach B cannot reply in coach A's thread; a coach cannot write an internal note; staff cannot assign, prioritise or change status (403); an admin can, with a before/after audit event; a coach cannot be an assignee; safeguarding threads are refused on the ordinary path; the 6th conversation in a minute is rate limited (429).
Found and fixed: `coach_sessions.refresh_token` is a uuid, so the draft's text comparison failed and the functions could not be created. Routes now map RPC error codes to 400/401/403/404/409/429 instead of 503 for everything. The origin check no longer uses `request.url`, which is an internal host on Amplify and would have rejected every write.
Still to test over HTTP once a UI exists: same-origin writes through the live site, and the list endpoints.

## Live verification (2026-11-21, 20:48 UTC, messaging switched on)
Checked on production. Test data was deleted afterwards, and the row counts matched the earlier baseline exactly (8 coaches, 1 conversation, 3 entries, 7 events).

**Database (read-only):** all 6 `eccp.message_*` tables and 4 RPCs exist. RLS is on and `anon` has no SELECT. The RPCs are callable by `service_role` only, not by `anon` or `authenticated`. This replaces the handoff in PR #56.

**Live HTTP at eccp.empowrcic.org** (temporary `tech+eccp-*` coach A, coach B, staff and admin accounts):
- Not signed in → 401. A cross-site Origin or a missing Origin → 403.
- Create: 201. Replay with the same key → the same id. Same key with a changed body → 409.
- Coach B reading or replying in coach A's thread → 404 (API and page). A coach writing a note or opening the staff inbox → 403.
- Staff note created. It does not appear in the coach thread, the coach list or the coach page.
- Two staff replies within a minute → exactly one email to coach A (checked in Resend).
- Unread is true after a staff reply and false after the coach opens the thread page. The API GET does not mark a thread read; that is by design.
- Waiting-for-staff (the Dashboard feed's filter): true when new, false after a staff reply, true again after the coach replies.
- Staff PATCH → 403. Admin PATCH (priority, status, assignee) → 200. Assigning a coach → 400.
- Queue feed with a wrong secret or no secret → 401.

**Not checked:** the queue feed with the correct secret (that would mean reading the secret from SSM; refused in auto mode). The feed uses the same `staffQueue()` filter verified above.

## Preparation
1. Back up the `eccp` schema, then apply `planning/sql/eccp-messaging-phase1.sql` and `planning/sql/eccp-messaging-rpcs-staging-draft.sql` with the migration script, with the flag off.
2. Re-run the rolled-back test matrix after any change to the SQL.
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
- Idempotency RPC draft now compares the normalized original payload on key replay; staging must verify exact retries succeed and changed category/title/body, conversation ID, or internal-note flag are rejected.
- Database tests require a staging connection and are **not** demonstrated by passing GitHub CI.
