"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setBusy(false);
    if (response.ok) {
      setStep("code");
    } else {
      setError("Something went wrong. Please try again.");
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      router.push(data.redirectTo ?? "/course");
    } else {
      setBusy(false);
      setError(data.error ?? "Invalid or expired code.");
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[0_4px_24px_rgb(27_27_27_/_0.06)]">
      <BrandMark label="ECCP" />

      {step === "email" ? (
        <form onSubmit={requestCode}>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-ink">
            Coach sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Enter the email address Empowr holds for you and we&rsquo;ll send a
            six-digit code.
          </p>

          <label
            className="mt-6 block text-sm font-bold text-ink"
            htmlFor="email"
          >
            Email address
          </label>
          <input
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue-pale"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <SubmitButton busy={busy} label="Send code" />
          {error ? <ErrorNote>{error}</ErrorNote> : null}
        </form>
      ) : (
        <form onSubmit={submitCode}>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-ink">
            Enter your code
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            If <span className="font-bold text-ink">{email}</span> matches a
            coach account, a six-digit code is on its way. It expires in 10
            minutes.
          </p>

          <label
            className="mt-6 block text-sm font-bold text-ink"
            htmlFor="code"
          >
            Six-digit code
          </label>
          <input
            autoComplete="one-time-code"
            className="mt-2 w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue-pale"
            id="code"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            pattern="\d{6}"
            required
            value={code}
          />

          <SubmitButton busy={busy} label="Sign in" />
          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <button
            className="mt-4 w-full text-sm font-bold text-blue hover:text-blue-dark"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            type="button"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark disabled:opacity-60"
      disabled={busy}
      type="submit"
    >
      {busy ? (
        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
      ) : null}
      {label}
    </button>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-lg bg-red/10 px-4 py-3 text-sm font-bold text-red-dark" role="alert">
      {children}
    </p>
  );
}
