import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and code required" },
      { status: 400 },
    );
  }

  const result = await verifyOtp(email, code);

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === "locked"
            ? "Too many incorrect attempts. Request a new code."
            : "Invalid or expired code.",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    redirectTo: result.coach.is_staff ? "/management" : "/course",
  });
}
