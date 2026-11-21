import { can, getCurrentCoach } from "@/lib/auth";
import { assignableStaff, staffQueue } from "@/lib/staff-messages";
import { NextResponse } from "next/server";

// Staff Inbox queue: staff-inbox conversations only, never safeguarding.
// Waiting-for-staff first. Admins also get the people they can assign to.
export async function GET() {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
 if (!can(actor, "view_management")) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
 if (process.env.ECCP_MESSAGING_ENABLED !== "true")
   return NextResponse.json({ error: "Messaging is not enabled" }, { status: 503 });
 try {
  const [conversations, staff] = await Promise.all([
   staffQueue(), can(actor, "change_roles") ? assignableStaff() : Promise.resolve([]),
  ]);
  return NextResponse.json({ conversations, staff }, { headers: { "Cache-Control": "no-store" } });
 } catch (error) {
  console.error("[staff-inbox] queue failed", error);
  return NextResponse.json({ error: "Inbox unavailable" }, { status: 503 });
 }
}
