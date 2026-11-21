"use client";

import { useState } from "react";
import { gradeLabels, sampleOnboardingCoaches, stageLabels, missingRequirements, type OnboardingGrade } from "@/lib/onboarding-preview";

const grades: OnboardingGrade[] = ["head_coach", "assistant_coach", "junior_assistant_coach"];

export function CoachGradingPreview() {
  const [assignments, setAssignments] = useState<Record<string, OnboardingGrade>>({});
  const [selected, setSelected] = useState(sampleOnboardingCoaches[0].id);
  const [pending, setPending] = useState<OnboardingGrade | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const coach = sampleOnboardingCoaches.find(item => item.id === selected)!;
  const current = assignments[coach.id] ?? coach.grade;
  const choose = (id: string) => { setSelected(id); setPending(null); };
  const apply = () => {
    if (!pending || pending === current) return;
    setHistory(items => [coach.name + ": " + gradeLabels[current] + " → " + gradeLabels[pending] + " (example only)", ...items]);
    setAssignments(items => ({ ...items, [coach.id]: pending }));
    setPending(null);
  };
  return <div className="mt-6 space-y-5">
    <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      EXAMPLE ONLY — fictional coaches. Grade changes are stored in this page temporarily, not in the database. No permissions, compliance verification, or activation is changed.
    </p>
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-bold">Example coach roster</h2>
        <div className="mt-3 space-y-2">{sampleOnboardingCoaches.map(item => <button type="button" key={item.id} onClick={() => choose(item.id)}
          aria-pressed={selected === item.id} className={"w-full rounded-lg border p-3 text-left text-sm " + (selected === item.id ? "border-blue bg-blue/5" : "border-border")}>
          <span className="block font-semibold">{item.name}</span>
          <span className="text-muted">{gradeLabels[assignments[item.id] ?? item.grade]} · {stageLabels[item.stage]}</span>
        </button>)}</div>
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-bold">{coach.name}</h2>
        <p className="mt-1 text-sm text-muted">Current example grade: {gradeLabels[current]}</p>
        <p className="mt-1 text-sm text-muted">Onboarding stage: {stageLabels[coach.stage]}</p>
        <p className="mt-1 text-sm text-muted">Outstanding compliance items: {missingRequirements(coach).length}</p>
        <label className="mt-5 block text-sm font-semibold">Proposed coaching grade
          <select className="mt-1 block w-full rounded-lg border border-border bg-card p-3 font-normal" value={pending ?? current} onChange={event => setPending(event.target.value as OnboardingGrade)}>
            {grades.map(grade => <option key={grade} value={grade}>{gradeLabels[grade]}</option>)}
          </select>
        </label>
        <p className="mt-3 text-xs text-muted">A Head Coach requires First Aid certification. This preview does not approve compliance, assign roles, or activate a coach.</p>
        {pending && pending !== current && <div className="mt-4 rounded-lg border border-border p-3 text-sm">
          <p><strong>Review example change:</strong> {gradeLabels[current]} → {gradeLabels[pending]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={apply} className="rounded-lg bg-blue px-4 py-2 font-semibold text-white">Confirm example change</button>
            <button type="button" onClick={() => setPending(null)} className="rounded-lg border border-border px-4 py-2">Cancel</button>
          </div>
        </div>}
      </section>
    </div>
    <section className="rounded-xl border border-border p-4">
      <h2 className="font-bold">Example change history (this page only)</h2>
      {history.length ? <ul className="mt-3 space-y-2 text-sm">{history.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-muted">No example changes yet.</p>}
    </section>
  </div>;
}
