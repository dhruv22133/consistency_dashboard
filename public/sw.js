// Service Worker for Consistency Dashboard background notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications from the server
self.addEventListener("push", (event) => {
  let data = {
    title: "Consistency Dashboard",
    body: "You have an update regarding your daily routine.",
    category: "system",
    url: "/",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || `consistency-task-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || "/",
      category: data.category || "system",
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click to open / focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
