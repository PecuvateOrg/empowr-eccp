import Link from "next/link";
import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { getProgress, completedCount } from "@/lib/progress";
import { getAttempts } from "@/lib/assessment";
import { courseModules } from "@/lib/safeguarding-course";
import { efn } from "@/lib/efn-client";
import { efnMessage, londonDate, shiftScreensEnabled, venueText, whenText } from "@/lib/efn-staffing";
import type { CoachShift } from "@/app/(coach)/my-shifts/MyShiftsList";

export const dynamic = "force-dynamic";

export default async function CoachDashboardPage() {
 const coach = await getCurrentCoach();
 if (!coach) redirect("/login");
 const [progress, attempts] = await Promise.all([getProgress(coach.id), getAttempts(coach.id)]);
 const shiftsEnabled = shiftScreensEnabled();
 const shiftResult = shiftsEnabled ? await efn(`/shifts?from=${londonDate(-1)}`, { coachId: coach.id }) : null;
 const shifts = shiftResult && Array.isArray(shiftResult.data.shifts) ? shiftResult.data.shifts as CoachShift[] : null;
 const upcoming = (shifts ?? []).filter(s => s.sessionStatus !== "cancelled" && s.response !== "declined" && new Date(s.endsAt).getTime() > Date.now()).sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
 const nextShift = upcoming[0];
 const pending = upcoming.filter(s => s.kind === "shift" && s.response === "pending").length;
 const completed = completedCount(progress);
 const total = courseModules.length;
 const passed = attempts.some(a => a.passed);
 const status = passed ? "Completed" : completed === 0 ? "Not started" : "In progress";
 return <main>
  <p className="text-xs font-black uppercase tracking-widest text-red-dark">Empowr Certified Coaching Programme</p>
  <h1 className="mt-3 text-ink text-xl font-bold tracking-tight sm:text-2xl">Welcome back, {coach.full_name.split(" ")[0]}!</h1>
  <p className="mt-3 max-w-3xl text-muted">Your coaching hub — check shifts, stay connected and keep your training up to date.</p>
  <section className="mt-8 rounded-2xl border border-border bg-card p-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-xl font-bold text-ink">My Shifts</h2>
    {shiftsEnabled && <Link className="text-sm font-bold text-blue hover:underline" href="/my-shifts">View all my shifts →</Link>}
   </div>
   {!shiftsEnabled ? <p className="mt-3 text-sm text-muted">Shift scheduling is not enabled.</p>
    : !shifts ? <p role="alert" className="mt-3 text-sm text-muted">{efnMessage(shiftResult?.status ?? 503, shiftResult?.data.error)}</p>
    : <>
      {nextShift ? <Link href="/my-shifts" className="mt-4 block rounded-xl border border-border p-4 hover:bg-blue-pale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue">
       <p className="text-xs font-bold uppercase tracking-wide text-muted">Next upcoming shift</p>
       <h3 className="mt-2 font-bold text-ink">{nextShift.title}</h3>
       <p className="mt-1 text-sm font-semibold text-blue">{whenText(nextShift.startsAt, nextShift.endsAt)}</p>
       <p className="mt-1 text-sm text-muted">{venueText(nextShift.venue)} · {nextShift.role}</p>
       <p className="mt-2 text-xs font-semibold text-muted">{nextShift.response === "pending" ? "Waiting for your answer" : nextShift.response === "accepted" ? "Accepted" : "Assigned"}</p>
      </Link> : <p className="mt-3 text-sm text-muted">You have no upcoming shifts.</p>}
      {pending > 0 && <Link href="/my-shifts" className="mt-3 inline-block text-sm font-bold text-blue hover:underline">{pending} {pending === 1 ? "shift is" : "shifts are"} waiting for your response →</Link>}
     </>}
  </section>
  <div className="mt-6 grid gap-4 sm:grid-cols-2">
   <section className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-lg font-bold text-ink">My Messages</h2>
    <p className="mt-2 text-sm text-muted">Team messages and session updates will appear here when messaging is enabled.</p>
    <span className="mt-4 inline-flex rounded-full bg-warm-white px-4 py-2 text-sm font-bold text-muted">Coming soon</span>
   </section>
   <section className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-lg font-bold text-ink">My Training &amp; Compliance</h2>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
     <span className="font-semibold text-ink">Safeguarding</span>
     <span className="rounded-full bg-blue-pale px-3 py-1 text-sm font-bold text-blue-dark">{status}</span>
    </div>
    <p className="mt-2 text-sm text-muted">{completed} of {total} modules complete. View courses, certificates and compliance requirements.</p>
    <Link className="mt-4 inline-flex rounded-full border border-blue px-4 py-2 text-sm font-bold text-blue-dark hover:bg-blue-pale" href="/training">Open Training &amp; Compliance</Link>
   </section>
   <section className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-lg font-bold text-ink">My Profile</h2>
    <p className="mt-2 text-sm text-muted">Your coaching grade, contact details and availability.</p>
    <Link className="mt-4 inline-flex rounded-full border border-blue px-4 py-2 text-sm font-bold text-blue-dark hover:bg-blue-pale" href="/profile">View profile</Link>
   </section>
   {can(coach, "view_management") && <section className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-lg font-bold text-ink">Management</h2>
    <p className="mt-2 text-sm text-muted">Open the staff management area.</p>
    <Link className="mt-4 inline-flex rounded-full border border-blue px-4 py-2 text-sm font-bold text-blue-dark" href="/management">Open management</Link>
   </section>}
  </div>
 </main>;
}
