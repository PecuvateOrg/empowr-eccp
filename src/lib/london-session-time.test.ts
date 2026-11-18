import assert from "node:assert/strict";
import test from "node:test";
import { londonSessionStartUtc } from "./london-session-time";

test("winter London time is UTC", () => {
 assert.equal(londonSessionStartUtc("2026-11-23","10:00"), "2026-11-23T10:00:00.000Z");
});
test("summer London time is UTC plus one hour", () => {
 assert.equal(londonSessionStartUtc("2026-07-20","10:00"), "2026-07-20T09:00:00.000Z");
});
test("rejects missing and ambiguous daylight-saving times", () => {
 assert.equal(londonSessionStartUtc("2026-03-29","01:30"), null);
 assert.equal(londonSessionStartUtc("2026-10-25","01:30"), null);
});
test("rejects invalid dates and clock times", () => {
 assert.equal(londonSessionStartUtc("2026-02-30","10:00"), null);
 assert.equal(londonSessionStartUtc("2026-11-23","25:00"), null);
});
