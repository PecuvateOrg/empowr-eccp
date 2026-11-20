import { can, getCurrentCoach } from "@/lib/auth";
import { renderCertificateHtml } from "@/lib/certificate-template";
import { renderCertificatePdf } from "@/lib/issue-certificate";
import { computeCertificateDates } from "@/lib/london-date";
import { PASS_MARK } from "@/lib/safeguarding-course";

// Staff-only check that certificate PDFs render on this host. Uses the real
// template and Chromium path, but never calls next_certificate_number, writes
// to Storage, inserts a row or sends email — probes must not consume a
// certificate number (gotchas, 2026-09-24). X-Render-Ms reports the render time.
export async function GET() {
  const coach = await getCurrentCoach();
  if (!coach) return new Response("Not signed in", { status: 401 });
  if (!can(coach, "view_management")) return new Response("Not authorised", { status: 403 });

  const dates = computeCertificateDates();
  const html = renderCertificateHtml({
    coachName: "Sample Coach",
    dateCompletedLabel: dates.completedAtLabel,
    renewsAtLabel: dates.renewsAtLabel,
    certificateNumber: "PREVIEW-NOT-ISSUED",
    passMark: PASS_MARK,
  });

  const started = Date.now();
  try {
    const pdf = await renderCertificatePdf(html);
    const ms = Date.now() - started;
    console.log("[management/certificate-preview] rendered", JSON.stringify({ ms, bytes: pdf.length }));
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="eccp-certificate-preview.pdf"',
        "Cache-Control": "no-store",
        "X-Render-Ms": String(ms),
      },
    });
  } catch (cause) {
    console.error(
      "[management/certificate-preview] failed",
      cause instanceof Error ? cause.message : String(cause),
    );
    return new Response("Certificate render failed — see the app logs.", { status: 500 });
  }
}
