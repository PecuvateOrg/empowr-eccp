"use client";

import { useState } from "react";
import { validateAvailability, type CoachAvailability, type Weekday } from "@/lib/coach-availability";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function AvailabilityUiPreview() {
  const [weekly, setWeekly] = useState<CoachAvailability["weekly"]>([]);
  const [exceptions, setExceptions] = useState<CoachAvailability["exceptions"]>([]);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState(false);
  const edit = () => { setReview(false); setMessage(""); };
  const check = () => {
    const errors = validateAvailability({ weekly, exceptions });
    if (errors.length) { setMessage(errors.join(". ")); setReview(false); return; }
    setReview(true);
    setMessage("Preview validated. No changes were saved.");
  };
  return <div className="mt-6 space-y-6">
    <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      EXAMPLE ONLY — your real availability is unchanged. This screen does not load or save coach data.
    </p>
    <section className="rounded-xl border border-border p-4 sm:p-6">
      <h2 className="text-lg font-bold">Weekly availability</h2>
      <p className="mt-1 text-sm text-muted">Add one or more time slots for each day.</p>
      {days.map((day, index) => <div key={day} className="mt-4 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{day}</h3>
          <button type="button" className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-blue" onClick={() => { edit(); setWeekly(current => [...current, { weekday: index as Weekday, start: "09:00", end: "17:00" }]); }}>Add time</button>
        </div>
        {weekly.map((slot, i) => slot.weekday === index && <div key={i} className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:items-end">
          <label className="text-sm">From<input aria-label={day + " start time"} type="time" value={slot.start} className="mt-1 block w-full rounded-lg border border-border bg-card p-2" onChange={e => { edit(); setWeekly(items => items.map((x, j) => i === j ? { ...x, start: e.target.value } : x)); }} /></label>
          <label className="text-sm">To<input aria-label={day + " end time"} type="time" value={slot.end} className="mt-1 block w-full rounded-lg border border-border bg-card p-2" onChange={e => { edit(); setWeekly(items => items.map((x, j) => i === j ? { ...x, end: e.target.value } : x)); }} /></label>
          <button type="button" className="col-span-2 rounded-lg border border-border px-3 py-2 text-sm text-red-600" onClick={() => { edit(); setWeekly(items => items.filter((_, j) => i !== j)); }}>Remove</button>
        </div>)}
      </div>)}
    </section>
    <section className="rounded-xl border border-border p-4 sm:p-6">
      <h2 className="text-lg font-bold">Specific dates</h2>
      <p className="mt-1 text-sm text-muted">Mark a day unavailable, or set different hours for that date.</p>
      {exceptions.map((item, i) => <div key={i} className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
        <label className="text-sm">Date<input type="date" value={item.date} className="mt-1 block w-full rounded-lg border border-border bg-card p-2" onChange={e => { edit(); setExceptions(items => items.map((x, j) => i === j ? { ...x, date: e.target.value } : x)); }} /></label>
        <label className="text-sm">Availability<select value={item.available ? "available" : "unavailable"} className="mt-1 block w-full rounded-lg border border-border bg-card p-2" onChange={e => { edit(); setExceptions(items => items.map((x, j) => i === j ? { ...x, available: e.target.value === "available" } : x)); }}><option value="unavailable">Unavailable all day</option><option value="available">Different hours</option></select></label>
        {item.available && <><label className="text-sm">From<input type="time" value={item.start ?? "09:00"} className="mt-1 block w-full rounded-lg border border-border bg-card p-2" onChange={e => { edit(); setExceptions(items => items.map((x, j) => i === j ? { ...x, start: e.target.value } : x)); }} /></label><label className="text-sm">To<input type="time" value={item.end ?? "17:00"} className="mt-1 block w-full rounded-lg border border-border bg-card p-2" onChange={e => { edit(); setExceptions(items => items.map((x, j) => i === j ? { ...x, end: e.target.value } : x)); }} /></label></>}
        <button type="button" className="text-left text-sm font-semibold text-red-600" onClick={() => { edit(); setExceptions(items => items.filter((_, j) => i !== j)); }}>Remove exception</button>
      </div>)}
      <button type="button" className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-blue" onClick={() => { edit(); setExceptions(items => [...items, { date: "", available: false }]); }}>Add date exception</button>
    </section>
    <button type="button" className="rounded-lg bg-blue px-5 py-3 font-semibold text-white" onClick={check}>Review example availability</button>
    {message && <p role="status" className="text-sm">{message}</p>}
    {review && <section className="rounded-xl border border-border p-4" aria-label="Availability preview summary">
      <h2 className="font-bold">Review summary — not saved</h2>
      <p className="mt-2 text-sm">{weekly.length} weekly time slots and {exceptions.length} date exceptions.</p>
      <ul className="mt-2 space-y-1 text-sm">{weekly.map((x, i) => <li key={i}>{days[x.weekday]}: {x.start}–{x.end}</li>)}{exceptions.map((x, i) => <li key={"e" + i}>{x.date}: {x.available ? x.start + "–" + x.end : "Unavailable"}</li>)}</ul>
    </section>}
  </div>;
}
