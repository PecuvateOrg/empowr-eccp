import { Resend } from "resend";

// safeguarding@ is the address the handover names for this programme. It sits
// on the empowrcic.org apex, which already carries verified SPF/DKIM/DMARC —
// no new domain or subdomain verification is needed.
const FROM = "Empowr Safeguarding <safeguarding@empowrcic.org>";

// Resend's SDK reports API failures in the returned `error` field rather than
// throwing, so an unverified sender or rejected address returns normally. Left
// unchecked, the caller reports "code sent" for an email that never left.
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");

  const { data, error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: email,
    subject: `Your ECCP login code: ${code}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1B1B1B;max-width:480px;margin:0 auto;padding:32px 16px;">
  <p style="font-size:15px;margin-bottom:24px;">Your Empowr Coach Certification login code:</p>
  <p style="font-size:40px;font-weight:700;letter-spacing:12px;text-align:center;margin:0 0 24px;">${code}</p>
  <p style="font-size:14px;color:#6B7280;">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;">
  <p style="font-size:12px;color:#9CA3AF;">Empowr CIC · empowrcic.org</p>
</body>
</html>`,
    text: `Your Empowr Coach Certification login code: ${code}

This code expires in 10 minutes. If you didn't request it, ignore this email.

Empowr CIC`,
  });

  if (error) {
    throw new Error(`resend rejected the send: ${error.name} — ${error.message}`);
  }

  console.info(`[email] otp sent to ${email}, resend id ${data?.id}`);
}
