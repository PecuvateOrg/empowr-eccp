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
  // is identical either way so this endpoint cannot be used to discover which
  // addresses hold a safeguarding record.
  const coach = await findCoachByEmail(email);
  if (coach) {
    await sendOtpEmail(coach.email, await createOtp(coach.email));
  }

  return NextResponse.json({ success: true });
}
