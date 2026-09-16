import { getDb } from "./supabase";
import type { Coach } from "./auth";

export interface CoachOverview {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly isStaff: boolean;
  readonly latestAttempt: {
    readonly score: number;
    readonly passed: boolean;
    readonly submittedAt: string;
  } | null;
  readonly certificate: {
    readonly certificateNumber: string;
    readonly issuedAt: string;
    readonly renewsAt: string;
  } | null;
}

// Three separate selects rather than a single nested query — same convention
// as the rest of this app (see assessment.ts, certificates.ts): every row is
// typed loosely off explicit column selects, not fought into a generic. Fine
// at this scale (a coach roster, not a high-volume table); merged in JS below.
//
// Takes the requesting coach and re-checks is_staff itself rather than
// trusting the caller — (staff)/layout.tsx is the only gate today, but a
// second gate here means this function stays safe to call from anywhere
// later without silently becoming the access-control gap.
export async function getManagementOverview(requestedBy: Coach): Promise<CoachOverview[]> {
  if (!requestedBy.is_staff) {
    throw new Error("not authorised: requestedBy is not staff");
  }

  const db = getDb();

  const { data: coaches, error: coachError } = await db
    .from("coaches")
    .select("id, email, full_name, is_staff")
    .order("full_name", { ascending: true });
  if (coachError) throw new Error(`coach list failed: ${coachError.message}`);
  if (!coaches || coaches.length === 0) return [];

  const { data: attempts, error: attemptError } = await db
    .from("assessment_attempts")
    .select("coach_id, score, passed, submitted_at")
    .order("submitted_at", { ascending: false });
  if (attemptError) throw new Error(`attempt list failed: ${attemptError.message}`);

  const { data: certificates, error: certError } = await db
    .from("certificates")
    .select("coach_id, certificate_number, issued_at, renews_at")
    .order("issued_at", { ascending: true });
  if (certError) throw new Error(`certificate list failed: ${certError.message}`);

  // Attempts are ordered newest-first, so the first match per coach is the
  // latest — a Map write only wins the first time a coach_id is seen.
  const latestAttemptByCoach = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts ?? []) {
    if (!latestAttemptByCoach.has(attempt.coach_id)) {
      latestAttemptByCoach.set(attempt.coach_id, attempt);
    }
  }

  // The unique constraint on certificates.attempt_id allows more than one
  // certificate per coach across retakes; the roster only needs the most
  // recently issued one. The select above orders issued_at ascending so the
  // last write into this Map for a given coach is always the newest.
  const certificateByCoach = new Map<string, (typeof certificates)[number]>();
  for (const certificate of certificates ?? []) {
    certificateByCoach.set(certificate.coach_id, certificate);
  }

  return coaches.map((coach) => {
    const attempt = latestAttemptByCoach.get(coach.id);
    const certificate = certificateByCoach.get(coach.id);
    return {
      id: coach.id,
      email: coach.email,
      fullName: coach.full_name,
      isStaff: coach.is_staff,
      latestAttempt: attempt
        ? { score: attempt.score, passed: attempt.passed, submittedAt: attempt.submitted_at }
        : null,
      certificate: certificate
        ? {
            certificateNumber: certificate.certificate_number,
            issuedAt: certificate.issued_at,
            renewsAt: certificate.renews_at,
          }
        : null,
    };
  });
}
