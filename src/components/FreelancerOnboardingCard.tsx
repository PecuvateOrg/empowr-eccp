import { efn } from "@/lib/efn-client";

// "Become an Empowr freelancer": greyed out until the coach is certified (owner 2026-11-24).
// EFN decides the state (efn_onboarding_state) and issues the one-use onboarding link.
const TEXT: Record<string, { label: string; body: string }> = {
  linked: { label: "Done", body: "You're an Empowr freelancer, ready to accept shifts and be paid." },
  not_certified: { label: "Locked", body: "Complete your ECCP certification first. Then you can become an Empowr freelancer here, ready to accept paid shifts." },
  // Since 2026-11-24 EFN turns 16–17 into ready/in_progress (parent/guardian co-signs), so this is 13–15.
  under_18: { label: "From 16", body: "You're certified. Junior Champions keep training with ECCP; you can become an Empowr freelancer (Junior Assistant Coach) from your 16th birthday, with a parent or guardian's consent." },
  in_progress: { label: "In progress", body: "Your Freelance Services Agreement has been emailed to you. Sign it, then add your payment details from the link in the email. If you are under 18, your parent or guardian signs their consent first." },
  ready: { label: "Ready", body: "You're certified. Become an Empowr freelancer to accept shifts and get paid: it takes about five minutes." },
};

export async function FreelancerOnboardingCard({ coachId }: { coachId: string }) {
  const r = await efn("/onboarding", { coachId });
  const state = typeof r.data.state === "string" && TEXT[r.data.state] ? r.data.state : null;
  const t = state ? TEXT[state] : null;
  const locked = state !== "ready";
  return <section className={`rounded-2xl border border-border bg-card p-6 ${state === "not_certified" ? "opacity-60" : ""}`} aria-label="Become an Empowr freelancer">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-bold text-ink">Become an Empowr freelancer</h2>
      {t && <span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted">{t.label}</span>}
    </div>
    <p className="mt-2 text-sm text-muted">{t ? t.body : "Freelancer status is unavailable right now. Try again shortly."}</p>
    <form action="/api/onboarding/start" method="post" className="mt-4">
      <button type="submit" disabled={locked} aria-disabled={locked}
        className="inline-flex min-h-11 items-center rounded-xl bg-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:bg-border disabled:text-muted">
        Start freelancer onboarding
      </button>
    </form>
  </section>;
}
