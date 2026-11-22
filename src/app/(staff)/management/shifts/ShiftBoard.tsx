"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { gradeLabel, ROLES, roleLabel, shiftLabel, venueLabel, type ShiftRole } from "@/lib/staffing-admin";
import type { BoardCoach, BoardSession } from "@/lib/staffing-admin-reader";

const field = "mt-1 block w-full rounded-lg border border-border bg-card p-2";
const button = "rounded-lg bg-blue px-4 py-2 font-bold text-white hover:bg-blue-dark disabled:opacity-50";
type Notice = { kind: "ok" | "error"; text: string } | null;

async function post(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return null;
    const data = await res.json().catch(() => null);
    return typeof data?.error === "string" ? data.error : "Scheduling is unavailable. Try again shortly.";
  } catch { return "Scheduling is unavailable. Check your connection and try again."; }
}

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return <p role="status" className="sr-only" />;
  // Error text stays ink on a soft red panel: red text fails contrast (design-system/MASTER.md).
  return <p role={notice.kind === "error" ? "alert" : "status"} className={notice.kind === "error"
    ? "rounded-lg border border-red bg-red/10 p-3 text-sm font-semibold text-ink"
    : "rounded-lg border border-border bg-blue-pale p-3 text-sm font-semibold text-ink"}>{notice.text}</p>;
}

export function ShiftBoard({ sessions, coaches }: { sessions: BoardSession[]; coaches: BoardCoach[] }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const reviews = sessions.filter(s => s.inReview);
  const assignable = sessions.filter(s => !s.inReview && s.status === "scheduled");

  // One key per filled-in form, kept across retries so a resend never assigns twice.
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [coachId, setCoachId] = useState("");
  const [role, setRole] = useState<ShiftRole>("assistant");
  const [picked, setPicked] = useState<string[]>([]);
  const [paid, setPaid] = useState(false);
  const [reason, setReason] = useState("");
  const changed = <T,>(set: (v: T) => void) => (v: T) => { set(v); setKey(crypto.randomUUID()); };

  async function run(action: () => Promise<string | null>, ok: string, after?: () => void) {
    setBusy(true); setNotice(null);
    const err = await action();
    setBusy(false);
    if (err) { setNotice({ kind: "error", text: err }); return; }
    after?.(); setNotice({ kind: "ok", text: ok }); router.refresh();
  }
  const assign = () => run(() => post("/api/management/shifts", { coachId, sessionIds: picked, role, additionalPaid: paid, reason: paid ? reason : null, idempotencyKey: key }),
    `Assigned to ${picked.length} session${picked.length === 1 ? "" : "s"}.`,
    () => { setPicked([]); setPaid(false); setReason(""); setKey(crypto.randomUUID()); });
  const cancel = (id: string, name: string) => {
    const why = window.prompt(`Cancel ${name}'s shift? Optional reason:`);
    if (why === null) return;
    run(() => post(`/api/management/shifts/${id}/cancel`, { reason: why }), `${name}'s shift was cancelled.`);
  };
  const accept = (id: string) => run(() => post(`/api/management/staffing-sessions/${id}/accept-review`, {}), "Change accepted.");

  return <div className="mt-6 space-y-8">
    <NoticeBox notice={notice} />

    <section aria-labelledby="review-heading">
      <h2 id="review-heading" className="text-xl font-bold">Waiting for review ({reviews.length})</h2>
      <p className="mt-1 text-sm text-muted">Changes from Members don&apos;t reach coaches&apos; shifts until you accept them.</p>
      {reviews.length === 0 ? <p className="mt-3 rounded-xl border border-border bg-card p-4 text-sm">Nothing to review.</p> :
        <div className="mt-3 space-y-3">{reviews.map(s => <article key={s.id} className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-bold">{s.title}</h3>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Now</dt><dd className="font-semibold">{shiftLabel(s.startsAt, s.endsAt)}<br />{venueLabel(s.venue)}</dd></div>
            <div><dt className="text-muted">Why it&apos;s here</dt><dd className="font-semibold">
              {s.proposal ? <>Members moved it to {shiftLabel(s.proposal.startsAt, s.proposal.endsAt)}<br />{venueLabel(s.proposal.venue)}</>
                : s.status === "cancelled" ? "Cancelled in Members. Cancel its shifts below if it isn't going ahead."
                : s.missingCount >= 2 ? `Missing from the last ${s.missingCount} Members schedules.`
                : "Flagged by the Members sync."}</dd></div>
          </dl>
          <p className="mt-2 text-sm text-muted">{s.shifts.length ? `${s.shifts.length} coach${s.shifts.length === 1 ? "" : "es"} on this session.` : "No coaches on this session."}</p>
          <button type="button" className={`${button} mt-3`} disabled={busy} onClick={() => accept(s.id)}>{s.proposal ? "Accept new time" : "Mark reviewed"}</button>
        </article>)}</div>}
    </section>

    <section aria-labelledby="assign-heading" className="rounded-xl border border-border bg-card p-4">
      <h2 id="assign-heading" className="text-xl font-bold">Assign a coach</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Coach<select className={field} value={coachId} onChange={e => changed(setCoachId)(e.target.value)}>
          <option value="">Choose a coach</option>
          {coaches.map(c => <option key={c.id} value={c.id}>{c.name} · {gradeLabel(c.grade)}</option>)}</select></label>
        <label className="text-sm">Role<select className={field} value={role} onChange={e => changed(setRole)(e.target.value as ShiftRole)}>
          {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}</select></label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-bold">Sessions ({picked.length} chosen)</legend>
        {assignable.length === 0 ? <p className="mt-2 text-sm text-muted">No upcoming sessions can take coaches.</p> :
          <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">{assignable.map(s => <label key={s.id} className="flex gap-2 text-sm">
            <input type="checkbox" checked={picked.includes(s.id)} onChange={e => changed(setPicked)(e.target.checked ? [...picked, s.id] : picked.filter(id => id !== s.id))} />
            <span>{s.title} · {shiftLabel(s.startsAt, s.endsAt)}</span></label>)}</div>}
      </fieldset>
      <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={paid} onChange={e => changed(setPaid)(e.target.checked)} />Additional paid coach (training and development)</label>
      {paid && <label className="mt-2 block text-sm">Reason<input className={field} value={reason} maxLength={500} onChange={e => changed(setReason)(e.target.value)} /></label>}
      <p className="mt-3 text-xs text-muted">The coach&apos;s grade and certificate are checked when you assign. All chosen sessions are assigned together, or none are.</p>
      <button type="button" className={`${button} mt-3`} disabled={busy || !coachId || !picked.length || (paid && !reason.trim())} onClick={assign}>Assign</button>
    </section>

    <section aria-labelledby="sessions-heading">
      <h2 id="sessions-heading" className="text-xl font-bold">Upcoming sessions</h2>
      {sessions.length === 0 ? <p className="mt-3 rounded-xl border border-border bg-card p-4 text-sm">No upcoming sessions yet. They appear here once the Members sync runs.</p> :
        <div className="mt-3 space-y-3">{sessions.map(s => <article key={s.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-bold">{s.title}</h3>
            {(s.inReview || s.status === "cancelled") && <span className="rounded-full border border-border px-2 text-xs font-bold">{s.status === "cancelled" ? "Cancelled in Members" : "Waiting for review"}</span>}
          </div>
          <p className="text-sm text-muted">{shiftLabel(s.startsAt, s.endsAt)} · {venueLabel(s.venue)}</p>
          {s.shifts.length === 0 ? <p className="mt-2 text-sm">No coaches yet.</p> :
            <ul className="mt-2 space-y-1">{s.shifts.map(a => <li key={a.id} className="flex flex-wrap items-center gap-3 text-sm">
              <span>{a.coachName} · {roleLabel[a.role]}{a.additionalPaid ? " · Additional paid" : ""}</span>
              <button type="button" className="font-semibold text-blue disabled:opacity-50" disabled={busy} onClick={() => cancel(a.id, a.coachName)}>Cancel shift</button>
            </li>)}</ul>}
        </article>)}</div>}
    </section>
  </div>;
}
