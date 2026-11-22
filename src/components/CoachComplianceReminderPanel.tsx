"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CoachComplianceReminderManager,
  type CoachComplianceItem,
  type ReminderDraft,
} from "./CoachComplianceReminderManager";
import type { ComplianceRequirement } from "@/lib/compliance-reminder-rules";

type CoachData = { coach: { id: string; name: string }; items: CoachComplianceItem[] };
async function jsonOrThrow(response: Response) {
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("The compliance service is unavailable");
  return data;
}

/** Management-only container. All reads and writes go through authenticated
 * server routes; the browser never supplies the actor or recipient email. */
export function CoachComplianceReminderPanel({ coachId }: { coachId: string }) {
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/management/compliance?coachId=${encodeURIComponent(coachId)}`, { cache: "no-store" });
    const result = await jsonOrThrow(response) as CoachData;
    setData(result);
  }, [coachId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/management/compliance?coachId=${encodeURIComponent(coachId)}`, { cache: "no-store" })
      .then(jsonOrThrow)
      .then(result => { if (active) setData(result as CoachData); })
      .catch(() => { if (active) setError("Compliance records are not available yet."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [coachId]);

  async function saveDeadline(requirement: ComplianceRequirement, deadline: string) {
    setBusy(true);
    try {
      await jsonOrThrow(await fetch("/api/management/compliance/deadline", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId, requirement, deadline }),
      }));
      await refresh();
    } finally { setBusy(false); }
  }

  async function sendReminder(draft: ReminderDraft) {
    setBusy(true);
    try {
      await jsonOrThrow(await fetch("/api/management/compliance/remind", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      }));
      await refresh();
    } finally { setBusy(false); }
  }

  if (loading) return <p role="status" className="text-sm text-muted">Loading compliance records…</p>;
  if (error || !data) return <p role="alert" className="text-sm text-muted">{error || "Compliance records unavailable."}</p>;
  return <CoachComplianceReminderManager key={coachId} coachId={data.coach.id}
    coachName={data.coach.name} items={data.items} saving={busy} sending={busy}
    onSaveDeadline={saveDeadline} onSendReminder={sendReminder} />;
}
