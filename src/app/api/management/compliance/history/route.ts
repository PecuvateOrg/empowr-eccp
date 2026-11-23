import { NextResponse } from "next/server";
import { can, getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Read-only audit history. No direct browser access to the service-role schema.
export async function GET(request: Request) {
  const actor = await getCurrentCoach();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!can(actor, "review_compliance")) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  if (process.env.ECCP_COMPLIANCE_REMINDERS_ENABLED !== "true")
    return NextResponse.json({ error: "Compliance reminders are not enabled" }, { status: 503 });
  const coachId = new URL(request.url).searchParams.get("coachId");
  if (!coachId || !uuid.test(coachId))
    return NextResponse.json({ error: "Valid coachId required" }, { status: 400 });
  try {
    const { data, error } = await getDb().from("coach_compliance_reminder_events")
      .select("id,requirement,completion_deadline,cadence,delivery_status,created_at,delivered_at")
      .eq("coach_id", coachId).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ events: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[compliance-reminders] history unavailable", error);
    return NextResponse.json({ error: "Reminder history unavailable" }, { status: 503 });
  }
}
