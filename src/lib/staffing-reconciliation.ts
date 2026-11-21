import type { StaffingSession } from "./members-schedule-validation";

export type StoredSession = StaffingSession & { reconciliation_state: "current" | "review"; missingSnapshots: number };
export function planReconciliation(snapshot: {snapshotVersion: string; sessions: StaffingSession[]}, stored: StoredSession[], now: string) {
  const time = Date.parse(now);
  if (!Number.isFinite(time) || !/^[a-f0-9]{64}$/.test(snapshot.snapshotVersion)) throw new Error("Invalid reconciliation input");
  const existing = new Map(stored.map(s => [s.source_key,s]));
  const seen = new Set<string>();
  const upserts = snapshot.sessions.map(s => {
    if (seen.has(s.source_key)) throw new Error("Duplicate source key");
    seen.add(s.source_key);
    const old = existing.get(s.source_key);
    const changed = !!old && (Date.parse(old.starts_at) !== Date.parse(s.starts_at) || Date.parse(old.ends_at) !== Date.parse(s.ends_at) || old.status !== s.status || old.venue?.name !== s.venue?.name || old.venue?.address !== s.venue?.address || old.venue?.postcode !== s.venue?.postcode);
    return { ...s, reconciliation_state: changed || s.status === "cancelled" || old?.reconciliation_state === "review" ? "review" as const : "current" as const, missingSnapshots: 0 };
  });
  const missing = stored.filter(s => !seen.has(s.source_key) && Date.parse(s.starts_at) > time && s.status === "scheduled").map(s => ({source_key:s.source_key, missingSnapshots:s.missingSnapshots+1,reconciliation_state:s.missingSnapshots>=1 || s.reconciliation_state==="review" ? "review" as const :"current" as const}));
  return {snapshotVersion:snapshot.snapshotVersion, upserts, missing};
}
