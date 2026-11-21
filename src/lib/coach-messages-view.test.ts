import assert from "node:assert/strict";
import test from "node:test";
import { categoryLabel, coachStatusLabel, isUnread, toCoachEntry } from "./coach-messages-view";

test("status labels are human, unknown values stay generic", () => {
  assert.equal(coachStatusLabel("new"), "New");
  assert.equal(coachStatusLabel("in_progress"), "In progress");
  assert.equal(coachStatusLabel("waiting_for_coach"), "Waiting for you");
  assert.equal(coachStatusLabel("resolved"), "Resolved");
  assert.equal(coachStatusLabel("anything"), "Open");
  assert.equal(categoryLabel("general"), "General enquiry");
  assert.equal(categoryLabel("safeguarding"), "Enquiry");
});

test("unread when someone else wrote after the coach last read", () => {
  assert.equal(isUnread(null, null), false);
  assert.equal(isUnread("2026-11-21T10:00:00Z", null), true);
  assert.equal(isUnread("2026-11-21T10:00:00Z", "2026-11-21T09:59:59Z"), true);
  assert.equal(isUnread("2026-11-21T10:00:00Z", "2026-11-21T10:00:00Z"), false);
  assert.equal(isUnread("2026-11-21T10:00:00Z", "2026-11-21T11:00:00Z"), false);
});

test("coaches see 'You' and the team, never a staff id or name", () => {
  const mine = toCoachEntry({ id: "1", author_id: "coach", body: "hi", created_at: "t" }, "coach");
  const staff = toCoachEntry({ id: "2", author_id: "staff-uuid", body: "hello", created_at: "t" }, "coach");
  assert.deepEqual([mine.mine, mine.author], [true, "You"]);
  assert.deepEqual([staff.mine, staff.author], [false, "ECCP staff team"]);
  assert.equal(JSON.stringify(staff).includes("staff-uuid"), false);
});
