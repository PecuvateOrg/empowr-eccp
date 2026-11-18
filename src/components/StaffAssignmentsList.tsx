"use client";
import { useEffect, useState } from "react";
import type { AssignmentView } from "@/lib/coach-assignment-storage";
export function StaffAssignmentsList() {
 const [items, setItems] = useState<AssignmentView[]>([]);
 const [error, setError] = useState("");
 const [form, setForm] = useState({ coachId: "", sessionId: "", date: "", start: "", end: "", startAtUtc: "" });
 const [saving, setSaving] = useState(false);
 async function offer(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setSaving(true); setError("");
  try {
   const response = await fetch("/api/management/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
   if (!response.ok) throw new Error("Offer could not be saved");
   const listing = await fetch("/api/management/assignments", { cache: "no-store" });
   if (listing.ok) setItems((await listing.json()).assignments);
   setError("Session offer created.");
  } catch { setError("Could not create the offer. Confirm coach ID, London time, UTC start, and staging setup."); }
  finally { setSaving(false); }
 }
 useEffect(() => {
  fetch("/api/management/assignments", { cache: "no-store" })
   .then(async (r) => { if (!r.ok) throw new Error("Unavailable"); return r.json(); })
   .then((data) => setItems(data.assignments))
   .catch(() => setError("Scheduling storage is not ready yet."));
 }, []);
 return <section className="mt-8 space-y-3">
  <form onSubmit={offer} className="space-y-3 rounded-xl border border-border p-5">
   <h2 className="font-bold">Offer a coach a session</h2>
   <p className="text-sm text-muted">Staging integration required. Confirm the coach ID and the UTC instant corresponding to the London session start.</p>
   {([["coachId","Coach UUID"],["sessionId","Session reference"],["date","Session date (YYYY-MM-DD)"],["start","Start (HH:mm London)"],["end","End (HH:mm London)"],["startAtUtc","UTC start (e.g. 2026-11-23T10:00:00Z)"]] as const).map(([key,label]) =>
    <label key={key} className="block text-sm">{label}
     <input required value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
      className="mt-1 block w-full rounded border border-border bg-transparent p-2" />
    </label>)}
   <button disabled={saving} type="submit" className="rounded bg-blue px-4 py-2 text-white disabled:opacity-50">{saving ? "Saving..." : "Offer session"}</button>
  </form>
  {error && <p role="alert">{error}</p>}
  {!items.length && <p className="text-muted">No assignments available.</p>}
  {items.map((item) => <article key={item.id} className="rounded-xl border border-border p-4">
   <h2 className="font-bold">{item.sessionId}</h2>
   <p className="text-sm">{item.date} · {item.start}–{item.end} · Coach ID: {item.coachId}</p>
   <p className="text-sm">Status: {item.status}</p>
   {item.reason && <p className="text-sm">Reason: {item.reason}</p>}
  </article>)}
  <p className="text-sm text-muted">Read-only management view. Assignment creation and notifications are pending staging integration.</p>
 </section>;
}
