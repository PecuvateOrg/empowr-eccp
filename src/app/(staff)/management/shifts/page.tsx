import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { staffingEnabled } from "@/lib/staffing-admin";
import { readStaffingBoard } from "@/lib/staffing-admin-reader";
import { ShiftBoard } from "./ShiftBoard";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  if (!staffingEnabled()) notFound();
  const coach = await getCurrentCoach();
  if (!coach || !can(coach, "manage_scheduling")) redirect("/management");
  const board = await readStaffingBoard();
  return <main className="min-w-0 py-8">
    <Link href="/management" className="text-sm font-bold text-blue">← Management</Link>
    <h1 className="mt-4 text-3xl font-black">Shifts</h1>
    <p className="mt-2 text-sm text-muted">Upcoming sessions from Members and the coaches on them. Times are UK time.</p>
    <ShiftBoard sessions={board.sessions} coaches={board.coaches} />
  </main>;
}
