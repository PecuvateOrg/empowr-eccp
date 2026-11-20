// Daily renewal-reminder sweep — the work itself, shared by both hosts.
// Netlify: scheduled function netlify/functions/eccp-renewal-reminders.ts.
// Amplify: POST /api/cron/renewal-reminders, called by EventBridge at 08:00 UTC.
// Idempotent: `reminder_sent_at` marks each certificate once.
//
// BUILDS ITS OWN SUPABASE AND RESEND CLIENTS — see lib/issue-certificate.ts.
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { londonDateIsoInDays } from "@/lib/london-date";
import { COURSE_TITLE } from "@/lib/certificate-template";

const REMINDER_WINDOW_DAYS = 30;
const FROM = "Empowr ECCP <eccp@empowrcic.org>";


export async function runRenewalReminders(): Promise<{ due: number; sent: number; failed: number }> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("missing Supabase env");
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false },
    db: { schema: "eccp" },
  });
  return sendDueReminders(db);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendDueReminders(db: any): Promise<{ due: number; sent: number; failed: number }> {
  const today = londonDateIsoInDays(0);
  const windowEnd = londonDateIsoInDays(REMINDER_WINDOW_DAYS);

  const { data: due, error } = await db
    .from("certificates")
    .select("id, certificate_number, renews_at, coach:coaches(email, full_name)")
    .is("reminder_sent_at", null)
    .gte("renews_at", today)
    .lte("renews_at", windowEnd);

  if (error) throw new Error(`due-certificate lookup failed: ${error.message}`);
  if (!due || due.length === 0) return { due: 0, sent: 0, failed: 0 };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  const resend = new Resend(apiKey);

  let sent = 0;
  let failed = 0;

  for (const certificate of due) {
    try {
      const { error: sendError } = await resend.emails.send({
        from: FROM,
        to: certificate.coach.email,
        subject: `Your Empowr ECCP certificate renews soon — ${certificate.certificate_number}`,
        html: renewalEmailHtml(certificate),
        text: renewalEmailText(certificate),
      });
      if (sendError) throw new Error(`resend rejected the send: ${sendError.name} — ${sendError.message}`);

      // Marked immediately after a successful send, one certificate at a
      // time — a crash partway through this loop must never leave a sent
      // reminder unmarked (that would re-send it tomorrow), and must never
      // mark one that was never actually sent.
      const { error: updateError } = await db
        .from("certificates")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", certificate.id);
      if (updateError) throw new Error(`reminder_sent_at update failed: ${updateError.message}`);

      sent += 1;
    } catch (cause) {
      failed += 1;
      console.error(
        "[eccp-renewal-reminders] one reminder failed",
        JSON.stringify({
          certificateId: certificate.id,
          certificateNumber: certificate.certificate_number,
          error: cause instanceof Error ? cause.message : String(cause),
        }),
      );
    }
  }

  return { due: due.length, sent, failed };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renewalEmailHtml(certificate: any): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1B1B1B;max-width:480px;margin:0 auto;padding:32px 16px;">
  <p style="font-size:15px;">Your Empowr Certified Coaching Programme (ECCP) safeguarding certificate is due for renewal.</p>
  <p style="font-size:15px;">Certificate <strong>${certificate.certificate_number}</strong> for
  <em>${COURSE_TITLE}</em> renews on <strong>${certificate.renews_at}</strong>. Please retake the
  course and assessment before then to keep your certification current.</p>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;">
  <p style="font-size:12px;color:#9CA3AF;">Empowr CIC · empowrcic.org</p>
</body>
</html>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renewalEmailText(certificate: any): string {
  return `Your Empowr Certified Coaching Programme (ECCP) safeguarding certificate is due for renewal.

Certificate ${certificate.certificate_number} for ${COURSE_TITLE} renews on ${certificate.renews_at}. Please retake the course and assessment before then to keep your certification current.

Empowr CIC`;
}

