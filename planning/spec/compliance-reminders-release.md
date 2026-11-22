# Compliance reminders — release checklist (Issue #33)

This PR begins the standalone implementation. The existing `ComplianceReminderPreview` is **fictional** and does not send messages or persist deadlines. Do not present it as live.

## Release requirements
- Staff-authorised per-coach completion deadlines for safeguarding, DBS, first aid, training and qualifications, **distinct** from certificate renewal dates
- Persist deadline, actor, timestamps and audit history; show each coach their own deadlines only
- Staff action to preview and send one reminder or all outstanding requirements, with optional note
- Recheck outstanding status immediately before sending, resolve recipient email server-side, idempotency and delivery-failure audit
- Optional 7-day, 1-day and overdue reminders via scheduler, **off by default**
- Europe/London calendar dates and DST-safe comparison; prevent duplicate scheduled sends
- No certificate contents or sensitive personal data in notification previews or lock-screen messages
- Tests for staff/coach access, completion suppression, deadline editing, idempotency, send failures, concurrency and scheduler retries
- Maintainer-reviewed database migration and deployment plan; no live migration, email or scheduled task in this PR

## Current implementation
Pure date and eligibility rules with tests only. Database, UI integration, email sender, audit and scheduled delivery remain **not implemented**. This PR must stay draft until the full feature is implemented, verified and reviewed.
