// Cache-first service worker so the whole app works with zero network connectivity
// after the first successful load.
const CACHE = "tacfit-v22";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/supabaseClient.js",
  "./js/auth.js",
  "./js/sync.js",
  "./js/poses.js",
  "./js/exercises.js",
  "./js/storage.js",
  "./js/fitness.js",
  "./js/workout-generator.js",
  "./js/charts.js",
  "./js/badges.js",
  "./js/notifications.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Never cache-first cross-origin requests (Supabase auth/API calls, the Supabase CDN script) —
  // those need to always hit the network live, not serve stale cached responses.
  if (new URL(event.request.url).origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
