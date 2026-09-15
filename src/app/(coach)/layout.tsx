import { redirect } from "next/navigation";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { getCurrentCoach } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

// This layout IS the access control for every coach page beneath it. There is no
// middleware: checking a session means a database round-trip, which the edge
// runtime cannot do. Any new route added outside this group is unprotected.
export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <Link className="flex items-center gap-2.5 font-black text-blue" href="/course">
          <BadgeCheck aria-hidden="true" className="size-6" />
          <span>Empowr ECCP</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {coach.is_staff ? (
            <Link className="font-bold text-blue hover:text-blue-dark" href="/management">
              Management
            </Link>
          ) : null}
          <span className="text-muted">{coach.full_name}</span>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
