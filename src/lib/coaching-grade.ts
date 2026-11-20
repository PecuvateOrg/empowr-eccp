export const coachingGrades = ["head_coach", "assistant_coach", "junior_assistant_coach"] as const;
export type CoachingGrade = (typeof coachingGrades)[number];
export function isCoachingGrade(value: unknown): value is CoachingGrade {
 return typeof value === "string" && coachingGrades.some(grade => grade === value);
}
export function coachingGradeLabel(grade: CoachingGrade | null): string {
 switch (grade) {
  case "head_coach": return "Head Coach";
  case "assistant_coach": return "Assistant Coach";
  case "junior_assistant_coach": return "Junior Assistant Coach";
  default: return "Not assigned yet";
 }
}
