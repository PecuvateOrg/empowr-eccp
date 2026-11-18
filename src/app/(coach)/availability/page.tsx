import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCoach } from "@/lib/auth";
import { CoachAvailabilityForm } from "@/components/CoachAvailabilityForm";

export default async function AvailabilityPage() {
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");
  return (
    <main className="mx-auto w-full max-w-3xl py-10">
      <Link href="/course" className="text-sm font-semibold text-blue hover:underline">
        Back to coach portal
      </Link>
      <h1 className="mt-6 text-3xl font-bold">My availability</h1>
      <p className="mt-2 text-muted">
        Tell Empowr which days and times you can usually coach, and note any exceptions.
      </p>
      <CoachAvailabilityForm />
    </main>
  );
}
