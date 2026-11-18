import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { listAssignableSessions } from "@/lib/assignable-sessions";

export async function GET() {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!actor.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 const sessions = await listAssignableSessions();
 if (sessions === null) return NextResponse.json({
  error: "The authoritative session catalogue is not connected yet.",
  code: "SESSION_SOURCE_NOT_CONFIGURED",
 }, { status: 503 });
 return NextResponse.json({ sessions });
}
