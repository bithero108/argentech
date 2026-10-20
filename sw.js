// Offline cache. Bump VERSION whenever a file changes so phones pick up the update.
const VERSION = "argentech-v3";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const OPTIONAL = ["./audio.js"]; // bundled Argentine voices, if present

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES).then(() => Promise.all(OPTIONAL.map(f => c.add(f).catch(() => {})))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first for the page and audio bundle (so updates arrive), cache first for everything else.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const fresh = e.request.mode === "navigate" || url.pathname.endsWith("/audio.js");
  if (fresh) {
    const key = e.request.mode === "navigate" ? "./index.html" : "./audio.js";
    e.respondWith(fetch(e.request)
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(key, copy)); } return r; })
      .catch(() => caches.match(key)));
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
  }
});
