// Minimal installability worker. Do not cache authenticated ECCP pages or API responses.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
