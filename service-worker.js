const CACHE_NAME = 'finance-tracker-xeni-1.1.0';
const PRECACHE = [
  "assets/index-cent-precision.js",
  "assets/advisor-home-plan.css",
  "assets/index-d702a2f6.css",
  "assets/xeni-enhancements.css",
  "icon.svg",
  "index.html",
  "manifest.webmanifest",
  "pwa-update.js",
  "src/app-enhancements.js",
  "src/data/local-db.js",
  "src/features/data-safety.js",
  "src/features/category-rules.js",
  "src/features/transaction-search.js",
  "src/features/advisor-actions.js"
];
const urlFor = (file) => new URL(file, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE.map(urlFor)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('finance-tracker-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(urlFor('index.html'))))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
