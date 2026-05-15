const cacheName = "lh-maintenance-v9";
const appShell = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "icons/lh-icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(appShell))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== cacheName).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (event.request.url.startsWith(self.location.origin) && response.ok) {
          const copy = response.clone();
          caches.open(cacheName).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", event => {
  const fallback = {
    title: "LH Maintenance",
    body: "You have a maintenance update.",
    url: "./#orders"
  };
  const payload = event.data ? event.data.json() : fallback;
  event.waitUntil(self.registration.showNotification(payload.title || fallback.title, {
    body: payload.body || fallback.body,
    tag: payload.orderId || "lh-maintenance",
    icon: "icons/lh-icon.svg",
    badge: "icons/lh-icon.svg",
    data: { url: payload.url || fallback.url, orderId: payload.orderId || "" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "./#orders";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
