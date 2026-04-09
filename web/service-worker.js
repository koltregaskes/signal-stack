const CACHE_NAME = 'signal-stack-shell-v6';
const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css?v=20260409f',
  './app.js?v=20260409f',
  './manifest.webmanifest?v=20260409f',
  '../shared/platforms.js?v=20260409c',
  '../shared/time.js?v=20260409c',
  '../shared/validation.js?v=20260409c'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
