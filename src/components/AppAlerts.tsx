"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, Download, Share } from "lucide-react";
import { setAlertKind } from "@/app/(coach)/account/actions";

// App and alerts on the Account page (Web Build Framework types/web-app/account-page.md), ported
// from the Empowr Dashboard's AppSetup. iPhone can only show alerts from the installed app, so
// there the order is install, then alerts. Each kind of alert has its own switch.

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Kind = { key: "replies" | "shifts"; label: string; hint: string; on: boolean };
declare global {
  interface Window { __eccpInstall?: InstallEvent | null }
}

const never = () => () => {};
const onInstallReady = (cb: () => void) => {
  window.addEventListener("eccp-install-ready", cb);
  return () => window.removeEventListener("eccp-install-ready", cb);
};
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const canPush = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const api = (method: string, body?: unknown) =>
  fetch("/api/push", { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

export function AppAlerts({ vapidKey, kinds }: { vapidKey: string; kinds: Kind[] }) {
  // null on the server and during hydration, then the browser's answer.
  const standalone = useSyncExternalStore(never, isStandalone, () => null);
  const ios = useSyncExternalStore(never, isIos, () => false);
  const supported = useSyncExternalStore(never, canPush, () => false);
  const installEvent = useSyncExternalStore(onInstallReady, () => window.__eccpInstall ?? null, () => null);
  const [alertsOn, setAlertsOn] = useState<boolean | null>(null);
  const [settings, setSettings] = useState(kinds);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setAlertsOn(Boolean(sub) && Notification.permission === "granted"))
      .catch(() => setAlertsOn(false));
  }, [supported]);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    window.__eccpInstall = null;
    window.dispatchEvent(new Event("eccp-install-ready"));
    if (outcome === "accepted") setMessage("Installed. Open Empowr ECCP from your home screen or apps, then turn on alerts.");
  }

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    try {
      if ((await Notification.requestPermission()) !== "granted") {
        setMessage("Alerts are blocked for this site. Allow notifications in your phone or browser settings, then try again.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) }));
      const res = await api("POST", sub.toJSON());
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "save failed");
      await api("PUT");
      setAlertsOn(true);
      setMessage("Alerts are on. We've sent a test alert to this device.");
    } catch (err) {
      setMessage(`Couldn't turn alerts on: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) {
        await api("DELETE", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setAlertsOn(false);
      setMessage("Alerts are off on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    const { sent } = await (await api("PUT")).json().catch(() => ({ sent: 0 }));
    setMessage(sent ? "Test alert sent." : "No devices with alerts on yet.");
  }

  async function toggle(key: Kind["key"], on: boolean) {
    const before = settings;
    setSettings((s) => s.map((k) => (k.key === key ? { ...k, on } : k)));
    const r = await setAlertKind(key, on);
    if ("error" in r) {
      setSettings(before);
      setMessage(r.error);
    }
  }

  const alertsPossible = Boolean(vapidKey) && supported && !(ios && !standalone);
  const button = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";
  const primary = `${button} bg-blue text-white hover:bg-blue-dark disabled:opacity-60`;
  const secondary = `${button} border border-ink/40 text-ink hover:bg-blue-pale`;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-bold text-ink">1. Install the app</p>
        {standalone === null ? null : standalone ? (
          <p className="text-ink/70">Done: you&apos;re using the app.</p>
        ) : installEvent ? (
          <button type="button" onClick={install} className={`${primary} mt-2`}>
            <Download size={18} aria-hidden /> Install Empowr ECCP
          </button>
        ) : ios ? (
          <p className="text-ink/70">
            In Safari, tap <Share size={16} aria-label="Share" className="inline align-text-bottom" /> Share, then{" "}
            <strong>Add to Home Screen</strong>. Then open Empowr ECCP from your home screen and sign in there.
          </p>
        ) : (
          <p className="text-ink/70">
            Open your browser&apos;s menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. (In
            Chrome or Edge on a computer, it&apos;s the install icon at the right of the address bar.)
          </p>
        )}
      </div>

      <div>
        <p className="font-bold text-ink">2. Turn on alerts on this device</p>
        {!vapidKey ? (
          <p className="text-ink/70">Alerts aren&apos;t switched on yet.</p>
        ) : !alertsPossible ? (
          <p className="text-ink/70">
            {ios ? "Once you've opened the app from your home screen, this step appears there." : "This browser can't show alerts. Try Chrome, Edge or Safari."}
          </p>
        ) : alertsOn === null ? null : alertsOn ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 font-bold text-ink"><Bell size={18} aria-hidden /> Alerts are on</span>
            <button type="button" onClick={test} className={secondary}>Send a test</button>
            <button type="button" onClick={turnOff} disabled={busy} className={secondary}>Turn off</button>
          </div>
        ) : (
          <button type="button" onClick={turnOn} disabled={busy} className={`${primary} mt-2`}>
            <Bell size={18} aria-hidden /> {busy ? "Turning on…" : "Turn on alerts"}
          </button>
        )}
      </div>

      <fieldset>
        <legend className="font-bold text-ink">3. What to alert you about</legend>
        <p className="text-sm text-ink/70">These apply to every device you&apos;ve turned alerts on for. Emails still come as before.</p>
        <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
          {settings.map((k) => (
            <li key={k.key}>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 p-3">
                <span>
                  <span className="block font-bold text-ink">{k.label}</span>
                  <span className="block text-sm text-ink/70">{k.hint}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={k.on}
                  onChange={(e) => toggle(k.key, e.target.checked)}
                  className="h-6 w-6 shrink-0 accent-blue"
                />
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {message && <p role="status" className="rounded-xl bg-blue-pale p-3 text-ink">{message}</p>}
    </div>
  );
}
