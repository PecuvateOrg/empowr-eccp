import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { listStaffAssignments } from "@/lib/coach-assignment-storage";
export async function GET() {
 const coach = await getCurrentCoach();
 if (!coach) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!coach.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 try { return NextResponse.json({ assignments: await listStaffAssignments() }); }
 catch { return NextResponse.json({ error: "Scheduling storage unavailable" }, { status: 503 }); }
}
export async function POST(request: Request) {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!actor.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 let raw: unknown;
 try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
 if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NextResponse.json({ error: "Invalid assignment" }, { status: 400 });
 const value = raw as Record<string,unknown>;
 if (typeof value.coachId !== "string" || !/^[0-9a-f-]{36}$/i.test(value.coachId) ||
  typeof value.sessionId !== "string" || !value.sessionId.trim() || value.sessionId.length > 150 ||
  typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
  typeof value.start !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.start) ||
  typeof value.end !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.end) ||
  value.start >= value.end) return NextResponse.json({ error: "Invalid session details" }, { status: 400 });
 // Requires a trusted timezone-aware session start instant, not an inferred offset.
 // The RPC checks the instant matches the London local session date/time.
 if (typeof value.startAtUtc !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value.startAtUtc) ||
  !Number.isFinite(Date.parse(value.startAtUtc))) return NextResponse.json({ error: "Valid UTC session start required" }, { status: 400 });
 // Do not permit live offers until authoritative session, activation, grade and compliance
 // evidence can be checked server-side and rechecked atomically by the assignment RPC.
 return NextResponse.json({ error: "Assignment offers are paused pending verified session and coach eligibility integration", code: "ELIGIBILITY_NOT_CONFIGURED" }, { status: 503 });
 /* Pending Shaun-approved staging integration:
 const { data, error } = await getDb().rpc("staff_offer_coach_assignment", {
  p_coach_id: value.coachId, p_session_id: value.sessionId.trim(),
  p_session_date: value.date, p_start_time: value.start, p_end_time: value.end,
  p_start_at: value.startAtUtc,
 });
 if (error) return NextResponse.json({ error: "Assignment could not be offered; staging integration may be pending" }, { status: 409 });
 return NextResponse.json({ assignment: data }, { status: 201 });
 */
}
