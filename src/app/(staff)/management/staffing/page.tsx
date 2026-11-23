import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { efn } from "@/lib/efn-client";
import { efnMessage, londonDate, shiftScreensEnabled } from "@/lib/efn-staffing";
import { StaffingBoard, type StaffSession } from "./StaffingBoard";

export const dynamic = "force-dynamic";

// Staff scheduling over EFN (the engine). Staff and admins; EFN re-checks the role on every write.
export default async function StaffingPage() {
  if (!shiftScreensEnabled()) notFound();
  const staff = await getCurrentCoach();
  if (!staff || !can(staff, "view_management")) redirect("/course");
  const [r, coaches] = await Promise.all([
    efn(`/staff/sessions?from=${londonDate()}&to=${londonDate(56)}`, { staffId: staff.id }),
    getDb().from("coaches").select("id, full_name, coaching_grade").eq("admin_role", "coach").order("full_name"),
  ]);
  const sessions = Array.isArray(r.data.sessions) ? r.data.sessions as StaffSession[] : null;
  return <main className="min-w-0">
    <Link href="/management" className="text-sm font-bold text-blue">← Management</Link>
    <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">Staffing</h1>
    <p className="mt-2 text-sm text-muted">The next 8 weeks of sessions from Members. Times are UK time. Grade, certificate, age and hours are checked by EFN when you assign.</p>
    {sessions ? <StaffingBoard sessions={sessions} coaches={(coaches.data ?? []).map(c => ({ id: c.id, name: c.full_name, grade: c.coaching_grade }))} />
      : <p role="alert" className="mt-6 rounded-lg border border-red bg-red/10 p-3 text-sm font-semibold text-ink">{efnMessage(r.status, r.data.error)}</p>}
  </main>;
}
