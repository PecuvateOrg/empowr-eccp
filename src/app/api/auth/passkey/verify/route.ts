import { NextResponse } from "next/server";
import { passkeysEnabled, signInWithPasskey } from "@/lib/passkeys";

export async function POST(request: Request) {
  if (!passkeysEnabled) return NextResponse.json({ error: "Passkeys are off" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    // Passkeys are coach accounts only, so a passkey sign-in always lands on the coach home.
    if (await signInWithPasskey(body)) return NextResponse.json({ success: true, redirectTo: "/dashboard" });
    return NextResponse.json({ error: "That passkey wasn't accepted. Use the email code instead." }, { status: 401 });
  } catch (cause) {
    console.error("[passkey/verify] failed", cause);
    return NextResponse.json({ error: "Could not sign you in right now." }, { status: 500 });
  }
}
