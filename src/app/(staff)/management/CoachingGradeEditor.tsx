"use client";
import { useState } from "react";
import { coachingGradeLabel, type CoachingGrade } from "@/lib/coaching-grade";
export function CoachingGradeEditor({ coachId, initialGrade, canEdit }: { coachId: string; initialGrade: CoachingGrade | null; canEdit: boolean }) {
 const [grade, setGrade] = useState<CoachingGrade | null>(initialGrade);
 const [saved, setSaved] = useState<CoachingGrade | null>(initialGrade);
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState("");
 if (!canEdit) return <span>{coachingGradeLabel(saved)}</span>;
 async function save() {
  setBusy(true); setMessage("");
  try {
   const response = await fetch("/api/management/coaching-grade", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coachId, grade }) });
   const result = await response.json();
   if (!response.ok) throw new Error(result.error || "Unable to save");
   setSaved(grade); setMessage("Saved");
  } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save"); }
  finally { setBusy(false); }
 }
 return <div className="flex min-w-44 flex-col gap-2">
  <label className="sr-only" htmlFor={`grade-${coachId}`}>Coaching grade</label>
  <select id={`grade-${coachId}`} value={grade ?? ""} onChange={e => { setGrade((e.target.value || null) as CoachingGrade | null); setMessage(""); }} className="rounded-lg border border-border bg-card p-2">
   <option value="">Unassigned</option>
   <option value="head_coach">Head Coach</option>
   <option value="assistant_coach">Assistant Coach</option>
   <option value="junior_assistant_coach">Junior Assistant Coach</option>
  </select>
  <button type="button" disabled={busy || grade === saved} onClick={save} className="rounded-lg bg-blue px-3 py-2 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save grade"}</button>
  {message && <span role="status" className="text-xs text-muted">{message}</span>}
 </div>;
}
