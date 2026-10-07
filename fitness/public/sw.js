// Only job: serve photos of saved exercises from the device (see keepImagesOffline in
// lib/exerciseBank.ts). Every other request goes to the network untouched.
const IMAGE_CACHE = 'exercise-images-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname !== 'cdn.jsdelivr.net' || !url.pathname.startsWith('/gh/yuhonas/free-exercise-db@')) return;
  event.respondWith(
    caches.open(IMAGE_CACHE)
      .then((cache) => cache.match(request.url))
      .then((hit) => hit || fetch(request)),
  );
});
