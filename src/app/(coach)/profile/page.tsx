import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCoach } from "@/lib/auth";
import { CoachProfileForm } from "@/components/CoachProfileForm";
import { CoachAvailabilityForm } from "@/components/CoachAvailabilityForm";
import { getDb } from "@/lib/supabase";
import { coachingGradeEnabled, coachingGradeLabel, toCoachingGrade } from "@/lib/coaching-grade";

export default async function CoachProfilePage() {
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");
  // Read-only here: only an admin changes a grade, in ECCP Management.
  const grade = coachingGradeEnabled()
    ? toCoachingGrade((await getDb().from("coaches").select("coaching_grade").eq("id", coach.id).maybeSingle()).data?.coaching_grade)
    : undefined;

  return (
    <main className="mx-auto w-full max-w-2xl">
      <Link href="/dashboard" className="text-sm font-semibold text-blue hover:underline">
        Back to coach portal
      </Link>
      <h1 className="mt-6 text-xl font-bold tracking-tight sm:text-2xl">My coach profile</h1>
      <p className="mt-2 text-muted">
        Review your account details and prepare your contact and emergency contact information.
      </p>

      <section className="mt-8 rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold">Account information</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-sm text-muted">Full name</dt>
            <dd className="font-medium">{coach.full_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Email address</dt>
            <dd className="font-medium">{coach.email}</dd>
          </div>
          {grade !== undefined && <div>
            <dt className="text-sm text-muted">Coaching grade</dt>
            <dd className="font-medium">{coachingGradeLabel(grade)}</dd>
          </div>}
        </dl>
        <p className="mt-4 text-sm text-muted">
          Your account email is linked to the account you signed in with. To use a separate coach email, sign out and use that coach account. Admin changes must be verified against the correct account before updating any email.
        </p>
      </section>
      <CoachProfileForm />
      <section id="availability" className="mt-8 scroll-mt-6 rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold">My availability</h2>
        <p className="mt-2 text-sm text-muted">Manage your usual coaching days and times and any exceptions.</p>
        <p className="mt-4 text-sm"><Link href="/availability-preview" className="font-semibold text-blue underline">Try the new availability layout (example only)</Link></p>
        <CoachAvailabilityForm />
      </section>
    </main>
  );
}
