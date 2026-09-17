"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import type { AssessmentQuestion } from "@/lib/safeguarding-course";

interface QuestionResult {
  id: number;
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

interface SubmitResponse {
  score: number;
  passed: boolean;
  results: QuestionResult[];
}

export function AssessmentForm({
  questions,
}: {
  questions: readonly AssessmentQuestion[];
}) {
  const [selected, setSelected] = useState<Array<number | null>>(
    () => questions.map(() => null),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const allAnswered = selected.every((value) => value !== null);

  // Submitting from partway down a 20-question list leaves the page scrolled
  // there — without this, the pass/fail banner and the certificate link
  // render off-screen above the fold and can go unnoticed.
  useEffect(() => {
    if (result) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [result]);

  async function submit() {
    setBusy(true);
    setError(null);

    const response = await fetch("/api/course/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: selected }),
    });

    setBusy(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not submit your answers. Please try again.");
      return;
    }

    setResult(await response.json());
  }

  function retake() {
    setSelected(questions.map(() => null));
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <div className="mt-8">
        <div
          className={`rounded-2xl border p-6 ${
            result.passed
              ? "border-blue bg-blue-pale"
              : "border-red bg-red/10"
          }`}
        >
          <p className="text-2xl font-black text-ink">{result.score}%</p>
          <p className="mt-1 font-bold text-ink">
            {result.passed
              ? "You passed — your certificate is being generated now."
              : "Not quite — review the feedback below and try again."}
          </p>
        </div>

        {result.passed ? (
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark"
            href="/certificate"
          >
            View your certificate
          </Link>
        ) : null}

        <ol className="mt-8 space-y-4">
          {questions.map((question, index) => {
            const item = result.results[index];
            return (
              <li
                key={question.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white ${
                      item.correct ? "bg-blue" : "bg-red-dark"
                    }`}
                  >
                    {item.correct ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      <X aria-hidden="true" className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{question.question}</p>
                    <p className="mt-1 text-sm text-muted">
                      Correct answer: {question.options[item.correctIndex]}
                    </p>
                    <p className="mt-1 text-sm text-muted">{item.explanation}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {result.passed ? (
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark"
            href="/certificate"
          >
            View your certificate
          </Link>
        ) : (
          <button
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark"
            onClick={retake}
            type="button"
          >
            Retake the assessment
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ol className="space-y-6">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="font-bold text-ink">
              {index + 1}. {question.question}
            </p>
            <div className="mt-4 space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-blue has-[:checked]:bg-blue-pale"
                >
                  <input
                    checked={selected[index] === optionIndex}
                    className="mt-1"
                    name={`question-${question.id}`}
                    onChange={() =>
                      setSelected((prev) => {
                        const next = [...prev];
                        next[index] = optionIndex;
                        return next;
                      })
                    }
                    type="radio"
                    value={optionIndex}
                  />
                  <span className="text-ink">{option}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark disabled:opacity-60"
          disabled={busy || !allAnswered}
          onClick={submit}
          type="button"
        >
          {busy ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : null}
          Submit answers
        </button>
        {!allAnswered ? (
          <p className="mt-3 text-sm text-muted">
            Answer every question to submit.
          </p>
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
    </div>
  );
}
