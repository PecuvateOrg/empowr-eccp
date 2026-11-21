# Staffing integration — maintainer review

Review PR #74 together with reconciliation PR #76. No production migration or flag activation is requested by this document.

## Required schema decisions
- Confirm coaches primary key and schema-of-record repository. Review proposed SQL against a disposable database.
- Add missing snapshot counter and distinct completed sync-run tracking; retries must not increment absence twice. Define bounded import horizon and retention.
- Add child count source and eligibility as-of session date, including qualification and availability policy. Never assume eligibility or child count from client.
- Add assignment updated timestamp, cancellation history, agreed pay classification, cover request state/acceptance/approval and append-only audit.
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
