import type { Metadata } from "next";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { getCurrentCoach } from "@/lib/auth";
import { courseModules, PASS_MARK } from "@/lib/safeguarding-course";
import { completedCount, getProgress, isCourseComplete } from "@/lib/progress";

export const metadata: Metadata = {
  title: "Safeguarding course — Empowr ECCP",
  robots: { index: false, follow: false },
};

export default async function CoursePage() {
  const coach = (await getCurrentCoach())!;
  const progress = await getProgress(coach.id);
  const done = completedCount(progress);
  const total = courseModules.length;
  const ready = isCourseComplete(progress);

  return (
    <main className="py-10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-dark">
        Empowr: Safeguarding for Roller Skating Coaches
      </p>
      <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
        Your safeguarding course
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        Work through all {total} modules, then take the assessment. You need{" "}
        {PASS_MARK}% to pass and receive your certificate.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-bold text-ink">
            {done} of {total} modules complete
          </span>
          <span className="text-sm text-muted">
            {Math.round((done / total) * 100)}%
          </span>
        </div>
        <div
          aria-label={`${done} of ${total} modules complete`}
          aria-valuemax={total}
          aria-valuemin={0}
          aria-valuenow={done}
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-blue-pale"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-blue transition-[width] duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>

        <div className="mt-6">
          {ready ? (
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark"
              href="/course/assessment"
            >
              Start the assessment
            </Link>
          ) : (
            <p className="flex items-center gap-2 text-sm font-bold text-muted">
              <Lock aria-hidden="true" className="size-4" />
              Finish every module to unlock the assessment
            </p>
          )}
        </div>
      </div>

      <ol className="mt-8 space-y-3">
        {courseModules.map((module) => {
          const complete = Boolean(progress.get(module.slug)?.completedAt);
          return (
            <li key={module.slug}>
              <Link
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-blue hover:shadow-[0_2px_12px_rgb(74_112_194_/_0.12)]"
                href={`/course/${module.slug}`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    complete
                      ? "bg-blue text-white"
                      : "bg-blue-pale text-blue"
                  }`}
                >
                  {complete ? (
                    <Check aria-hidden="true" className="size-5" />
                  ) : (
                    module.order
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black uppercase tracking-[0.14em] text-muted">
                    {module.label}
                  </span>
                  <span className="block font-bold text-ink">{module.title}</span>
                </span>
                <span className="sr-only">
                  {complete ? "Complete" : "Not yet complete"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
