import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { AvailabilityUiPreview } from "@/components/AvailabilityUiPreview";

export default async function AvailabilityPreviewPage() {
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");
  return <main className="mx-auto w-full max-w-2xl py-10">
    <Link href="/profile#availability" className="text-sm font-semibold text-blue underline">Back to my availability</Link>
    <h1 className="mt-6 text-3xl font-bold">Availability — interface example</h1>
    <p className="mt-2 text-sm text-muted">Try a redesigned weekly schedule and date exceptions. Your existing availability is not loaded or changed.</p>
    <AvailabilityUiPreview />
  </main>;
}
