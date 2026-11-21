# ECCP Messaging — production verification handoff

## Why this is needed
The database security test matrix passed on 2026-11-21 **inside a rolled-back transaction**. This does not prove the messaging schema and RPCs were subsequently installed permanently. The management messaging page currently returns 404; this is consistent with the feature flag remaining off and is **not** evidence of a failed migration.

## Owner: authorised Supabase administrator (Shaun / infrastructure owner)
Run this **read-only** query against the ECCP production database. Do not share connection strings, tokens, credentials or row data.

```sql
select
  to_regclass('eccp.message_conversations') is not null as conversations,
  to_regclass('eccp.message_participants') is not null as participants,
  to_regclass('eccp.message_safeguarding_access') is not null as safeguarding_access,
  to_regclass('eccp.message_entries') is not null as entries,
  to_regclass('eccp.message_events') is not null as events,
  to_regclass('eccp.message_read_receipts') is not null as receipts,
  to_regprocedure('eccp.message_actor(text)') is not null as actor_rpc,
  to_regprocedure('eccp.message_create_staff_enquiry(text,text,text,text,uuid)') is not null as create_rpc,
  to_regprocedure('eccp.message_add_entry(text,uuid,text,boolean,uuid)') is not null as reply_rpc,
  to_regprocedure('eccp.message_manage_staff_enquiry(text,uuid,boolean,uuid,text,text)') is not null as manage_rpc;
```

Report each boolean result, project/environment, date, and whether the migrations were deliberately committed. All TRUE confirms object presence, **not** complete grants, RLS, migration correctness or end-to-end operation. If anything is FALSE, stop and investigate; do not run a migration blindly.

## Follow-up release checks
- [ ] Confirm all required objects exist and permanent migration history / application is documented.
- [ ] Verify RLS and grants, including service_role-only RPC execution, without exposing credentials.
- [ ] Keep `ECCP_MESSAGING_ENABLED` off until explicit release approval.
- [ ] Arrange controlled authenticated HTTP tests with separate coach A, coach B, staff and admin accounts, including origin checks, isolation, internal note filtering, and error codes.
- [ ] Record evidence in `planning/spec/eccp-messaging-staging-verification.md` after verification; avoid writing sensitive test data to the repository.
- [ ] Enable only after the security/release owner signs off.

**Scope of this PR:** documentation and handoff only; no production database writes, feature-flag changes or application behavior changes.
