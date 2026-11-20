import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";

const cards = [
 { title: "Safeguarding training", description: "Continue your modules, assessment and certificate.", href: "/course", label: "Go to training" },
 { title: "My coach profile", description: "Check your account and contact details.", href: "/profile", label: "View profile" },
 { title: "My availability", description: "Review and update when you are available to coach.", href: "/availability", label: "Manage availability" },
] as const;

export default async function CoachDashboardPage() {
 const coach = await getCurrentCoach();
 if (!coach) redirect("/login");
 return <main className="py-10">
  <p className="text-xs font-black uppercase tracking-widest text-red-dark">Empowr Certified Coaching Programme</p>
  <h1 className="mt-3 text-3xl font-bold text-ink">Welcome back, {coach.full_name.split(" ")[0]}</h1>
  <p className="mt-2 max-w-2xl text-muted">Your coaching hub. Choose what you need to work on today.</p>
  <div className="mt-8 grid gap-5 sm:grid-cols-2">
   {cards.map(card => <section key={card.href} className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-xl font-bold text-ink">{card.title}</h2>
    <p className="mt-2 text-sm text-muted">{card.description}</p>
    <Link className="mt-5 inline-flex rounded-full bg-blue px-5 py-3 font-bold text-white hover:bg-blue-dark" href={card.href}>{card.label}</Link>
   </section>)}
   {coach.is_staff && <section className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-xl font-bold text-ink">Management</h2>
    <p className="mt-2 text-sm text-muted">Access the staff management area.</p>
    <Link className="mt-5 inline-flex rounded-full bg-blue px-5 py-3 font-bold text-white hover:bg-blue-dark" href="/management">Open management</Link>
   </section>}
  </div>
 </main>;
}
