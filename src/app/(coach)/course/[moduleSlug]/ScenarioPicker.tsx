"use client";

import { useState } from "react";
import type { Scenario } from "@/lib/safeguarding-course";

// Practice, not assessment — nothing here is scored or stored, so showing the
// recommended answer after a choice is the point rather than a leak.
export function ScenarioPicker({ scenario }: { scenario: Scenario }) {
  const [chosen, setChosen] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="font-bold text-ink">{scenario.prompt}</p>

      <div className="mt-4 space-y-3">
        {scenario.options.map((option, index) => {
          const picked = chosen === index;
          const revealed = chosen !== null;

          let tone = "border-border bg-warm-white hover:border-blue";
          if (revealed && option.recommended) {
            tone = "border-blue bg-blue-pale";
          } else if (picked) {
            tone = "border-red bg-red/10";
          }

          return (
            <div key={index}>
              <button
                aria-pressed={picked}
                className={`w-full rounded-xl border px-4 py-3 text-left font-medium text-ink transition ${tone}`}
                disabled={revealed}
                onClick={() => setChosen(index)}
                type="button"
              >
                {option.text}
              </button>

              {revealed && (picked || option.recommended) ? (
                <p
                  className={`mt-2 px-4 text-sm leading-6 ${
                    option.recommended ? "text-blue-dark" : "text-muted"
                  }`}
                >
                  {option.feedback}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
