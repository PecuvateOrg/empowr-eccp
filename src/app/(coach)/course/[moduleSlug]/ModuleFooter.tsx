"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

export function ModuleFooter({
  moduleSlug,
  isComplete,
  initialReflection,
  prompt,
  placeholder,
  nextHref,
  nextLabel,
}: {
  moduleSlug: string;
  isComplete: boolean;
  initialReflection: string;
  prompt: string | null;
  placeholder: string | null;
  nextHref: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const [reflection, setReflection] = useState(initialReflection);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);

    const response = await fetch("/api/course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleSlug, reflectionText: reflection || null }),
    });

    if (!response.ok) {
      setBusy(false);
      setError("Could not save your progress. Please try again.");
      return;
    }

    router.push(nextHref);
    router.refresh();
  }

  return (
    <section className="mt-10 border-t border-border pt-8">
      {prompt ? (
        <>
          <label className="block font-bold text-ink" htmlFor="reflection">
            {prompt}
          </label>
          <textarea
            className="mt-3 w-full rounded-xl border border-border bg-warm-white px-4 py-3 text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue-pale"
            id="reflection"
            onChange={(event) => setReflection(event.target.value)}
            placeholder={placeholder ?? undefined}
            rows={6}
            value={reflection}
          />
        </>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark disabled:opacity-60"
          disabled={busy}
          onClick={save}
          type="button"
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : null}
          {nextLabel}
        </button>

        {isComplete ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue">
            <Check aria-hidden="true" className="size-4" />
            Already completed
          </span>
        ) : null}
      </div>

      {error ? (
        <p
          className="mt-4 rounded-lg bg-red/10 px-4 py-3 text-sm font-bold text-red-dark"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
