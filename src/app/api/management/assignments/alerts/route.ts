import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
export async function GET() {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!actor.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 const { data, error } = await getDb().from("coach_assignment_alert_outbox")
  .select("id,assignment_id,coach_id,alert_type,status,created_at")
  .order("created_at", { ascending: false }).limit(100);
 if (error) return NextResponse.json({ error: "Alert queue unavailable" }, { status: 503 });
 return NextResponse.json({ alerts: data ?? [] });
}
