import Link from "next/link";
import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { SchedulingExample } from "./SchedulingExample";

export default async function SchedulingPreview() {
  const coach = await getCurrentCoach();
  if (!coach || !can(coach, "view_management")) redirect("/course");
  return <main className="min-w-0 py-8">
    <Link href="/management" className="text-sm font-bold text-blue">← Management</Link>
    <h1 className="mt-4 text-3xl font-black">Coach Scheduling</h1>
    <p className="mt-2 text-sm text-muted">Example only — fictional sessions and coaches. Changes reset on reload; no live assignments or notifications.</p>
    <SchedulingExample />
  </main>;
}
