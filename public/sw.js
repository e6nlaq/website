// 手書きの Service Worker。Serwist は Turbopack に対応していないため、
// キャッシュ戦略をここで直接実装している。挙動を変えたら CACHE_VERSION を上げる。
const CACHE_VERSION = "v2";

const STATIC_CACHE = `e6nlaq-static-${CACHE_VERSION}`;
const PAGES_CACHE = `e6nlaq-pages-${CACHE_VERSION}`;
const DATA_CACHE = `e6nlaq-data-${CACHE_VERSION}`;
const ASSETS_CACHE = `e6nlaq-assets-${CACHE_VERSION}`;
const CACHE_NAMES = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE, ASSETS_CACHE];

const OFFLINE_URL = "/offline.html";
const ASSET_EXTENSIONS =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|wasm)$/i;
const ASSETS_CACHE_LIMIT = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("e6nlaq-") && !CACHE_NAMES.includes(key)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 本番の /_next/static/* は immutable なハッシュ付きファイルなので
// cache-first で問題ない。一方、開発サーバは no-cache で内容が変わるため、
// キャッシュすると HMR 後に古いチャンクを返してモジュール解決が壊れる。
function isImmutable(response) {
  return (response.headers.get("cache-control") || "").includes("immutable");
}

async function cacheFirstImmutable(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached && isImmutable(cached)) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === "basic" && isImmutable(response)) {
    await cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;

  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
  );
}

function staleWhileRevalidate(event, cacheName) {
  const { request } = event;

  return caches.open(cacheName).then(async (cache) => {
    const cached = await cache.match(request);
    const network = fetch(request).then(async (response) => {
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
        await trimCache(cacheName, ASSETS_CACHE_LIMIT);
      }
      return response;
    });

    if (cached) {
      event.waitUntil(network.catch(() => {}));
      return cached;
    }
    return network;
  });
}

async function networkFirst(event, cacheName) {
  const { request } = event;
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function networkFirstNavigation(event) {
  const { request } = event;
  const cache = await caches.open(PAGES_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await cache.match(request, { ignoreSearch: true }));
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response("オフラインです", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/og/")) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirstImmutable(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(staleWhileRevalidate(event, ASSETS_CACHE));
    return;
  }

  // HMR などの内部リクエストは横取りしない
  if (url.pathname.startsWith("/_next/")) return;

  if (ASSET_EXTENSIONS.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, ASSETS_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  event.respondWith(networkFirst(event, DATA_CACHE));
});
