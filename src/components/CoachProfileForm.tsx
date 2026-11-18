"use client";

import { useState, type FormEvent } from "react";
import { validateCoachContactProfile } from "@/lib/coach-profile";

export function CoachProfileForm() {
  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  function handleValidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateCoachContactProfile({
      phone,
      emergencyContactName,
      emergencyContactPhone,
    });
    if (!result.ok) {
      setErrors(result.errors);
      setMessage("");
      return;
    }
    setErrors({});
    setMessage(
      "Details validated. Saving will be enabled after the secure profile database connection is ready. Nothing has been submitted.",
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-border p-6">
      <h2 className="text-lg font-bold">Contact details</h2>
      <p className="mt-2 text-sm text-muted">
        This form is a preview. Your entries are not saved or sent to Empowr yet.
      </p>
      <form onSubmit={handleValidate} className="mt-6 space-y-5" noValidate>
        <div>
          <label htmlFor="coach-phone" className="block text-sm font-semibold">Your phone number</label>
          <input id="coach-phone" type="tel" autoComplete="tel" value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-transparent p-3" />
          {errors.phone && <p role="alert" className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="emergency-name" className="block text-sm font-semibold">Emergency contact name</label>
          <input id="emergency-name" type="text" autoComplete="off" value={emergencyContactName}
            onChange={(event) => setEmergencyContactName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-transparent p-3" />
          {errors.emergencyContactName && <p role="alert" className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>}
        </div>
        <div>
          <label htmlFor="emergency-phone" className="block text-sm font-semibold">Emergency contact phone</label>
          <input id="emergency-phone" type="tel" autoComplete="off" value={emergencyContactPhone}
            onChange={(event) => setEmergencyContactPhone(event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-transparent p-3" />
          {errors.emergencyContactPhone && <p role="alert" className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>}
        </div>
        <button type="submit" className="rounded-lg bg-blue px-5 py-3 font-bold text-white">
          Validate details
        </button>
        {message && <p role="status" className="text-sm text-muted">{message}</p>}
      </form>
    </section>
  );
}
