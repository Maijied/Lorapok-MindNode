const CACHE_NAME = 'lorapok-mindnode-v1';
const ASSETS_TO_CACHE = ['./', './index.html', './manifest.json', './logo.svg', './logo-mark.svg', './icons/icon-192x192.png', './icons/icon-512x512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS_TO_CACHE))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => { if (k !== CACHE_NAME) return caches.delete(k); })))); });
self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
