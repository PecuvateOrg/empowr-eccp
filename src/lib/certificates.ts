import { getDb } from "./supabase";

export const CERTIFICATE_BUCKET = "eccp-certificates";
const SIGNED_URL_TTL_SECONDS = 300;

export interface Certificate {
  readonly id: string;
  readonly attemptId: string;
  readonly certificateNumber: string;
  readonly courseTitle: string;
  readonly passScore: number;
  readonly completedAt: string;
  readonly renewsAt: string;
  readonly pdfStoragePath: string;
  readonly issuedAt: string;
}

export async function getCertificateForCoach(coachId: string): Promise<Certificate | null> {
  const { data, error } = await getDb()
    .from("certificates")
    .select(
      "id, attempt_id, certificate_number, course_title, pass_score, completed_at, renews_at, pdf_storage_path, issued_at",
    )
    .eq("coach_id", coachId)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`certificate lookup failed: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    attemptId: data.attempt_id,
    certificateNumber: data.certificate_number,
    courseTitle: data.course_title,
    passScore: data.pass_score,
    completedAt: data.completed_at,
    renewsAt: data.renews_at,
    pdfStoragePath: data.pdf_storage_path,
    issuedAt: data.issued_at,
  };
}

// A signed URL, not a public one — the bucket has no policy granting
// anon/authenticated any access at all, by design (see the plan's data-model
// notes). This is the only sanctioned way a coach ever reaches the PDF.
export async function getSignedCertificateUrl(pdfStoragePath: string): Promise<string> {
  const { data, error } = await getDb()
    .storage.from(CERTIFICATE_BUCKET)
    .createSignedUrl(pdfStoragePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    throw new Error(`signed url generation failed: ${error?.message ?? "no data"}`);
  }
  return data.signedUrl;
}

// Fire-and-check, not fire-and-forget: a 202 only means Netlify accepted the
// background invocation, not that issuance succeeded — but it's the one thing
// worth telling apart from "the hand-off itself never happened", since a dead
// background function and a network failure here look identical to the coach
// (no certificate ever appears) with no other trace to distinguish them.
export async function triggerCertificateIssuance(attemptId: string): Promise<boolean> {
  const base = process.env.URL ?? process.env.DEPLOY_URL;
  if (!base) {
    console.error("[certificates] no site URL env var — cannot trigger issuance", { attemptId });
    return false;
  }

  try {
    const response = await fetch(`${base}/.netlify/functions/eccp-issue-certificate-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId }),
    });
    const triggered = response.status === 202;
    if (!triggered) {
      console.error("[certificates] issuance hand-off did not return 202", {
        attemptId,
        status: response.status,
      });
    }
    return triggered;
  } catch (cause) {
    console.error("[certificates] issuance hand-off failed", { attemptId, cause });
    return false;
  }
}
