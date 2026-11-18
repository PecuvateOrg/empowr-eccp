import { getDb } from "@/lib/supabase";
import type { SessionAssignment, AssignmentStatus } from "@/lib/coach-session-assignments";

type AssignmentRow = {
 id: string; coach_id: string; external_session_id: string;
 session_date: string; start_time: string; end_time: string;
 status: AssignmentStatus; decision_reason: string | null; session_start_at: string;
};
export type AssignmentView = SessionAssignment & { reason: string | null; sessionStartAt: string };
export function toAssignment(row: AssignmentRow): AssignmentView {
 return { id: row.id, coachId: row.coach_id, sessionId: row.external_session_id,
  date: row.session_date, start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5),
  status: row.status, reason: row.decision_reason, sessionStartAt: row.session_start_at };
}
const columns = "id,coach_id,external_session_id,session_date,start_time,end_time,status,decision_reason,session_start_at";
export async function listCoachAssignments(coachId: string): Promise<AssignmentView[]> {
 const { data, error } = await getDb().from("coach_session_assignments").select(columns)
  .eq("coach_id", coachId).order("session_date", { ascending: true }).limit(100);
 if (error) throw new Error("Assignments storage unavailable");
 return ((data ?? []) as AssignmentRow[]).map(toAssignment);
}
export async function listStaffAssignments(): Promise<AssignmentView[]> {
 const { data, error } = await getDb().from("coach_session_assignments").select(columns)
  .order("session_date", { ascending: true }).limit(200);
 if (error) throw new Error("Assignments storage unavailable");
 return ((data ?? []) as AssignmentRow[]).map(toAssignment);
}
