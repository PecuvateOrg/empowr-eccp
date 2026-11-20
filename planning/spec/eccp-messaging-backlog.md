# ECCP messaging — approved requirements backlog (20 November 2026)

**Status:** requirements agreed; not implemented. **Release:** after Phase 1 scheduling integrations and staging verification. No production changes authorized.

## Goal
Coaches can contact the ECCP administration team without routing routine messages to the founder or Shaun. Authorized staff handle a shared inbox, with accountable assignment and appropriate escalation. Coaches assigned to a session can also participate in a session-specific group chat.

## Coach experience
- **Message Admin** opens a private conversation addressed to the shared **ECCP Staff Inbox**, not automatically to either Super Admin.
- Coach can start a conversation from an assigned session, automatically referencing the authoritative session ID.
- Coach can see and reply to their own conversations, attachments where allowed, unread counts, and their session/team group chats.
- Coaches cannot view internal notes, other coaches' private conversations, staff assignment metadata or restricted safeguarding threads.

## Staff inbox and routing
- Authorized **Staff** and **Admin** roles can work the shared inbox according to permissions.
- Each conversation has a category: Scheduling, Training, Safeguarding, General Enquiry, Other.
- Configurable category-to-team or category-to-staff routing; **no default assignment to founder/Shaun**. Unroutable messages stay in an unassigned queue visible to authorized triage staff.
- Authorized staff can claim/assign/reassign a conversation; record assignee and audit changes.
- Status: New, In Progress, Waiting for Coach, Resolved.
- Priority: Low, Medium, High, Urgent.
- Internal staff notes are strictly separate from coach-visible messages; enforce separation server-side.
- Unread indicators, notification delivery and announcement permissions require approved delivery provider and preferences.

## Group chats
- Authorized Admin/Staff can create invitation-only groups for a session or project.
- Session groups use canonical session IDs and include only invited/authorized participants; define membership changes when assignments are withdrawn, declined or cancelled.
- Coach can see and send messages only in groups where they are an active participant.
- Group participants are visible to each other; no private messages or internal staff notes are leaked into groups.
- Admin announcements support selected groups or audiences, with audited permissions.

## Roles and safeguarding
- **Coach:** own direct conversations and authorized groups.
- **Staff:** inbox triage and assigned conversations within granted scope; no blanket Super Admin authority.
- **Admin:** assignment, reassignment and oversight of ordinary staff inbox conversations.
- **Super Admin (founder/Shaun):** oversight and escalations; not routine recipients.
- **Safeguarding:** restricted, separately routed conversation accessible only to designated safeguarding personnel; never automatically added to general groups or unrestricted inbox. Escalation and emergency guidance must be defined before launch.
- Use persisted trusted roles, not user-provided role labels. Preserve existing separate coach and admin identities.

## Technical acceptance criteria
1. Confirm verified ECCP roles and identity mapping with Shaun before schema migrations.
2. Draft schema for conversation, participant, message, attachment metadata, assignment, category, status, priority, internal note and audit event; service-role access only with server-side authorization.
3. Implement private conversation creation and reply; enforce coach-specific access on every read/write.
4. Implement staff inbox triage, assignment, status/priority changes and internal notes with audit trail.
5. Implement session/project group creation, invitation and membership revocation.
6. Safeguarding access uses separate restricted authorization and routing; test denied access for non-designated staff and Super Admin unless explicitly authorized by policy.
7. Test cross-coach isolation, unauthorized staff access, forged participants, session reassignment, attachment permissions, notification failure and idempotent message submission.
8. Define retention, moderation, notification preferences, file scanning and operational support before release.
9. Keep this work separate from the unmerged scheduling release; no merge, migration or deployment without approval.

## Proposed implementation sequence
A. Permissions, data model and restricted safeguarding routing
B. Shared staff inbox and coach-to-staff private messages
C. Staff assignment, notes, priority/status and unread counts
D. Session and project group chats
E. Notifications, attachments, announcements and staging QA
