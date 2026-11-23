import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { coachUnreadCount } from "@/lib/coach-messages";
import { shiftScreensEnabled } from "@/lib/efn-staffing";
import { AppShell } from "@/components/shell/AppShell";
import { coachNav } from "@/components/shell/nav";

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
  const messaging = process.env.ECCP_MESSAGING_ENABLED === "true";
  // A failed count never blocks the page; the Messages tab just shows no number.
  const unread = messaging ? await coachUnreadCount(coach.id).catch(() => null) : null;

  return (
    <AppShell
      nav={coachNav({ shifts: shiftScreensEnabled(), messaging, management: can(coach, "view_management") })}
      email={coach.email}
      badges={unread ? { "/messages": unread } : {}}
    >
      {children}
    </AppShell>
  );
}
