"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CoachComplianceReminderManager,
  type CoachComplianceItem,
  type ReminderDraft,
} from "./CoachComplianceReminderManager";
import type { ComplianceRequirement } from "@/lib/compliance-reminder-rules";

type CoachData = { coach: { id: string; name: string }; items: CoachComplianceItem[] };
type ReminderEvent = { id: string; requirement: string; completion_deadline: string; delivery_status: string; created_at: string; delivered_at: string | null };
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
  const [history, setHistory] = useState<ReminderEvent[] | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/management/compliance/history?coachId=${encodeURIComponent(coachId)}`, { cache: "no-store" });
      const result = await jsonOrThrow(response) as { events: ReminderEvent[] };
      setHistory(result.events);
      setHistoryError(false);
    } catch { setHistoryError(true); }
  }, [coachId]);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/management/compliance?coachId=${encodeURIComponent(coachId)}`, { cache: "no-store" });
    const result = await jsonOrThrow(response) as CoachData;
    setData(result);
    await loadHistory();
  }, [coachId, loadHistory]);

  useEffect(() => {
    let active = true;
    fetch(`/api/management/compliance?coachId=${encodeURIComponent(coachId)}`, { cache: "no-store" })
      .then(jsonOrThrow)
      .then(result => { if (active) setData(result as CoachData); })
      .catch(() => { if (active) setError("Compliance records are not available yet."); })
      .finally(() => { if (active) setLoading(false); });
    void loadHistory();
    return () => { active = false; };
  }, [coachId, loadHistory]);

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
  return <div className="space-y-4">
    <CoachComplianceReminderManager key={coachId} coachId={data.coach.id}
      coachName={data.coach.name} items={data.items} saving={busy} sending={busy}
      onSaveDeadline={saveDeadline} onSendReminder={sendReminder} />
    <section className="rounded-xl border border-border bg-card p-4" aria-label="Reminder delivery history">
      <h3 className="font-semibold">Reminder history</h3>
      {historyError ? <p role="status" className="mt-2 text-sm">Reminder history is currently unavailable.</p>
        : history === null ? <p className="mt-2 text-sm">Loading history…</p>
        : history.length === 0 ? <p className="mt-2 text-sm">No reminders recorded yet.</p>
        : <ul className="mt-3 space-y-2">{history.map(event => <li key={event.id} className="rounded border border-border p-2 text-sm">
          <strong>{event.requirement.replaceAll("_", " ")}</strong> — {event.delivery_status}
          <span className="block">Deadline: {event.completion_deadline} · Requested: {new Date(event.created_at).toLocaleString("en-GB")}</span>
          {event.delivered_at && <span className="block">Sent: {new Date(event.delivered_at).toLocaleString("en-GB")}</span>}
        </li>)}</ul>}
    </section>
  </div>;
}
