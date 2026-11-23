import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { trustedMessagingOrigin } from "@/lib/messaging-write";
import { parseSubscription, pushEnabled, removeSubscription, saveSubscription, sendTest } from "@/lib/push";

// This device's alerts, for the signed-in coach only. POST = turn on, DELETE = turn off, PUT = send a test.
// Coach accounts only: staff alerts live in the Empowr Dashboard.
async function caller(request: Request) {
  if (!trustedMessagingOrigin(request)) return { error: NextResponse.json({ error: "Invalid request origin" }, { status: 403 }) };
  const coach = await getCurrentCoach();
  if (!coach) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  if (coach.admin_role !== "coach") return { error: NextResponse.json({ error: "Staff alerts are on the Empowr Dashboard" }, { status: 403 }) };
  return { coach };
}

export async function POST(request: Request) {
  const c = await caller(request);
  if (c.error) return c.error;
  if (!pushEnabled) return NextResponse.json({ error: "Alerts aren't switched on yet" }, { status: 503 });
  const sub = parseSubscription(await request.json().catch(() => null));
  if (!sub) return NextResponse.json({ error: "Bad subscription" }, { status: 400 });
  await saveSubscription(c.coach.id, sub);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const c = await caller(request);
  if (c.error) return c.error;
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await removeSubscription(c.coach.id, body.endpoint);
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const c = await caller(request);
  if (c.error) return c.error;
  return NextResponse.json({ sent: await sendTest(c.coach.id) });
}
