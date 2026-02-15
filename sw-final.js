const CACHE_NAME = 'meal-reminder-v2';
const BASE_PATH = '/Meal-Reminder/';

const urlsToCache = [
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icon-192.png',
  BASE_PATH + 'icon-512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Cache error:', err))
  );
  self.skipWaiting();
});

// Activate and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Cache new requests
          if (event.request.url.startsWith(self.location.origin + BASE_PATH)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(err => {
        console.log('Fetch error:', err);
        // Return offline page or cached index if available
        return caches.match(BASE_PATH + 'index.html');
      })
  );
});

// Handle notifications
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: BASE_PATH + 'icon-192.png',
      badge: BASE_PATH + 'icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'meal-reminder',
      requireInteraction: false,
      silent: false
    });
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(BASE_PATH + 'index.html')
  );
});
