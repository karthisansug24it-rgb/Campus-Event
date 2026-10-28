import api from '../api/axios';
import { requestFcmToken, unregisterFcmToken, isFcmSupported } from '../services/fcm';

/**
 * Utility to convert base64 VAPID public key to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if browser supports push notifications (FCM or Web Push)
 */
export function isPushNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window
  );
}

/**
 * Returns current browser notification permission: 'default', 'granted', or 'denied'
 */
export function getNotificationPermission() {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Registers the standard service worker for offline/PWA
 */
export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[PushManager] Service Worker registration failed:', err.message);
    return null;
  }
}

/**
 * Subscribes user to push notifications using Firebase Cloud Messaging (Primary)
 * with graceful fallback to standard VAPID Web Push.
 */
export async function subscribeToPushNotifications() {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // 1. Request user permission explicitly
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  let fcmSuccess = false;

  // 2. Try Firebase Cloud Messaging (Primary Delivery)
  try {
    const fcmSupported = await isFcmSupported();
    if (fcmSupported) {
      const fcmToken = await requestFcmToken();
      if (fcmToken) {
        fcmSuccess = true;
      }
    }
  } catch (fcmErr) {
    console.warn('[PushManager] FCM subscription warning (falling back to Web Push):', fcmErr.message);
  }

  // 3. Register standard Web Push (VAPID) as dual/fallback subscription
  try {
    const registration = await registerServiceWorker();
    if (registration && 'PushManager' in window) {
      const keyRes = await api.get('/notifications/vapid-public-key').catch(() => null);
      if (keyRes?.data?.success && keyRes?.data?.data?.publicKey) {
        const applicationServerKey = urlBase64ToUint8Array(keyRes.data.data.publicKey);
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          });
        }
        await api.post('/notifications/push-subscribe', {
          subscription: subscription.toJSON()
        }).catch(() => {});
      }
    }
  } catch (webPushErr) {
    console.warn('[PushManager] Web push fallback error:', webPushErr.message);
  }

  return { success: true, fcm: fcmSuccess };
}

/**
 * Unsubscribes current browser session from both FCM and Web Push
 */
export async function unsubscribeFromPushNotifications() {
  if (!isPushNotificationSupported()) return;

  try {
    // 1. Unregister FCM Token
    await unregisterFcmToken();

    // 2. Unsubscribe Web Push
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.post('/notifications/push-unsubscribe', { endpoint }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[PushManager] Unsubscribe error:', err.message);
  }
}
