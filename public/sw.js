const CACHE = "dnest-shell-v1";
const SHELL = ["/", "/offline", "/icon.svg"];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("supabase"))
    return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches
        .match(event.request)
        .then((found) => found || caches.match("/offline")),
    ),
  );
});
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {
    title: "DNest",
    body: "Something warm is waiting in your Nest.",
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      data: { url: data.url || "/notifications" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/notifications",
    self.location.origin,
  );
  const url =
    target.origin === self.location.origin
      ? target.href
      : new URL("/notifications", self.location.origin).href;
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const existing = windows[0];
        if (existing)
          return existing.navigate(url).then((client) => client?.focus());
        return clients.openWindow(url);
      }),
  );
});
