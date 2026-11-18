"use client";
import { useEffect, useState } from "react";
import type { AssignmentView } from "@/lib/coach-assignment-storage";

export function CoachSessionsList() {
 const [items, setItems] = useState<AssignmentView[]>([]);
 const [message, setMessage] = useState("");
 const [busy, setBusy] = useState<string | null>(null);
 const [reasons, setReasons] = useState<Record<string,string>>({});
 async function load() {
  const response = await fetch("/api/coach/assignments", { cache: "no-store" });
  if (!response.ok) throw new Error("Scheduling is not available yet");
  const result = await response.json();
  setItems(result.assignments);
 }
 useEffect(() => {
  let cancelled = false;
  fetch("/api/coach/assignments", { cache: "no-store" })
   .then(async (response) => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
   .then((result) => { if (!cancelled) setItems(result.assignments); })
   .catch(() => { if (!cancelled) setMessage("Scheduling storage is not enabled yet."); });
  return () => { cancelled = true; };
 }, []);
 async function decide(id: string, decision: "accept" | "decline" | "withdraw") {
  setBusy(id); setMessage("");
  try {
   const response = await fetch(`/api/coach/assignments/${id}/decision`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reason: reasons[id] }),
   });
   if (!response.ok) throw new Error("Decision could not be saved");
   await load();
   setMessage("Your response has been recorded.");
  } catch { setMessage("Unable to save your response. Please contact the team if the session is urgent."); }
  finally { setBusy(null); }
 }
 return <section className="mt-8 space-y-4">
  {message && <p role="status" className="text-sm">{message}</p>}
  {!items.length && <p className="text-muted">No assigned sessions are currently shown.</p>}
  {items.map((item) => <article key={item.id} className="rounded-xl border border-border p-5">
   <h2 className="font-bold">{item.sessionId}</h2>
   <p className="mt-1 text-sm">{item.date} · {item.start}–{item.end} (London time)</p>
   <p className="mt-1 text-sm">Status: <strong>{item.status}</strong></p>
   {item.status === "offered" && <div className="mt-4 flex gap-3">
    <button disabled={busy === item.id} onClick={() => decide(item.id,"accept")} className="rounded bg-blue px-4 py-2 text-white disabled:opacity-50">Accept</button>
    <button disabled={busy === item.id} onClick={() => decide(item.id,"decline")} className="rounded border border-border px-4 py-2 disabled:opacity-50">Decline</button>
   </div>}
   {item.status === "accepted" && <div className="mt-4 space-y-3">
    <label className="block text-sm font-semibold" htmlFor={`reason-${item.id}`}>Reason for withdrawal</label>
    <textarea id={`reason-${item.id}`} maxLength={500} className="w-full rounded border border-border bg-transparent p-2"
     value={reasons[item.id] ?? ""} onChange={(e) => setReasons((v) => ({ ...v, [item.id]: e.target.value }))}/>
    <button disabled={busy === item.id || !reasons[item.id]?.trim()} onClick={() => decide(item.id,"withdraw")}
     className="rounded border border-border px-4 py-2 disabled:opacity-50">Withdraw from session</button>
   </div>}
  </article>)}
 </section>;
}
