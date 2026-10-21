// Rechenreise: Offline-Betrieb. Die Seite selbst kommt immer zuerst aus dem Netz (damit neue Versionen sofort da sind)
// und fällt ohne Netz auf die gespeicherte Fassung zurück. Die Schriften stecken in der Seite selbst.
const CACHE = "rechenreise-1.8";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))));
  }
});
