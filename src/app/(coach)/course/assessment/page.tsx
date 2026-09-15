import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { getProgress, isCourseComplete } from "@/lib/progress";
import { assessmentQuestions, PASS_MARK } from "@/lib/safeguarding-course";
import { AssessmentForm } from "./AssessmentForm";

export const metadata: Metadata = {
  title: "Assessment — Empowr ECCP",
  robots: { index: false, follow: false },
};

export default async function AssessmentPage() {
  const coach = (await getCurrentCoach())!;
  const progress = await getProgress(coach.id);

  // The dashboard hides the link until every module is complete, but that's
  // display only — this redirect is the actual gate against typing the URL.
  if (!isCourseComplete(progress)) {
    redirect("/course");
  }

  return (
    <main className="py-10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-dark">
        Empowr: Safeguarding for Roller Skating Coaches
      </p>
      <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
        Final assessment
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        {assessmentQuestions.length} questions. You need {PASS_MARK}% to pass.
        You can retake the assessment as many times as you need.
      </p>

      {/* Question text and options only — never the correct answer, which
          lives server-side and reaches the client solely inside the graded
          response after submit. */}
      <AssessmentForm questions={assessmentQuestions} />
    </main>
  );
}
