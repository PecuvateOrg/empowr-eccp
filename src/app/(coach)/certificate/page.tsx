import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { getAttempts } from "@/lib/assessment";
import { getCertificateForCoach } from "@/lib/certificates";
import { CertificateStatus } from "./CertificateStatus";

export const metadata: Metadata = {
  title: "Your certificate — Empowr ECCP",
  robots: { index: false, follow: false },
};

export default async function CertificatePage() {
  const coach = (await getCurrentCoach())!;
  const attempts = await getAttempts(coach.id);
  const latestPass = attempts.find((a) => a.passed);

  // Nothing to show yet: the coach hasn't passed, so there's no certificate
  // in flight and nothing for this page to poll for.
  if (!latestPass) {
    redirect("/course");
  }

  const certificate = await getCertificateForCoach(coach.id);

  return (
    <main className="py-10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-dark">
        Empowr: Safeguarding for Roller Skating Coaches
      </p>
      <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
        Your certificate
      </h1>

      <CertificateStatus
        certificate={certificate}
        submittedAt={latestPass.submittedAt}
      />
    </main>
  );
}
