"use client";
import { ATTENDANCE_LABEL as LABEL, attendanceTime as time, MarkButtons, Notice, useAttendanceMark } from "@/components/AttendanceMark";

export type TeamMember = { taskId: string; role: string; name: string; attendance: string; checkedInAt: string | null; source: string | null };

export function TeamAttendance({ sessionId, team }: { sessionId: string; team: TeamMember[] }) {
  const { busy, notice, mark } = useAttendanceMark(() => `/api/sessions/${sessionId}/attendance`, (taskId, value, reason) => ({ taskId, value, reason }));
  return <div className="mt-6 space-y-3">
    <Notice notice={notice} />
    {team.map(m => <article key={m.taskId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div>
        <h2 className="font-bold">{m.name}</h2>
        <p className="text-sm text-muted">{m.role} · {LABEL[m.attendance] ?? m.attendance}{m.checkedInAt ? ` at ${time(m.checkedInAt)}` : ""}</p>
      </div>
      <MarkButtons disabled={busy === m.taskId} onMark={(v) => mark(m.taskId, m.name, v)} />
    </article>)}
  </div>;
}
