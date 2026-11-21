import Link from "next/link";
import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { getProgress, completedCount } from "@/lib/progress";
import { getAttempts } from "@/lib/assessment";
import { courseModules } from "@/lib/safeguarding-course";

export default async function CoachDashboardPage() {
 const coach = await getCurrentCoach();
 if (!coach) redirect("/login");
 const [progress, attempts] = await Promise.all([getProgress(coach.id), getAttempts(coach.id)]);
 const completed = completedCount(progress);
 const total = courseModules.length;
 const passed = attempts.some(a => a.passed);
 const status = passed ? "Completed" : completed === 0 ? "Not started" : "In progress";
 return <main className="py-10">
  <p className="text-xs font-black uppercase tracking-widest text-red-dark">Empowr Certified Coaching Programme</p>
  <h1 className="mt-3 text-3xl font-bold text-ink">Welcome back, {coach.full_name.split(" ")[0]}!</h1>
  <p className="mt-3 max-w-3xl text-muted">Your coaching hub — check shifts, stay connected and keep your training up to date.</p>
  <section className="mt-8 rounded-2xl border border-border bg-card p-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-xl font-bold text-ink">My Shifts</h2>
    <span className="rounded-full bg-warm-white px-3 py-1 text-xs font-bold text-muted">Scheduling coming soon</span>
   </div>
   <p className="mt-3 text-sm text-muted">Your next assigned session, date, time and location will appear here when shift scheduling is connected.</p>
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
