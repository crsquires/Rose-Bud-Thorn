// Home screen icon badge. Needs iOS 16.4+ and notification permission;
// absent everywhere else, so always feature-detect.
function setBadge(count) {
  if (!self.navigator || !self.navigator.setAppBadge) return Promise.resolve();
  if (count > 0) return self.navigator.setAppBadge(count).catch(() => {});
  return self.navigator.clearAppBadge().catch(() => {});
}

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Rose, Bud, Thorn";
  const options = {
    body: data.body || "Someone posted a new check-in.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(async () => {
      // Badge count = how many of our notifications are still sitting
      // undismissed. Self-maintaining, and needs nothing from the server.
      const open = await self.registration.getNotifications();
      await setBadge(open.length);
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const open = await self.registration.getNotifications();
      await setBadge(open.length);

      const clientList = await clients.matchAll({ type: "window" });
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("/");
    })()
  );
});

// The app tells us the real unread count whenever it knows it.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_BADGE") {
    event.waitUntil(setBadge(event.data.count || 0));
  }
});

const CACHE_NAME = "rose-bud-thorn-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
