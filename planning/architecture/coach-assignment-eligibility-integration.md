# Assignment eligibility integration gate — Phase 1

The pure eligibility policy is implemented in `src/lib/coach-assignment-eligibility.ts` and tested. The staff offer POST currently returns HTTP 503 by design until the authoritative coach and session records are confirmed.

## Shaun to confirm
- Authoritative activation state and grade per coach, including whether a coach may hold more than one grade
- Safeguarding training completion/expiry source and what counts as verified
- DBS verification and recheck source; avoid copying sensitive DBS documents
- First-aid verification/expiry for Head Coaches
- Session required grade/role and canonical session ID, venue, time, cancellation state
- Whether existing ECCP role migration and onboarding migrations are applied in staging

## Safe integration sequence
1. Add server-only evidence adapter returning verified fields, with missing fields treated as unknown.
2. Map actual grade requirements, including policy for Head Coach covering Assistant roles; current exact-grade comparison is conservative and provisional.
3. Add session grade/role picker from authoritative source, not browser-supplied flags.
4. In the staff preview, label separately: available, assignment overlap, compliance verified, and eligibility pending.
5. In the assignment POST, derive session and coach evidence server-side and evaluate the policy; do not trust UI flags.
6. Revalidate coach activation, grade, compliance, availability, overlap and session state **inside the transactional assignment operation** to prevent time-of-check/time-of-use races.
7. Only then remove the deliberate 503 gate. Test missing, expired, revoked, conflicting and concurrent cases in staging.
8. Do not deploy until Shaun approves staging evidence and the founder approves production release.
