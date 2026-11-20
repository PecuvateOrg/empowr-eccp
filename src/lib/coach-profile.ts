/**
 * Coach-editable profile fields for Phase 1.
 * Persistence and authorization must be enforced server-side after the
 * Supabase schema is verified. Never accept role/grade/compliance from a
 * coach-submitted profile payload.
 */
export interface CoachContactProfile {
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export type ProfileValidation =
  | { ok: true; value: CoachContactProfile }
  | { ok: false; errors: Partial<Record<keyof CoachContactProfile, string>> };

function normalized(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function validPhone(value: string): boolean {
  // International-friendly phone check; no assumption that every coach has UK number.
  return /^\+?[0-9() .-]{7,25}$/.test(value) &&
    (value.match(/\d/g)?.length ?? 0) >= 7;
}

export function validateCoachContactProfile(input: unknown): ProfileValidation {
  const raw =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const phone = normalized(raw.phone, 25);
  const emergencyContactName = normalized(raw.emergencyContactName, 120);
  const emergencyContactPhone = normalized(raw.emergencyContactPhone, 25);
  const errors: Partial<Record<keyof CoachContactProfile, string>> = {};
  if (!phone || !validPhone(phone)) errors.phone = "Enter a valid phone number";
  if (!emergencyContactName) errors.emergencyContactName = "Enter an emergency contact name";
  if (!emergencyContactPhone || !validPhone(emergencyContactPhone)) {
    errors.emergencyContactPhone = "Enter a valid emergency contact phone";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      phone: phone!,
      emergencyContactName: emergencyContactName!,
      emergencyContactPhone: emergencyContactPhone!,
    },
  };
}
