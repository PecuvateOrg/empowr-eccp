# Staffing integration — proposed contract (#64)

Review with the schema maintainer before migration. This document does not apply SQL or enable production synchronisation.

## Records
- staffing_sessions: UUID primary key, source system, unique (source_system, source_key), offering reference, title, start/end timestamptz, venue snapshot, source status (scheduled/cancelled), reconciliation state, last seen snapshot, audit timestamps. Require end > start. Retain cancelled and historic records.
- shift_assignments: UUID primary key, staffing session foreign key (restrict deletion), coach reference matching existing coach PK, role, assignment state, required/additional-paid classification, additional-paid reason and approval actor/time, recurrence reference, agreed pay classification. One active assignment per coach/session; enforce eligibility and overlapping time checks transactionally.
- sync audit: run ID, start/end, snapshot version, result, counts and non-sensitive error category. Never store bearer credentials. Track repeated missing future keys only across complete successful snapshots.

## Permissions
Management with explicit scheduling authority may assign or approve cover; coaches may read only their own assigned shifts. Server-only sync identity owns source fields, not staffing assignments. Deny direct client writes unless explicitly authorised by reviewed RLS. Audit assignment and cover changes.

## Reconciliation
Collect and validate every page before persistence. Upsert source-owned fields by stable key in one transaction; never delete assignments or infer cancellations from absence. Explicit cancellations and changed times/venues require management review and notification deduplication. Missing future sessions require repeated complete snapshots before review. Preserve last good state on errors. No automatic replacement of shifted course dates.

## Release gates
Confirm actual coach PK and role policy, schema-of-record migrations, RLS tests, rollback, concurrency and overlap enforcement, course exclusions/cancellations, bounded horizon, end-to-end fixtures and maintainer-managed secrets. No production writes or activation from this branch.
