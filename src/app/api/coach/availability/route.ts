import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { validateAvailability, type CoachAvailability } from "@/lib/coach-availability";

export async function GET() {
  const coach = await getCurrentCoach();
  if (!coach) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const [weekly, exceptions] = await Promise.all([
    db.from("coach_weekly_availability").select("weekday,start_time,end_time").eq("coach_id", coach.id),
    db.from("coach_availability_exceptions").select("exception_date,available,start_time,end_time").eq("coach_id", coach.id),
  ]);
  if (weekly.error || exceptions.error) return NextResponse.json({ error: "Availability storage unavailable" }, { status: 503 });
  return NextResponse.json({ availability: {
    weekly: (weekly.data ?? []).map((w) => ({ weekday: w.weekday, start: w.start_time.slice(0, 5), end: w.end_time.slice(0, 5) })),
    exceptions: (exceptions.data ?? []).map((e) => ({
      date: e.exception_date, available: e.available,
      ...(e.available ? { start: e.start_time.slice(0, 5), end: e.end_time.slice(0, 5) } : {}),
    })),
  } });
}

export async function PUT(request: Request) {
  const coach = await getCurrentCoach();
  if (!coach) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Invalid availability" }, { status: 400 });
  const raw = payload as Record<string, unknown>;
  if (!Array.isArray(raw.weekly) || !Array.isArray(raw.exceptions) ||
      raw.weekly.length > 70 || raw.exceptions.length > 366) {
    return NextResponse.json({ error: "Invalid availability size" }, { status: 400 });
  }
  const availability = { weekly: raw.weekly, exceptions: raw.exceptions } as CoachAvailability;
  const errors = validateAvailability(availability);
  if (errors.length) return NextResponse.json({ errors }, { status: 400 });

  // Until a database RPC transaction is reviewed, avoid pretending multi-table writes are atomic.
  // A single RPC can replace both sets and roll back completely on failure.
  const { error } = await getDb().rpc("replace_coach_availability", {
    p_coach_id: coach.id,
    p_weekly: availability.weekly.map((w) => ({ weekday: w.weekday, start: w.start, end: w.end })),
    p_exceptions: availability.exceptions.map((e) => ({
      date: e.date, available: e.available,
      start: e.available ? e.start : null, end: e.available ? e.end : null,
    })),
  });
  if (error) return NextResponse.json({ error: "Availability saving is not enabled yet" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
