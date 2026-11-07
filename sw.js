// Rechenreise: Offline-Betrieb. Die Seite selbst kommt immer zuerst aus dem Netz (damit neue Versionen sofort da sind)
// und fällt ohne Netz auf die gespeicherte Fassung zurück. Die Schriften stecken in der Seite selbst.
// Ab 1.16.2: am Zwischenspeicher des Browsers vorbei fragen (GitHub Pages erlaubt sonst 10 Minuten alte Antworten),
// nach 6 Sekunden ohne Antwort die gespeicherte Fassung zeigen, die Seite nur einmal speichern (vorher doppelt: „./“ und „index.html“),
// und sw.js selbst nie aus dem Speicher liefern (die App liest daraus die neueste Versionsnummer).
const CACHE = "rechenreise-1.18.2";
const CORE = ["./", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
const WAIT_MS = 6000;
// Ab 1.18.1 nur eigene Zwischenspeicher löschen: Auf derselben Adresse (github.io) liegt auch die englische Fassung (mathjourney-…).

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("rechenreise-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const fromCache = (req) => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("./") : undefined));
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("/sw.js")) return;
  const page = req.mode === "navigate";
  e.respondWith(new Promise((resolve) => {
    let done = false;
    const give = (r) => { if (!done && r) { done = true; resolve(r); } };
    const timer = setTimeout(() => fromCache(req).then(give), WAIT_MS);
    // Seitenaufrufe werden unter „./“ gespeichert, egal ob als „/“ oder „/index.html“ geöffnet
    fetch(page ? req.url : req, { cache: "no-cache" }).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(page ? "./" : req, copy)); }
      clearTimeout(timer); give(r);
    }).catch(() => { clearTimeout(timer); fromCache(req).then((r) => give(r || Response.error())); });
  }));
});
