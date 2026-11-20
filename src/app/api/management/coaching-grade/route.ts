import { NextResponse } from "next/server";
import { can, getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { isCoachingGrade } from "@/lib/coaching-grade";

export async function PATCH(request: Request) {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
 if (!can(actor, "change_roles")) return NextResponse.json({ error: "Not authorised" }, { status: 403 });
 const body = await request.json().catch(() => null);
 const coachId = body?.coachId;
 const grade = body?.grade;
 if (typeof coachId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(coachId) || !(grade === null || isCoachingGrade(grade))) {
  return NextResponse.json({ error: "Invalid coach or coaching grade" }, { status: 400 });
 }
 const db = getDb();
 const { data: existing, error: readError } = await db.from("coaches").select("id, coaching_grade").eq("id", coachId).maybeSingle();
 if (readError) return NextResponse.json({ error: "Coaching grade storage is not ready" }, { status: 503 });
 if (!existing) return NextResponse.json({ error: "Coach not found" }, { status: 404 });
 if (existing.coaching_grade === grade) return NextResponse.json({ grade });
 const { error: updateError } = await db.from("coaches").update({ coaching_grade: grade }).eq("id", coachId).eq("coaching_grade", existing.coaching_grade ?? null);
 if (updateError) return NextResponse.json({ error: "Unable to update coaching grade" }, { status: 500 });
 const { error: auditError } = await db.from("coaching_grade_audit").insert({ coach_id: coachId, changed_by: actor.id, previous_grade: existing.coaching_grade, new_grade: grade });
 if (auditError) {
  console.error("[coaching-grade] audit failed", auditError);
  return NextResponse.json({ error: "Grade changed but audit recording failed; contact an administrator" }, { status: 500 });
 }
 return NextResponse.json({ grade });
}
