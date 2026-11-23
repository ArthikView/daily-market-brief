/* Arthik View service worker: app shell, offline fallback and push display. */
const CACHE_NAME = "arthik-view-shell-v1";
const BASE_PATH = new URL("./", self.registration.scope).pathname;
const APP_SHELL = [
  BASE_PATH,
  BASE_PATH + "index.html",
  BASE_PATH + "styles.css",
  BASE_PATH + "app.js",
  BASE_PATH + "pwa.js",
  BASE_PATH + "manifest.json",
  BASE_PATH + "assets/favicon.svg",
  BASE_PATH + "assets/app-icon.svg",
  BASE_PATH + "offline.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("arthik-view-") && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(BASE_PATH + "offline.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch (_) { payload = { body: event.data ? event.data.text() : "A new publication is available." }; }

  const target = payload.url || BASE_PATH;
  const safeUrl = new URL(target, self.location.origin);
  const url = safeUrl.origin === self.location.origin ? safeUrl.href : self.location.origin + BASE_PATH;

  event.waitUntil(self.registration.showNotification(payload.title || "Arthik View", {
    body: payload.body || payload.message || "A new article or market brief has been published.",
    icon: self.location.origin + BASE_PATH + "assets/app-icon.svg",
    badge: self.location.origin + BASE_PATH + "assets/favicon.svg",
    data: { url },
    tag: payload.tag || "arthik-view-publication"
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : self.location.origin + BASE_PATH;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === target && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});