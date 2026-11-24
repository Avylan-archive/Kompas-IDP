const CACHE_NAME = 'kompas-ui-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/assets/kompas-logo-transparent.png',
];

const STATIC_UI_EXTENSIONS = [
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('kompas-ui-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isCacheableUiAsset(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }

  // Never cache API endpoints, Firebase auth handlers, or Firestore requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/')) {
    return false;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    return true;
  }

  if (url.pathname.startsWith('/assets/')) {
    return true;
  }

  return STATIC_UI_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bypass all external requests (Firestore, Firebase Auth, Google APIs, Gemini, etc.) and /api/*
  if (!isCacheableUiAsset(url)) {
    return;
  }

  // Navigation requests: network-first, fallback to cached UI shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static UI view assets only: cache-first with background refresh
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
