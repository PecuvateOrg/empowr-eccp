import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Read-only and feature-gated: do not expose message bodies or internal staff notes.
// Only return conversations in which the authenticated coach is a participant.
export async function GET() {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
 if (process.env.ECCP_MESSAGING_ENABLED !== "true")
   return NextResponse.json({ error: "Messaging is not enabled" }, { status: 503 });
 const db = getDb();
 const { data: memberships, error: membershipError } = await db.from("message_participants")
   .select("conversation_id").eq("coach_id", actor.id).limit(200);
 if (membershipError) return NextResponse.json({ error: "Messages unavailable" }, { status: 503 });
 const ids = (memberships ?? []).map((row) => row.conversation_id);
 if (!ids.length) return NextResponse.json({ conversations: [] }, { headers: { "Cache-Control": "no-store" } });
 const { data, error } = await db.from("message_conversations")
   .select("id,kind,category,title,status,updated_at")
   .in("id", ids).neq("kind", "safeguarding").order("updated_at", { ascending: false }).limit(100);
 if (error) return NextResponse.json({ error: "Messages unavailable" }, { status: 503 });
 return NextResponse.json({ conversations: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
