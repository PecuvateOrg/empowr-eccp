// Certificate issuance — background execution.
//
// Triggered by api/course/assessment/route.ts the moment a coach passes, via
// a plain HTTP POST to this function's own URL (never awaited synchronously
// by that route — see lib/certificates.ts). Puppeteer + @sparticuz/chromium
// cold-starting, a Storage upload, and a Resend send with a PDF attachment
// can comfortably exceed a normal Netlify Function's execution ceiling; a
// background function gets 15 minutes and Netlify returns 202 before this
// handler's own work starts, so the triggering route never blocks on it.
//
// BUILDS ITS OWN SUPABASE AND RESEND CLIENTS — do NOT import lib/supabase.ts
// or lib/email.ts here. Neither carries a `server-only` guard today, but
// nothing stops one from being added later (exactly the failure class in
// feedback_server_only_throws_outside_next: it throws outside Next's build,
// silently, while Netlify still reports the function deployed). Only
// lib/certificate-template.ts, lib/london-date.ts and the safeguarding
// course's PASS_MARK are imported — plain data/string modules with no
// Next.js-specific dependency anywhere in their own import chain.
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { renderCertificateHtml } from "@/lib/certificate-template";
import { computeCertificateDates } from "@/lib/london-date";
import { PASS_MARK } from "@/lib/safeguarding-course";

const BUCKET = "eccp-certificates";
const FROM = "Empowr ECCP <eccp@empowrcic.org>";

export default async function handler(req: Request): Promise<Response> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("[eccp-issue-certificate] missing Supabase env");
    return new Response(null, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const attemptId = body && typeof body.attemptId === "string" ? body.attemptId : null;
  if (!attemptId) {
    return new Response(null, { status: 400 });
  }

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false },
    db: { schema: "eccp" },
  });

  try {
    await issueCertificate(db, attemptId);
    console.log("[eccp-issue-certificate] issued", JSON.stringify({ attemptId }));
  } catch (cause) {
    // Nothing else observes this failure — the coach's certificate page has
    // its own retry action for exactly this case, since a dead run here
    // leaves no trace beyond this log line.
    console.error(
      "[eccp-issue-certificate] failed",
      JSON.stringify({ attemptId, error: cause instanceof Error ? cause.message : String(cause) }),
    );
  }

  return new Response(null, { status: 200 });
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
  // Same dual executablePath pattern as Freelancer-Workflow's
  // send-agreement-v2.ts: Lambda uses @sparticuz/chromium's bundled binary,
  // a local run uses whatever Chrome is already installed.
  const executablePath = process.env.AWS_LAMBDA_FUNCTION_NAME
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
  <p style="font-size:15px;">Congratulations — you've passed the Empowr safeguarding assessment.</p>
  <p style="font-size:15px;">Your certificate (<strong>${certificateNumber}</strong>) is attached to this email, and you can download it again any time from your ECCP certificate page.</p>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;">
  <p style="font-size:12px;color:#9CA3AF;">Empowr CIC · empowrcic.org</p>
</body>
</html>`,
    text: `Congratulations — you've passed the Empowr safeguarding assessment.

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
