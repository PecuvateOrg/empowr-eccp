import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCoach } from "@/lib/auth";
import { BrandMark } from "@/components/BrandMark";
import { SignOutButton } from "@/components/SignOutButton";

// This layout IS the access control for every staff page beneath it — it does
// NOT inherit (coach)/layout.tsx's gate, since a route group's layout only
// wraps routes inside that same group. A signed-in coach who is not staff is
// sent back to /course rather than shown an error, since /management isn't a
// secret — it's just linked conditionally in the coach nav.
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");
  if (!coach.is_staff) redirect("/course");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <BrandMark href="/management" label="ECCP — Management" />
        <div className="flex items-center gap-4 text-sm">
          <Link className="font-bold text-blue hover:text-blue-dark" href="/course">
            Coach view
          </Link>
          <span className="text-muted">{coach.full_name}</span>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
