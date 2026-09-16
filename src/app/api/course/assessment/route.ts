import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getProgress, isCourseComplete } from "@/lib/progress";
import { assessmentQuestions, PASS_MARK } from "@/lib/safeguarding-course";
import { answerKey } from "@/lib/safeguarding-answers";
import { recordAttempt } from "@/lib/assessment";

// The only file in the app that imports the answer key. A page or shared
// component importing it would ship every correct answer to the browser —
// keeping the import here, in a route handler nothing renders, is what makes
// that impossible rather than just unlikely.
export async function POST(request: Request) {
  const coach = await getCurrentCoach();
  if (!coach) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // The course-complete link is hidden client-side, but the route is the real
  // gate — nothing stops a coach from requesting this URL directly.
  const progress = await getProgress(coach.id);
  if (!isCourseComplete(progress)) {
    return NextResponse.json(
      { error: "Finish every module before taking the assessment." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const answers = Array.isArray(body.answers) ? body.answers : null;

  if (!answers || answers.length !== assessmentQuestions.length) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Scored here, server-side, from the submitted option indices only — a
  // submitted score field (if any) is never read.
  const results = assessmentQuestions.map((question, index) => {
    const selected = answers[index];
    const correct = answerKey[index].correctIndex;
    return {
      id: question.id,
      correct: selected === correct,
      correctIndex: correct,
      explanation: answerKey[index].explanation,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / assessmentQuestions.length) * 100);
  const passed = score >= PASS_MARK;

  try {
    const attempt = await recordAttempt(coach.id, score, passed);
    return NextResponse.json({
      attemptNumber: attempt.attemptNumber,
      score,
      passed,
      results,
    });
  } catch (cause) {
    console.error("[course/assessment] failed", cause);
    return NextResponse.json(
      { error: "Could not save your attempt." },
      { status: 500 },
    );
  }
}
