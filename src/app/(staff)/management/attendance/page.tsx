import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { efn } from "@/lib/efn-client";
import { checkInEnabled, efnMessage } from "@/lib/efn-staffing";
import { AttendanceBoard, type AttendanceShift } from "./AttendanceBoard";

export const dynamic = "force-dynamic";

const STATES = [
  { key: "unresolved", title: "Unresolved", hint: "No confirmation 24 hours after the end. Kept out of payment until you decide." },
  { key: "flagged", title: "Not checked in", hint: "Ended without a check-in. The coach can still confirm within 24 hours." },
  { key: "today", title: "Today", hint: "Every shift on today's sessions." },
  { key: "self_confirmed", title: "Confirmed by the coach after the session", hint: "Last 14 days. Counts as scheduled hours; shown here for review." },
] as const;

// Coach attendance from EFN (the engine). Staff and admins; EFN re-checks the role on every write.
export default async function AttendancePage() {
  if (!checkInEnabled()) notFound();
  const staff = await getCurrentCoach();
  if (!staff || !can(staff, "view_management")) redirect("/course");
  const results = await Promise.all(STATES.map(s => efn(`/staff/attendance?state=${s.key}`, { staffId: staff.id })));
  return <main className="min-w-0">
    <Link href="/management" className="text-sm font-bold text-blue">← Management</Link>
    <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">Attendance</h1>
    <p className="mt-2 text-sm text-muted">Check-ins from coaches. Only confirmed attendance becomes hours. Times are UK time.</p>
    {STATES.map((s, i) => {
      const r = results[i];
      const shifts = Array.isArray(r.data.shifts) ? r.data.shifts as AttendanceShift[] : null;
      return <section key={s.key} className="mt-6">
        <h2 className="text-lg font-bold">{s.title}{shifts ? ` (${shifts.length})` : ""}</h2>
        <p className="text-sm text-muted">{s.hint}</p>
        {shifts ? <AttendanceBoard shifts={shifts} showActions={s.key !== "self_confirmed"} />
          : <p role="alert" className="mt-3 rounded-lg border border-red bg-red/10 p-3 text-sm font-semibold text-ink">{efnMessage(r.status, r.data.error)}</p>}
      </section>;
    })}
  </main>;
}
