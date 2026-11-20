# ECCP Phase 1 — staging verification checklist

**Do not merge PR #28 or deploy to production until Shaun approves the schema and staging results.**

## Database review and migration order
1. Confirm `eccp.coaches` identity mapping and the actual authoritative session registry. The proposed `external_session_id` is temporary; avoid duplicate session sources.
2. Review existing `eccp` privileges, SECURITY DEFINER ownership and service_role-only RPC grants.
3. Review and apply in the order in `planning/sql/README.md` (there is no staging database; files are additive and features stay off until checked):
   - `planning/sql/coach-details-phase1.sql`
4. Confirm staging environment variables and application API point to staging Supabase only.

## Test scenarios
- Unauthenticated coach/staff endpoints return 401; coach accessing staff endpoints returns 403.
- Coach can only read and change their own profile and availability; another coach's ID is rejected.
- Profile and availability pages distinguish loading, empty, and unavailable database.
- Confirm alerts are only **queued**, not delivered, until a separately approved notification worker exists.
- Check concurrent coach availability saves and session offers for race conditions; the current proposal locks coach rows for availability updates but offer creation must be reviewed for equivalent coordination.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm build` from `src/`; verify GitHub PR checks are green.

## Release gate
Shaun signs off schema, access controls, staging test evidence, and source-of-truth session mapping.
Founder approves the workflow and production release separately. Keep PR #28 in draft until ready.
