import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { isAvailable, type CoachAvailability, type Weekday } from "@/lib/coach-availability";
import { listStaffAssignments } from "@/lib/coach-assignment-storage";

export async function GET(request: Request) {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!actor.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 const params = new URL(request.url).searchParams;
 const date = params.get("date") ?? "";
 const start = params.get("start") ?? "";
 const end = params.get("end") ?? "";
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
  !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) || start >= end)
  return NextResponse.json({ error: "Invalid session date or time" }, { status: 400 });
 const parsed = new Date(date + "T12:00:00Z");
 if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date)
  return NextResponse.json({ error: "Invalid date" }, { status: 400 });
 const weekday = ((parsed.getUTCDay() + 6) % 7) as Weekday;
 try {
  const db = getDb();
  const [directory, assignments] = await Promise.all([
   db.from("coaches").select("id,full_name,email").order("full_name").limit(500),
   listStaffAssignments(),
  ]);
  if (directory.error) throw new Error("Directory unavailable");
  const coaches = await Promise.all((directory.data ?? []).map(async (coach) => {
   const [weekly, exceptions] = await Promise.all([
    db.from("coach_weekly_availability").select("weekday,start_time,end_time").eq("coach_id",coach.id),
    db.from("coach_availability_exceptions").select("exception_date,available,start_time,end_time").eq("coach_id",coach.id),
   ]);
   if (weekly.error || exceptions.error) throw new Error("Availability unavailable");
   const availability: CoachAvailability = {
    weekly: (weekly.data ?? []).map((w) => ({ weekday: w.weekday as Weekday, start: w.start_time.slice(0,5), end: w.end_time.slice(0,5) })),
    exceptions: (exceptions.data ?? []).map((e) => ({
     date: e.exception_date, available: e.available,
     ...(e.available ? { start: e.start_time.slice(0,5), end: e.end_time.slice(0,5) } : {}),
    })),
   };
   const available = isAvailable(availability, date, weekday, start, end);
   const overlap = assignments.some((a) => a.coachId === coach.id &&
    ["offered","accepted"].includes(a.status) && a.date === date && a.start < end && a.end > start);
   return { id: coach.id, name: coach.full_name, available, overlap,
    status: overlap ? "Already assigned at this time" : available ? "Available" : "Not marked available" };
  }));
  return NextResponse.json({ coaches, note: "Availability and overlapping ECCP assignments only. Coaching grade and safeguarding eligibility are not yet verified." });
 } catch {
  return NextResponse.json({ error: "Coach availability preview unavailable" }, { status: 503 });
 }
}
