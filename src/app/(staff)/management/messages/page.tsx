import { notFound } from "next/navigation";
import Link from "next/link";
import { can, getCurrentCoach } from "@/lib/auth";
import { StaffMessaging } from "@/components/StaffMessaging";
import { uuid } from "@/lib/messaging-write";

export default async function StaffMessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
 if (process.env.ECCP_MESSAGING_ENABLED !== "true") notFound();
 const actor=await getCurrentCoach();
 if (!actor || !can(actor,"view_management")) notFound();
 return <main>
  <p className="text-xs font-black uppercase tracking-widest text-red-dark">ECCP Management</p>
  <h1 className="mt-3 text-ink text-xl font-bold tracking-tight sm:text-2xl">Staff Inbox</h1>
  <p className="mt-2 max-w-2xl text-muted">Review coach enquiries, respond as the staff team and keep private internal notes. Only administrators can change priority and status.</p>
  <StaffMessaging canManage={can(actor,"change_roles")} initialSelected={uuid((await searchParams).c) ? (await searchParams).c! : null} />
  <section className="mt-6 rounded-2xl border border-border bg-card p-6">
   <h2 className="text-xl font-bold">Group conversations</h2>
   <p className="mt-2 text-sm text-muted">Session and project groups will be available after permissions and membership controls are verified.</p>
  </section>
  <p className="mt-6 text-sm text-muted">Safeguarding messages use a separate restricted inbox and are never displayed in this general queue.</p>
  <Link href="/management" className="mt-6 inline-block font-semibold text-blue underline">Back to Management</Link>
 </main>;
}
