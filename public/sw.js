const CACHE_NAME = 'cinetheme-app-shell-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg',
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate Event - Clean Up Outdated Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('cinetheme-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event - Skip Waiting on User Action
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event - Strict Routing & Exclusion Rules
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Rule 1: Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Rule 2: NEVER cache Jellyfin authenticated APIs or media streaming endpoints
  const isJellyfinEndpoint =
    url.pathname.includes('/Users/') ||
    url.pathname.includes('/Items/') ||
    url.pathname.includes('/Shows/') ||
    url.pathname.includes('/Videos/') ||
    url.pathname.includes('/Sessions/') ||
    url.pathname.includes('/System/') ||
    url.pathname.includes('/Plugin/') ||
    url.pathname.includes('/Episode/');

  const isMediaStream =
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.m4s') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.endsWith('.mkv') ||
    url.pathname.endsWith('.vtt') ||
    url.pathname.endsWith('.ass') ||
    url.pathname.endsWith('.srt');

  const hasAuthQuery =
    url.searchParams.has('api_key') ||
    url.searchParams.has('token') ||
    url.searchParams.has('Token');

  if (isJellyfinEndpoint || isMediaStream || hasAuthQuery) {
    // Explicitly bypass service worker caching - direct network fetch
    return;
  }

  // Rule 3: HTML Navigation Requests (Network-first with cached App Shell fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html').then((cached) => {
          return cached || caches.match('/');
        });
      })
    );
    return;
  }

  // Rule 4: Static Web App Assets (Cache-first with Network Fallback)
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.wasm'))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
  }
});
