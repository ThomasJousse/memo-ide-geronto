// Service worker de la version web : fonctionnement hors ligne.
// Les pages et ressources sont mises en cache au premier chargement. Aucune donnée personnelle.
const VERSION = new URL(self.location).searchParams.get("v") || "dev";
const CACHE = `memo-geronto-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("memo-geronto-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ne pas intercepter l'API GitHub
  if (req.mode === "navigate") {
    // Réseau d'abord pour la page (mises à jour), cache en secours hors ligne.
    event.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); return res; }).catch(() => caches.match("./index.html")));
    return;
  }
  // Ressources (JS, CSS, icônes) : cache d'abord, puis réseau.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }))
  );
});
