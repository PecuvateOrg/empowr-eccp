import "server-only";
import { getDb } from "./supabase";
import { sendCoachReplyEmail } from "./email";
import { shouldEmailCoach } from "./messaging-alerts";

// After a staff reply (never a note): email the coach(es) in the conversation,
// at most once per 15 minutes. The coach_notified event is written BEFORE the
// send, so two quick replies can't both email; a failed send is logged and
// never fails the reply, which is already saved and shows as unread in ECCP.
export async function notifyCoachesOfReply(conversationId: string, staffId: string): Promise<void> {
  const db = getDb();
  const { data: last } = await db.from("message_events").select("created_at")
    .eq("conversation_id", conversationId).eq("event_type", "coach_notified")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!shouldEmailCoach(last?.created_at ?? null, new Date())) return;

  const { data: members, error } = await db.from("message_participants")
    .select("coach_id").eq("conversation_id", conversationId);
  if (error) throw new Error(`participants: ${error.message}`);
  const ids = (members ?? []).map(m => m.coach_id).filter(id => id !== staffId);
  if (!ids.length) return;
  const { data: coaches, error: coachError } = await db.from("coaches")
    .select("id,email,full_name").in("id", ids).eq("admin_role", "coach");
  if (coachError) throw new Error(`coaches: ${coachError.message}`);
  if (!coaches?.length) return;

  const { error: claimError } = await db.from("message_events").insert({
    conversation_id: conversationId, actor_id: staffId, event_type: "coach_notified",
    details: { coaches: coaches.length },
  });
  if (claimError) throw new Error(`notify claim: ${claimError.message}`);
  for (const c of coaches) {
    await sendCoachReplyEmail(c.email, c.full_name).catch(e => console.error("[messages] coach reply email failed", c.id, e));
  }
}
