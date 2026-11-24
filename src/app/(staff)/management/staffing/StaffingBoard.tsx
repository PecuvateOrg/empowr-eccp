"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { venueText, whenText, type Venue } from "@/lib/efn-staffing";

type FilledBy = { name: string; coachId: string | null; response: string | null; isCover: boolean; taskId: string | null } | null;
type Position = { id: string; role: string; kind: string; additionalReason: string | null; filledBy: FilledBy; withdrawals: number };
export type StaffSession = {
  id: string; title: string; startsAt: string; endsAt: string; venue: Venue | null; status: string; needsReview: boolean;
  reviewReason: string | null; locked: boolean; positions: Position[];
  coverage: { countedCoaches: number; minimumCoaches: number | null; meetsMinimum: boolean | null; hasHeadCoach: boolean };
};
type Coach = { id: string; name: string; grade: string | null };
const ROLES = ["Head Coach", "Assistant Coach", "Junior Assistant Coach", "Junior Champion", "Other role"];
const EXTRA = [["shadowing", "Shadowing"], ["mentoring", "Mentoring"], ["practical_assessment", "Practical assessment"], ["head_coach_development", "Head coach development"], ["extra_support", "Extra support"]];
const REVIEW: Record<string, string> = { time_changed: "The time changed in Members", venue_changed: "The venue changed in Members", cancelled: "Cancelled in Members", missing: "Missing from the Members schedule" };
const GRADE: Record<string, string> = { head_coach: "Head coach", assistant_coach: "Assistant coach", junior_assistant_coach: "Junior assistant coach" };
const field = "rounded-lg border border-border bg-card p-2 text-sm";
const button = "rounded-lg bg-blue px-3 py-2 text-sm font-bold text-white hover:bg-blue-dark disabled:opacity-50";

export function StaffingBoard({ sessions, coaches }: { sessions: StaffSession[]; coaches: Coach[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; lines: string[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  async function post(path: string, body: object, ok: (d: Record<string, unknown>) => string) {
    setBusy(true); setNotice(null);
    try {
      const res = await fetch(`/api/management/staffing/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setNotice({ error: true, lines: [d.error ?? "Something went wrong. Try again."] });
      else { const skipped = (d.skipped ?? []) as string[]; setNotice({ error: skipped.length > 0, lines: [ok(d), ...skipped.map(s => "Not assigned · " + s)] }); router.refresh(); }
    } catch { setNotice({ error: true, lines: ["Couldn't reach ECCP. Check your connection and try again."] }); }
    setBusy(false);
  }
  const reviews = sessions.filter(s => s.needsReview);
  return <div className="mt-6 space-y-8">
    {notice && <div role={notice.error ? "alert" : "status"} className={`rounded-lg border p-3 text-sm font-semibold text-ink ${notice.error ? "border-red bg-red/10" : "border-border bg-blue-pale"}`}>{notice.lines.map((l, i) => <p key={i}>{l}</p>)}</div>}
    <section aria-labelledby="review-h">
      <h2 id="review-h" className="text-xl font-bold">Waiting for review ({reviews.length})</h2>
      {reviews.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing to review.</p> : <ul className="mt-3 space-y-2">{reviews.map(s =>
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm">
          <span><b>{s.title}</b> · {whenText(s.startsAt, s.endsAt)} · {REVIEW[s.reviewReason ?? ""] ?? "Flagged by the sync"}</span>
          <button type="button" className={button} disabled={busy} onClick={() => post(`sessions/${s.id}/review`, {}, () => "Marked as reviewed.")}>Mark reviewed</button>
        </li>)}</ul>}
    </section>
    <section aria-labelledby="sessions-h">
      <h2 id="sessions-h" className="text-xl font-bold">Sessions</h2>
      {sessions.length === 0 && <p className="mt-2 text-sm text-muted">No sessions in the next 8 weeks.</p>}
      <div className="mt-3 space-y-3">{sessions.map(s => <article key={s.id} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-bold">{s.title}</h3>
          <span className="text-xs font-bold">{s.status === "cancelled" ? "Cancelled" : s.locked ? "Staffing locked" : s.coverage.hasHeadCoach ? "Head coach in place" : "No head coach yet"}</span>
        </div>
        <p className="text-sm text-muted">{whenText(s.startsAt, s.endsAt)} · {venueText(s.venue)}</p>
        {s.positions.length === 0 ? <p className="mt-2 text-sm">No places added yet.</p> : <ul className="mt-2 space-y-2">{s.positions.map(p =>
          <PositionRow key={p.id} p={p} coaches={coaches} busy={busy} post={post} />)}</ul>}
        {s.status !== "cancelled" && (open === s.id
          ? <AddPlace onCancel={() => setOpen(null)} busy={busy} add={(role, kind, reason) => post(`sessions/${s.id}/positions`, { role, kind, additionalReason: reason }, () => `${role} place added.`).then(() => setOpen(null))} />
          : <button type="button" className="mt-3 text-sm font-semibold text-blue" onClick={() => setOpen(s.id)}>+ Add a place</button>)}
      </article>)}</div>
    </section>
  </div>;
}

function PositionRow({ p, coaches, busy, post }: { p: Position; coaches: Coach[]; busy: boolean; post: (path: string, body: object, ok: (d: Record<string, unknown>) => string) => Promise<void> }) {
  const [coachId, setCoachId] = useState("");
  const [scope, setScope] = useState<"date" | "series">("date");
  const label = `${p.role}${p.kind === "additional" ? " (extra place)" : ""}`;
  if (p.filledBy) {
    const f = p.filledBy;
    const remove = (series: boolean) => {
      const reason = window.prompt(`Remove ${f.name} from ${series ? "this and every later date in the series" : "this date"}? Give a short reason (kept in the staffing log):`);
      if (reason !== null) post(`tasks/${f.taskId}/remove`, { scope: series ? "series" : "date", reason },
        d => `Removed ${f.name} from ${d.removed ?? 0} date(s).${d.emailed ? " They've been emailed." : ""} The place is open again.`);
    };
    return <li className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span><b>{label}:</b> {f.name}{f.isCover ? " (cover)" : ""} · {f.response === "accepted" ? "accepted" : f.response === "declined" ? "declined" : f.response === "pending" ? "waiting for answer" : "training place"}</span>
      {f.taskId && <span className="flex gap-3">
        <button type="button" disabled={busy} className="font-semibold text-blue disabled:opacity-50" onClick={() => remove(false)}>Remove</button>
        {!f.isCover && <button type="button" disabled={busy} className="font-semibold text-blue disabled:opacity-50" onClick={() => remove(true)}>Remove from series</button>}
      </span>}</li>;
  }
  const cover = p.withdrawals > 0;
  return <li className="flex flex-wrap items-center gap-2 text-sm">
    <b>{label}:</b> <span className="text-muted">{cover ? "needs cover" : "unfilled"}</span>
    <select aria-label={`Coach for ${label}`} className={field} value={coachId} onChange={e => setCoachId(e.target.value)}>
      <option value="">Choose a coach</option>
      {coaches.map(c => <option key={c.id} value={c.id}>{c.name} · {GRADE[c.grade ?? ""] ?? "no grade"}</option>)}
    </select>
    {!cover && <select aria-label="How many dates" className={field} value={scope} onChange={e => setScope(e.target.value as "date" | "series")}>
      <option value="date">This date</option><option value="series">This and later dates in the series</option></select>}
    <button type="button" className={button} disabled={busy || !coachId} onClick={() => cover
      ? post(`positions/${p.id}/cover`, { coachId }, () => "Cover assigned. The coach will see it in My Shifts.")
      : post(`positions/${p.id}/assign`, { coachId, scope }, d => `Assigned to ${d.assigned ?? 0} date(s). The coach will see it in My Shifts.`)}>{cover ? "Assign cover" : "Assign"}</button>
  </li>;
}

function AddPlace({ add, onCancel, busy }: { add: (role: string, kind: string, reason: string | null) => void; onCancel: () => void; busy: boolean }) {
  const [role, setRole] = useState(ROLES[0]);
  const [extra, setExtra] = useState(false);
  const [reason, setReason] = useState(EXTRA[0][0]);
  return <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
    <select aria-label="Role" className={field} value={role} onChange={e => setRole(e.target.value)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
    <label className="flex items-center gap-1"><input type="checkbox" checked={extra} onChange={e => setExtra(e.target.checked)} />Extra place (admin only)</label>
    {extra && <select aria-label="Reason" className={field} value={reason} onChange={e => setReason(e.target.value)}>{EXTRA.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
    <button type="button" className={button} disabled={busy} onClick={() => add(role, extra ? "additional" : "required", extra ? reason : null)}>Add</button>
    <button type="button" className="text-sm font-semibold text-blue" onClick={onCancel}>Cancel</button>
  </div>;
}
