"use client";
import { useEffect, useState } from "react";
import type { AssignmentView } from "@/lib/coach-assignment-storage";
export function StaffAssignmentsList() {
 const [items, setItems] = useState<AssignmentView[]>([]);
 const [error, setError] = useState("");
 useEffect(() => {
  fetch("/api/management/assignments", { cache: "no-store" })
   .then(async (r) => { if (!r.ok) throw new Error("Unavailable"); return r.json(); })
   .then((data) => setItems(data.assignments))
   .catch(() => setError("Scheduling storage is not ready yet."));
 }, []);
 return <section className="mt-8 space-y-3">
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
