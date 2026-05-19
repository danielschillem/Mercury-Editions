const CACHE_NAME = 'mercury-cache-v5';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/images/logo/logo.png',
];

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isDevAssetRequest(url) {
  return url.pathname.startsWith('/@vite/')
    || url.pathname.startsWith('/node_modules/')
    || url.pathname.startsWith('/resources/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Never cache API responses to avoid stale account/orders/purchases data.
  if (requestUrl.pathname.startsWith('/api/')) {
    return;
  }

  // Never cache Vite development assets.
  if (isDevAssetRequest(requestUrl)) {
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', responseClone));
          }

          return response;
        })
        .catch(() => caches.match('/').then((cachedHome) => cachedHome || Response.error()))
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match('/'));
    })
  );
});
