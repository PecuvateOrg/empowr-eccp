"use client";

import { useState } from "react";
import { isCalendarDate, type ComplianceRequirement, type ComplianceStatus } from "@/lib/compliance-reminder-rules";

/** Real-data-ready management UI. The parent must supply authorised records and
 * server-backed handlers. No demo coaches, local-only history, or email side effects.
 * Do not mount in production until the approved staff API is available.
 */
export type CoachComplianceItem = {
  requirement: ComplianceRequirement;
  status: ComplianceStatus;
  deadline: string | null;
};
export type ReminderDraft = {
  coachId: string;
  requirements: ComplianceRequirement[];
  note: string;
};
type Props = {
  coachId: string;
  coachName: string;
  items: CoachComplianceItem[];
  sending?: boolean;
  saving?: boolean;
  onSaveDeadline: (requirement: ComplianceRequirement, deadline: string) => Promise<void>;
  onSendReminder: (draft: ReminderDraft) => Promise<void>;
};
const labels: Record<ComplianceRequirement, string> = {
  safeguarding: "Safeguarding", first_aid: "First aid", dbs: "DBS",
  training: "Training", qualification: "Qualifications",
};

export function CoachComplianceReminderManager({
  coachId, coachName, items, sending = false, saving = false, onSaveDeadline, onSendReminder,
}: Props) {
  const [selected, setSelected] = useState<ComplianceRequirement[]>([]);
  const [deadlines, setDeadlines] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const outstanding = items.filter(item => item.status === "outstanding" && item.deadline && isCalendarDate(item.deadline));
  const eligible = outstanding.filter(item => selected.includes(item.requirement));
  const busy = sending || saving;

  async function saveDeadline(requirement: ComplianceRequirement, current: string | null) {
    const value = deadlines[requirement] ?? current ?? "";
    if (!isCalendarDate(value)) { setError("Enter a valid completion deadline."); return; }
    setError(""); setSuccess("");
    try {
      await onSaveDeadline(requirement, value);
      setSuccess("Deadline saved.");
    } catch {
      setError("Could not save the deadline. Please try again.");
    }
  }

  async function send() {
    if (!eligible.length || busy) return;
    setError(""); setSuccess("");
    try {
      await onSendReminder({ coachId, requirements: eligible.map(item => item.requirement), note: note.trim() });
      setSuccess("Reminder request completed. Check the delivery history for its status.");
      setSelected([]); setNote(""); setPreview(false);
    } catch {
      setError("Reminder could not be sent. Check the delivery history before retrying.");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-label={`Compliance reminders for ${coachName}`}>
      <h3 className="font-semibold">Compliance reminders — {coachName}</h3>
      <p className="mt-1 text-sm text-muted">Set completion deadlines and select outstanding requirements to remind this coach about. Certificate renewal dates are separate.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p role="status" className="mt-3 text-sm">{success}</p>}
      <div className="mt-4 space-y-3">
        {items.map(item => {
          const eligibleItem = item.status === "outstanding" && !!item.deadline && isCalendarDate(item.deadline);
          return (
            <div key={item.requirement} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" disabled={!eligibleItem || busy} checked={eligibleItem && selected.includes(item.requirement)}
                    onChange={event => { setSelected(previous => event.target.checked ? [...previous, item.requirement] : previous.filter(value => value !== item.requirement)); setPreview(false); }} />
                  {labels[item.requirement]}
                </label>
                <span className="text-xs text-muted">{item.status.replace("_", " ")}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="text-sm">Completion deadline
                  <input type="date" className="ml-2 rounded border border-border bg-card p-2" disabled={busy}
                    value={deadlines[item.requirement] ?? item.deadline ?? ""}
                    onChange={event => { setDeadlines(previous => ({ ...previous, [item.requirement]: event.target.value })); setPreview(false); }} />
                </label>
                <button type="button" disabled={busy || item.status !== "outstanding" || !isCalendarDate(deadlines[item.requirement] ?? item.deadline ?? "")}
                  className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => void saveDeadline(item.requirement, item.deadline)}>Save deadline</button>
              </div>
            </div>
          );
        })}
      </div>
      {outstanding.length === 0 && <p className="mt-3 text-sm text-muted">No outstanding requirements with saved deadlines are ready for reminders.</p>}
      <label className="mt-4 block text-sm font-semibold">Optional message
        <textarea rows={3} maxLength={500} disabled={busy} value={note} onChange={event => { setNote(event.target.value); setPreview(false); }}
          className="mt-1 block w-full rounded-lg border border-border bg-card p-3 font-normal" />
      </label>
      {!preview ? (
        <button type="button" disabled={busy || eligible.length === 0} onClick={() => setPreview(true)}
          className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">Preview reminder ({eligible.length})</button>
      ) : (
        <div className="mt-4 rounded-lg border border-border p-3 text-sm">
          <p className="font-semibold">Email preview — not sent</p>
          <p className="mt-2">Hello {coachName},</p>
          <p className="mt-2">Please complete the following requirements:</p>
          <ul className="mt-2 list-disc pl-5">{eligible.map(item => <li key={item.requirement}>{labels[item.requirement]} — due {item.deadline}</li>)}</ul>
          {note.trim() && <p className="mt-2 whitespace-pre-wrap">{note.trim()}</p>}
          <p className="mt-2">Empowr CIC</p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy || eligible.length === 0} onClick={() => void send()}
              className="rounded-lg border border-border px-4 py-2 font-semibold disabled:opacity-50">Send reminder</button>
            <button type="button" disabled={busy} onClick={() => setPreview(false)}
              className="rounded-lg border border-border px-4 py-2">Edit</button>
          </div>
        </div>
      )}
    </section>
  );
}
