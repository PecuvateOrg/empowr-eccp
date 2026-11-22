import { getDb } from "@/lib/supabase";
import { isUuid, parseReason } from "@/lib/staffing-admin";
import { adminForStaffingWrite, staffingFail, staffingOk, staffingRpcFail } from "@/lib/staffing-write";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminForStaffingWrite(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const reason = parseReason(await request.json().catch(() => ({})));
  if (!isUuid(id) || reason === undefined) return staffingFail("That request was not valid.", 400);
  const { error } = await getDb().rpc("staffing_cancel_assignment", { p_session_token: auth.token, p_assignment_id: id, p_reason: reason });
  if (error) return staffingRpcFail(error, "cancel");
  return staffingOk({ cancelled: id });
}
