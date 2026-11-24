import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { trustedMessagingOrigin } from "@/lib/messaging-write";
import { efn } from "@/lib/efn-client";
import { COACH_ACTIONS, checkInEnabled, efnMessage, isUuid, shiftScreensEnabled } from "@/lib/efn-staffing";

const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// A coach answers or withdraws from their own shift. EFN checks the shift is theirs.
// POST /api/shifts/:id/response {response: accept|decline, scope?: date|series} · POST /api/shifts/:id/withdraw {reason}
// POST /api/shifts/:id/check-in · POST /api/shifts/:id/confirm-attendance {reason}
export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  if (!shiftScreensEnabled()) return reply({ error: "Not found" }, 404);
  if (!trustedMessagingOrigin(request)) return reply({ error: "Invalid request origin" }, 403);
  const coach = await getCurrentCoach();
  if (!coach) return reply({ error: "Please sign in again." }, 401);
  const { id, action } = await params;
  if (!isUuid(id) || !COACH_ACTIONS.some(a => a === action)) return reply({ error: "Shift not found." }, 404);
  if ((action === "check-in" || action === "confirm-attendance") && !checkInEnabled()) return reply({ error: "Shift not found." }, 404);
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const body = action === "response" ? { response: input?.response, scope: input?.scope === "series" ? "series" : "date" } : { reason: input?.reason };
  const r = await efn(`/shifts/${id}/${action}`, { coachId: coach.id }, { method: "POST", body });
  return r.status < 300 ? reply(r.data, 200) : reply({ error: efnMessage(r.status, r.data.error) }, r.status >= 500 ? 503 : r.status);
}
