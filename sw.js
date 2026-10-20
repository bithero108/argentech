// Offline cache. Bump VERSION whenever index.html changes so phones pick up the update.
const VERSION = "argentech-v2";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first for the page (so updates arrive), cache first for everything else.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isPage = e.request.mode === "navigate";
  e.respondWith(isPage
    ? fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return r; })
        .catch(() => caches.match("./index.html"))
    : caches.match(e.request).then(hit => hit || fetch(e.request)));
});
