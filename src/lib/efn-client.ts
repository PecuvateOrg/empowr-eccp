import "server-only";

// Server-side calls to EFN's /api/eccp/v1. The caller's identity always comes from the ECCP
// session (getCurrentCoach), never from the browser. Coach and staff calls use separate keys
// (SSM ECCP_EFN_API_KEY / ECCP_EFN_STAFF_API_KEY; Vault SHARED_EFN_ECCP_*_PROD), so a fault on
// the coach path can never reach the staff endpoints. Response bodies hold names: never log them.

const BASE = "https://efn-dashboard.empowrcic.org/api/eccp/v1";
export type As = { coachId: string } | { staffId: string } | { system: string };
export type EfnResult = { status: number; data: Record<string, unknown> };

export async function efn(path: string, as: As, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<EfnResult> {
  const staff = "staffId" in as || "system" in as;
  const key = staff ? process.env.ECCP_EFN_STAFF_API_KEY : process.env.ECCP_EFN_API_KEY;
  if (!key) return { status: 503, data: { error: "not_configured" } };
  try {
    const res = await fetch(BASE + path, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        ...("staffId" in as ? { "X-ECCP-Staff-Id": as.staffId } : "system" in as ? { "X-ECCP-System": as.system } : { "X-ECCP-Coach-Id": as.coachId }),
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data: data && typeof data === "object" && !Array.isArray(data) ? data : {} };
  } catch {
    return { status: 503, data: { error: "efn_unavailable" } };
  }
}
