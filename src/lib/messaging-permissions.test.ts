import assert from "node:assert/strict";
import test from "node:test";
import { canManageConversation, canReadConversation, canReadInternalNote, canSendMessage, canWriteInternalNote } from "./messaging-permissions";
const inbox = { kind: "staff_inbox" as const, participantIds: ["coach-a"], designatedSafeguardingIds: [] };
const group = { kind: "group" as const, participantIds: ["coach-a", "coach-b"], designatedSafeguardingIds: [] };
const safeguarding = { kind: "safeguarding" as const, participantIds: ["coach-a"], designatedSafeguardingIds: ["safeguarding-lead"] };
test("coach can only see own inbox and joined groups", () => {
 assert.equal(canReadConversation("coach-a", "coach", inbox), true);
 assert.equal(canReadConversation("coach-b", "coach", inbox), false);
 assert.equal(canSendMessage("coach-b", "coach", group), true);
 assert.equal(canReadConversation("coach-c", "coach", group), false);
});
test("staff inbox is shared, but group chat is not", () => {
 assert.equal(canReadConversation("staff-a", "staff", inbox), true);
 assert.equal(canReadConversation("staff-a", "staff", group), false);
 assert.equal(canManageConversation("staff", "staff_inbox", false), false);
 assert.equal(canManageConversation("admin", "staff_inbox", false), true);
});
test("internal notes are hidden from coaches and group members", () => {
 assert.equal(canReadInternalNote("coach-a", "coach", inbox), false);
 assert.equal(canWriteInternalNote("staff-a", "staff", inbox), true);
 assert.equal(canWriteInternalNote("staff-a", "staff", group), false);
});
test("safeguarding access requires explicit designation even for admin", () => {
 assert.equal(canReadConversation("coach-a", "coach", safeguarding), false);
 assert.equal(canReadConversation("admin-a", "admin", safeguarding), false);
 assert.equal(canReadConversation("safeguarding-lead", "staff", safeguarding), true);
 assert.equal(canManageConversation("admin", "safeguarding", false), false);
 assert.equal(canManageConversation("staff", "safeguarding", true), true);
});

test("unknown roles cannot gain staff inbox access", () => {
 assert.equal(canReadConversation("unknown", "founder" as never, inbox), false);
 assert.equal(canManageConversation("super_admin" as never, "staff_inbox", false), false);
 assert.equal(canWriteInternalNote("unknown", "founder" as never, inbox), false);
});
