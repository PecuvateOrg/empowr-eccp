"use client";
import { ATTENDANCE_LABEL, attendanceTime, MarkButtons, Notice, useAttendanceMark } from "@/components/AttendanceMark";
import { whenText } from "@/lib/efn-staffing";

export type AttendanceShift = {
  taskId: string; role: string; name: string; attendance: string; checkedInAt: string | null; source: string | null
  reason: string | null; decidedAt: string | null
  session: { id: string; title: string; startsAt: string; endsAt: string; venue: string | null };
};

export function AttendanceBoard({ shifts, showActions }: { shifts: AttendanceShift[]; showActions: boolean }) {
  const { busy, notice, mark } = useAttendanceMark((taskId) => `/api/management/staffing/tasks/${taskId}/attendance`, (_t, value, reason) => ({ value, reason }));
  if (!shifts.length) return <p className="mt-3 rounded-xl border border-border bg-card p-4 text-sm">Nothing here.</p>;
  return <div className="mt-3 space-y-2">
    <Notice notice={notice} />
    {shifts.map(s => <article key={s.taskId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0">
        <h3 className="font-bold">{s.name} · {s.role}</h3>
        <p className="text-sm text-blue">{s.session.title} · {whenText(s.session.startsAt, s.session.endsAt)}</p>
        <p className="text-sm text-muted">{ATTENDANCE_LABEL[s.attendance] ?? s.attendance}{s.checkedInAt ? ` · checked in ${attendanceTime(s.checkedInAt)}` : ""}{s.reason ? ` · “${s.reason}”` : ""}</p>
      </div>
      {showActions && <MarkButtons disabled={busy === s.taskId} onMark={(v) => mark(s.taskId, s.name, v)} />}
    </article>)}
  </div>;
}
