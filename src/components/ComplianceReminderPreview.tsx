"use client";

import { useState } from "react";

type ReminderPreviewProps = {
  coachName: string;
  requirements: string[];
};

export function ComplianceReminderPreview({ coachName, requirements }: ReminderPreviewProps) {
  const [requirement, setRequirement] = useState(requirements[0] ?? "");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [drafts, setDrafts] = useState<Array<{ requirement: string; deadline: string; note: string }>>([]);
  const [confirm, setConfirm] = useState(false);

  if (!requirements.length) return <p className="mt-4 text-sm text-muted">No outstanding requirements to remind about in this example.</p>;

  const addPreview = () => {
    if (!requirement || !deadline) return;
    setDrafts(previous => [{ requirement, deadline, note: note.trim() }, ...previous]);
    setConfirm(false);
    setNote("");
  };

  return (
    <section className="mt-5 rounded-xl border border-border bg-card p-4" aria-label="Reminder preview">
      <h3 className="font-semibold">Compliance reminder — example only</h3>
      <p className="mt-1 text-xs text-muted">Try drafting a reminder for {coachName}. Nothing is sent, saved to a server, or recorded against a real coach.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Outstanding requirement
          <select className="mt-1 block w-full rounded-lg border border-border bg-card p-3 font-normal" value={requirement} onChange={event => { setRequirement(event.target.value); setConfirm(false); }}>
            {requirements.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Completion deadline
          <input type="date" required className="mt-1 block w-full rounded-lg border border-border bg-card p-3 font-normal" value={deadline} onChange={event => { setDeadline(event.target.value); setConfirm(false); }} />
        </label>
      </div>
      <label className="mt-3 block text-sm font-semibold">Optional message
        <textarea rows={3} maxLength={500} className="mt-1 block w-full rounded-lg border border-border bg-card p-3 font-normal" value={note} onChange={event => { setNote(event.target.value); setConfirm(false); }} placeholder="Add context for the coach..." />
      </label>
      {!confirm ? (
        <button type="button" disabled={!deadline} onClick={() => setConfirm(true)} className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-blue disabled:opacity-50">Preview reminder</button>
      ) : (
        <div className="mt-4 rounded-lg border border-border p-3 text-sm">
          <p className="font-bold">Email preview — not sent</p>
          <p className="mt-2">Hello {coachName},</p>
          <p className="mt-2">This is a reminder to complete your {requirement} by {deadline}.</p>
          {note && <p className="mt-2 whitespace-pre-wrap">{note}</p>}
          <p className="mt-2">Empowr CIC</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={addPreview} className="rounded-lg border border-border px-4 py-2 font-semibold text-blue">Add to example history</button>
            <button type="button" onClick={() => setConfirm(false)} className="rounded-lg border border-border px-4 py-2">Edit draft</button>
          </div>
        </div>
      )}
      <div className="mt-5 border-t border-border pt-3">
        <h4 className="text-sm font-semibold">Example reminder history (this page only)</h4>
        {drafts.length === 0 ? <p className="mt-2 text-xs text-muted">No example reminders added.</p> : (
          <ul className="mt-2 space-y-2 text-sm">{drafts.map((draft, index) => (
            <li key={index} className="rounded-lg border border-border p-3">
              <strong>{draft.requirement}</strong> · Due {draft.deadline}
              <p className="text-xs text-muted">Draft preview only — not sent</p>
              {draft.note && <p className="mt-1 whitespace-pre-wrap text-xs">{draft.note}</p>}
            </li>
          ))}</ul>
        )}
      </div>
    </section>
  );
}
