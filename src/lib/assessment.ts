import { getDb } from "./supabase";

export interface AssessmentAttempt {
  readonly id: string;
  readonly attemptNumber: number;
  readonly score: number;
  readonly passed: boolean;
  readonly submittedAt: string;
}

export async function getAttempts(coachId: string): Promise<AssessmentAttempt[]> {
  const { data, error } = await getDb()
    .from("assessment_attempts")
    .select("id, attempt_number, score, passed, submitted_at")
    .eq("coach_id", coachId)
    .order("attempt_number", { ascending: false });

  if (error) throw new Error(`attempt lookup failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    attemptNumber: row.attempt_number,
    score: row.score,
    passed: row.passed,
    submittedAt: row.submitted_at,
  }));
}

// The attempt number is derived from what's already stored, not tracked as
// separate counter state, so it can never drift from the rows it numbers.
export async function recordAttempt(
  coachId: string,
  score: number,
  passed: boolean,
): Promise<AssessmentAttempt> {
  const previous = await getAttempts(coachId);
  const attemptNumber = (previous[0]?.attemptNumber ?? 0) + 1;

  const { data, error } = await getDb()
    .from("assessment_attempts")
    .insert({ coach_id: coachId, attempt_number: attemptNumber, score, passed })
    .select("id, attempt_number, score, passed, submitted_at")
    .single();

  if (error) throw new Error(`attempt insert failed: ${error.message}`);

  return {
    id: data.id,
    attemptNumber: data.attempt_number,
    score: data.score,
    passed: data.passed,
    submittedAt: data.submitted_at,
  };
}
