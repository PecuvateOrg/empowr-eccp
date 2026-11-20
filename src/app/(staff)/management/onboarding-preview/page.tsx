import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCoach, can } from "@/lib/auth";
import { OnboardingPreview } from "@/components/OnboardingPreview";

export default async function OnboardingPreviewPage() {
  const coach = await getCurrentCoach();
  if (!coach || !can(coach, "view_management")) redirect("/course");
  return (
    <main className="py-8">
      <Link href="/management" className="text-sm font-semibold text-blue underline">Back to coach roster</Link>
      <h1 className="mt-5 text-3xl font-black">Coach onboarding — UI preview</h1>
      <p className="mt-2 text-sm text-muted">Explore onboarding stages, grades and requirements with fictional examples. No live records are used.</p>
      <OnboardingPreview />
    </main>
  );
}
