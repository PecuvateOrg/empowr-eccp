import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { provisionCoach } from "@/lib/management";

export async function POST(request: Request) {
  const coach = await getCurrentCoach();
  if (!coach) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!coach.is_staff) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const fullName = typeof body.fullName === "string" ? body.fullName : "";

  try {
    const result = await provisionCoach(coach, { email, fullName });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ coach: result.coach, invited: result.invited });
  } catch (cause) {
    console.error("[management/coaches] failed", cause);
    return NextResponse.json({ error: "Could not provision that coach." }, { status: 500 });
  }
}
