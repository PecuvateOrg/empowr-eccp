"use client";

import { useState } from "react";
import {
  gradeLabels, missingRequirements, requirementKeys, requirementLabels,
  sampleOnboardingCoaches, stageLabels, type OnboardingStage,
} from "@/lib/onboarding-preview";

const stages: OnboardingStage[] = ["invited", "in_progress", "ready_for_activation", "active"];

export function OnboardingPreview() {
  const [selectedId, setSelectedId] = useState(sampleOnboardingCoaches[0].id);
  const [filter, setFilter] = useState<OnboardingStage | "all">("all");
  const visible = sampleOnboardingCoaches.filter(coach => filter === "all" || coach.stage === filter);
  const selected = sampleOnboardingCoaches.find(coach => coach.id === selectedId) ?? sampleOnboardingCoaches[0];
  const missing = missingRequirements(selected);
  return (
    <div className="mt-6 space-y-6">
      <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>DEMONSTRATION ONLY — SAMPLE DATA.</strong> This page does not read or write coach records, verify compliance, send notifications or activate coaches.
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="onboarding-stage-filter" className="text-sm font-semibold">Filter onboarding stage</label>
        <select id="onboarding-stage-filter" className="rounded-lg border border-border bg-card p-2" value={filter}
          onChange={event => setFilter(event.target.value as OnboardingStage | "all")}>
          <option value="all">All stages</option>
          {Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Sample coach roster" className="space-y-2">
          {visible.length === 0 && <p className="text-sm text-muted">No sample coaches at this stage.</p>}
          {visible.map(coach => (
            <button key={coach.id} type="button" onClick={() => setSelectedId(coach.id)}
              aria-pressed={selected.id === coach.id}
              className={`w-full rounded-xl border p-4 text-left ${selected.id === coach.id ? "border-blue bg-blue/5" : "border-border bg-card"}`}>
              <span className="block font-bold">{coach.name}</span>
              <span className="block text-sm text-muted">{gradeLabels[coach.grade]} · {stageLabels[coach.stage]}</span>
              <span className="block text-xs text-muted">{missingRequirements(coach).length} outstanding requirements</span>
            </button>
          ))}
        </section>
        <section aria-label="Sample onboarding detail" className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-bold">{selected.name}</h2>
          <p className="mt-1 text-sm text-muted">{gradeLabels[selected.grade]} · {stageLabels[selected.stage]}</p>
          <div aria-label="Onboarding stages" className="mt-5 grid grid-cols-4 gap-2">
            {stages.map((stage, index) => {
              const currentIndex = stages.indexOf(selected.stage);
              const complete = currentIndex >= index && selected.stage !== "withdrawn";
              return <div key={stage} className="space-y-2">
                <div className={`h-2 rounded-full ${complete ? "bg-emerald-600" : "bg-gray-200"}`} />
                <span className="block text-xs">{stageLabels[stage]}</span>
              </div>;
            })}
          </div>
          {selected.stage === "withdrawn" && <p className="mt-3 text-sm font-semibold text-red-700">Withdrawn — not eligible for activation.</p>}
          <h3 className="mt-6 font-bold">Requirements</h3>
          <ul className="mt-3 space-y-3">
            {requirementKeys.map(key => {
              const status = selected.requirements[key];
              return <li key={key} className="flex items-center justify-between gap-3 text-sm">
                <span>{requirementLabels[key]}</span>
                <span className={status === "complete" ? "font-semibold text-emerald-700" : "text-muted"}>
                  {status === "complete" ? "Verified (sample)" : status === "pending" ? "Pending" : "Not required"}
                </span>
              </li>;
            })}
          </ul>
          <p className="mt-5 text-sm text-muted">{missing.length === 0 ? "No sample requirements outstanding." : `${missing.length} requirement(s) outstanding.`}</p>
          <button type="button" disabled className="mt-4 w-full rounded-lg bg-gray-200 p-3 font-semibold text-gray-600">
            Founder activation — unavailable in preview
          </button>
        </section>
      </div>
    </div>
  );
}
