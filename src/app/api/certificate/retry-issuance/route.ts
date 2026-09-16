import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getAttempts } from "@/lib/assessment";
import { getCertificateForCoach, triggerCertificateIssuance } from "@/lib/certificates";

// The recovery path for a hand-off or background-function failure the coach
// has no other way to unstick: re-fires the same trigger the assessment
// route uses for the coach's latest passing attempt, if it's still missing
// a certificate. Safe to call repeatedly — the unique constraint on
// certificates.attempt_id is the hard guard against a duplicate issuance
// racing a delayed first one.
export async function POST() {
  const coach = await getCurrentCoach();
  if (!coach) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const attempts = await getAttempts(coach.id);
  const latestPass = attempts.find((a) => a.passed);
  if (!latestPass) {
    return NextResponse.json({ error: "No passing attempt on record" }, { status: 400 });
  }

  const existing = await getCertificateForCoach(coach.id);
  if (existing) {
    return NextResponse.json({ error: "Certificate already issued" }, { status: 409 });
  }

  const triggered = await triggerCertificateIssuance(latestPass.id);
  if (!triggered) {
    return NextResponse.json(
      { error: "Could not restart certificate generation. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
