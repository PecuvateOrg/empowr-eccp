"use client";
import { useState } from "react";

const sessions = [
  { id: "school", title: "Example school club", when: "Monday · 15:30–16:30", venue: "Example school", children: 24, recurrence: "Whole term" },
  { id: "weekly", title: "Example Sk8 Skool", when: "Saturday · 14:00–15:00", venue: "Example hall", children: 16, recurrence: "Weekly" },
  { id: "event", title: "Example skate event", when: "Sunday · 12:00–14:00", venue: "Example venue", children: 32, recurrence: "Single date" },
];
const coaches = [{ id: "a", name: "Example coach A", role: "Head Coach" }, { id: "b", name: "Example coach B", role: "Assistant Coach" }, { id: "c", name: "Example coach C", role: "Assistant Coach" }];
export function SchedulingExample() {
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [filter, setFilter] = useState("all");
  const covered = (id: string, children: number) => {
    const ids = assignments[id] ?? [];
    return ids.includes("a") && ids.length >= Math.ceil(children / 16);
  };
  const open = sessions.filter(s => !covered(s.id, s.children)).length;
  return <section className="mt-6 space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted">Example sessions</p><p className="text-2xl font-bold">{sessions.length}</p></div>
      <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted">Staffing gaps</p><p className="text-2xl font-bold">{open}</p></div>
    </div>
    <label className="block text-sm font-semibold">Filter sessions
      <select className="mt-2 block w-full rounded-lg border border-border bg-card p-3" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All sessions</option><option value="gaps">Staffing gaps</option></select>
    </label>
    {sessions.filter(s => filter === "all" || !covered(s.id, s.children)).map(s => {
      const ids = assignments[s.id] ?? [];
      return <article key={s.id} className="min-w-0 rounded-xl border border-border bg-card p-4">
        <h2 className="font-bold">{s.title}</h2><p className="mt-1 text-sm text-muted">{s.when} · {s.venue}</p>
        <p className="mt-3 text-sm">{s.children} children · Minimum {Math.ceil(s.children / 16)} eligible coaches · {s.recurrence}</p>
        <p className="mt-2 text-sm font-semibold">{covered(s.id, s.children) ? "Example minimum met" : "Staffing gap"} · {ids.length} selected</p>
        <fieldset className="mt-4 space-y-2"><legend className="text-sm font-semibold">Example coach allocation</legend>
          {coaches.map(c => <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ids.includes(c.id)} onChange={e => setAssignments(prev => ({ ...prev, [s.id]: e.target.checked ? [...(prev[s.id] ?? []), c.id] : (prev[s.id] ?? []).filter(id => id !== c.id) }))} />{c.name} — {c.role}</label>)}
        </fieldset>
        <p className="mt-3 text-xs text-muted">Illustrative minimum only; real eligibility, risk assessment, recurrence and conflicts require server-side checks.</p>
      </article>;
    })}
  </section>;
}
