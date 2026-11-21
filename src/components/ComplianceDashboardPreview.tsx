"use client";

import { useMemo, useState } from "react";
import { ComplianceReminderPreview } from "@/components/ComplianceReminderPreview";
import {
  gradeLabels, requirementKeys, requirementLabels, sampleOnboardingCoaches,
  stageLabels, missingRequirements, type OnboardingStage, type RequirementKey,
} from "@/lib/onboarding-preview";

const statusText = { complete: "Complete (example)", pending: "Outstanding (example)", not_required: "Not required" } as const;
const filters: Array<OnboardingStage | "all"> = ["all", "invited", "in_progress", "ready_for_activation", "active", "withdrawn"];

export function ComplianceDashboardPreview() {
  const [stage, setStage] = useState<OnboardingStage | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const coaches = useMemo(() => sampleOnboardingCoaches.filter(coach =>
    (stage === "all" || coach.stage === stage) &&
    (coach.name + " " + gradeLabels[coach.grade]).toLowerCase().includes(search.trim().toLowerCase())
  ), [stage, search]);
  const selected = sampleOnboardingCoaches.find(coach => coach.id === selectedId) ?? null;
  const outstanding = sampleOnboardingCoaches.filter(coach => missingRequirements(coach).length > 0 && coach.stage !== "withdrawn").length;
  const ready = sampleOnboardingCoaches.filter(coach => coach.stage === "ready_for_activation").length;

  return (
    <div className="mt-6 space-y-6">
      <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>EXAMPLE ONLY — NOT LIVE COMPLIANCE DATA.</strong> All names and statuses are fictional.
        This dashboard does not access coach records, verify evidence, send reminders or activate coaches.
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Example coaches", sampleOnboardingCoaches.length],
          ["With outstanding items", outstanding],
          ["Awaiting founder activation", ready],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-sm font-semibold">Search example coaches
          <input className="mt-1 w-full rounded-lg border border-border bg-card p-3 font-normal" value={search}
            onChange={event => setSearch(event.target.value)} placeholder="Coach name or grade" />
        </label>
        <label className="text-sm font-semibold">Onboarding stage
          <select className="mt-1 block w-full rounded-lg border border-border bg-card p-3 font-normal" value={stage}
            onChange={event => setStage(event.target.value as OnboardingStage | "all")}>
            {filters.map(value => <option key={value} value={value}>{value === "all" ? "All stages" : stageLabels[value]}</option>)}
          </select>
        </label>
      </div>
      <div className="space-y-3">
        {coaches.length === 0 && <p className="rounded-xl border border-border p-5 text-sm">No examples match these filters.</p>}
        {coaches.map(coach => {
          const pending = missingRequirements(coach);
          return (
            <section key={coach.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{coach.name}</h2>
                  <p className="text-sm text-muted">{gradeLabels[coach.grade]} · {stageLabels[coach.stage]}</p>
                  <p className="mt-2 text-sm">{pending.length} outstanding requirement{pending.length === 1 ? "" : "s"} (example)</p>
                </div>
                <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-blue"
                  onClick={() => setSelectedId(selectedId === coach.id ? null : coach.id)}
                  aria-expanded={selectedId === coach.id}>
                  {selectedId === coach.id ? "Hide details" : "View checklist"}
                </button>
              </div>
              {selected?.id === coach.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="font-semibold">Compliance checklist — example</h3>
                  <ul className="mt-3 space-y-3">
                    {requirementKeys.map((key: RequirementKey) => (
                      <li key={key} className="flex flex-wrap justify-between gap-2 text-sm">
                        <span>{requirementLabels[key]}</span>
                        <span className={coach.requirements[key] === "pending" ? "font-semibold text-amber-800" : "text-muted"}>
                          {statusText[coach.requirements[key]]}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <ComplianceReminderPreview key={coach.id} coachName={coach.name} requirements={requirementKeys.filter(key => coach.requirements[key] === "pending").map(key => requirementLabels[key])} />
                  <p className="mt-4 text-xs text-muted">Only authorized staff will verify real requirements. Final coach activation is reserved for the founder after secure integration.</p>
                  <button type="button" disabled className="mt-3 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">
                    Verify / activate — unavailable in example
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
