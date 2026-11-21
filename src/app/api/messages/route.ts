import { getCurrentCoach } from "@/lib/auth";
import { listCoachConversations } from "@/lib/coach-messages";
import { NextResponse } from "next/server";

// The signed-in coach's own conversations (participant only, never
// safeguarding), with an unread flag. No message bodies.
export async function GET() {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
 if (process.env.ECCP_MESSAGING_ENABLED !== "true")
   return NextResponse.json({ error: "Messaging is not enabled" }, { status: 503 });
 try {
  const conversations = await listCoachConversations(actor.id);
  return NextResponse.json({ conversations }, { headers: { "Cache-Control": "no-store" } });
 } catch (error) {
  console.error("[messages] list failed", error);
  return NextResponse.json({ error: "Messages unavailable" }, { status: 503 });
 }
}
