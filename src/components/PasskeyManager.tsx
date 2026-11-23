"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { deletePasskey, finishAddPasskey, myPasskeys, startAddPasskey } from "@/app/(coach)/account/actions";
import type { PasskeyListItem } from "@/lib/passkeys";

const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android phone";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows computer";
  return "Passkey";
}

const noSubscribe = () => () => {};

export function PasskeyManager() {
  // null on the server and during hydration, then the browser's answer.
  const supported = useSyncExternalStore(noSubscribe, browserSupportsWebAuthn, () => null);
  const [passkeys, setPasskeys] = useState<PasskeyListItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // A failed read must not look like "no passkeys".
  const show = useCallback((r: Awaited<ReturnType<typeof myPasskeys>>) => {
    if ("error" in r) setNotice({ ok: false, text: r.error });
    else setPasskeys(r.passkeys);
  }, []);
  const load = useCallback(() => myPasskeys().then(show), [show]);

  useEffect(() => {
    if (supported) myPasskeys().then(show);
  }, [supported, show]);

  async function add() {
    setNotice(null);
    setBusy(true);
    try {
      const start = await startAddPasskey();
      if ("error" in start) return setNotice({ ok: false, text: start.error });
      let response;
      try {
        response = await startRegistration({ optionsJSON: start.options });
      } catch (e) {
        const name = (e as Error).name;
        if (name === "InvalidStateError") setNotice({ ok: false, text: "This device already has a passkey for your account." });
        return; // Cancelled: say nothing.
      }
      const r = await finishAddPasskey(response, deviceLabel());
      if ("error" in r) return setNotice({ ok: false, text: r.error });
      setNotice({ ok: true, text: "Passkey added. You can use it next time you sign in." });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: PasskeyListItem) {
    if (!confirm(`Remove the passkey "${p.label}"? That device will need the email code again.`)) return;
    const r = await deletePasskey(p.credential_id);
    if ("error" in r) return setNotice({ ok: false, text: r.error });
    load();
  }

  if (supported === null) return null;
  if (!supported) return <p className="text-ink/70">This browser can&apos;t use passkeys.</p>;

  return (
    <div className="space-y-3">
      {passkeys && passkeys.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {passkeys.map((p) => (
            <li key={p.credential_id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <span>
                <strong className="text-ink">{p.label}</strong>
                <span className="block text-sm text-ink/70">
                  Added {date.format(new Date(p.created_at))}
                  {p.last_used_at ? `, last used ${date.format(new Date(p.last_used_at))}` : ", not used yet"}
                </span>
              </span>
              <button type="button" onClick={() => remove(p)} className="min-h-11 rounded-xl border border-border px-4 font-bold text-ink/70 hover:border-blue">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {passkeys && passkeys.length === 0 && <p className="text-ink/70">You have no passkeys yet.</p>}
      <button type="button" onClick={add} disabled={busy} className="min-h-11 rounded-xl bg-blue px-5 font-bold text-white hover:bg-blue-dark disabled:opacity-50">
        {busy ? "Waiting for your device…" : "Add a passkey on this device"}
      </button>
      {notice && (
        <p role={notice.ok ? "status" : "alert"} className={notice.ok ? "font-bold text-ink" : "rounded-lg bg-red/10 px-4 py-3 font-bold text-ink"}>
          {notice.text}
        </p>
      )}
    </div>
  );
}
