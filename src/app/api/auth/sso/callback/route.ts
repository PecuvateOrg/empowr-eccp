import { NextResponse } from "next/server";
import { can, findCoachByEmail, openSession } from "@/lib/auth";
import { ECCP_ORIGIN, exchangeCode, sameString, SSO_COOKIE_PATH, SSO_SESSION_HOURS, STATE_COOKIE } from "@/lib/sso";

// The Dashboard sends staff back here with a one-time code. ECCP checks the
// state it set, swaps the code server-to-server, and opens a session only if
// the email is an ECCP coach row whose role can view management (admin or
// staff). Coaches are refused: they sign in with an email code.
function finish(path: string, reason?: string) {
  const url = new URL(path, ECCP_ORIGIN);
  if (reason) url.searchParams.set("sso", reason);
  const response = NextResponse.redirect(url);
  response.cookies.delete({ name: STATE_COOKIE, path: SSO_COOKIE_PATH });
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const expected = request.headers.get("cookie")?.split(/;\s*/)
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))?.slice(STATE_COOKIE.length + 1) ?? "";
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";

  if (!expected || !state || !sameString(state, expected)) return finish("/login", "expired");
  if (!code) return finish("/login", "failed");

  const who = await exchangeCode(code).catch(() => null);
  if (!who) return finish("/login", "failed");

  const coach = await findCoachByEmail(who.email).catch(() => null);
  if (!coach || !can(coach, "view_management")) {
    console.warn("[sso] dashboard sign-in refused: not ECCP staff", JSON.stringify({ email: who.email }));
    return finish("/login", "not_staff");
  }

  if (!(await openSession(coach.id, SSO_SESSION_HOURS))) return finish("/login", "failed");
  console.log("[sso] signed in via dashboard", JSON.stringify({ email: who.email }));
  return finish("/management");
}
