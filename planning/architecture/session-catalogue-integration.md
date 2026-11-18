# ECCP authoritative session catalogue integration

## Decision required from Shaun
Identify the authoritative Empowr Members booking/session source and confirm the approved read-only integration path. Do not copy session records into ECCP as an independent master catalogue.

## Prepared interface
- `src/lib/assignable-sessions.ts`: typed `AssignableSession` record and explicit unconfigured result.
- `GET /api/management/assignments/sessions`: staff-only, returns 503 while source unconfigured, never a misleading empty catalogue.
- Admin form: session picker with session name, date, London start and venue; selecting an entry fills the assignment form.
- Manual session reference is a staging-only fallback; disable it before production rollout.

## Before enabling
1. Confirm session IDs, dates, time zone, venue and cancellation fields from the booking source.
2. Implement a server-side authenticated read-only adapter; do not expose integration credentials to the browser.
3. Filter future, active sessions; show an explicit empty state if genuinely none.
4. On POST, verify the selected session ID and all date/time fields against the authoritative source **server-side**. Do not trust browser-prefilled fields.
5. Ensure booking changes and cancellations reconcile with offered/accepted coach assignments.
6. Validate role eligibility and availability before offering assignments, including concurrent changes.
7. Test session picker with DST, cancellations, deleted sessions and API outages.
8. Keep the production release gated on Shaun's staging review and founder approval.
