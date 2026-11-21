import { NextResponse } from "next/server";
import { staffQueue } from "@/lib/staff-messages";
import { queueSecretValid } from "@/lib/messaging-alerts";

// Server-to-server feed for the Empowr Dashboard work list (same contract as
// Members' /api/staff-queue): coach enquiries WAITING FOR STAFF only. No
// internal notes, no safeguarding, no coach email. Staff reply in ECCP, so the
// Dashboard links there; it never writes back. The item id is the coach's
// latest message, so Done in the Dashboard hides that message only and a new
// coach message shows up again.
const OPEN_URL = "https://eccp.empowrcic.org/management/messages";

export async function GET(request: Request) {
 if (!queueSecretValid(request.headers.get("x-staff-queue-secret"), process.env.ECCP_QUEUE_SECRET))
  return NextResponse.json({ error: "Not authorised" }, { status: 401 });
 if (process.env.ECCP_MESSAGING_ENABLED !== "true")
  return NextResponse.json({ messages: [] }, { headers: { "Cache-Control": "no-store" } });
 try {
  const waiting = (await staffQueue()).filter(c => c.waitingForStaff && c.lastPublicId);
  const messages = waiting.map(c => ({
   id: c.lastPublicId!, conversationId: c.id, created_at: c.lastPublicAt, name: c.coachName,
   topic: c.title, body: c.lastPublicBody ?? "", url: `${OPEN_URL}?c=${c.id}`,
  }));
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
 } catch (error) {
  console.error("[staff-queue] failed", error);
  return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
 }
}
