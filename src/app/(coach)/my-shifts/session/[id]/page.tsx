import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { efn } from "@/lib/efn-client";
import { checkInEnabled, efnMessage, isUuid } from "@/lib/efn-staffing";
import { TeamAttendance, type TeamMember } from "./TeamAttendance";

export const dynamic = "force-dynamic";

// The Head Coach's view of their session: who has checked in, and marking the others. EFN checks
// the caller is this session's Head Coach on every read and write.
export default async function SessionTeamPage({ params }: { params: Promise<{ id: string }> }) {
  if (!checkInEnabled()) notFound();
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const r = await efn(`/sessions/${id}/team`, { coachId: coach.id });
  const team = Array.isArray(r.data.team) ? r.data.team as TeamMember[] : null;
  return <main className="min-w-0">
    <Link href="/my-shifts" className="text-sm font-bold text-blue">← My Shifts</Link>
    <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">Team check-in</h1>
    <p className="mt-2 text-sm text-muted">As Head Coach you can confirm attendance for anyone on this session, including your own missed check-in. A reason is needed and is recorded.</p>
    {team ? <TeamAttendance sessionId={id} team={team} />
      : <p role="alert" className="mt-6 rounded-lg border border-red bg-red/10 p-3 text-sm font-semibold text-ink">{efnMessage(r.status, r.data.error)}</p>}
  </main>;
}
