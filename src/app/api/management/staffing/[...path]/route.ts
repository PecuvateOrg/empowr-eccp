import { NextResponse } from "next/server";
import { can, getCurrentCoach } from "@/lib/auth";
import { trustedMessagingOrigin } from "@/lib/messaging-write";
import { efn } from "@/lib/efn-client";
import { efnMessage, shiftScreensEnabled, skippedText, staffPath } from "@/lib/efn-staffing";
import { alertCoaches } from "@/lib/push";

const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Staff scheduling actions, forwarded to EFN with the signed-in staff member's id. EFN re-reads
// their role itself: staff may assign; only admins approve extra places (owner 2026-11-21).
// Allowed: sessions/:id/positions, sessions/:id/review, positions/:id/assign, positions/:id/cover.
export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!shiftScreensEnabled()) return reply({ error: "Not found" }, 404);
  if (!trustedMessagingOrigin(request)) return reply({ error: "Invalid request origin" }, 403);
  const staff = await getCurrentCoach();
  if (!staff) return reply({ error: "Please sign in again." }, 401);
  if (!can(staff, "view_management")) return reply({ error: "Only Empowr staff can do this." }, 403);
  const path = staffPath((await params).path);
  if (!path) return reply({ error: "Not found" }, 404);
  const input = await request.json().catch(() => ({}));
  const r = await efn(path, { staffId: staff.id }, { method: "POST", body: input && typeof input === "object" ? input : {} });
  if (r.status >= 300) return reply({ error: efnMessage(r.status, r.data.error) }, r.status >= 500 ? 503 : r.status);
  // A coach put on a shift here hears about it (if they have shift alerts on). Assignments made
  // directly in EFN don't pass through ECCP, so they don't alert. Never throws.
  const coachId = (input as { coachId?: unknown })?.coachId;
  if (/\/(assign|cover)$/.test(path) && typeof coachId === "string") {
    await alertCoaches([coachId], "shifts", { title: "New shift", body: "You've been put on a session. Open My Shifts to see it.", url: "/my-shifts" });
  }
  const skipped = Array.isArray(r.data.skipped) ? (r.data.skipped as { date: string; reason: string }[]).map(skippedText) : [];
  return reply({ ...r.data, skipped }, 200);
}
