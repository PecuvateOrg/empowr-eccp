import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { canUsePasskeys, passkeysEnabled } from "@/lib/passkeys";
import { PasskeyManager } from "@/components/PasskeyManager";
import { AppAlerts } from "@/components/AppAlerts";
import { ALERT_KINDS, getAlertSettings, VAPID_PUBLIC_KEY, type AlertKind } from "@/lib/push";

export const metadata: Metadata = { title: "Account" };

// The person, not the platform (Web Build Framework types/web-app/account-page.md): how you
// sign in and how you hear from us. Coaching details live on Profile. Always renders, so the
// menu link never 404s; a switched-off section says so.
export default async function AccountPage() {
  const coach = await getCurrentCoach();
  if (!coach) redirect("/login");
  const isCoach = canUsePasskeys(coach);
  // A failed read shows an error, never a guessed on/off.
  const settings = isCoach ? await getAlertSettings(coach.id).catch(() => null) : null;

  return (
    <main className="max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Account</h1>
      <p className="mt-2 text-ink/70">
        Signed in as <span className="font-bold text-ink">{coach.email}</span>. Your coaching details are on your{" "}
        <Link href="/profile" className="font-bold text-blue-dark underline">Profile</Link>.
      </p>

      <section aria-labelledby="sign-in" className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 id="sign-in" className="text-lg font-bold text-ink">Sign-in and passkeys</h2>
        {!isCoach ? (
          <p className="text-ink/70">
            Staff accounts sign in through the Empowr Dashboard. Manage your passkeys there, on its Account page.
          </p>
        ) : passkeysEnabled ? (
          <>
            <p className="text-ink/70">
              Sign in with Face ID, Touch ID, Windows Hello or your phone instead of an email code. The email code always
              still works.
            </p>
            <PasskeyManager />
          </>
        ) : (
          <p className="text-ink/70">Passkey sign-in isn&apos;t switched on yet. Sign in with the email code.</p>
        )}
      </section>

      <section aria-labelledby="alerts" className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 id="alerts" className="text-lg font-bold text-ink">App and alerts</h2>
        {!isCoach ? (
          <p className="text-ink/70">Staff alerts come through the Empowr Dashboard. Turn them on from its Account page.</p>
        ) : !settings ? (
          <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 font-bold text-ink">Couldn&apos;t load your alert settings. Refresh to try again.</p>
        ) : (
          <>
            <p className="text-ink/70">Install ECCP as an app and get an alert on your phone or computer when there&apos;s news for you.</p>
            <AppAlerts
              vapidKey={VAPID_PUBLIC_KEY}
              kinds={(Object.keys(ALERT_KINDS) as AlertKind[]).map((key) => ({ key, ...ALERT_KINDS[key], on: settings[key] }))}
            />
          </>
        )}
      </section>
    </main>
  );
}
