import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
 const coach = await getCurrentCoach();
 if (!coach) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const { id } = await context.params;
 if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
 let body: unknown;
 try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
 if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
 const { decision, reason } = body as Record<string, unknown>;
 if (!["accept", "decline", "withdraw"].includes(String(decision))) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
 if (decision === "withdraw" && (typeof reason !== "string" || !reason.trim() || reason.length > 500))
   return NextResponse.json({ error: "Withdrawal reason required (maximum 500 characters)" }, { status: 400 });
 if (decision === "decline" && reason !== undefined && (typeof reason !== "string" || reason.length > 500))
   return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
 // Atomic database transition enforces coach ownership and current status under row lock.
 // Never use client-supplied coachId, status, or urgency.
 const { data, error } = await getDb().rpc("coach_decide_assignment", {
  p_coach_id: coach.id, p_assignment_id: id, p_decision: decision,
  p_reason: typeof reason === "string" ? reason.trim() : null,
 });
 if (error) return NextResponse.json({ error: "Could not apply decision; check assignment status or staging migration" }, { status: 409 });
 return NextResponse.json({ ok: true, result: data });
}
