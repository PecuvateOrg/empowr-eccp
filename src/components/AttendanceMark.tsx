"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Marking attendance: shared by the Head Coach team page and the staff Attendance page. */
export function useAttendanceMark(url: (taskId: string) => string, body: (taskId: string, value: string, reason: string) => object) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  async function mark(taskId: string, name: string, value: "attended" | "absent") {
    const reason = window.prompt(`Reason for marking ${name} ${value}:`);
    if (reason === null) return;
    setBusy(taskId); setNotice(null);
    try {
      const res = await fetch(url(taskId), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body(taskId, value, reason)) });
      const data = await res.json().catch(() => ({}));
      setNotice(res.ok ? { error: false, text: `${name} marked ${value}.` } : { error: true, text: data.error ?? "Something went wrong. Try again." });
      if (res.ok) router.refresh();
    } catch { setNotice({ error: true, text: "Couldn't reach ECCP. Check your connection and try again." }); }
    setBusy(null);
  }
  return { busy, notice, mark };
}

export function Notice({ notice }: { notice: { error: boolean; text: string } | null }) {
  return notice ? <p role={notice.error ? "alert" : "status"} className={`rounded-lg border p-3 text-sm font-semibold text-ink ${notice.error ? "border-red bg-red/10" : "border-border bg-blue-pale"}`}>{notice.text}</p> : null;
}

export function MarkButtons({ disabled, onMark }: { disabled: boolean; onMark: (v: "attended" | "absent") => void }) {
  const b = "rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50";
  return <div className="flex gap-2">
    <button type="button" disabled={disabled} className={`${b} bg-blue text-white hover:bg-blue-dark`} onClick={() => onMark("attended")}>Attended</button>
    <button type="button" disabled={disabled} className={`${b} border border-border text-ink`} onClick={() => onMark("absent")}>Absent</button>
  </div>;
}

export const attendanceTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
export const ATTENDANCE_LABEL: Record<string, string> = { unconfirmed: "Not checked in", attended: "Attended", absent: "Absent", unresolved: "Unresolved" };
