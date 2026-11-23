import Link from "next/link";
import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { ComplianceDashboardPreview } from "@/components/ComplianceDashboardPreview";

export default async function ComplianceDashboardPreviewPage() {
  const coach = await getCurrentCoach();
  if (!coach || !can(coach, "view_management")) redirect("/course");
  return (
    <main>
      <Link href="/management" className="text-sm font-semibold text-blue underline">Back to coach roster</Link>
      <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">Coach compliance — dashboard example</h1>
      <p className="mt-2 text-sm text-muted">Explore how management could review outstanding safeguarding, DBS, EFN agreement and First Aid requirements. Sample data only.</p>
      <ComplianceDashboardPreview />
    </main>
  );
}
