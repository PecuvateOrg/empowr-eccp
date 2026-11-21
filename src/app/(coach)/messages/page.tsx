import { notFound } from "next/navigation";
import Link from "next/link";
export default function CoachMessagesPage() {
 if (process.env.ECCP_MESSAGING_ENABLED !== "true") notFound();
 return <main className="py-10">
  <p className="text-xs font-black uppercase tracking-widest text-red-dark">Coach Portal</p>
  <h1 className="mt-3 text-3xl font-bold text-ink">My Messages</h1>
  <p className="mt-2 max-w-2xl text-muted">Private conversations with the ECCP staff team and groups for your assigned sessions will appear here.</p>
  <section className="mt-8 rounded-2xl border border-border bg-card p-6" aria-labelledby="private-title">
   <h2 id="private-title" className="text-xl font-bold">Message the staff team</h2>
   <p className="mt-2 text-sm text-muted">Your message will go to the shared Staff Inbox, not directly to the founder or Shaun. Staff will assign it to the right person.</p>
   <p role="status" className="mt-4 rounded-lg bg-warm-white p-3 text-sm font-semibold">Messaging is being prepared. Sending messages is not available yet.</p>
  </section>
  <section className="mt-6 rounded-2xl border border-border bg-card p-6" aria-labelledby="groups-title">
   <h2 id="groups-title" className="text-xl font-bold">My session and team groups</h2>
   <p className="mt-2 text-sm text-muted">Only groups you are invited to will be visible. Group chat is not available yet.</p>
  </section>
  <Link href="/course" className="mt-6 inline-block font-semibold text-blue underline">Back to Coach Portal</Link>
 </main>;
}
