// Offline support. Only the small shell is cached up front; everything else
// (the Ruffle engine actually used by this device, and the game file from archive.org)
// is cached the first time it loads, so later visits start instantly.
const CACHE = "whtbb-v4";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "ruffle.js",
];
const GAME_URL = "https://archive.org/cors/whtbb/brain_game_2_6_7_translated_v1.swf";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function put(req, res) {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isGame = url.href === GAME_URL;
  if (url.origin !== location.origin && !isGame) return;

  // Pages: network first so updates to the site reach players; cache when offline.
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(fetch(req).then((res) => put(req, res)).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }

  // Everything else (engine, game file, icons): cache first.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => put(req, res)))
  );
});
