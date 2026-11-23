import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { requirementKeys, requirementLabels, sampleOnboardingCoaches, stageLabels, gradeLabels } from "@/lib/onboarding-preview";

export default async function CoachOnboardingPreviewPage() {
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");
  // Fictional profile is intentionally NOT matched to the signed-in coach.
  const example = sampleOnboardingCoaches[0];
  return (
    <main className="mx-auto w-full max-w-2xl">
      <Link href="/training" className="text-sm font-semibold text-blue underline">Back to Training &amp; Compliance</Link>
      <h1 className="mt-6 text-xl font-bold tracking-tight sm:text-2xl">Coach onboarding — coming soon</h1>
      <p role="note" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        Here’s an example of what your onboarding journey could look like. This is fictional information, not your own onboarding or compliance status.
      </p>
      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Example onboarding progress</h2>
        <p className="mt-2 text-sm">{gradeLabels[example.grade]} · {stageLabels[example.stage]}</p>
        <ul className="mt-5 space-y-3">
          {requirementKeys.map(key => <li key={key} className="flex justify-between gap-4 border-b border-border pb-3 text-sm">
            <span>{requirementLabels[key]}</span>
            <span>{example.requirements[key] === "complete" ? "Complete (sample)" : example.requirements[key] === "not_required" ? "Not required" : "Pending (sample)"}</span>
          </li>)}
        </ul>
        <p className="mt-5 text-sm text-muted">Requirements are read-only in this preview. Verification and activation will be connected only after the secure database work is approved.</p>
      </section>
    </main>
  );
}
