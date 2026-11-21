import Link from "next/link";
import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { getManagementOverview } from "@/lib/management";
import { ProvisionCoachForm } from "./ProvisionCoachForm";
import { CoachingGradeEditor } from "./CoachingGradeEditor";
import { coachingGradeEnabled } from "@/lib/coaching-grade";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const complianceTools = [
  { title: "Coach onboarding", description: "Review onboarding stages and requirements.", href: "/management/onboarding-preview", action: "Open onboarding example" },
  { title: "Safeguarding & training", description: "Review outstanding requirements, deadlines and draft reminders.", href: "/management/compliance-preview", action: "Open compliance example" },
];

export default async function ManagementPage() {
  const coach = await getCurrentCoach();
  if (!coach || !can(coach, "view_management")) redirect("/course");
  const roster = await getManagementOverview(coach);
  const showGrade = coachingGradeEnabled();
  const canEditGrade = can(coach, "change_roles");
  const passed = roster.filter(item => item.latestAttempt?.passed).length;
  const certified = roster.filter(item => item.certificate).length;

  return (
    <main className="py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue">ECCP Management</p>
          <h1 className="mt-1 text-3xl font-black text-ink">Coach management</h1>
          <p className="mt-2 text-sm text-muted">Find coach records, review training and access management tools.</p>
        </div>
        <a href="#coach-roster" className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-blue">View coach roster</a>
      </div>

      <section aria-label="Coach overview" className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted">Coach accounts</p><p className="mt-1 text-3xl font-black">{roster.length}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted">Latest assessment passed</p><p className="mt-1 text-3xl font-black">{passed}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted">Certificates recorded</p><p className="mt-1 text-3xl font-black">{certified}</p></div>
      </section>
      <p className="mt-2 text-xs text-muted">These figures use the existing coach roster and assessment records. They are not onboarding or compliance clearance totals.</p>

      <section className="mt-9" aria-labelledby="management-tools">
        <h2 id="management-tools" className="text-xl font-bold">Training &amp; Compliance</h2>
        <p className="mt-1 text-sm text-muted">Coach onboarding, safeguarding, training, deadlines and reminders in one place. These tools currently use fictional example data.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {complianceTools.map(item => <Link key={item.href} href={item.href} className="flex flex-col rounded-xl border border-border bg-card p-5 hover:border-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue">
            <h3 className="font-bold text-ink">{item.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted">{item.description}</p>
            <span className="mt-4 text-sm font-semibold text-blue">{item.action} →</span>
            <span className="mt-2 text-xs text-muted">Example only — no live changes</span>
          </Link>)}
        </div>
        <div className="mt-5 rounded-xl border border-border bg-card p-5">
          <h3 className="font-bold text-ink">Coach grading</h3>
          <p className="mt-2 text-sm text-muted">Explore coaching grades separately from onboarding and compliance.</p>
          <Link href="/management/grading-preview" className="mt-3 inline-block text-sm font-semibold text-blue">Open grading example →</Link>
          <p className="mt-2 text-xs text-muted">Example only — no live changes</p>
        </div>
      </section>

      <section id="coach-roster" className="mt-10 scroll-mt-6" aria-labelledby="coach-roster-heading">
        <h2 id="coach-roster-heading" className="text-xl font-bold">Coach roster</h2>
        <p className="mt-1 text-sm text-muted">Live coach account, assessment and certificate records.</p>
        {roster.length === 0 ? <p className="mt-4 rounded-xl border border-border bg-card p-5 text-sm">No coach accounts found.</p> : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {roster.map(entry => <article key={entry.id} className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
              <h3 className="break-words font-bold text-ink">{entry.fullName}</h3>
              <p className="mt-1 break-all text-sm text-muted">{entry.email}</p>
              <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">Latest assessment</dt><dd className="mt-1 font-semibold">{entry.latestAttempt ? `${entry.latestAttempt.score}% — ${entry.latestAttempt.passed ? "Passed" : "Failed"}` : "Not attempted"}</dd>
                  {entry.latestAttempt && <p className="mt-1 text-xs text-muted">{formatDate(entry.latestAttempt.submittedAt)}</p>}</div>
                <div><dt className="text-muted">Certificate</dt><dd className="mt-1 break-all font-semibold">{entry.certificate ? entry.certificate.certificateNumber : "Not issued"}</dd>
                  {entry.certificate && <p className="mt-1 text-xs text-muted">Renews {formatDate(entry.certificate.renewsAt)}</p>}</div>
              </dl>
              {showGrade && <div className="mt-4 border-t border-border pt-4 text-sm"><p className="text-muted">Coaching grade</p>
                <div className="mt-1 font-semibold"><CoachingGradeEditor coachId={entry.id} initialGrade={entry.coachingGrade} canEdit={canEditGrade} /></div></div>}
            </article>)}
          </div>
        )}
      </section>

      <section className="mt-9 rounded-xl border border-border bg-card p-4 sm:p-6" aria-labelledby="admin-actions">
        <h2 id="admin-actions" className="text-xl font-bold">Administrative actions</h2>
        <p className="mt-1 text-sm text-muted">Create a coach account or test certificate output when needed.</p>
        <details className="mt-4 rounded-lg border border-border p-4">
          <summary className="cursor-pointer font-semibold text-blue">Invite / provision a coach</summary>
          <div className="mt-3"><ProvisionCoachForm /></div>
        </details>
        <details className="mt-3 rounded-lg border border-border p-4">
          <summary className="cursor-pointer font-semibold text-blue">Certificate PDF test</summary>
          <p className="mt-3 text-sm text-muted">This creates a sample PDF only; it is not saved, emailed or numbered.</p>
          <a href="/api/management/certificate-preview" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-blue underline">Open sample certificate PDF</a>
        </details>
      </section>
    </main>
  );
}
