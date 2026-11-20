# ECCP Phase 1 — Approved Upgrade Backlog (18 November 2026)

Status: approved operational requirements; **not implemented by this document**. Implement in reviewable changes after Supabase schema verification. Preserve existing safeguarding training, certificates and authentication.

## 1. Role model and onboarding (P0)
- Founder Jasmine: sole final coach activation authority; Super Admin privileges.
- Shaun: Super Admin, including finance authorization and appeal decisions.
- Eve: Admin, may invite/review compliance, scheduling, attendance and prepare payment batches; no activation or financial authorization.
- Grades: Head Coach, Assistant Coach, Junior Assistant Coach. Coach can edit own contact/emergency details and availability; cannot self-verify compliance/grade.
- Onboarding: Invited → In Progress → Ready for Activation → Active; support Withdrawn. Safeguarding course, DBS verification/recheck, EFN freelancer agreement, first aid for Head Coaches. Do not duplicate EFN agreements or retain unnecessary sensitive documents. All privilege checks server-side.

> **Owner decision 2026-11-20 — where sections 2–4 live.** Session assignments, cover,
> attendance and hours are **EFN** work: each session is an EFN task (`freelancer_tasks`),
> the engine for hours, approval and payment. ECCP shows a coach their tasks through EFN's
> `/api/eccp/v1` and keeps **availability** (and contact profile) itself. The rules below
> still stand as requirements; they are built in EFN, not as ECCP tables.

## 2. Availability, assignment and cover (P0)
- Recurring weekly availability and date exceptions. Notify admins of availability changes only if they conflict with assigned sessions.
- Assigned session displays date, venue, time and grade/role; coach can accept/decline. Accepted-session withdrawal requires reason; under 24h triggers urgent admin alert.
- Eligible available coaches may volunteer for cover. Admin selects volunteer; notify selected and unsuccessful volunteers. Never auto-assign first volunteer.

## 3. Attendance and reminders (P0)
- Time-based 'I'm Here' check-in; no geolocation requirement.
- Reminder 15 minutes before session, second reminder 10 minutes after start if not checked in. At session end, if still unchecked, explain that check-in confirms hours for payment and flag for Head Coach/admin follow-up.
- No check-in must not itself equal absence or automatically deduct pay.
- Head Coach can mark attendance/absence for assigned-session coaches and confirm own missed check-in; authorized admins can confirm. Audit manual actions.
- Every coaching grade may retrospectively self-confirm own attendance up to 24 hours after session end, with mandatory reason. This counts as confirmed scheduled hours and is flagged on admin dashboard (no per-event notification). Cannot override an existing absence or locked payment record.
- At 24 hours without confirmation, mark Unresolved, show on both Admin and Super Admin dashboards (no standalone alert). Eve/Jasmine/Shaun may resolve Attended (scheduled hours) or Absent (zero), with reason and audit. Exclude unresolved from payment batches.

## 4. Hours and corrections (P0)
- EFN is the source of assignments, attendance, hours, freelancer agreements and payments (owner 2026-11-20). ECCP is the source of coach availability, profile, certification and compliance.
- Auto-record scheduled hours only after confirmed attendance. Coach may request **reduction**, not increase, with mandatory reason and admin approval. Coach correction window: 7 calendar days after session or until authorized payment lock, whichever is earlier; admins handle later exceptions.
- Coaches see own sessions, roles, hours and statuses Pending Review / Approved / Sent for Payment, without payment amounts.

## 5. Disputes and appeals (P1)
- On absent determination, notify coach of session and zero hours. Coach can dispute within 7 calendar days of notice using written explanation only (no attachments). Flag dispute on Admin and Super Admin dashboards and exclude affected session from payment, not other sessions.
- Eve/Jasmine/Shaun may decide disputes; rejection requires written reason visible to coach.
- If Eve rejects dispute, coach may appeal within 7 calendar days of rejection to Jasmine/Shaun; written explanation required. Only Super Admin makes final appeal decision with written reason; automatically notify coach, close/lock appeal, retain internal audit. Eve cannot decide appeal.
- Automatically notify **both** Jasmine and Shaun upon appeal submission. At 7 calendar days unresolved, mark Overdue, pin to top of both Super Admin dashboards, and remind both; overdue stays visible until final decision. No automatic rejection or closure.
- Coach sees current dispute/appeal status and written decision reasons, not full historical cases; authorized management sees full history.

## 6. Monthly approved-hours batches and EFN (P1 + integration dependency)
- Last Friday of month is target payday. Include hours **through that Friday** only if attendance has actually been confirmed before authorization; never forecast unworked or unconfirmed Friday hours. Late-confirmed hours carry forward.
- Provisional batch on preceding Monday, authorization reminder Wednesday, and readiness notice to both Super Admins. Only Jasmine/Shaun can authorize. Eve may review/prepare.
- Upon authorization, lock included hours; automatically hand off to EFN **only after integration capability and idempotency are verified**. Until then provide an audited manual handoff, without marking transfers successful prematurely.
- Exclude disputed/unresolved sessions only, not entire coach batches. Approved exceptional post-authorization adjustments roll into next authorized monthly batch.
- Post-payment adjustments: Eve may create/edit/withdraw pending requests with reason, optional attachments, full audit and Super Admin notifications; 48-hour pending reminder to Jasmine/Shaun. Only Jasmine/Shaun approve/reject, with mandatory rejection reason; notify Eve. Once decided lock adjustment. Coaches do not see adjustment details/history in ECCP.

## 7. Delivery order and release gates
1. Shaun verifies actual Supabase `eccp.coaches` schema, identity mapping, role migration, access policy and rollback. Do not merge SQL planning document as though it is executed.
2. Implement and test role enforcement and onboarding.
3. Implement scheduling/cover and attendance with scheduled reminders.
4. Implement hour corrections, disputes/appeals and audit.
5. Implement monthly authorization, then EFN integration after technical verification.
6. Test all role boundaries, existing safeguarding/certificates, session time zones, midnight/month-end cutoffs, duplicate reminders, notification failures, concurrent edits, payment idempotency and migration rollback in staging.
7. Release in small verified stages. PR #28 alone is **not** the full Phase 1 deployment.

## Open technical questions (not policy decisions)
- Supabase production schema and data migration plan; current staff identifiers.
- Reminder delivery service, scheduling, timezone and retries.
- EFN API/authentication, transfer acknowledgment and reconciliation.
- Staging test coverage, operational alert channels, and rollout flags.
