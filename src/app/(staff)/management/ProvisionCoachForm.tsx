"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

export function ProvisionCoachForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/management/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setBusy(false);
      setError(body.error ?? "Could not provision that coach. Please try again.");
      return;
    }

    setEmail("");
    setFullName("");
    setBusy(false);
    router.refresh();
  }

  return (
    <form
      className="mt-8 rounded-2xl border border-border bg-card p-6"
      onSubmit={submit}
    >
      <h2 className="font-black text-ink">Provision a coach</h2>
      <p className="mt-1 text-sm text-muted">
        They&apos;ll sign in with this email — no password, no invite step.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <label className="sr-only" htmlFor="provision-full-name">
            Full name
          </label>
          <input
            className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue-pale"
            id="provision-full-name"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            required
            type="text"
            value={fullName}
          />
        </div>
        <div className="flex-1">
          <label className="sr-only" htmlFor="provision-email">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue-pale"
            id="provision-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
            value={email}
          />
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <UserPlus aria-hidden="true" className="size-5" />
          )}
          Add coach
        </button>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-lg bg-red/10 px-4 py-3 text-sm font-bold text-red-dark"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
