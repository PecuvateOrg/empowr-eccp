import assert from "node:assert/strict";
import test from "node:test";
import { queueSecretValid, shouldEmailCoach } from "./messaging-alerts";

test("coach reply email at most every 15 minutes", () => {
  const now = new Date("2026-11-21T12:00:00Z");
  assert.equal(shouldEmailCoach(null, now), true);
  assert.equal(shouldEmailCoach("2026-11-21T11:50:00Z", now), false);
  assert.equal(shouldEmailCoach("2026-11-21T11:45:00Z", now), true);
});

test("queue secret: exact match only; unset or short secret never opens it", () => {
  const s = "x".repeat(48);
  assert.equal(queueSecretValid(s, s), true);
  assert.equal(queueSecretValid(s + "y", s), false);
  assert.equal(queueSecretValid("wrong", s), false);
  assert.equal(queueSecretValid(null, s), false);
  assert.equal(queueSecretValid("", undefined), false);
  assert.equal(queueSecretValid(undefined as never, undefined), false);
  assert.equal(queueSecretValid("short", "short"), false);
});
