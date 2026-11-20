// Daily renewal-reminder sweep.
//
// A certificate renews 3 years after completion (computeCertificateDates).
// This finds every certificate entering its reminder window and emails the
// coach once — `reminder_sent_at` is the idempotency marker; without it a
// certificate sitting inside the window would get a fresh email every single
// day until it renews.
//
// Direct call, not an HTTP hand-off to a background function (contrast
// eccp-issue-certificate-background.ts, whose Puppeteer/Storage/Resend work
// can exceed a normal function's ceiling): this is a handful of Supabase
// round-trips and plain-text Resend sends against a small coach base.
//
// BUILDS ITS OWN SUPABASE AND RESEND CLIENTS — do NOT import lib/supabase.ts
// or lib/email.ts here. Neither carries a `server-only` guard today, but
// nothing stops one from being added later (feedback_server_only_throws_outside_next:
// it throws outside Next's build, silently, while Netlify still reports the
// function deployed). Only lib/london-date.ts and lib/certificate-template.ts's
// COURSE_TITLE are imported — plain data/string modules with no Next.js
// dependency anywhere in their own import chain.
import type { Config } from "@netlify/functions";
import { runRenewalReminders } from "@/lib/renewal-reminders";

export default async function handler(): Promise<Response> {
  try {
    const result = await runRenewalReminders();
    console.log("[eccp-renewal-reminders]", JSON.stringify(result));
    return new Response(null, { status: 200 });
  } catch (cause) {
    console.error(
      "[eccp-renewal-reminders] failed",
      cause instanceof Error ? cause.message : String(cause),
    );
    return new Response(null, { status: 500 });
  }
}

// Schedule REMOVED 2026-11-18: reminders now run on AWS (EventBridge rule
// eccp-renewal-reminders-daily → POST /api/cron/renewal-reminders, 08:00 UTC).
// Only one scheduler may be live. This function stays only as the Netlify
// fallback until that site is retired; restore `schedule: "0 8 * * *"` here
// ONLY if the AWS rule is disabled at the same time.
export const config: Config = {};
