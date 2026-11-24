import "server-only";
import { efn } from "./efn-client";
import { checkInEnabled } from "./efn-staffing";
import { alertCoaches } from "./push";

// Check-in reminders. EFN decides what is due (and marks 24 h-old shifts unresolved); ECCP only
// sends. EFN has already claimed each reminder, so it is sent at most once.
// Spec: Freelancer-Workflow planning/specs/2026-11-24-coach-check-in.md.

type Reminder = { kind: "before" | "late" | "end"; taskId: string; coachId: string; title: string; startsAt: string; endsAt: string };

const TEXT: Record<Reminder["kind"], (r: Reminder) => { title: string; body: string }> = {
  before: (r) => ({ title: "Check in soon", body: `${r.title} starts in 15 minutes. Tap I'm Here in My Shifts when you arrive.` }),
  late: (r) => ({ title: "Have you checked in?", body: `${r.title} started 10 minutes ago. Tap I'm Here in My Shifts.` }),
  end: (r) => ({ title: "Confirm your shift", body: `${r.title} has ended and you didn't check in. Check-in confirms your hours for payment: confirm in My Shifts within 24 hours.` }),
};

/** The one place a shift alert is sent from, so moving to the shared notification service is one change. */
export async function sendShiftAlert(r: Reminder): Promise<number> {
  return alertCoaches([r.coachId], "shifts", { ...TEXT[r.kind](r), url: "/my-shifts" });
}

export async function runShiftReminders() {
  if (!checkInEnabled()) return { enabled: false };
  const res = await efn("/system/attendance-tick", { system: "attendance" }, { method: "POST" });
  if (res.status >= 300) throw new Error(`EFN attendance tick failed (${res.status})`);
  const reminders = Array.isArray(res.data.reminders) ? res.data.reminders as Reminder[] : [];
  let devices = 0;
  for (const r of reminders) devices += await sendShiftAlert(r);
  return { enabled: true, unresolved: res.data.unresolved ?? 0, reminders: reminders.length, devices };
}
