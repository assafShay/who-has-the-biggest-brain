// Caches the app so it works offline once it has been opened.
const CACHE = "whtbb-v3";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "172de42e6619eac8f371.wasm",
  "878d548199cddef07035.wasm",
  "core.ruffle.16d61072ac7fdc4d5013.js",
  "core.ruffle.994eeef0a471a88cd0e3.js",
  "ruffle.js",
];
// The game file itself comes from the Internet Archive and is cached on first play.
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

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isGame = url.href === GAME_URL;
  if (url.origin !== location.origin && !isGame) return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok && (isGame || url.pathname.endsWith(".swf"))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
