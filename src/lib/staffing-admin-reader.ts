import "server-only";
import { getDb } from "./supabase";
import type { ShiftRole, Venue } from "./staffing-admin";

export type BoardShift = { id: string; coachId: string; coachName: string; role: ShiftRole; additionalPaid: boolean };
export type BoardSession = {
  id: string; title: string; startsAt: string; endsAt: string; venue: Venue; status: string; inReview: boolean;
  proposal: { startsAt: string; endsAt: string; venue: Venue } | null; missingCount: number; shifts: BoardShift[];
};
export type BoardCoach = { id: string; name: string; grade: string | null };

/** Admin board: upcoming sessions, their confirmed shifts, and assignable coaches. Caller checks manage_scheduling. */
export async function readStaffingBoard(now = new Date()): Promise<{ sessions: BoardSession[]; coaches: BoardCoach[] }> {
  const db = getDb();
  const [sessions, coaches] = await Promise.all([
    db.from("staffing_sessions")
      .select("id,title,starts_at,ends_at,venue,source_status,reconciliation_state,has_proposal,proposed_starts_at,proposed_ends_at,proposed_venue,consecutive_missing")
      .gt("ends_at", now.toISOString()).order("starts_at").limit(300),
    db.from("coaches").select("id,full_name,coaching_grade").eq("admin_role", "coach").order("full_name"),
  ]);
  if (sessions.error || coaches.error) throw new Error("Staffing board unavailable");
  const ids = sessions.data.map(s => s.id);
  const shifts = ids.length
    ? await db.from("shift_assignments").select("id,session_id,coach_id,role,additional_paid").in("session_id", ids).eq("state", "confirmed")
    : { data: [], error: null };
  if (shifts.error) throw new Error("Staffing board unavailable");

  // Names for every coach holding a shift, including staff or admins with a grade.
  const names = new Map(coaches.data.map(c => [c.id, c.full_name as string]));
  const missing = [...new Set(shifts.data.map(a => a.coach_id).filter(id => !names.has(id)))];
  if (missing.length) {
    const extra = await db.from("coaches").select("id,full_name").in("id", missing);
    if (extra.error) throw new Error("Staffing board unavailable");
    for (const c of extra.data) names.set(c.id, c.full_name);
  }
  return {
    coaches: coaches.data.map(c => ({ id: c.id, name: c.full_name, grade: c.coaching_grade })),
    sessions: sessions.data.map(s => ({
      id: s.id, title: s.title, startsAt: s.starts_at, endsAt: s.ends_at, venue: s.venue, status: s.source_status,
      inReview: s.reconciliation_state === "review", missingCount: s.consecutive_missing,
      proposal: s.has_proposal ? { startsAt: s.proposed_starts_at, endsAt: s.proposed_ends_at, venue: s.proposed_venue } : null,
      shifts: shifts.data.filter(a => a.session_id === s.id).map(a => ({
        id: a.id, coachId: a.coach_id, coachName: names.get(a.coach_id) ?? "Unknown coach", role: a.role, additionalPaid: a.additional_paid,
      })),
    })),
  };
}
