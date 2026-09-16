"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Download, Loader2, RefreshCw } from "lucide-react";

interface CertificateView {
  certificateNumber: string;
  courseTitle: string;
  passScore: number;
  completedAt: string;
  renewsAt: string;
}

const RETRY_AFTER_MS = 90_000;
const POLL_INTERVAL_MS = 5_000;

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CertificateStatus({
  certificate,
  submittedAt,
}: {
  certificate: CertificateView | null;
  submittedAt: string;
}) {
  const router = useRouter();
  const [showRetry, setShowRetry] = useState(
    () => Date.now() - new Date(submittedAt).getTime() > RETRY_AFTER_MS,
  );
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Poll for the certificate row until it appears — generation runs in a
  // background function, so this response never carries it directly.
  useEffect(() => {
    if (certificate) return;

    const pollId = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    const retryTimer = setTimeout(
      () => setShowRetry(true),
      Math.max(0, RETRY_AFTER_MS - (Date.now() - new Date(submittedAt).getTime())),
    );

    return () => {
      clearInterval(pollId);
      clearTimeout(retryTimer);
    };
  }, [certificate, router, submittedAt]);

  async function retry() {
    setRetrying(true);
    setRetryError(null);

    const response = await fetch("/api/certificate/retry-issuance", { method: "POST" });

    setRetrying(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setRetryError(body.error ?? "Could not restart certificate generation.");
      return;
    }

    setShowRetry(false);
    router.refresh();
  }

  if (!certificate) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <Loader2 aria-hidden="true" className="size-6 shrink-0 animate-spin text-blue" />
          <div>
            <p className="font-bold text-ink">Generating your certificate…</p>
            <p className="mt-1 text-sm text-muted">
              This usually takes a few seconds. This page will update automatically.
            </p>
          </div>
        </div>

        {showRetry ? (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-muted">
              This is taking longer than expected.
            </p>
            <button
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 font-extrabold text-white hover:bg-blue-dark disabled:opacity-60"
              disabled={retrying}
              onClick={retry}
              type="button"
            >
              {retrying ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <RefreshCw aria-hidden="true" className="size-4" />
              )}
              Try again
            </button>
            {retryError ? (
              <p className="mt-3 text-sm font-bold text-red-dark" role="alert">
                {retryError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <Award aria-hidden="true" className="size-8 shrink-0 text-blue" />
        <div>
          <p className="font-bold text-ink">{certificate.courseTitle}</p>
          <p className="text-sm text-muted">Certificate {certificate.certificateNumber}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.1em] text-blue">
            Date completed
          </dt>
          <dd className="mt-1 font-bold text-ink">{formatDate(certificate.completedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.1em] text-blue">
            Renewal due
          </dt>
          <dd className="mt-1 font-bold text-ink">{formatDate(certificate.renewsAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.1em] text-blue">
            Pass mark
          </dt>
          <dd className="mt-1 font-bold text-ink">{certificate.passScore}%</dd>
        </div>
      </dl>

      <a
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark"
        href="/api/certificate/download"
        target="_blank"
        rel="noreferrer"
      >
        <Download aria-hidden="true" className="size-5" />
        Download certificate
      </a>
    </div>
  );
}
