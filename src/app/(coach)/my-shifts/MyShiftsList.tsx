"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { venueText, whenText, type Venue } from "@/lib/efn-staffing";

export type CoachShift = {
  id: string; kind: "shift" | "training"; role: string; title: string; startsAt: string; endsAt: string; venue: Venue | null;
  sessionStatus: string; response: "pending" | "accepted" | "declined" | null; status: string | null; isCover: boolean;
};
const button = "rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50";

export function MyShiftsList({ shifts }: { shifts: CoachShift[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  async function act(id: string, action: "response" | "withdraw", body: object, ok: string) {
    setBusy(id); setNotice(null);
    try {
      const res = await fetch(`/api/shifts/${id}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      setNotice(res.ok ? { error: false, text: ok } : { error: true, text: data.error ?? "Something went wrong. Try again." });
      if (res.ok) router.refresh();
    } catch { setNotice({ error: true, text: "Couldn't reach ECCP. Check your connection and try again." }); }
    setBusy(null);
  }
  const withdraw = (s: CoachShift) => {
    const reason = window.prompt(`Why are you pulling out of ${s.title}? (needed for staff to arrange cover)`);
    if (reason !== null) act(s.id, "withdraw", { reason }, "You've pulled out of this shift. Staff have been told.");
  };
  const upcoming = shifts.filter(s => new Date(s.endsAt) > new Date());
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
        {!cancelled && s.kind === "shift" && s.response === "accepted" &&
          <button type="button" disabled={busy === s.id} className="mt-3 text-sm font-semibold text-blue disabled:opacity-50" onClick={() => withdraw(s)}>I can no longer do this shift</button>}
      </article>;
    })}
  </div>;
}
