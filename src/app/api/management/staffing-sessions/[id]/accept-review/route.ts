import { getDb } from "@/lib/supabase";
import { isUuid } from "@/lib/staffing-admin";
import { adminForStaffingWrite, staffingFail, staffingOk, staffingRpcFail } from "@/lib/staffing-write";

// Accept a session flagged by the Members sync: applies any proposed time or
// venue (coaches' shifts move with it) and clears the review. Refused, with
// nothing changed, if the move would double-book a coach.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminForStaffingWrite(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!isUuid(id)) return staffingFail("That request was not valid.", 400);
  const { error } = await getDb().rpc("staffing_accept_session_review", { p_session_token: auth.token, p_session_id: id });
  if (error) return staffingRpcFail(error, "review");
  return staffingOk({ accepted: id });
}
