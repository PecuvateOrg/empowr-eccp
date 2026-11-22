import { NextResponse } from "next/server";
import { can, getCurrentCoach } from "@/lib/auth";

// Fail closed until an approved transactional reminder reservation,
// recheck and audited delivery implementation is available.
export async function POST() {
  const actor = await getCurrentCoach();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!can(actor, "review_compliance")) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  return NextResponse.json(
    { error: "Reminder delivery is not enabled until database approval and audit integration are complete" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
