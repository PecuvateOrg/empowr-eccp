import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { shiftScreensEnabled } from "@/lib/efn-staffing";
import { AppShell } from "@/components/shell/AppShell";
import { staffNav } from "@/components/shell/nav";

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
  if (!can(coach, "view_management")) redirect("/course");

  return (
    <AppShell
      nav={staffNav({ shifts: shiftScreensEnabled(), messaging: process.env.ECCP_MESSAGING_ENABLED === "true" })}
      email={coach.email}
    >
      {children}
    </AppShell>
  );
}
