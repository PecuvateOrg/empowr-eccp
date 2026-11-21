export const coachingGrades = ["head_coach", "assistant_coach", "junior_assistant_coach"] as const;
export type CoachingGrade = (typeof coachingGrades)[number];

// Off until planning/sql/coaching-grade.sql is applied. While off, nothing
// reads or writes the coaching_grade column, so pages work before the migration.
export function coachingGradeEnabled(): boolean {
  return process.env.ECCP_COACHING_GRADE_ENABLED === "1";
}

export function isCoachingGrade(value: unknown): value is CoachingGrade {
  return typeof value === "string" && coachingGrades.some(grade => grade === value);
}

export function toCoachingGrade(value: unknown): CoachingGrade | null {
  return isCoachingGrade(value) ? value : null;
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Body of PATCH /api/management/coaching-grade. grade null = clear the grade.
export function parseGradeRequest(body: unknown): { coachId: string; grade: CoachingGrade | null } | null {
  if (typeof body !== "object" || body === null) return null;
  const { coachId, grade } = body as Record<string, unknown>;
  if (typeof coachId !== "string" || !uuid.test(coachId)) return null;
  if (grade !== null && !isCoachingGrade(grade)) return null;
  return { coachId, grade };
}

export function coachingGradeLabel(grade: CoachingGrade | null): string {
  switch (grade) {
    case "head_coach": return "Head Coach";
    case "assistant_coach": return "Assistant Coach";
    case "junior_assistant_coach": return "Junior Assistant Coach";
    default: return "Not assigned yet";
  }
}
