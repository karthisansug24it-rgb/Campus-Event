// FXEC Campus Events - Service Worker with PWA Offline Caching & Browser Push Notifications
const CACHE_NAME = 'fxec-events-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/fxec-logo.png'
];

// Install event: cache static assets and skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll skipped for some assets:', err);
      });
    })
  );
});

// Activate event: cleanup stale caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network first with cache fallback, ignoring /api/ requests
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.method === 'GET' && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Push event: Receive Web Push notification payload and show notification
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'FXEC Campus Events';
    const options = {
      body: data.body || '',
      icon: data.icon || '/fxec-logo.png',
      badge: data.badge || '/fxec-logo.png',
      data: data.data || { url: '/events' },
      tag: (data.data && data.data.category) || 'fxec-notification',
      renotify: true,
      vibrate: [120, 60, 120]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[ServiceWorker] Push event parsing error:', err);
  }
});

// Notification click event: Focus open window or open new window to target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/events';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
