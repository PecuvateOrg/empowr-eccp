import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCoach } from "@/lib/auth";
import { openCoachThread } from "@/lib/coach-messages";
import { categoryLabel, coachStatusLabel } from "@/lib/coach-messages-view";
import { uuid } from "@/lib/messaging-write";
import { CoachReplyForm } from "@/components/CoachReplyForm";

export const dynamic = "force-dynamic";

export default async function CoachConversationPage({ params }: { params: Promise<{ id: string }> }) {
 if (process.env.ECCP_MESSAGING_ENABLED !== "true") notFound();
 const coach = await getCurrentCoach();
 if (!coach) redirect("/login");
 const { id } = await params;
 if (!uuid(id)) notFound();
 const thread = await openCoachThread(coach.id, id);
 if (!thread) notFound();
 return <main className="py-10">
  <Link href="/messages" className="text-sm font-semibold text-blue hover:underline">Back to my messages</Link>
  <h1 className="mt-6 break-words text-2xl font-bold text-ink sm:text-3xl">{thread.title}</h1>
  <p className="mt-2 text-sm text-muted">{categoryLabel(thread.category)} · {coachStatusLabel(thread.status)}</p>
  <ol className="mt-6 space-y-3" aria-label="Messages">
   {thread.entries.map(e => <li key={e.id} className={"rounded-xl border p-4 " + (e.mine ? "border-border bg-card sm:ml-10" : "border-blue/30 bg-blue/5 sm:mr-10")}>
    <p className="text-xs font-bold text-muted">{e.author} · {new Date(e.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" })}</p>
    <p className="mt-2 whitespace-pre-wrap break-words">{e.body}</p>
   </li>)}
  </ol>
  {thread.status === "resolved" && <p className="mt-6 text-sm text-muted">This enquiry is resolved. Replying reopens it for the staff team.</p>}
  <CoachReplyForm conversationId={thread.id} />
 </main>;
}
