# Staffing integration — maintainer review

Review PR #74 together with reconciliation PR #76. No production migration or flag activation is requested by this document.

## Settled in the proposed SQL (tested 2026-11-22 on a disposable Postgres 17)
- Coach primary key is `uuid` (checked on the live database); the dynamic type lookup is removed.
- One coach cannot hold overlapping confirmed shifts: exclusion constraint on coach + time range. Assignment times are copied from the session by trigger, and a session time change that would double-book a coach is rejected as a whole.
- Cancellation records who, when and why; a cancelled row without them is rejected.
- `shift_assignment_events` is append-only (update/delete blocked by trigger); `updated_at` is kept by trigger.
- Missing-session tracking: `consecutive_missing` per session, `complete` and `missing_count` per sync run.
- anon/authenticated are denied on all four tables; service_role cannot delete assignments.

## Assignment writer (ops/staffing-assign-function-proposed.sql)
`eccp.staffing_assign_shifts` is the only way to create assignments; service_role has read-only access to assignments and events. Caller identity comes from the session token (admin only). All sessions in a call are assigned, or none. Grade → role: Head Coach may be head or assistant; Assistant Coach assistant; Junior Assistant Coach junior assistant only. Idempotency key retries return the same rows. Tests: `ops/sql-tests/`.

Open decisions for the writer:
- **PROPOSED, not yet decided:** a certificate valid on the session date is required.
- Not enforced: first aid for head coaches (no first-aid record in the database), availability, child count/coverage, more than one head per session.

## Cancel and cover (ops/staffing-cancel-cover-functions-proposed.sql)
- `staffing_cancel_assignment` (admin, reason required): cancels a shift and withdraws its open cover request; repeating it does nothing.
- `staffing_request_cover` → `staffing_accept_cover` (only the named replacement, eligibility re-checked) → `staffing_approve_cover` (admin): original cancelled and replacement created with the same role and pay terms in one transaction; refused if the replacement would be double-booked, leaving everything unchanged. `staffing_close_cover`: the replacement declines, or the requester, the original coach or an admin withdraws.
- One open cover request per shift. Assign and cover share `staffing_eligibility_error`, so the rules cannot drift apart.
- **PROPOSED, not yet decided:** who may raise a cover request (the original coach for their own shift, or an admin).
- Not built: editing a shift in place (role, pay terms). Cancel and re-assign instead.
- Staging check: on Supabase the function owner must bypass RLS (Supabase `postgres` does).

## Required schema decisions
- Confirm coaches primary key and schema-of-record repository. Review proposed SQL against a disposable database.
- Retries must not increment absence twice: the writer must count only distinct complete sync runs. Define bounded import horizon and retention.
- Add child count source and eligibility as-of session date, including qualification and availability policy. Never assume eligibility or child count from client.
- Add agreed pay classification values, cover request state/acceptance/approval and append-only audit.
- Add hashed revocable calendar subscription credentials scoped to one coach, notification outbox with unique delivery keys, attendance and first-aid report references. Restrict safeguarding data separately.

## Transaction boundaries
Sync: validate entire snapshot before acquiring lock; serialise runs; upsert only source-owned fields; review cancellations, changed times/venues and repeated absence; never delete assignments. Record audit and commit atomically.
Allocation: authenticate and authorise manager; lock affected coaches and sessions in consistent order; re-read eligibility, status and conflicts; validate entire batch; write assignments and audit atomically.
Cover: verify persisted request, acceptance and replacement eligibility; lock original and replacement; replace atomically, preserving history.
Arrival/completion: verify own assignment, server clock, reviewed location policy and persisted first-aid report; audit exceptions.
Notifications: claim outbox durably, revalidate recipient and session immediately before delivery; handle retry and deduplication.

## Acceptance sequence
1. Maintainer approves roles, schema and migration/rollback plan; test SQL on disposable environment with denied anon/authenticated access.
2. Test two coach accounts for isolation, expired session denial, manager permissions, simultaneous allocations, rollback of failed batch, cancelled and moved sessions, repeated snapshot retries.
3. Enable Members reader in staging with maintainer-managed secret; dry-run reconciliation; compare imported sessions to source.
4. Enable staging manager writes and own-shifts reader; test complete scheduling and cover journey. Verify planned coverage and child count provenance.
5. Add calendar issuance/revocation, delivery worker and attendance UI in staging; review geolocation privacy, manual exceptions and first-aid access.
6. Approve production rollout separately, with monitoring, disable switches and rollback. No live writes until gates pass.

## Existing foundations
PRs #77–#82 provide allocation/cover validation, own-shifts reader, calendar formatting, reminder and attendance rules. They are not complete live workflows. PR #76 contains reconciliation planning only. PR #74 is a review-only schema proposal. All production flags remain subject to maintainer approval.
