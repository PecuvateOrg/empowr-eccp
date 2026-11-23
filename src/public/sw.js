// Empowr ECCP service worker: makes the app installable and shows alerts (Account page).
// No offline caching: never cache authenticated ECCP pages or API responses.
// Offline (installable-app standard, 2026-11-23): only the static /offline.html is cached. Pages are
// always fetched live (never cached: they hold signed-in or live data); if the network fails, the
// offline page shows instead of the browser's error.
const OFFLINE = "offline-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(OFFLINE).then((c) => c.add("/offline.html")).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== OFFLINE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => caches.match("/offline.html")));
});

self.addEventListener("push", (event) => {
  let data = { title: "Empowr ECCP", body: "There's news from Empowr.", url: "/dashboard" };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/eccp-app-icon.svg",
      data: { url: data.url },
      tag: "eccp",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Only ever open a page of this site.
  const url = new URL(event.notification.data?.url || "/dashboard", self.location.origin);
  const target = url.origin === self.location.origin ? url.href : self.location.origin + "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if (c.url.startsWith(self.location.origin)) { c.navigate(target); return c.focus(); }
      return self.clients.openWindow(target);
    }),
  );
});
