import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";

export async function GET() {
 const actor = await getCurrentCoach();
 if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!actor.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 const { data, error } = await getDb().from("coaches")
  .select("id,full_name,email").order("full_name", { ascending: true }).limit(500);
 if (error) return NextResponse.json({ error: "Coach directory unavailable" }, { status: 503 });
 return NextResponse.json({ coaches: data ?? [] });
}
