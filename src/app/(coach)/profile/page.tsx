import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCoach } from "@/lib/auth";
import { CoachProfileForm } from "@/components/CoachProfileForm";

export default async function CoachProfilePage() {
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl py-10">
      <Link href="/course" className="text-sm font-semibold text-blue hover:underline">
        Back to coach portal
      </Link>
      <h1 className="mt-6 text-3xl font-bold">My coach profile</h1>
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
        </dl>
        <p className="mt-4 text-sm text-muted">
          Changes to your name, email, coaching grade and compliance status are managed by the Empowr team.
        </p>
      </section>

      <CoachProfileForm />
    </main>
  );
}
