import Link from "next/link";
import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { CoachGradingPreview } from "@/components/CoachGradingPreview";

export default async function GradingPreviewPage() {
  const coach = await getCurrentCoach();
  if (!coach || !can(coach, "view_management")) redirect("/course");
  return <main>
    <Link href="/management" className="text-sm font-semibold text-blue underline">Back to coach roster</Link>
    <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">Coach grading — management example</h1>
    <p className="mt-2 text-sm text-muted">Review Head Coach, Assistant Coach and Junior Assistant Coach grades using fictional records only.</p>
    <CoachGradingPreview />
  </main>;
}
