import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { trustedMessagingOrigin } from "@/lib/messaging-write";
import { efn } from "@/lib/efn-client";
import { shiftScreensEnabled } from "@/lib/efn-staffing";
import { ECCP_ORIGIN } from "@/lib/sso";

// POST (form) → EFN issues a one-use onboarding link for this coach, only if certified → 303 to it.
// Redirects use ECCP_ORIGIN: on Amplify request.url is an internal localhost address.
// Anything else returns the coach to their dashboard, where the card explains why.
export async function POST(request: Request) {
  const back = NextResponse.redirect(new URL("/dashboard", ECCP_ORIGIN), 303);
  if (!shiftScreensEnabled() || !trustedMessagingOrigin(request)) return back;
  const coach = await getCurrentCoach();
  if (!coach) return NextResponse.redirect(new URL("/login", ECCP_ORIGIN), 303);
  const r = await efn("/onboarding/invite", { coachId: coach.id }, { method: "POST" });
  const url = typeof r.data.url === "string" && r.data.url.startsWith("https://efn-dashboard.empowrcic.org/onboard?invite=") ? r.data.url : null;
  return url ? NextResponse.redirect(url, 303) : back;
}
