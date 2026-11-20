import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
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
 const trainingHref = passed ? "/certificate" : "/course";
 const trainingAction = passed ? "View certificate" : completed ? "Continue training" : "Start training";
 const cards = [
  { title: "My sessions & shifts", description: "Your assigned coaching sessions and shift details will appear here once scheduling is connected.", href: null, action: "Coming soon" },
  { title: "Team messages", description: "Contact the staff team and chat with invited coaches in your session groups once messaging is enabled.", href: null, action: "Coming soon" },
  { title: "My development", description: "Access additional training and track your coaching progression as new courses become available.", href: "/course", action: "Explore training" },
  { title: "My coach profile", description: "Review your account details, emergency contacts and coaching availability.", href: "/profile", action: "View profile" },
 ] as const;
 return <main className="py-10">
  <p className="text-xs font-black uppercase tracking-widest text-red-dark">Empowr Certified Coaching Programme</p>
  <h1 className="mt-3 text-3xl font-bold text-ink">Welcome back, {coach.full_name.split(" ")[0]}!</h1>
  <p className="mt-3 max-w-3xl text-muted">Welcome to your Empowr Coaching Hub. Everything you need to grow as a coach, complete your training, manage your sessions and stay connected with the team — all in one place.</p>
  <section className="mt-8 rounded-2xl border border-border bg-card p-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-xl font-bold text-ink">Safeguarding training</h2>
    <span className="rounded-full bg-blue-pale px-3 py-1 text-sm font-bold text-blue-dark">{status}</span>
   </div>
   <p className="mt-2 text-sm text-muted">{passed ? "You've passed your safeguarding assessment." : "Complete your safeguarding modules and assessment to progress."}</p>
   <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-blue-pale" role="progressbar" aria-label="Safeguarding modules completed" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}>
    <div className="h-full bg-blue" style={{ width: `${Math.round(completed / total * 100)}%` }} />
   </div>
   <p className="mt-2 text-sm text-muted">{completed} of {total} modules complete</p>
   <Link className="mt-4 inline-flex rounded-full bg-blue px-5 py-3 font-bold text-white hover:bg-blue-dark" href={trainingHref}>{trainingAction}</Link>
  </section>
  <div className="mt-6 grid gap-4 sm:grid-cols-2">
   {cards.map(card => <section key={card.title} className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-lg font-bold text-ink">{card.title}</h2>
    <p className="mt-2 text-sm text-muted">{card.description}</p>
    {card.href ? <Link className="mt-4 inline-flex rounded-full border border-blue px-4 py-2 text-sm font-bold text-blue-dark hover:bg-blue-pale" href={card.href}>{card.action}</Link> :
     <span className="mt-4 inline-flex rounded-full bg-warm-white px-4 py-2 text-sm font-bold text-muted">{card.action}</span>}
   </section>)}
   {coach.is_staff && <section className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-lg font-bold text-ink">Management</h2>
    <p className="mt-2 text-sm text-muted">Open the staff management area.</p>
    <Link className="mt-4 inline-flex rounded-full border border-blue px-4 py-2 text-sm font-bold text-blue-dark" href="/management">Open management</Link>
   </section>}
  </div>
 </main>;
}
