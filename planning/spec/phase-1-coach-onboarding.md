# Phase 1 — Coach onboarding and compliance workflow

Status: design specification; not deployed. This extends the existing `/management` roster and preserves safeguarding certification records.

## Lifecycle
- `invited`: account provisioned; welcome email attempted
- `in_progress`: coach completes training and verification requirements
- `ready_for_activation`: all applicable requirements verified; notify Founder, Super Admin, Admin
- `active`: Founder explicitly approves activation; record actor, timestamp and evidence snapshot
- `withdrawn`: coaching eligibility revoked, retain history; reactivation requires fresh verification

Do not equate a passing safeguarding certificate with activation. An invited or in-progress coach may access their training and profile but cannot be assigned to sessions.

## Requirements
1. ECCP safeguarding completion: read the existing course/certificate records; do not duplicate.
2. DBS: record verification status, reviewer, date and **policy recheck date**. DBS certificates do not themselves have a statutory expiry date.
3. EFN freelancer agreement: reference the existing EFN record, do not copy contracts into ECCP. Exemption permitted only for verified Founder/Super Admin, with reason, approver, expiry and audit trail.
4. First aid: mandatory for Head Coach role only; store verification and expiry. Warn 90 and 30 days before expiry. Expired first aid blocks confirmed Head Coach assignment; future offers may be provisional.
5. Coaching grade: Head Coach, Assistant Coach, Junior Assistant Coach. Certification is separate from grade.

## Existing management UI additions
- Onboarding status and missing requirements in each roster row
- Detail panel for evidence verification and audit history
- Admin actions: invite, verify requirements, review readiness
- Founder-only activation control (server-authorized, with confirmation)
- Withdraw and reactivation review, with immutable event history

## Reminders
- Consolidated weekly incomplete-onboarding reminder
- Escalation at 30 days with extension or withdrawal decision
- Compliance reminders for DBS recheck and first-aid expiry
- Notify internal admins when ready; notify coach on activation
- Idempotent delivery and clear failure reporting; no sensitive DBS details in email

## Security and privacy
- Authorize every read/write server-side using a trusted persisted role.
- Do not trust client-supplied role or `is_staff` for Founder approval.
- Store minimal DBS metadata, not scans by default.
- Audit actor, action, target, timestamp, and relevant old/new state.
- Separate coaching eligibility from login/training access.
- No public self-registration and no duplicate EFN, Members Platform or Xero records.

## Implementation order
1. Confirm live schema, verified staff IDs and retention policies.
2. Migrate roles with compatibility and rollback.
3. Add onboarding tables and verification event history.
4. Add read-only roster indicators.
5. Add verified compliance actions.
6. Add Founder-only activation endpoint and UI with negative tests.
7. Add reminders and monitoring.
8. Run tests and build; review PR before merge/deploy.
