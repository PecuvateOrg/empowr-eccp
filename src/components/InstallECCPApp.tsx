"use client";
import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function InstallECCPApp() {
 const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
 const [installed, setInstalled] = useState(false);
 const [platform, setPlatform] = useState<"ios" | "other">("other");
 const [message, setMessage] = useState("");
 useEffect(() => {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => setMessage("App installation is currently unavailable."));
  setInstalled(window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)));
  setPlatform(/iPad|iPhone|iPod/.test(navigator.userAgent) ? "ios" : "other");
  const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
  const onInstalled = () => { setInstalled(true); setPrompt(null); setMessage("Empowr ECCP has been added to your device."); };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
 }, []);
 async function install() {
  if (!prompt) return;
  await prompt.prompt();
  const choice = await prompt.userChoice;
  setPrompt(null);
  if (choice.outcome === "dismissed") setMessage("Installation cancelled. You can try again from your browser menu.");
 }
 return <section className="mt-8 rounded-xl border border-border p-6">
  <h2 className="text-lg font-bold">Add ECCP to your phone</h2>
  <p className="mt-2 text-sm text-muted">Open your coaching hub from your home screen, like an app. No app store needed.</p>
  {installed ? <p className="mt-4 font-semibold text-ink">App already installed on this device.</p> :
   prompt ? <button type="button" onClick={install} className="mt-4 rounded-full bg-blue px-5 py-3 font-bold text-white">Install Empowr ECCP</button> :
   <p className="mt-4 text-sm text-ink">{platform === "ios" ? "In Safari, tap Share, then Add to Home Screen." : "In Chrome or your browser menu, choose Install app or Add to Home screen. If you do not see that option, try opening this page in Chrome."}</p>}
  {message && <p role="status" className="mt-3 text-sm text-muted">{message}</p>}
 </section>;
}
