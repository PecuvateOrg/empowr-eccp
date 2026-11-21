# ECCP messaging phase 2: coach conversation view and staff alerts

**Status:** DONE 2026-11-21. Stages 1-3 shipped (#59-#62), switched on (#63), verified live (#66; results in `eccp-messaging-staging-verification.md`). Stage 4 step 1 (`run-with-secrets.sh` handing apps the vault URL) was fixed in `_config` 8a7ea3c and checked: the app now gets the empowr-cic project. Plan accepted by the owner 2026-11-21.

## Where phase 1 left off

Tested end to end on 2026-11-21 (coach A, coach B, staff, admin; test data deleted): permissions,
internal notes, idempotency, assignment and the screens all work. Three gaps stop a launch:

1. A coach can list their enquiries but **cannot open one**, so a staff reply is invisible to them.
   The API already exists (`GET /api/messages/[id]`, internal notes excluded).
2. Nobody is told when something arrives: staff don't know a coach wrote, coaches don't know staff replied.
3. Raw values show in the UI (`in_progress`), and staff messages carry no author.

## Decisions (owner, 2026-11-21: recommendations accepted)

| # | Question | Recommendation |
|---|---|---|
| 1 | Where do staff see new enquiries? | **Empowr Dashboard work list**, as a third platform source beside CRM and Members. Staff already work there; no new inbox to watch. |
| 2 | Do staff also get an email? | **No** at launch. The Dashboard item is the alert. An email to a shared address would duplicate it (staff-work-list rule: one owner per message). |
| 3 | Which Dashboard department owns ECCP enquiries? | **Admin** (Eve, Jasmine). Coaches are EFN freelancers, and `efn@` is already an Admin address (`company/operations/email-management.md`). Items carry `addresses: ["efn@empowrcic.org"]`, so `departmentOf()` places them there with no new department. A Coaching department can be added later if volume justifies it. |
| 4 | Do coaches get an email when staff reply? | **Yes**, with no message content: "You have a new reply from the ECCP staff team. Sign in to read it." Safeguarding-safe, and coaches rarely sit on the page. |
| 5 | What name do coaches see on staff messages? | **"ECCP staff team"**, never the individual. Staff see each other's names. |

## Stage 1: coach conversation view

- New page `/messages/[id]`, inside the `(coach)` group so its layout gate applies, and a 404 while the flag is off.
- Shows the thread oldest first: "You" for the coach, "ECCP staff team" for staff. Uses the existing coach route, which already drops internal notes. Add a test that a note never reaches this page.
- A reply box under the thread, using `/api/messages/[id]/reply`. Same retry-safe idempotency key as the compose form.
- The enquiry list links to each thread and shows human labels: New, In progress, Waiting for you, Resolved.
- **Unread:** opening a thread writes `message_read_receipts` (the table exists). A thread is unread when a staff entry is newer than the coach's receipt. The "Team message alerts" banner in the coach layout shows the unread count and links to `/messages`.
- A resolved thread stays readable. Replying reopens it to New (one line in `message_add_entry`; needs a migration).

## Stage 2: staff inbox polish

- Author on every entry: the coach's name, or the staff member's name.
- Human labels for status and priority.
- **Waiting for staff** marker: the newest public entry is from the coach. Sort these first.
- The admin-only status, priority and assignee controls are already in the API; check the UI exposes them to admins only.

## Stage 3: alerts

**Staff, through the Dashboard (decisions 1–3).** Same contract as Members' `/api/staff-queue`:

- ECCP route `GET /api/staff-queue`, checked by an `x-staff-queue-secret` header against `ECCP_QUEUE_SECRET` (SSM for Amplify, mirrored to Vault). It returns open `staff_inbox` conversations that are **waiting for staff**: id, coach name, category, title, the last coach message (first 200 characters), and time. It never returns internal notes or safeguarding.
- Dashboard: add `eccp` to `inbox-sources.ts` (the `SourceKey`, `target()` and an `eccpItems()` mapper). Each item links to `https://eccp.empowrcic.org/management/messages?c=<id>`. Staff reply in ECCP, not in the Dashboard (rule: platforms send their own replies).
- Department: each item sets `addresses: ["efn@empowrcic.org"]`, which lands it in **Admin**. Check this on the live list: platform items with `addresses: []` fall through to Personal unless a stored row says otherwise.
- An item drops off the list once staff reply, because it is no longer waiting. A new coach reply brings it back.
- If ECCP can't be reached, the Dashboard names it as a failed source instead of showing nothing.

**Coaches, by email (decision 4).**

- After a successful staff reply (never after an internal note), send `sendCoachReplyEmail` through the existing Resend sender. Content-free, with a fixed link to `https://eccp.empowrcic.org/messages`.
- At most one email per conversation per 15 minutes. Record a `coach_notified` row in `message_events` and check it before sending.
- A failed send never fails the reply: log it, keep the reply, and leave unread showing in the app (gotchas: commit first, then send).

## Stage 4: test and switch on

1. Fix `run-with-secrets.sh` first: it hands apps the vault's own `SUPABASE_URL`, so local runs hit the wrong database.
2. Re-run the phase 1 test matrix plus:
   - A coach reads a staff reply and never sees a note.
   - Unread counts rise and clear.
   - A staff reply sends one coach email, and a second reply within 15 minutes sends none.
   - The Dashboard shows the enquiry, it clears when staff reply, and it returns when the coach replies.
   - A wrong queue secret gets 401.
3. Test accounts use `tech+…@pecuvate.com` and are deleted afterwards, with counts checked against a baseline.
4. Tell staff where enquiries will appear, then set `ECCP_MESSAGING_ENABLED=true` (SSM, then a `src/` commit), and check the live site as a coach and as staff.

## Out of scope

Group chats, safeguarding messaging (needs its own lead, retention schedule and access protocol),
attachments, the 24-month deletion job (approved period; the job needs its own review), and push notifications.
