import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { getProgress, completedCount } from "@/lib/progress";
import { getAttempts } from "@/lib/assessment";
import { courseModules } from "@/lib/safeguarding-course";
import { courses } from "@/lib/courses";

export default async function MyTrainingPage() {
 const coach = await getCurrentCoach();
 if (!coach) redirect("/login");
 const [progress, attempts] = await Promise.all([getProgress(coach.id), getAttempts(coach.id)]);
 const completed = completedCount(progress);
 const passed = attempts.some(a => a.passed);
 const status = passed ? "Completed" : completed === 0 ? "Not started" : "In progress";
 return <main className="py-10">
  <Link href="/dashboard" className="text-sm font-semibold text-blue hover:underline">Back to coach portal</Link>
  <h1 className="mt-5 text-3xl font-bold text-ink">My Training</h1>
  <p className="mt-2 max-w-2xl text-muted">Your Empowr coaching courses, progress and certificates in one place.</p>
  <section className="mt-8 rounded-2xl border border-border bg-card p-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-xl font-bold text-ink">Safeguarding for Roller Skating Coaches</h2>
    <span className="rounded-full bg-blue-pale px-3 py-1 text-sm font-bold text-blue-dark">{status}</span>
   </div>
   <p className="mt-3 text-sm text-muted">{completed} of {courseModules.length} modules complete{passed ? " · Assessment passed" : ""}</p>
   <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-blue-pale" role="progressbar" aria-label="Safeguarding modules completed" aria-valuemin={0} aria-valuemax={courseModules.length} aria-valuenow={completed}>
    <div className="h-full bg-blue" style={{ width: `${Math.round(completed / courseModules.length * 100)}%` }} />
   </div>
   <div className="mt-5 flex flex-wrap gap-3">
    <Link href="/course" className="inline-flex rounded-full bg-blue px-5 py-3 text-sm font-bold text-white hover:bg-blue-dark">{passed ? "Review training" : completed ? "Continue training" : "Start training"}</Link>
    {passed && <Link href="/certificate" className="inline-flex rounded-full border border-blue px-5 py-3 text-sm font-bold text-blue-dark hover:bg-blue-pale">View / download certificate</Link>}
   </div>
  </section>
  <h2 className="mt-9 text-xl font-bold text-ink">Other training</h2>
  <div className="mt-4 grid gap-4 sm:grid-cols-2">
   {courses.filter(c => c.status === "coming-soon").map(c => <section key={c.slug} className="rounded-2xl border border-border bg-card p-5">
    <h3 className="font-bold text-ink">{c.shortLabel}</h3>
    <p className="mt-2 text-sm font-semibold text-muted">Coming soon</p>
   </section>)}
  </div>
 </main>;
}
