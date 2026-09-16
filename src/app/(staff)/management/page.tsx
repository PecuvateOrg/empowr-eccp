import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth";
import { getManagementOverview } from "@/lib/management";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ManagementPage() {
  // (staff)/layout.tsx already redirects a non-staff coach before this ever
  // renders; this repeats the check because getManagementOverview requires
  // it — see the comment there for why the second gate exists.
  const coach = await getCurrentCoach();
  if (!coach || !coach.is_staff) redirect("/course");

  const roster = await getManagementOverview(coach);

  return (
    <main className="py-8">
      <h1 className="text-3xl font-black text-ink">Coach roster</h1>
      <p className="mt-2 text-sm text-muted">
        {roster.length} coach{roster.length === 1 ? "" : "es"} provisioned.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-warm-white text-xs font-bold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Coach</th>
              <th className="px-4 py-3">Latest attempt</th>
              <th className="px-4 py-3">Certificate</th>
              <th className="px-4 py-3">Renews</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-bold text-ink">
                    {entry.fullName}
                    {entry.isStaff ? (
                      <span className="ml-2 rounded-full bg-blue/10 px-2 py-0.5 text-xs font-bold text-blue">
                        Staff
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted">{entry.email}</div>
                </td>
                <td className="px-4 py-3">
                  {entry.latestAttempt ? (
                    <span
                      className={
                        entry.latestAttempt.passed
                          ? "font-bold text-emerald-700"
                          : "font-bold text-red-dark"
                      }
                    >
                      {entry.latestAttempt.score}% — {entry.latestAttempt.passed ? "Passed" : "Failed"}
                    </span>
                  ) : (
                    <span className="text-muted">Not attempted</span>
                  )}
                  {entry.latestAttempt ? (
                    <div className="text-xs text-muted">
                      {formatDate(entry.latestAttempt.submittedAt)}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {entry.certificate ? (
                    <span className="font-mono text-xs">{entry.certificate.certificateNumber}</span>
                  ) : (
                    <span className="text-muted">None issued</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {entry.certificate ? formatDate(entry.certificate.renewsAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
