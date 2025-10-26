/* Simple PWA Service Worker for MTG Timer */
const CACHE_NAME = 'mtg-pwa-v1';
const CORE_ASSETS = [
  '/',
  '/control',
  '/timer',
  '/manifest.webmanifest',
  '/logoboards.png',
  '/sound/warning.mp3',
  '/sound/over.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve(true))))
    ).then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  try { return new URL(url).origin === self.location.origin; } catch { return false; }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = isSameOrigin(request.url);

  // Runtime caching strategies
  // Next.js static assets
  const isNextStatic = sameOrigin && url.pathname.startsWith('/_next/');
  const isMedia = sameOrigin && (url.pathname.startsWith('/slider/') || url.pathname.startsWith('/sound/') || url.pathname.startsWith('/custom-slider/'));
  const dest = request.destination;
  const isAsset = ['style','script','font','image'].includes(dest);

  // Cache-first for static assets/media
  if (isNextStatic || isMedia || isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchAndUpdate = fetch(request).then((resp) => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
          return resp;
        }).catch(() => cached);
        return cached || fetchAndUpdate;
      })
    );
    return;
  }

  // Network-first for everything else (with cache fallback)
  event.respondWith(
    fetch(request)
      .then((resp) => {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
        return resp;
      })
      .catch(() => caches.match(request))
  );
});
