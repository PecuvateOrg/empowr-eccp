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
