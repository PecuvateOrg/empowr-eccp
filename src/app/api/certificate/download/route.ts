import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getCertificateForCoach, getSignedCertificateUrl } from "@/lib/certificates";

// Redirects to a short-lived signed Storage URL rather than streaming or
// returning it as JSON — the bucket has no policy granting anon/authenticated
// any access, so this route (running as the service role) is the only path
// to the PDF, and the signed URL itself is the credential, good for minutes.
export async function GET() {
  const coach = await getCurrentCoach();
  if (!coach) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const certificate = await getCertificateForCoach(coach.id);
  if (!certificate) {
    return NextResponse.json({ error: "No certificate found" }, { status: 404 });
  }

  const url = await getSignedCertificateUrl(certificate.pdfStoragePath);
  return NextResponse.redirect(url);
}
