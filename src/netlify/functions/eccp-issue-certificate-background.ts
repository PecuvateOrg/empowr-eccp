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
import { runCertificateIssuance } from "@/lib/issue-certificate";

export default async function handler(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const attemptId = body && typeof body.attemptId === "string" ? body.attemptId : null;
  if (!attemptId) {
    return new Response(null, { status: 400 });
  }

  try {
    await runCertificateIssuance(attemptId);
    console.log("[eccp-issue-certificate] issued", JSON.stringify({ attemptId }));
  } catch (cause) {
    // Nothing else observes this failure — the coach's certificate page has
    // its own retry action for exactly this case.
    console.error(
      "[eccp-issue-certificate] failed",
      JSON.stringify({ attemptId, error: cause instanceof Error ? cause.message : String(cause) }),
    );
  }

  return new Response(null, { status: 200 });
}
