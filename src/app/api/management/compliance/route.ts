import { NextResponse } from "next/server";
import { can, getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";

// Disabled until the reviewed eccp schema is deployed. No fictional records.
export async function GET(request: Request) {
  const actor = await getCurrentCoach();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!can(actor, "view_management")) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  if (process.env.ECCP_COMPLIANCE_REMINDERS_ENABLED !== "true")
    return NextResponse.json({ error: "Compliance reminders are not enabled" }, { status: 503 });
  const coachId = new URL(request.url).searchParams.get("coachId");
  if (!coachId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(coachId))
    return NextResponse.json({ error: "Valid coachId required" }, { status: 400 });
  try {
    const db = getDb();
    const { data: coach, error: coachError } = await db.from("coaches")
      .select("id,full_name").eq("id", coachId).maybeSingle();
    if (coachError) throw coachError;
    if (!coach) return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    const { data, error } = await db.from("coach_compliance_deadlines")
      .select("requirement,completion_status,completion_deadline")
      .eq("coach_id", coachId).order("requirement");
    if (error) throw error;
    return NextResponse.json({
      coach: { id: coach.id, name: coach.full_name },
      items: (data ?? []).map(item => ({
        requirement: item.requirement, status: item.completion_status,
        deadline: item.completion_deadline,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[compliance-reminders] read failed", error);
    return NextResponse.json({ error: "Compliance records unavailable" }, { status: 503 });
  }
}
