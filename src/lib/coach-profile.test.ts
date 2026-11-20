import assert from "node:assert/strict";
import test from "node:test";
import { validateCoachContactProfile } from "./coach-profile";
test("validates and trims contact details", () => {
  const result = validateCoachContactProfile({ phone: " +44 7700 900123 ", emergencyContactName: " Alex ", emergencyContactPhone: "07700900456", role: "admin" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.emergencyContactName, "Alex");
    assert.equal("role" in result.value, false);
  }
});
test("rejects invalid fields", () => {
  const result = validateCoachContactProfile({ phone: "123", emergencyContactName: "", emergencyContactPhone: "abc" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(Object.keys(result.errors).length, 3);
});
