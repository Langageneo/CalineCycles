const CACHE_NAME = 'calinecycle-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/images/icon-192.png',
  '/images/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js' // cache CDN response
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});
self.addEventListener('activate', evt => {
  evt.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request).then(r => {
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(evt.request, r.clone());
        return r;
      });
    }).catch(()=> caches.match('/index.html')))
  );
});
