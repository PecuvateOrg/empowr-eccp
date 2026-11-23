import { notFound } from "next/navigation";
import Link from "next/link";
import { CoachMessaging } from "@/components/CoachMessaging";

export default function CoachMessagesPage() {
 if (process.env.ECCP_MESSAGING_ENABLED !== "true") notFound();
 return <main>
  <p className="text-xs font-black uppercase tracking-widest text-red-dark">Coach Portal</p>
  <h1 className="mt-3 text-ink text-xl font-bold tracking-tight sm:text-2xl">My Messages</h1>
  <p className="mt-2 max-w-2xl text-muted">Send a private enquiry to the ECCP staff team and track its status.</p>
  <CoachMessaging />
  <section className="mt-6 rounded-2xl border border-border bg-card p-6" aria-labelledby="groups-title">
   <h2 id="groups-title" className="text-xl font-bold">My session and team groups</h2>
   <p className="mt-2 text-sm text-muted">Only groups you are invited to will be visible. Group chat is not available yet.</p>
  </section>
  <Link href="/course" className="mt-6 inline-block font-semibold text-blue underline">Back to Coach Portal</Link>
 </main>;
}
