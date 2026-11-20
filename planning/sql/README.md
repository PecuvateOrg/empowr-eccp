# Phase 1 SQL: run order

**Not applied.** The maintainers apply these with their migration script, which wraps each
file in a transaction, probes it first and records it in the migration ledger. Back up the
`eccp` schema (`pg_dump -n eccp`) before the first one. Production is shared with Members,
EFN and Waivers, and there is no staging database: every file only adds things, and features
stay switched off in code until checked.

| Order | File | Adds | Status |
|---|---|---|---|
| 1 | `../architecture/phase-1-database-migration.md` → Migration A | `coaches.admin_role` (`admin` / `staff` / `coach`) | Ready once role holders are confirmed |
| 2 | `coach-details-phase1.sql` | Contact profiles, weekly availability, exceptions, the **one** `replace_coach_availability` | Ready |
| 3 | `coach-scheduling-phase1.sql` | Session assignments + alert outbox | **Held:** EFN handoff decision |
| 4 | `coach-assignment-offers-phase1.sql` | `staff_offer_coach_assignment` | Held, needs 3 |
| 5 | `coach-assignment-decisions-phase1.sql` | `coach_decide_assignment` | Held, needs 3 |

`replace_coach_availability` turns on its conflict alerts by itself once step 3 has run, so it
never needs to be redefined.
