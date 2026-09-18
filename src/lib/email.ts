import { Resend } from "resend";

// Every ECCP email goes out from this one address, and replies come back to it.
// It sits on the empowrcic.org apex, which already carries verified SPF/DKIM/
// DMARC, so no new domain or subdomain verification is needed.
//
// The handover named safeguarding@ instead; that address was used and proven to
// deliver, then superseded by eccp@ on 2026-09-15 as the programme's own inbox.
const FROM = "Empowr ECCP <eccp@empowrcic.org>";

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
  <p style="font-size:15px;margin-bottom:24px;">Your Empowr Certified Coaching Programme (ECCP) login code:</p>
  <p style="font-size:40px;font-weight:700;letter-spacing:12px;text-align:center;margin:0 0 24px;">${code}</p>
  <p style="font-size:14px;color:#6B7280;">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;">
  <p style="font-size:12px;color:#9CA3AF;">Empowr CIC · empowrcic.org</p>
</body>
</html>`,
    text: `Your Empowr Certified Coaching Programme (ECCP) login code: ${code}

This code expires in 10 minutes. If you didn't request it, ignore this email.

Empowr CIC`,
  });

  if (error) {
    throw new Error(`resend rejected the send: ${error.name} — ${error.message}`);
  }

  console.info(`[email] otp sent to ${email}, resend id ${data?.id}`);
}

// The sign-in link is a constant, not derived from the incoming request. On
// Netlify, request.url carries the internal deploy host rather than the public
// domain, which has already broken a sign-in link elsewhere in this workspace.
// A wrong link here reaches a coach's inbox, where it cannot be corrected.
const SIGN_IN_URL = "https://eccp.empowrcic.org/login";

// Sent when staff provision a coach, so the account is not silently created.
// It carries a link, NOT a code: OTPs expire in 10 minutes and one embedded in
// a provisioning email is stale long before anyone reads it. The coach requests
// their own code from the sign-in page.
export async function sendWelcomeEmail(
  email: string,
  fullName: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");

  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  const { data, error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: email,
    subject: "Your Empowr coach account is ready",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1B1B1B;max-width:480px;margin:0 auto;padding:32px 16px;">
  <p style="font-size:15px;">Hi ${firstName},</p>
  <p style="font-size:15px;line-height:1.6;">Your account on the Empowr Certified Coaching Programme (ECCP) is ready. You can now start your safeguarding training.</p>
  <p style="text-align:center;margin:32px 0;">
    <a href="${SIGN_IN_URL}" style="display:inline-block;background:#4a70c2;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:999px;">Sign in to start</a>
  </p>
  <p style="font-size:14px;line-height:1.6;color:#6B7280;">There is no password. Enter this email address (<strong>${email}</strong>) on the sign-in page and we'll send you a 6-digit code.</p>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;">
  <p style="font-size:12px;color:#9CA3AF;">Empowr CIC · empowrcic.org<br>If you weren't expecting this, reply to this email and let us know.</p>
</body>
</html>`,
    text: `Hi ${firstName},

Your account on the Empowr Certified Coaching Programme (ECCP) is ready. You can now start your safeguarding training.

Sign in to start: ${SIGN_IN_URL}

There is no password. Enter this email address (${email}) on the sign-in page and we'll send you a 6-digit code.

Empowr CIC
If you weren't expecting this, reply to this email and let us know.`,
  });

  if (error) {
    throw new Error(`resend rejected the send: ${error.name} — ${error.message}`);
  }

  console.info(`[email] welcome sent to ${email}, resend id ${data?.id}`);
}

// A staff account is not a coach account — sendWelcomeEmail's copy tells the
// reader to "start your safeguarding training", which is wrong for someone
// added to manage the roster rather than take it. There is no staff-
// provisioning UI yet (staff rows are still added directly in the database),
// so this has no caller in the app today; it exists so the next staff add
// has correct copy to send rather than reusing the coach template again.
export async function sendStaffWelcomeEmail(
  email: string,
  fullName: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");

  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  const { data, error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: email,
    subject: "Your Empowr ECCP staff access is ready",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1B1B1B;max-width:480px;margin:0 auto;padding:32px 16px;">
  <p style="font-size:15px;">Hi ${firstName},</p>
  <p style="font-size:15px;line-height:1.6;">You've been added as staff on the Empowr Certified Coaching Programme (ECCP) platform. You can sign in to manage the coach roster, review certifications, and add new coaches.</p>
  <p style="text-align:center;margin:32px 0;">
    <a href="${SIGN_IN_URL}" style="display:inline-block;background:#4a70c2;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:999px;">Sign in to management</a>
  </p>
  <p style="font-size:14px;line-height:1.6;color:#6B7280;">There is no password. Enter this email address (<strong>${email}</strong>) on the sign-in page and we'll send you a 6-digit code.</p>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;">
  <p style="font-size:12px;color:#9CA3AF;">Empowr CIC · empowrcic.org<br>If you weren't expecting this, reply to this email and let us know.</p>
</body>
</html>`,
    text: `Hi ${firstName},

You've been added as staff on the Empowr Certified Coaching Programme (ECCP) platform. You can sign in to manage the coach roster, review certifications, and add new coaches.

Sign in to management: ${SIGN_IN_URL}

There is no password. Enter this email address (${email}) on the sign-in page and we'll send you a 6-digit code.

Empowr CIC
If you weren't expecting this, reply to this email and let us know.`,
  });

  if (error) {
    throw new Error(`resend rejected the send: ${error.name} — ${error.message}`);
  }

  console.info(`[email] staff welcome sent to ${email}, resend id ${data?.id}`);
}
