import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Coach sign in — Empowr ECCP",
  robots: { index: false, follow: false },
};

const SSO_PROBLEMS: Record<string, string> = {
  expired: "That sign-in took too long. Please try again.",
  failed: "Empowr Dashboard sign-in did not complete. Please try again.",
  not_staff: "That Dashboard account does not have ECCP management access. Coaches sign in with an email code below.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sso?: string }>;
}) {
  const { sso } = await searchParams;
  const ssoProblem = sso ? SSO_PROBLEMS[sso] ?? SSO_PROBLEMS.failed : null;
  const coach = await getCurrentCoach();
  if (coach) redirect(can(coach, "view_management") ? "/management" : "/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 py-16">
      <LoginForm />
      <div className="w-full max-w-md space-y-3 border-t border-border pt-6 text-center">
        <p className="text-sm text-muted">Empowr staff</p>
        <a
          href="/api/auth/sso/start"
          className="flex min-h-11 w-full items-center justify-center rounded-lg border border-blue px-4 py-2 text-sm font-bold text-blue transition-colors hover:bg-blue/10"
        >
          Sign in with Empowr Dashboard
        </a>
        {ssoProblem ? (
          <p role="alert" className="rounded-lg bg-red/10 px-3 py-2 text-left text-sm text-ink">
            {ssoProblem}
          </p>
        ) : null}
      </div>
    </main>
  );
}
