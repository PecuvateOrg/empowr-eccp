import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { trustedMessagingOrigin } from "@/lib/messaging-write";
import { efn } from "@/lib/efn-client";
import { checkInEnabled, efnMessage, isUuid } from "@/lib/efn-staffing";

const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// POST /api/sessions/:id/attendance { taskId, value: attended|absent, reason } — the session's Head
// Coach marks a coach. EFN checks the caller holds the Head Coach shift on this session.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkInEnabled()) return reply({ error: "Not found" }, 404);
  if (!trustedMessagingOrigin(request)) return reply({ error: "Invalid request origin" }, 403);
  const coach = await getCurrentCoach();
  if (!coach) return reply({ error: "Please sign in again." }, 401);
  const { id } = await params;
  if (!isUuid(id)) return reply({ error: "Session not found." }, 404);
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const body = { taskId: input?.taskId, value: input?.value, reason: input?.reason };
  const r = await efn(`/sessions/${id}/attendance`, { coachId: coach.id }, { method: "POST", body });
  return r.status < 300 ? reply(r.data, 200) : reply({ error: efnMessage(r.status, r.data.error) }, r.status >= 500 ? 503 : r.status);
}
