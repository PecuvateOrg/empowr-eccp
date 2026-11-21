import { notFound } from "next/navigation";
import Link from "next/link";
export default function StaffMessagesPage() {
 if (process.env.ECCP_MESSAGING_ENABLED !== "true") notFound();
 return <main className="py-10">
  <p className="text-xs font-black uppercase tracking-widest text-red-dark">ECCP Management</p>
  <h1 className="mt-3 text-3xl font-bold text-ink">Staff Inbox</h1>
  <p className="mt-2 max-w-2xl text-muted">Coach enquiries will be routed here for authorized staff to claim, assign and respond to. Routine messages will not be assigned automatically to the founder or Shaun.</p>
  <section className="mt-8 rounded-2xl border border-border bg-card p-6">
   <h2 className="text-xl font-bold">Conversations</h2>
   <p role="status" className="mt-3 rounded-lg bg-warm-white p-3 text-sm font-semibold">Inbox not yet connected. No messages can be sent, received or assigned from this page.</p>
   <p className="mt-3 text-sm text-muted">Planned: unassigned queue, staff ownership, status, priority, unread messages and private internal notes.</p>
  </section>
  <section className="mt-6 rounded-2xl border border-border bg-card p-6">
   <h2 className="text-xl font-bold">Group conversations</h2>
   <p className="mt-2 text-sm text-muted">Session and project groups will be available after permissions and membership controls are verified.</p>
  </section>
  <p className="mt-6 text-sm text-muted">Safeguarding messages require a separate restricted inbox and will not be displayed in the general queue.</p>
  <Link href="/management" className="mt-6 inline-block font-semibold text-blue underline">Back to Management</Link>
 </main>;
}
