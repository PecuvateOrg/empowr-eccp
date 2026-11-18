import { describe, expect, it } from "vitest";
import { validateCoachContactProfile } from "./coach-profile";

describe("coach contact profile validation", () => {
  it("accepts and normalizes valid contact information", () => {
    expect(validateCoachContactProfile({
      phone: " +44 7700 900123 ",
      emergencyContactName: " Alex Example ",
      emergencyContactPhone: "+44 7700 900456",
    })).toEqual({
      ok: true,
      value: {
        phone: "+44 7700 900123",
        emergencyContactName: "Alex Example",
        emergencyContactPhone: "+44 7700 900456",
      },
    });
  });

  it("rejects missing and invalid fields", () => {
    const result = validateCoachContactProfile({
      phone: "123",
      emergencyContactName: "",
      emergencyContactPhone: "abc",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors)).toEqual([
        "phone", "emergencyContactName", "emergencyContactPhone",
      ]);
    }
  });

  it("does not include privileged fields in validated payload", () => {
    const result = validateCoachContactProfile({
      phone: "07700900123",
      emergencyContactName: "Alex",
      emergencyContactPhone: "07700900456",
      grade: "head_coach",
      role: "founder",
      safeguardingCompleted: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("role");
      expect(result.value).not.toHaveProperty("grade");
      expect(result.value).not.toHaveProperty("safeguardingCompleted");
    }
  });
});
