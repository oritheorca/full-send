const CACHE = 'full-send-v1';

// Pre-cache the app shell on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.add('./'))
      .then(() => self.skipWaiting())
  );
});

// Remove old caches on activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - CDN resources (React, Babel, fonts): cache-first — they're versioned, never change
// - Local files (index.html): network-first, fall back to cache so updates land
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isCDN = url.hostname !== self.location.hostname;

  if (isCDN) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(response => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          });
        })
      )
    );
  } else {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE).then(c => c.put(e.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
