import { NextResponse } from "next/server";
import { createOtp, findCoachByEmail } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Coach accounts are staff-provisioned; there is no self-signup. The response
  // is identical for a known and an unknown address so this endpoint cannot be
  // used to discover which addresses hold a safeguarding record. A genuine
  // failure is NOT disguised that way — it is logged and returned as a 500,
  // otherwise a broken database reads to the user as "your code is coming".
  try {
    const coach = await findCoachByEmail(email);
    if (coach) {
      await sendOtpEmail(coach.email, await createOtp(coach.email));
    }
    return NextResponse.json({ success: true });
  } catch (cause) {
    console.error("[otp/send] failed", cause);
    return NextResponse.json(
      { error: "Could not send a code right now." },
      { status: 500 },
    );
  }
}
