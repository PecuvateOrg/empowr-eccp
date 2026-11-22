import { test } from "node:test";
import assert from "node:assert/strict";
import { efnMessage, londonDate, shiftScreensEnabled, skippedText, staffPath, whenText } from "./efn-staffing";

const ID = "00000000-0000-4000-8000-000000000001";

test("screens are off unless the flag is exactly 'true'", () => {
  assert.equal(shiftScreensEnabled({}), false);
  assert.equal(shiftScreensEnabled({ ECCP_SHIFTS_ENABLED: "1" }), false);
  assert.equal(shiftScreensEnabled({ ECCP_SHIFTS_ENABLED: "true" }), true);
});

test("only the four staff actions are forwarded", () => {
  assert.equal(staffPath(["sessions", ID, "positions"]), `/staff/sessions/${ID}/positions`);
  assert.equal(staffPath(["sessions", ID, "review"]), `/staff/sessions/${ID}/review`);
  assert.equal(staffPath(["positions", ID, "assign"]), `/staff/positions/${ID}/assign`);
  assert.equal(staffPath(["positions", ID, "cover"]), `/staff/positions/${ID}/cover`);
  assert.equal(staffPath(["series", "x", "lock"]), null, "term locking is not on these screens");
  assert.equal(staffPath(["positions", "not-a-uuid", "assign"]), null);
  assert.equal(staffPath(["positions", ID, "assign", "extra"]), null);
  assert.equal(staffPath(["sessions", ID, "assign"]), null);
});

test("EFN codes read as plain text; sentences pass; internals never leak", () => {
  assert.match(efnMessage(409, "certificate_expired"), /certificate/);
  assert.match(efnMessage(409, "no_head_coach"), /head coach/);
  assert.match(efnMessage(404, "not_linked"), /EFN dashboard/);
  assert.equal(efnMessage(409, "You have already answered this shift"), "You have already answered this shift");
  assert.match(efnMessage(500, "connection refused at 10.0.0.1"), /unavailable/);
  assert.match(efnMessage(409, "some_new_code"), /unavailable/, "an unknown code is not shown raw");
});

test("skipped series dates name the date and the reason", () => {
  assert.equal(skippedText({ date: "2026-12-05", reason: "double_booked" }), "Sat 5 Dec: This coach already has a session at that time.");
});

test("times in UK time, including summer time; London date", () => {
  assert.equal(whenText("2027-01-11T15:30:00Z", "2027-01-11T16:30:00Z"), "Mon, 11 Jan 2027 · 15:30–16:30");
  assert.equal(whenText("2027-07-12T15:30:00Z", "2027-07-12T16:30:00Z"), "Mon, 12 Jul 2027 · 16:30–17:30");
  assert.equal(londonDate(0, new Date("2027-07-12T23:30:00Z")), "2027-07-13");
});
