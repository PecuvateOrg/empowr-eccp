import { can } from "@/lib/auth";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Read-only until staging migration and verified staff role mapping are complete.
// Never return safeguarding messages from the general inbox.
export async function GET() {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
 if (!can(actor, "view_management")) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
 if (process.env.ECCP_MESSAGING_ENABLED !== "true")
   return NextResponse.json({ error: "Messaging is not enabled" }, { status: 503 });
 const { data, error } = await getDb().from("message_conversations")
  .select("id,category,title,assigned_staff_id,priority,status,created_at,updated_at")
  .eq("kind", "staff_inbox")
  .neq("category", "safeguarding")
  .order("updated_at", { ascending: false }).limit(100);
 if (error) return NextResponse.json({ error: "Inbox unavailable" }, { status: 503 });
 return NextResponse.json({ conversations: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
