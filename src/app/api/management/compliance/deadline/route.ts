import { NextResponse } from "next/server";
import { can, getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { isCalendarDate } from "@/lib/compliance-reminder-rules";

const requirements = new Set(["safeguarding", "first_aid", "dbs", "training", "qualification"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// A reviewed database RPC must atomically update the deadline and audit entry.
// The API cannot silently update a deadline without its audit trail.
export async function POST(request: Request) {
  const actor = await getCurrentCoach();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!can(actor, "review_compliance")) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  if (process.env.ECCP_COMPLIANCE_REMINDERS_ENABLED !== "true")
    return NextResponse.json({ error: "Compliance reminders are not enabled" }, { status: 503 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.coachId !== "string" || !uuid.test(input.coachId) ||
      typeof input.requirement !== "string" || !requirements.has(input.requirement) ||
      typeof input.deadline !== "string" || !isCalendarDate(input.deadline))
    return NextResponse.json({ error: "Invalid coach, requirement or deadline" }, { status: 400 });
  try {
    const { data, error } = await getDb().rpc("compliance_set_deadline", {
      p_actor_id: actor.id,
      p_coach_id: input.coachId,
      p_requirement: input.requirement,
      p_deadline: input.deadline,
    });
    if (error) throw error;
    return NextResponse.json({ updated: true, result: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[compliance-reminders] deadline update failed", error);
    return NextResponse.json({ error: "Deadline could not be saved" }, { status: 503 });
  }
}
