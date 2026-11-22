import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { efn } from "@/lib/efn-client";
import { efnMessage, londonDate, shiftScreensEnabled } from "@/lib/efn-staffing";
import { MyShiftsList, type CoachShift } from "./MyShiftsList";

export const dynamic = "force-dynamic";

const example = [
  {date:"Monday 11 January 2027",time:"15:30–16:30",title:"Example school club",venue:"Example school",role:"Head Coach"},
  {date:"Monday 18 January 2027",time:"15:30–16:30",title:"Example school club",venue:"Example school",role:"Head Coach"},
];
export default async function MyShifts(){
  const coach = await getCurrentCoach();
  if(!coach)redirect("/login");
  if(shiftScreensEnabled()){
    // Shifts come from EFN, the staffing engine; ECCP only shows them.
    const r = await efn(`/shifts?from=${londonDate(-1)}`, { coachId: coach.id });
    const shifts = Array.isArray(r.data.shifts) ? r.data.shifts as CoachShift[] : null;
    return <main className="py-8 min-w-0">
      <Link href="/dashboard" className="text-sm font-bold text-blue">← Dashboard</Link>
      <h1 className="mt-4 text-3xl font-black">My Shifts</h1>
      <p className="mt-2 text-sm text-muted">Your upcoming sessions. Times are UK time.</p>
      {shifts ? <MyShiftsList shifts={shifts} />
        : <p role="alert" className="mt-6 rounded-lg border border-red bg-red/10 p-3 text-sm font-semibold text-ink">{efnMessage(r.status, r.data.error)}</p>}
    </main>;
  }
  return <main className="py-8 min-w-0">
    <Link href="/dashboard" className="text-sm font-bold text-blue">← Dashboard</Link>
    <h1 className="mt-4 text-3xl font-black">My Shifts</h1>
    <p className="mt-2 text-sm text-muted">Coming soon — your assigned sessions, cover requests and calendar will appear here when scheduling is connected.</p>
    <section className="mt-6 space-y-3" aria-label="Example shifts">
      <h2 className="text-xl font-bold">Example upcoming shifts</h2>
      <p className="text-xs text-muted">Fictional examples only. These are not your assigned shifts.</p>
      {example.map(s=><article key={s.date} className="rounded-xl border border-border bg-card p-4"><p className="text-sm font-semibold text-blue">{s.date} · {s.time}</p><h3 className="mt-2 font-bold">{s.title}</h3><p className="text-sm text-muted">{s.venue} · {s.role}</p></article>)}
    </section>
    <section className="mt-6 rounded-xl border border-border bg-card p-4"><h2 className="font-bold">Cover requests</h2><p className="mt-2 text-sm text-muted">Coming soon. Requests will require coach acceptance and management approval.</p></section>
    <section className="mt-4 rounded-xl border border-border bg-card p-4"><h2 className="font-bold">Personal calendar</h2><p className="mt-2 text-sm text-muted">Coming soon. Subscribe to your own confirmed shifts once secure calendar access is available.</p></section>
  </main>;
}
