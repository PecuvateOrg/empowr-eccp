"use client";

import { useState, type FormEvent } from "react";
import {
  validateAvailability,
  type CoachAvailability,
  type Weekday,
} from "@/lib/coach-availability";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function CoachAvailabilityForm() {
  const [weekly, setWeekly] = useState<CoachAvailability["weekly"]>([]);
  const [exceptions, setExceptions] = useState<CoachAvailability["exceptions"]>([]);
  const [message, setMessage] = useState("");

  function addWindow(day: Weekday) {
    setWeekly((current) => [...current, { weekday: day, start: "09:00", end: "17:00" }]);
    setMessage("");
  }

  function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateAvailability({ weekly, exceptions });
    setMessage(errors.length
      ? errors.join(". ")
      : "Availability validated. Nothing has been saved; database integration is pending.");
  }

  return (
    <form onSubmit={validate} className="mt-8 space-y-8">
      <section className="rounded-xl border border-border p-6">
        <h2 className="text-xl font-bold">Regular weekly availability</h2>
        <p className="mt-2 text-sm text-muted">Add the times you are usually available each week.</p>
        {days.map((day, index) => (
          <div key={day} className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold">{day}</h3>
              <button type="button" className="text-sm font-bold text-blue"
                onClick={() => addWindow(index as Weekday)}>Add time</button>
            </div>
            {weekly.map((window, i) => window.weekday === index && (
              <div key={i} className="mt-3 flex flex-wrap items-center gap-3">
                <label className="text-sm">From <input type="time" value={window.start}
                  className="ml-2 rounded border border-border bg-transparent p-2"
                  onChange={(e) => setWeekly((items) => items.map((w, j) =>
                    j === i ? { ...w, start: e.target.value } : w))} /></label>
                <label className="text-sm">To <input type="time" value={window.end}
                  className="ml-2 rounded border border-border bg-transparent p-2"
                  onChange={(e) => setWeekly((items) => items.map((w, j) =>
                    j === i ? { ...w, end: e.target.value } : w))} /></label>
                <button type="button" className="text-sm text-red-600"
                  onClick={() => setWeekly((items) => items.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
          </div>
        ))}
      </section>
      <section className="rounded-xl border border-border p-6">
        <h2 className="text-xl font-bold">Date exceptions</h2>
        <p className="mt-2 text-sm text-muted">Override your usual hours for a particular date.</p>
        {exceptions.map((exception, index) => (
          <div key={index} className="mt-4 flex flex-wrap items-center gap-3">
            <input aria-label="Exception date" type="date" value={exception.date}
              className="rounded border border-border bg-transparent p-2"
              onChange={(e) => setExceptions((items) => items.map((x, i) =>
                i === index ? { ...x, date: e.target.value } : x))} />
            <label className="text-sm"><input type="checkbox" checked={exception.available}
              onChange={(e) => setExceptions((items) => items.map((x, i) =>
                i === index ? { ...x, available: e.target.checked } : x))} /> Available</label>
            {exception.available && <>
              <input aria-label="Exception start time" type="time" value={exception.start ?? "09:00"}
                onChange={(e) => setExceptions((items) => items.map((x, i) =>
                  i === index ? { ...x, start: e.target.value } : x))} />
              <input aria-label="Exception end time" type="time" value={exception.end ?? "17:00"}
                onChange={(e) => setExceptions((items) => items.map((x, i) =>
                  i === index ? { ...x, end: e.target.value } : x))} />
            </>}
            <button type="button" className="text-sm text-red-600"
              onClick={() => setExceptions((items) => items.filter((_, i) => i !== index))}>Remove</button>
          </div>
        ))}
        <button type="button" className="mt-4 text-sm font-bold text-blue"
          onClick={() => setExceptions((items) => [...items, {
            date: "", available: false, start: "09:00", end: "17:00",
          }])}>Add date exception</button>
      </section>
      <button type="submit" className="rounded-lg bg-blue px-5 py-3 font-bold text-white">
        Validate availability
      </button>
      {message && <p role="status" className="text-sm">{message}</p>}
      <p className="text-sm text-muted">Preview only: changes are not saved or shared with admins yet.</p>
    </form>
  );
}
