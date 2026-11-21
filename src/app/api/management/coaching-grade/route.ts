import { NextResponse } from "next/server";
import { can, getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { coachingGradeEnabled, parseGradeRequest } from "@/lib/coaching-grade";

// Admin-only. The grade change and its audit row are one transaction inside
// eccp.set_coaching_grade, which also re-checks the actor and target.
export async function PATCH(request: Request) {
  if (!coachingGradeEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const actor = await getCurrentCoach();
  if (!actor) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(actor, "change_roles")) return NextResponse.json({ error: "Not authorised" }, { status: 403 });

  const parsed = parseGradeRequest(await request.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "Invalid coach or coaching grade" }, { status: 400 });

  const { error } = await getDb().rpc("set_coaching_grade", {
    p_actor_id: actor.id,
    p_coach_id: parsed.coachId,
    p_grade: parsed.grade,
  });
  if (error) {
    if (error.code === "ECCP1") return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    if (error.code === "ECCP2") return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    if (error.code === "ECCP3") return NextResponse.json({ error: "Invalid coaching grade" }, { status: 400 });
    console.error("[coaching-grade] update failed", error.code, error.message);
    return NextResponse.json({ error: "Unable to update coaching grade" }, { status: 500 });
  }
  return NextResponse.json({ grade: parsed.grade });
}
