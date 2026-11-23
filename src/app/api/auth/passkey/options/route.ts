import { NextResponse } from "next/server";
import { authenticationOptions, passkeysEnabled } from "@/lib/passkeys";

export async function POST() {
  if (!passkeysEnabled) return NextResponse.json({ error: "Passkeys are off" }, { status: 404 });
  try {
    return NextResponse.json(await authenticationOptions());
  } catch (cause) {
    console.error("[passkey/options] failed", cause);
    return NextResponse.json({ error: "Passkey sign-in isn't available right now." }, { status: 500 });
  }
}
