// Replaced with the deploy's build ID by vite.config.js at build time.
const BUILD_ID = "__BUILD_ID__";
const CACHE_NAME = `rose-bud-thorn-${BUILD_ID}`;

/* ---------- Push notifications ---------- */

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Rose, Bud, Thorn";
  const options = {
    body: data.body || "Someone posted a new check-in.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("/");
    })
  );
});

/* ---------- Lifecycle: new versions take over immediately ---------- */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ---------- Caching ---------- */

function putInCache(request, response) {
  if (response && response.ok && response.type === "basic") {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Only handle our own files. Supabase and other APIs go straight to the network.
  if (url.origin !== self.location.origin) return;

  // Update-check files are never cached.
  if (url.pathname === "/version.json" || url.pathname === "/sw.js") return;

  // Vite's hashed build files never change once published: serve from cache first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => putInCache(req, res)))
    );
    return;
  }

  // Pages and everything else: always try the network (skipping the HTTP cache),
  // fall back to the last saved copy when offline.
  const networkRequest =
    req.mode === "navigate"
      ? fetch(req.url, { cache: "no-store", credentials: "same-origin" })
      : fetch(req, { cache: "no-store" });

  event.respondWith(
    networkRequest
      .then((res) => putInCache(req, res))
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("/") : undefined))
      )
  );
});
