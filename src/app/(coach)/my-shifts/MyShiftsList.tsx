"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { venueText, whenText, type Venue } from "@/lib/efn-staffing";

export type CoachShift = {
  id: string; kind: "shift" | "training"; role: string; title: string; startsAt: string; endsAt: string; venue: Venue | null;
  sessionStatus: string; response: "pending" | "accepted" | "declined" | null; status: string | null; isCover: boolean;
  sessionId?: string; seriesKey?: string | null; attendance?: "unconfirmed" | "attended" | "absent" | "unresolved" | null; checkedInAt?: string | null;
  canCheckIn?: boolean; canSelfConfirm?: boolean;
};
const timeOnly = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
// A Members series can run on several weekdays; "the series" = same weekday and UK start time.
const slotFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const slot = (iso: string) => slotFmt.format(new Date(iso));
const ATTENDANCE: Record<string, string> = { attended: "Attendance confirmed", absent: "Marked absent", unresolved: "Waiting for staff to confirm" };
const OTHER = "Something else";
const MISSED_CHECK_IN = ["I forgot to tap I'm Here", "I didn't know I had to check in", "My phone was flat or had no signal", "The I'm Here button didn't work", OTHER];
const button = "rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50";

export function MyShiftsList({ shifts }: { shifts: CoachShift[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  async function act(id: string, action: "response" | "withdraw" | "check-in" | "confirm-attendance", body: object, ok: string) {
    setBusy(id); setNotice(null);
    try {
      const res = await fetch(`/api/shifts/${id}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      setNotice(res.ok ? { error: false, text: ok } : { error: true, text: data.error ?? "Something went wrong. Try again." });
      if (res.ok) router.refresh();
      setBusy(null);
      return res.ok;
    } catch { setNotice({ error: true, text: "Couldn't reach ECCP. Check your connection and try again." }); }
    setBusy(null);
    return false;
  }
  const withdraw = (s: CoachShift) => {
    const reason = window.prompt(`Why are you pulling out of ${s.title}? (needed for staff to arrange cover)`);
    if (reason !== null) act(s.id, "withdraw", { reason }, "You've pulled out of this shift. Staff have been told.");
  };
  // Why "I'm Here" wasn't tapped: a pick-list, not free text (first real shift 2026-11-25 got "I don't know").
  const [confirming, setConfirming] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const [other, setOther] = useState("");
  const openConfirm = (id: string) => { setConfirming(id); setChoice(""); setOther(""); };
  const reasonText = choice === OTHER ? `${OTHER}: ${other.trim()}` : choice;
  const reasonReady = choice !== "" && (choice !== OTHER || other.trim() !== "");
  const confirm = (s: CoachShift) => {
    if (!reasonReady) return;
    act(s.id, "confirm-attendance", { reason: reasonText }, "Thanks. Your attendance is confirmed and staff can see your answer.").then(ok => { if (ok) setConfirming(null); });
  };
  const [now] = useState(() => Date.now());
  // Unanswered shifts in the same series and role from this one on: what "accept the series" will cover.
  const seriesPending = (s: CoachShift) => !s.seriesKey ? 0 : shifts.filter(o => o.kind === "shift" && o.response === "pending" && o.sessionStatus !== "cancelled"
    && o.seriesKey === s.seriesKey && slot(o.startsAt) === slot(s.startsAt) && o.role === s.role && o.startsAt >= s.startsAt && Date.parse(o.startsAt) > now).length;
  const upcoming = shifts.filter(s => Date.parse(s.endsAt) > now || s.canSelfConfirm || (s.attendance && s.attendance !== "unconfirmed" && Date.parse(s.endsAt) > now - 86_400_000));
  return <div className="mt-6 space-y-3">
    {notice && <p role={notice.error ? "alert" : "status"} className={`rounded-lg border p-3 text-sm font-semibold text-ink ${notice.error ? "border-red bg-red/10" : "border-border bg-blue-pale"}`}>{notice.text}</p>}
    {upcoming.length === 0 && <p className="rounded-xl border border-border bg-card p-4 text-sm">You have no upcoming shifts. When Empowr staff assign you to a session, it will appear here for you to accept.</p>}
    {upcoming.map(s => {
      const cancelled = s.sessionStatus === "cancelled";
      return <article key={s.id} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold">{s.title}</h2>
          <span className="rounded-full border border-border px-2 text-xs font-bold">
            {cancelled ? "Session cancelled" : s.kind === "training" ? "Training place" : s.response === "accepted" ? "Accepted" : s.response === "declined" ? "Declined" : "Waiting for your answer"}
          </span>
        </div>
        <p className="text-sm font-semibold text-blue">{whenText(s.startsAt, s.endsAt)}</p>
        <p className="text-sm text-muted">{venueText(s.venue)} · {s.role}{s.isCover ? " · Cover" : ""}</p>
        {!cancelled && s.kind === "shift" && s.response === "pending" && <div className="mt-3 flex gap-2">
          <button type="button" disabled={busy === s.id} className={`${button} bg-blue text-white hover:bg-blue-dark`} onClick={() => act(s.id, "response", { response: "accept" }, "Shift accepted.")}>Accept</button>
          <button type="button" disabled={busy === s.id} className={`${button} border border-border text-ink`} onClick={() => act(s.id, "response", { response: "decline" }, "Shift declined.")}>Decline</button>
        </div>}
        {!cancelled && s.kind === "shift" && s.response === "pending" && (() => {
          const n = seriesPending(s);
          return n > 1 && <button type="button" disabled={busy === s.id} className="mt-2 text-sm font-semibold text-blue disabled:opacity-50"
            onClick={() => act(s.id, "response", { response: "accept", scope: "series" }, `${n} shifts accepted.`)}>Accept this and the {n - 1} later {n - 1 === 1 ? "date" : "dates"} in this series</button>;
        })()}
        {s.canCheckIn && <button type="button" disabled={busy === s.id} className="mt-3 w-full rounded-xl bg-blue px-4 py-4 text-lg font-bold text-white hover:bg-blue-dark disabled:opacity-50 sm:w-auto" onClick={() => act(s.id, "check-in", {}, "You're checked in. Have a great session!")}>I&apos;m Here</button>}
        {s.attendance === "attended" && s.checkedInAt && <p className="mt-3 text-sm font-bold text-ink">✓ Checked in at {timeOnly(s.checkedInAt)}</p>}
        {s.attendance && s.attendance !== "unconfirmed" && !(s.attendance === "attended" && s.checkedInAt) && <p className="mt-3 text-sm font-bold text-ink">{ATTENDANCE[s.attendance]}</p>}
        {s.canSelfConfirm && <div className="mt-3 rounded-lg border border-border bg-blue-pale p-3 text-sm">
          <p>You didn&apos;t check in for this shift. Check-in confirms your hours for payment.</p>
          {confirming !== s.id
            ? <button type="button" disabled={busy === s.id} className={`${button} mt-2 bg-blue text-white hover:bg-blue-dark`} onClick={() => openConfirm(s.id)}>Confirm I was there</button>
            : <fieldset className="mt-3">
                <legend className="font-bold">Why didn&apos;t you tap I&apos;m Here when you arrived?</legend>
                <div className="mt-2 space-y-1">
                  {MISSED_CHECK_IN.map(r => <label key={r} className="flex min-h-11 items-center gap-2">
                    <input type="radio" name={`missed-${s.id}`} value={r} checked={choice === r} onChange={() => setChoice(r)} /> {r}
                  </label>)}
                </div>
                {choice === OTHER && <label className="mt-2 block">
                  <span className="sr-only">Tell us what happened</span>
                  <input type="text" value={other} onChange={e => setOther(e.target.value)} maxLength={200} placeholder="Tell us what happened"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2" />
                </label>}
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={busy === s.id || !reasonReady} className={`${button} bg-blue text-white hover:bg-blue-dark`} onClick={() => confirm(s)}>Confirm I was there</button>
                  <button type="button" disabled={busy === s.id} className={`${button} border border-border text-ink`} onClick={() => setConfirming(null)}>Cancel</button>
                </div>
              </fieldset>}
        </div>}
        {!cancelled && s.kind === "shift" && s.response === "accepted" && s.role === "Head Coach" && s.sessionId && Date.parse(s.startsAt) - 30 * 60_000 <= now && Date.parse(s.endsAt) + 86_400_000 > now &&
          <a href={`/my-shifts/session/${s.sessionId}`} className="mt-3 block text-sm font-semibold text-blue">Your team&apos;s check-in →</a>}
        {!cancelled && s.kind === "shift" && s.response === "accepted" && Date.parse(s.startsAt) > now &&
          <button type="button" disabled={busy === s.id} className="mt-3 text-sm font-semibold text-blue disabled:opacity-50" onClick={() => withdraw(s)}>I can no longer do this shift</button>}
      </article>;
    })}
  </div>;
}
