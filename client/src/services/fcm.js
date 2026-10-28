import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken, onMessage, isSupported } from 'firebase/messaging';
import api from '../api/axios';

let firebaseApp = null;
let firebaseMessaging = null;
let cachedConfig = null;

/**
 * Checks if Firebase Cloud Messaging is supported in the current browser/environment.
 */
export async function isFcmSupported() {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  try {
    return await isSupported();
  } catch (err) {
    console.warn('[FCM Client] Browser does not support FCM Web Push:', err.message);
    return false;
  }
}

/**
 * Retrieves public client-safe Firebase configuration from the backend
 * or environment variables. Private credentials are kept on the server.
 */
export async function fetchFcmConfig() {
  if (cachedConfig && cachedConfig.projectId) return cachedConfig;

  // 1. Check build-time Vite environment variables first
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
  };

  if (envConfig.projectId) {
    cachedConfig = envConfig;
    return cachedConfig;
  }

  // 2. Fetch from Express backend endpoint
  try {
    const res = await api.get('/notifications/fcm-config');
    if (res.data?.success && res.data?.data) {
      cachedConfig = res.data.data;
      return cachedConfig;
    }
  } catch (err) {
    console.warn('[FCM Client] Could not fetch FCM config from backend:', err.message);
  }

  return envConfig;
}

/**
 * Initializes Firebase App and Messaging instances.
 */
export async function initFirebaseMessaging() {
  const supported = await isFcmSupported();
  if (!supported) return null;

  const config = await fetchFcmConfig();
  if (!config || !config.projectId) {
    console.warn('[FCM Client] Firebase projectId is not configured.');
    return null;
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);
  }

  if (!firebaseMessaging) {
    firebaseMessaging = getMessaging(firebaseApp);
  }

  return firebaseMessaging;
}

/**
 * Registers the Firebase Messaging Service Worker with config query param.
 */
export async function registerFcmServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  const config = await fetchFcmConfig();
  const configQuery = config.projectId ? `?config=${encodeURIComponent(JSON.stringify(config))}` : '';
  const swUrl = `/firebase-messaging-sw.js${configQuery}`;

  try {
    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[FCM Client] Service worker registration error:', err.message);
    return null;
  }
}

/**
 * Explicit Student Action: Requests notification permission, obtains FCM token,
 * and saves it to the MySQL database via Express API.
 * 
 * Requirement 3: Never request permission automatically without user action.
 */
export async function requestFcmToken() {
  const supported = await isFcmSupported();
  if (!supported) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // 1. Request user permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  // 2. Initialize Firebase Messaging & Service Worker
  const messaging = await initFirebaseMessaging();
  if (!messaging) {
    throw new Error('Firebase Cloud Messaging is not configured on this server.');
  }

  const registration = await registerFcmServiceWorker();
  if (!registration) {
    throw new Error('Failed to register Firebase Messaging service worker.');
  }

  const config = await fetchFcmConfig();

  // 3. Obtain FCM Registration Token
  const token = await getToken(messaging, {
    vapidKey: config.vapidKey || undefined,
    serviceWorkerRegistration: registration
  });

  if (!token) {
    throw new Error('Failed to retrieve FCM registration token.');
  }

  // 4. Send token to Express backend
  const deviceName = `${navigator.userAgentData?.platform || navigator.platform || 'Web'} Browser`;
  await api.post('/notifications/fcm-token', {
    token,
    platform: 'web',
    deviceName
  });

  // 5. Store locally to track status
  localStorage.setItem('fcm_token', token);

  return token;
}

/**
 * Unregisters the FCM token upon user opt-out or logout.
 */
export async function unregisterFcmToken() {
  const token = localStorage.getItem('fcm_token');
  if (!token) return;

  try {
    const messaging = await initFirebaseMessaging();
    if (messaging) {
      await deleteToken(messaging).catch(() => {});
    }

    await api.delete('/notifications/fcm-token', { data: { token } }).catch(() => {});
  } catch (err) {
    console.warn('[FCM Client] Error unregistering token:', err.message);
  } finally {
    localStorage.removeItem('fcm_token');
  }
}

/**
 * Subscribes to foreground push notifications when student is actively browsing the website.
 * Dispatches a DOM event 'campus-event-notification' for reactive UI updates without duplicate system alerts.
 */
export function setupForegroundMessageListener(onNotificationReceived) {
  let unsubscribe = null;

  initFirebaseMessaging().then((messaging) => {
    if (!messaging) return;

    unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM Client] Received foreground message:', payload);

      // Dispatch custom event for notification bell & center reactive update
      window.dispatchEvent(
        new CustomEvent('campus-event-notification', { detail: payload })
      );

      if (typeof onNotificationReceived === 'function') {
        onNotificationReceived(payload);
      }
    });
  }).catch((err) => {
    console.warn('[FCM Client] Could not setup foreground listener:', err.message);
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}
