# Messaging write API — integration and release blockers

Added routes (feature-gated by `ECCP_MESSAGING_ENABLED=true`, OFF by default):
- POST /api/messages/new — coach starts ordinary staff enquiry
- POST /api/messages/[id]/reply — authorized coach or staff replies
- PATCH /api/management/messages/[id] — staff assignment, priority and status
- POST /api/management/messages/[id]/notes — staff-only note

**Do not enable in any environment yet.** The transactional PostgreSQL functions
`message_create_staff_enquiry`, `message_add_entry` and
`message_manage_staff_enquiry` exist only as an unexecuted staging SQL draft. They are NOT deployed or verified. Requests fail closed with
503 if functions are absent. This is an API scaffold, not a working messaging system.

Before enabling, implement RPCs with these non-negotiable requirements:
1. Validate actor identity and current persisted role INSIDE each RPC; never trust
   `p_actor_id` or `p_is_staff` passed from a caller as authorization. Because
   service-role DB connections bypass RLS, RPCs should use a secure server
   authorization mechanism that cannot be forged by an API consumer.
2. Create conversation + participant + first entry + audit record in one transaction.
   Verify creator is a valid active coach; no default assignment to founder/Shaun.
3. Reply only for current conversation participants or explicitly authorized
   staff-inbox operators; reject safeguarding conversations and removed members.
4. Internal notes must be inaccessible to coaches at BOTH query and RPC level.
5. Assignment must check the proposed assignee's trusted staff role, plus the
   actor's assignment permission, then audit old/new assignee and status.
6. Idempotency keys and per-actor rate limits are drafted in SQL and wired into write routes,
   but remain untested in staging. Verify retries, concurrency and quota enforcement.
   Same-origin write checks are now in place but need integration testing with the deployed proxy/origin configuration. Attachment uploads are explicitly unsupported in Phase 1 (JSON text-only guard); future uploads require separate scanning, storage permissions, and retention review. Retention policy approval remains a blocker.
7. Verify a source of truth for `staff` vs `admin` vs `super_admin` roles:
   `getCurrentCoach()` now loads persisted `admin_role` (`coach`, `staff`, `admin`).
   Confirm the staging schema and deployed migration expose the same column.
8. Verify staging schema and all migrations with Shaun; do not run on production.
9. Test cross-coach isolation, forged IDs, staff privilege escalation,
   safeguarding separation, internal-note leakage, concurrent assignment,
   duplicate submission, and revoked group membership.
10. Wire UI forms only after the RPCs and tests pass.

The draft PR remains unmerged; role and navigation fixes are committed, but staging verification and security tests remain. Production feature flag must remain unset/false.

## Retention and attachments — proposed policy, approval required

- **Phase 1:** text-only conversations and internal notes. Reject multipart uploads and attachment-related fields. Do not store file blobs, remote file URLs, or base64 media as supported attachment types.
- **Routine conversations:** propose retaining messages, assignment history, and staff notes for **24 months after resolution**, then deleting them through an audited, separately approved retention job. The 24-month period is recorded as owner-approved on 2026-11-21 (to be confirmed by the owner on this PR); the deletion job is not implemented or deployed.
- **Safeguarding:** exclude from routine automated deletion. A designated safeguarding lead must approve a separate statutory/contractual retention schedule and access protocol before any safeguarding messaging is enabled. Do not infer a universal statutory retention period.
- **Open cases, complaints, disputes, or legal holds:** suspend deletion until the relevant authorised owner approves release.
- **Backups and audit events:** document backup expiry, audit retention, and secure erasure before activating any purge job. A production purge must never run from this draft.
- **Future attachments:** require malware scanning, private storage, per-message authorization, download audit, file size/type restrictions, and deletion coverage before enabling.

**Approval gate:** routine-message retention period approved by the project owner. Data-protection implementation review, deletion-job testing, and separate safeguarding retention approval remain necessary before any automatic purge or feature enablement.
