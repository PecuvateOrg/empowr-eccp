import { getDb } from "@/lib/supabase";
import { parseAssign } from "@/lib/staffing-admin";
import { adminForStaffingWrite, staffingFail, staffingOk, staffingRpcFail } from "@/lib/staffing-write";

// Assign one coach to one or more sessions, all or nothing, in
// eccp.staffing_assign_shifts. Retrying with the same idempotencyKey is safe.
export async function POST(request: Request) {
  const auth = await adminForStaffingWrite(request);
  if (auth.error) return auth.error;
  const input = parseAssign(await request.json().catch(() => null));
  if (!input) return staffingFail("That request was not valid.", 400);
  const { data, error } = await getDb().rpc("staffing_assign_shifts", {
    p_session_token: auth.token, p_coach_id: input.coachId, p_session_ids: input.sessionIds, p_role: input.role,
    p_additional_paid: input.additionalPaid, p_reason: input.reason, p_idempotency_key: input.idempotencyKey,
  });
  if (error) return staffingRpcFail(error, "assign");
  return staffingOk({ assignmentIds: data }, 201);
}
