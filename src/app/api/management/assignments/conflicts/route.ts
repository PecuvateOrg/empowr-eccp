import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { listStaffAssignments } from "@/lib/coach-assignment-storage";
import { detectAvailabilityConflicts } from "@/lib/coach-session-assignments";
import type { CoachAvailability, Weekday } from "@/lib/coach-availability";
export async function GET() {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!actor.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 try {
  const assignments = await listStaffAssignments();
  const db = getDb();
  const conflicts: ReturnType<typeof detectAvailabilityConflicts> = [];
  for (const coachId of [...new Set(assignments.filter((a) => ["offered","accepted"].includes(a.status)).map((a) => a.coachId))]) {
   const [weekly, exceptions] = await Promise.all([
    db.from("coach_weekly_availability").select("weekday,start_time,end_time").eq("coach_id",coachId),
    db.from("coach_availability_exceptions").select("exception_date,available,start_time,end_time").eq("coach_id",coachId),
   ]);
   if (weekly.error || exceptions.error) throw new Error("Availability unavailable");
   const availability: CoachAvailability = {
    weekly: (weekly.data ?? []).map((w) => ({ weekday: w.weekday as Weekday, start: w.start_time.slice(0,5), end: w.end_time.slice(0,5) })),
    exceptions: (exceptions.data ?? []).map((e) => ({ date: e.exception_date, available: e.available, ...(e.available ? { start: e.start_time.slice(0,5), end: e.end_time.slice(0,5) } : {}) })),
   };
   conflicts.push(...detectAvailabilityConflicts(availability, assignments, coachId));
  }
  return NextResponse.json({ conflicts });
 } catch { return NextResponse.json({ error: "Conflict preview unavailable" }, { status: 503 }); }
}
