# Phase 1 SQL: run order

**Not applied.** The maintainers apply these with their migration script, which wraps each
file in a transaction, probes it first and records it in the migration ledger. Back up the
`eccp` schema (`pg_dump -n eccp`) before the first one. Production is shared with Members,
EFN and Waivers, and there is no staging database: every file only adds things, and features
stay switched off in code until checked.

| Order | File | Adds |
|---|---|---|
| 1 | `../architecture/phase-1-database-migration.md` → Migration A | `coaches.admin_role` (`admin` / `staff` / `coach`) |
| 2 | `coach-details-phase1.sql` | Contact profiles, weekly availability, exceptions, `replace_coach_availability` |
| 3 | `coaching-grade.sql` | `coaches.coaching_grade`, grade audit table, `set_coaching_grade` (then set `ECCP_COACHING_GRADE_ENABLED=1`) |
| 4 | `eccp-messaging-phase1.sql` then `eccp-messaging-rpcs-staging-draft.sql` | Messaging tables (RLS on, no client grants) and RPCs. Leave `ECCP_MESSAGING_ENABLED` off |
| 5 | `eccp-service-role-grants.sql` | **Applied 2026-11-21.** Server-role access to every table added since phase 1. Any new `eccp` table needs the same grant, or the app gets `42501 permission denied` |

Session assignments are **not** ECCP tables. They live in EFN as `freelancer_tasks` (owner
decision 2026-11-20). ECCP shows a coach their tasks through EFN's `/api/eccp/v1`.
