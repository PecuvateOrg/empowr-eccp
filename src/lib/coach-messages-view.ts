// Pure helpers for the coach's view of their conversations. No database or
// Next imports, so they can be unit-tested and used in client components.

export type ConversationStatus = "new" | "in_progress" | "waiting_for_coach" | "resolved";

// Coach-facing wording. "Waiting for you" is the status staff set when they
// need the coach to answer.
export function coachStatusLabel(status: string): string {
  switch (status) {
    case "new": return "New";
    case "in_progress": return "In progress";
    case "waiting_for_coach": return "Waiting for you";
    case "resolved": return "Resolved";
    default: return "Open";
  }
}

const categoryLabels: Record<string, string> = {
  general: "General enquiry",
  scheduling: "Scheduling",
  training: "Training",
  other: "Other",
};
export function categoryLabel(category: string): string {
  return categoryLabels[category] ?? "Enquiry";
}

// A conversation is unread for the coach when the newest message someone else
// wrote is newer than the coach's last read time (or the coach never opened it).
export function isUnread(latestFromOthers: string | null, lastReadAt: string | null): boolean {
  if (!latestFromOthers) return false;
  if (!lastReadAt) return true;
  return Date.parse(latestFromOthers) > Date.parse(lastReadAt);
}

export type ThreadEntry = { id: string; mine: boolean; author: string; body: string; createdAt: string };

// Coaches see their own messages as "You" and every staff message as the team,
// never an individual name or id (owner decision 2026-11-21).
export function toCoachEntry(
  entry: { id: string; author_id: string; body: string; created_at: string },
  coachId: string,
): ThreadEntry {
  const mine = entry.author_id === coachId;
  return { id: entry.id, mine, author: mine ? "You" : "ECCP staff team", body: entry.body, createdAt: entry.created_at };
}

// Staff-facing wording (staff see "Waiting for coach", coaches "Waiting for you").
export function staffStatusLabel(status: string): string {
  return status === "waiting_for_coach" ? "Waiting for coach" : coachStatusLabel(status);
}
export function priorityLabel(priority: string): string {
  return ({ low: "Low", medium: "Medium", high: "High", urgent: "Urgent" } as Record<string, string>)[priority] ?? "Medium";
}

// An enquiry waits for staff when it's open and the newest public message is
// from a coach. Waiting enquiries sort first, oldest wait first; the rest follow
// by most recent activity.
export type QueueItem = { status: string; updatedAt: string; lastPublicByCoach: boolean; lastPublicAt: string | null };
export function waitingForStaff(item: QueueItem): boolean {
  return item.status !== "resolved" && item.lastPublicByCoach;
}
export function staffQueueOrder(a: QueueItem, b: QueueItem): number {
  const wa = waitingForStaff(a), wb = waitingForStaff(b);
  if (wa !== wb) return wa ? -1 : 1;
  if (wa) return Date.parse(a.lastPublicAt ?? a.updatedAt) - Date.parse(b.lastPublicAt ?? b.updatedAt);
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}
