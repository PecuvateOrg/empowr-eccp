"use client";
import { useEffect, useState } from "react";
import type { AssignmentView } from "@/lib/coach-assignment-storage";
import { londonSessionStartUtc } from "@/lib/london-session-time";
import type { AssignableSession } from "@/lib/assignable-sessions";
export function StaffAssignmentsList() {
 const [items, setItems] = useState<AssignmentView[]>([]);
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(true);
 const [loadFailed, setLoadFailed] = useState(false);
 const [form, setForm] = useState({ coachId: "", sessionId: "", date: "", start: "", end: "" });
 const [coaches, setCoaches] = useState<{id:string;full_name:string;email:string}[]>([]);
 const [directoryError, setDirectoryError] = useState(false);
 const [sessions, setSessions] = useState<AssignableSession[]>([]);
 const [sessionSourceReady, setSessionSourceReady] = useState(false);
 const [selectedSession, setSelectedSession] = useState("");
 const [availabilityPreview, setAvailabilityPreview] = useState<{id:string;name:string;available:boolean;overlap:boolean;status:string}[]>([]);
 const [previewError, setPreviewError] = useState("");
 const [previewFor, setPreviewFor] = useState("");
 const sessionKey = `${form.date}|${form.start}|${form.end}`;
 const previewCurrent = previewFor === sessionKey;
 const startAtUtc = londonSessionStartUtc(form.date, form.start);
 const [saving, setSaving] = useState(false);
 const [statusFilter, setStatusFilter] = useState("all");
 const visible = items.filter((item) => statusFilter === "all" || item.status === statusFilter);
 const offeredCount = items.filter((item) => item.status === "offered").length;
 const acceptedCount = items.filter((item) => item.status === "accepted").length;
 const [alerts, setAlerts] = useState<{id:string;assignment_id:string;alert_type:string;status:string;created_at:string}[]>([]);
 async function refreshAlerts() {
  try {
   const response = await fetch("/api/management/assignments/alerts", { cache: "no-store" });
   if (!response.ok) throw new Error("Unavailable");
   setAlerts((await response.json()).alerts);
   setError("Alert queue refreshed.");
  } catch { setError("Alert queue is unavailable until staging migration."); }
 }
 const [conflicts, setConflicts] = useState<{assignmentId:string;sessionId:string;date:string}[]>([]);
 async function checkConflicts() {
  try {
   const response = await fetch("/api/management/assignments/conflicts", { cache: "no-store" });
   if (!response.ok) throw new Error("Unavailable");
   setConflicts((await response.json()).conflicts);
   setError("Conflict preview refreshed.");
  } catch { setError("Conflict preview is not available until staging database setup."); }
 }
 async function previewCoaches() {
  setPreviewError(""); setPreviewFor(""); setAvailabilityPreview([]);
  try {
   const query = new URLSearchParams({ date: form.date, start: form.start, end: form.end });
   const response = await fetch(`/api/management/assignments/availability?${query}`, { cache: "no-store" });
   if (!response.ok) throw new Error("Unavailable");
   const data = await response.json();
   setAvailabilityPreview(data.coaches); setPreviewFor(sessionKey);
  } catch { setPreviewError("Availability preview is not available until staging is configured."); }
 }
 async function offer(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (!startAtUtc) { setError("Select a valid London session date and time. Daylight-saving transition hours may be ambiguous."); return; }
  setSaving(true); setError("");
  try {
   const response = await fetch("/api/management/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, startAtUtc }) });
   if (!response.ok) throw new Error("Offer could not be saved");
   const listing = await fetch("/api/management/assignments", { cache: "no-store" });
   if (listing.ok) setItems((await listing.json()).assignments);
   setError("Session offer created.");
  } catch { setError("Could not create the offer. Confirm coach ID, London time, UTC start, and staging setup."); }
  finally { setSaving(false); }
 }
 useEffect(() => {
  fetch("/api/management/assignments/sessions", { cache: "no-store" })
   .then(async (response) => { if (!response.ok) throw new Error("Not configured"); return response.json(); })
   .then((data) => { setSessions(data.sessions); setSessionSourceReady(true); })
   .catch(() => setSessionSourceReady(false));
  fetch("/api/management/assignments/coaches", { cache: "no-store" })
   .then(async (response) => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
   .then((data) => setCoaches(data.coaches))
   .catch(() => setDirectoryError(true));
  fetch("/api/management/assignments", { cache: "no-store" })
   .then(async (r) => { if (!r.ok) throw new Error("Unavailable"); return r.json(); })
   .then((data) => { setItems(data.assignments); setLoadFailed(false); })
   .catch(() => { setLoadFailed(true); setError("Scheduling storage is not ready yet."); })
   .finally(() => setLoading(false));
 }, []);
 return <section className="mt-8 space-y-3">
  <form onSubmit={offer} className="space-y-3 rounded-xl border border-border p-5">
   <h2 className="font-bold">Offer a coach a session</h2>
   <p className="text-sm text-muted">Select a coach and enter the session details in London local time. Staging integration is required before offers can be saved.</p>
   <label className="block text-sm">Coach
    <select required value={form.coachId} onChange={(event) => setForm((current) => ({ ...current, coachId: event.target.value }))} className="mt-1 block w-full rounded border border-border bg-transparent p-2">
     <option value="">Select a coach</option>
     {coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.full_name} ({coach.email})</option>)}
    </select>
   </label>
   {directoryError && <p role="status" className="text-sm text-muted">Coach directory is currently unavailable.</p>}
   {sessionSourceReady && <label className="block text-sm">Choose a scheduled session
    <select value={selectedSession} onChange={(event) => {
     const id = event.target.value;
     setSelectedSession(id);
     const session = sessions.find((entry) => entry.id === id);
     if (session) setForm((current) => ({ ...current, sessionId: session.id, date: session.date, start: session.start, end: session.end }));
    }} className="mt-1 block w-full rounded border border-border bg-transparent p-2">
     <option value="">Select a session</option>
     {sessions.map((session) => <option key={session.id} value={session.id}>{session.title} · {session.date} · {session.start} · {session.venue}</option>)}
    </select>
   </label>}
   {!sessionSourceReady && <p className="text-sm text-muted">Live session selection is awaiting connection to Empowr’s booking system. Manual session references are available for staging testing only.</p>}
   {([["sessionId","Session reference","text"],["date","Session date","date"],["start","Start time (London)","time"],["end","End time (London)","time"]] as const).map(([key,label,type]) =>
    <label key={key} className="block text-sm">{label}
     <input required type={type} readOnly={sessionSourceReady} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
      className="mt-1 block w-full rounded border border-border bg-transparent p-2" />
    </label>)}
   {form.date && form.start && !startAtUtc && <p className="text-sm text-muted">This date or time is invalid or ambiguous due to daylight saving. Please choose another time.</p>}
   <div className="space-y-2 rounded border border-border p-3">
    <h3 className="font-semibold">Coach availability preview</h3>
    <p className="text-sm text-muted">Checks recorded availability and overlapping ECCP assignments. This does not verify coaching grade, safeguarding or activation.</p>
    <button type="button" disabled={!form.date || !form.start || !form.end} onClick={previewCoaches} className="rounded border border-border px-3 py-2 text-sm">Check coach availability</button>
    {previewError && <p role="status" className="text-sm">{previewError}</p>}
    {previewFor && !previewCurrent && <p className="text-sm text-muted">Session details changed. Check availability again.</p>}
    {previewCurrent && !availabilityPreview.length && <p className="text-sm text-muted">No coaches found in the directory.</p>}
    {previewCurrent && availabilityPreview.map((coach) => <p key={coach.id} className="text-sm">{coach.name}: {coach.status}</p>)}
   </div>
   <button disabled={saving || !coaches.length || !startAtUtc} type="submit" className="rounded bg-blue px-4 py-2 text-white disabled:opacity-50">{saving ? "Saving..." : "Offer session"}</button>
  </form>
  <div className="rounded-xl border border-border p-4">
   <h2 className="font-bold">Administrator alert queue</h2>
   <p className="text-sm text-muted">Review queued availability conflicts and urgent withdrawals. Sending notifications is not enabled.</p>
   <button onClick={refreshAlerts} className="mt-2 rounded border border-border px-4 py-2">Refresh alerts</button>
   {alerts.map((a) => <p key={a.id} className="mt-2 text-sm">{a.alert_type} · {a.status} · Assignment {a.assignment_id}</p>)}
  </div>
  <div className="rounded-xl border border-border p-4">
   <h2 className="font-bold">Availability conflict preview</h2>
   <p className="text-sm text-muted">Read-only check of offered and accepted assignments. This does not send notifications.</p>
   <button onClick={checkConflicts} className="mt-2 rounded border border-border px-4 py-2">Check conflicts</button>
   {conflicts.map((c) => <p key={c.assignmentId} className="mt-2 text-sm">Conflict: {c.sessionId} on {c.date} (assignment {c.assignmentId})</p>)}
  </div>
  {error && <p role="status">{error}</p>}
  {loading && <p role="status" className="text-muted">Loading assignments…</p>}
  {!loading && !loadFailed && !items.length && <p className="text-muted">No assignments available.</p>}
  {!loading && !loadFailed && <div className="space-y-3 rounded-xl border border-border p-4">
   <h2 className="font-bold">Assignment overview</h2>
   <p className="text-sm text-muted">{offeredCount} awaiting response · {acceptedCount} accepted · {items.length} total</p>
   <label className="block text-sm">Filter by status
    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block w-full rounded border border-border bg-transparent p-2">
     {["all","offered","accepted","declined","withdrawn","completed","cancelled"].map((status) => <option key={status} value={status}>{status === "all" ? "All assignments" : status}</option>)}
    </select>
   </label>
   {!visible.length && !!items.length && <p className="text-sm text-muted">No assignments match this status.</p>}
  </div>}
  {!loadFailed && visible.map((item) => <article key={item.id} className="rounded-xl border border-border p-4">
   <h2 className="font-bold">{item.sessionId}</h2>
   <p className="text-sm">{item.date} · {item.start}–{item.end} · Coach ID: {item.coachId}</p>
   <p className="text-sm">Status: {item.status}</p>
   {item.reason && <p className="text-sm">Reason: {item.reason}</p>}
  </article>)}
  <p className="text-sm text-muted">Assignment offers require staging integration. Alerts can be queued after the migrations are applied, but notification delivery is not enabled.</p>
 </section>;
}
