import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { listCoachAssignments } from "@/lib/coach-assignment-storage";
export async function GET() {
 const coach = await getCurrentCoach();
 if (!coach) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 try { return NextResponse.json({ assignments: await listCoachAssignments(coach.id) }); }
 catch { return NextResponse.json({ error: "Scheduling storage unavailable" }, { status: 503 }); }
}
