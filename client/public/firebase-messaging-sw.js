// FXEC Campus Events - Firebase Cloud Messaging Service Worker
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Parse Firebase config passed via service worker registration URL query parameters, or use defaults
const urlParams = new URL(location).searchParams;
const configParam = urlParams.get('config');

let firebaseConfig = {
  apiKey: '',
  projectId: '',
  messagingSenderId: '',
  appId: ''
};

if (configParam) {
  try {
    firebaseConfig = JSON.parse(decodeURIComponent(configParam));
  } catch (err) {
    console.warn('[firebase-messaging-sw.js] Failed to parse config query param:', err);
  }
}

// Initialize Firebase compat app in worker if projectId is available
if (firebaseConfig.projectId) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);

      const title = payload.notification?.title || payload.data?.title || 'FXEC Campus Events';
      const body = payload.notification?.body || payload.data?.body || '';
      const icon = payload.notification?.icon || payload.data?.icon || '/fxec-logo.png';
      const actionUrl = payload.fcmOptions?.link || payload.data?.url || '/events';

      const notificationOptions = {
        body,
        icon,
        badge: '/fxec-logo.png',
        data: {
          url: actionUrl,
          ...payload.data
        },
        tag: payload.data?.category || 'campus-event-fcm',
        renotify: true,
        vibrate: [120, 60, 120]
      };

      return self.registration.showNotification(title, notificationOptions);
    });
  } catch (err) {
    console.error('[firebase-messaging-sw.js] Initialization error:', err);
  }
}

// Handle notification click to navigate to destination page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/events';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
