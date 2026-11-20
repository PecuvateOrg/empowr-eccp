import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runRenewalReminders } from "@/lib/renewal-reminders";

// Daily 08:00 UTC on Amplify: EventBridge API destination → this route
// (_config/guides/amplify-scheduled-calls.md). On Netlify the scheduled
// function does the same job; only one scheduler is switched on at a time.
// Fails closed when CRON_SECRET is unset.
function authorised(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!authorised(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  try {
    const result = await runRenewalReminders();
    console.log("[cron/renewal-reminders]", JSON.stringify(result));
    return NextResponse.json(result);
  } catch (cause) {
    console.error(
      "[cron/renewal-reminders] failed",
      cause instanceof Error ? cause.message : String(cause),
    );
    return NextResponse.json({ error: "Reminder sweep failed" }, { status: 500 });
  }
}
