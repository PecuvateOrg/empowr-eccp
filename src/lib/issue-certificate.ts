// Certificate issuance — the work itself, shared by both hosts.
//
// Netlify: netlify/functions/eccp-issue-certificate-background.ts calls this
// in a 15-minute background function. Amplify has no background functions and
// freezes a Lambda once its response is sent, so there lib/certificates.ts
// awaits this inline (ECCP_INLINE_ISSUANCE=1) and the coach waits for it.
//
// BUILDS ITS OWN SUPABASE AND RESEND CLIENTS — do NOT import lib/supabase.ts
// or lib/email.ts here. A later `server-only` guard on either would throw
// outside Next's build (the Netlify function) silently. Only plain data/string
// modules are imported.
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { renderCertificateHtml } from "@/lib/certificate-template";
import { computeCertificateDates } from "@/lib/london-date";
import { PASS_MARK } from "@/lib/safeguarding-course";

const BUCKET = "eccp-certificates";
const FROM = "Empowr ECCP <eccp@empowrcic.org>";


/** Issues the certificate for a passing attempt. Throws on any failure. */
export async function runCertificateIssuance(attemptId: string): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("missing Supabase env");
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false },
    db: { schema: "eccp" },
  });
  await issueCertificate(db, attemptId);
}

// `db` is typed loosely rather than fought into a generic — same as every
// other file in this app, none of which type the Supabase client against
// generated row types. Safety here comes from checking `error`/null after
// every call below, not from compile-time row shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function issueCertificate(db: any, attemptId: string): Promise<void> {
  // Defensive re-check: the unique constraint on certificates.attempt_id is
  // the hard guarantee against double issuance, but this avoids redoing the
  // Puppeteer/Storage/Resend work for a retry that already succeeded.
  const { data: existing } = await db
    .from("certificates")
    .select("id")
    .eq("attempt_id", attemptId)
    .maybeSingle();
  if (existing) return;

  const { data: attempt, error: attemptError } = await db
    .from("assessment_attempts")
    .select("id, coach_id, passed")
    .eq("id", attemptId)
    .single();
  if (attemptError || !attempt) {
    throw new Error(`attempt not found: ${attemptError?.message ?? "no row"}`);
  }
  if (!attempt.passed) {
    throw new Error("attempt did not pass — refusing to issue a certificate");
  }

  const { data: coach, error: coachError } = await db
    .from("coaches")
    .select("id, email, full_name")
    .eq("id", attempt.coach_id)
    .single();
  if (coachError || !coach) {
    throw new Error(`coach not found: ${coachError?.message ?? "no row"}`);
  }

  const { data: certificateNumber, error: numberError } = await db.rpc(
    "next_certificate_number",
  );
  if (numberError || !certificateNumber) {
    throw new Error(`certificate number allocation failed: ${numberError?.message}`);
  }

  const dates = computeCertificateDates();

  const html = renderCertificateHtml({
    coachName: coach.full_name,
    dateCompletedLabel: dates.completedAtLabel,
    renewsAtLabel: dates.renewsAtLabel,
    certificateNumber,
    passMark: PASS_MARK,
  });

  const pdf = await renderCertificatePdf(html);

  const storagePath = `${coach.id}/${certificateNumber}.pdf`;
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(storagePath, pdf, { contentType: "application/pdf", upsert: false });
  if (uploadError) {
    throw new Error(`certificate upload failed: ${uploadError.message}`);
  }

  const { error: insertError } = await db.from("certificates").insert({
    coach_id: coach.id,
    attempt_id: attemptId,
    certificate_number: certificateNumber,
    pass_score: PASS_MARK,
    completed_at: dates.completedAt,
    renews_at: dates.renewsAt,
    pdf_storage_path: storagePath,
  });
  if (insertError) {
    throw new Error(`certificate row insert failed: ${insertError.message}`);
  }

  await sendCertificateEmail(coach.email, certificateNumber, pdf);
}

async function renderCertificatePdf(html: string): Promise<Buffer> {
  // Netlify and Amplify both run on Lambda; check both markers so a missing
  // one can't send production to a local Chrome path that does not exist.
  // Same dual executablePath pattern as Freelancer-Workflow's
  // send-agreement-v2.ts: Lambda uses @sparticuz/chromium's bundled binary,
  // a local run uses whatever Chrome is already installed.
  const executablePath = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV
    ? await chromium.executablePath()
    : process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : "/usr/bin/google-chrome";

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    // "load" is enough — the template is fully self-contained (the logo is a
    // data URI, no external requests are ever made), so there is nothing for
    // "networkidle0" to wait on, and puppeteer-core's SetContentWaitForOptions
    // type excludes it here anyway.
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", landscape: true, printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function sendCertificateEmail(
  email: string,
  certificateNumber: string,
  pdf: Buffer,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");

  const { error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: email,
    subject: `Your Empowr ECCP certificate — ${certificateNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1B1B1B;max-width:480px;margin:0 auto;padding:32px 16px;">
  <p style="font-size:15px;">Congratulations — you've passed the Empowr Certified Coaching Programme (ECCP) safeguarding assessment.</p>
  <p style="font-size:15px;">Your certificate (<strong>${certificateNumber}</strong>) is attached to this email, and you can download it again any time from your ECCP certificate page.</p>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;">
  <p style="font-size:12px;color:#9CA3AF;">Empowr CIC · empowrcic.org</p>
</body>
</html>`,
    text: `Congratulations — you've passed the Empowr Certified Coaching Programme (ECCP) safeguarding assessment.

Your certificate (${certificateNumber}) is attached to this email, and you can download it again any time from your ECCP certificate page.

Empowr CIC`,
    // Resend's HTTP API documents base64 content; the SDK's type also allows
    // a raw Buffer but doesn't say whether it re-encodes one, so this encodes
    // explicitly rather than trusting an unverified auto-conversion.
    attachments: [
      {
        filename: `empowr-eccp-certificate-${certificateNumber}.pdf`,
        content: pdf.toString("base64"),
      },
    ],
  });

  if (error) {
    throw new Error(`resend rejected the send: ${error.name} — ${error.message}`);
  }
}
