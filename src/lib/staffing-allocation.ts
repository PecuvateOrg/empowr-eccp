export type Role = "head" | "assistant" | "junior_assistant" | "champion";
export type Shift = { id: string; startsAt: string; endsAt: string; children: number };
export type Allocation = { shiftId: string; coachId: string; role: Role; eligible: boolean; additionalPaid?: boolean; reason?: string; approvedBy?: string };
export type Duration = "single" | "weekly" | "term" | "custom";

export function selectDates(shifts: Shift[], selectedIds: string[], duration: Duration): Shift[] {
  const ids = new Set(selectedIds);
  if (!ids.size || (duration === "single" && ids.size !== 1)) throw new Error("Invalid selection");
  const selected = shifts.filter(s => ids.has(s.id));
  if (selected.length !== ids.size) throw new Error("Unknown or duplicate session");
  return selected;
}

export function overlaps(a: Shift, b: Shift): boolean {
  const times = [a.startsAt, a.endsAt, b.startsAt, b.endsAt].map(Date.parse);
  if (times.some(t => !Number.isFinite(t)) || times[0] >= times[1] || times[2] >= times[3]) throw new Error("Invalid shift times");
  return times[0] < times[3] && times[2] < times[1];
}

export function validateAllocation(next: Allocation, shifts: Shift[], existing: Allocation[]): void {
  const shift = shifts.find(s => s.id === next.shiftId);
  if (!shift || !next.coachId || !next.eligible || next.role === "champion") throw new Error("Ineligible allocation");
  overlaps(shift, shift);
  if (next.additionalPaid && (!next.reason?.trim() || !next.approvedBy?.trim())) throw new Error("Additional paid support requires reason and approval");
  for (const assigned of existing.filter(a => a.coachId === next.coachId)) {
    const other = shifts.find(s => s.id === assigned.shiftId);
    if (!other) throw new Error("Unknown existing shift");
    if (assigned.shiftId === next.shiftId || overlaps(shift, other)) throw new Error("Conflicting allocation");
  }
}

export function staffingRequirement(children: number, allocations: Allocation[]) {
  if (!Number.isSafeInteger(children) || children < 0) throw new Error("Invalid child count");
  const required = Math.max(1, Math.ceil(children / 16));
  const eligible = allocations.filter(a => a.eligible && a.role !== "champion" && !a.additionalPaid);
  const assigned = new Set(eligible.map(a => a.coachId)).size;
  return { required, assigned, covered: assigned >= required && eligible.some(a => a.role === "head") };
}

export function approveCover(original: Allocation, replacement: Allocation, accepted: boolean, approvedBy: string, shifts: Shift[], existing: Allocation[]): Allocation[] {
  if (!accepted || !approvedBy.trim() || original.shiftId !== replacement.shiftId || original.role !== replacement.role || original.coachId === replacement.coachId) throw new Error("Cover requires eligible acceptance and management approval");
  if (!existing.some(a => a.shiftId === original.shiftId && a.coachId === original.coachId)) throw new Error("Original allocation missing");
  const remaining = existing.filter(a => !(a.shiftId === original.shiftId && a.coachId === original.coachId));
  validateAllocation(replacement, shifts, remaining);
  return [...remaining, replacement];
}
