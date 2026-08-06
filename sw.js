// ═══ Grievance Tracker Service Worker ═══
// ⚠️ Version বাড়ালে users কে auto-update notification আসবে
const VERSION = "v1.1";
const CACHE = "akh-gt-" + VERSION;

const ASSETS = [
  "./",
  "./index.html"
];

// Install — cache assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

// Activate — delete old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Skip waiting when told to update
self.addEventListener("message", e => {
  if(e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Notification action buttons (👀 দেখুন / 🔕 Mute) — showNotification() from
// the page routes here so the buttons actually do something.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const action = e.action; // "" for a plain tap on the body

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientsArr => {
      if(action === "mute"){
        if(clientsArr.length){
          clientsArr.forEach(c => c.postMessage({ type: "MUTE_NOTIF" }));
          return clientsArr[0].focus();
        }
        // No tab open — open one with a flag index.html reads on load
        return self.clients.openWindow("./index.html?action=mute");
      }
      // "view" action or a plain tap — just bring the app to front
      if(clientsArr.length) return clientsArr[0].focus();
      return self.clients.openWindow("./index.html");
    })
  );
});
