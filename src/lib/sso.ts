import { timingSafeEqual } from "crypto";

// "Sign in with Empowr Dashboard" (single sign-on), as EFN
// (_config/guides/empowr-staff-single-sign-on.md). The Dashboard checks the
// person's staff domain and that an admin gave them ECCP on its Platform access
// page; ECCP then requires a coach row whose role can view management, so a
// person needs both. Coaches never sign in this way. Sessions end after 12 hours.

export const DASHBOARD_ORIGIN = "https://dashboard.empowrcic.org";
// Never build redirects from request.url: on Amplify it is the internal host.
export const ECCP_ORIGIN = "https://eccp.empowrcic.org";
export const SSO_APP = "eccp";
export const SSO_SESSION_HOURS = 12;
export const STATE_COOKIE = "eccp_sso_state";
export const SSO_COOKIE_PATH = "/api/auth/sso";

export function sameString(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export type DashboardIdentity = { staffId: string; email: string; fullName: string };

/** Server-to-server code exchange. Null when the Dashboard refuses (or the secret is unset). */
export async function exchangeCode(code: string): Promise<DashboardIdentity | null> {
  const secret = process.env.DASHBOARD_SSO_SECRET;
  if (!secret) {
    console.error("[sso] DASHBOARD_SSO_SECRET is not set");
    return null;
  }
  const res = await fetch(`${DASHBOARD_ORIGIN}/api/sso/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ app: SSO_APP, code }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn("[sso] dashboard refused the code", res.status);
    return null;
  }
  const who = (await res.json()) as Partial<DashboardIdentity>;
  return typeof who.email === "string" && who.email
    ? { staffId: String(who.staffId), email: who.email, fullName: String(who.fullName ?? "") }
    : null;
}
