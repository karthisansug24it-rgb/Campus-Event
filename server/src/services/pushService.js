const webpush = require('web-push');
const crypto = require('crypto');
const { pool } = require('../config/db');

// Initialize Web Push with VAPID details if available
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@francisxavier.ac.in';

let isConfigured = false;
if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isConfigured = true;
  } catch (err) {
    console.warn('[WebPush Config Warning]:', err.message);
  }
} else {
  console.warn('[WebPush Warning]: VAPID keys not configured in environment.');
}

/**
 * Creates SHA-256 hash of subscription endpoint for unique indexing.
 */
function hashEndpoint(endpoint) {
  return crypto.createHash('sha256').update(endpoint).digest('hex');
}

/**
 * Saves or updates a browser push subscription for a user.
 */
async function saveSubscription(userId, subscription, userAgent = null) {
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new Error('Invalid subscription object.');
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;
  const endpointHash = hashEndpoint(endpoint);

  await pool.execute(
    `INSERT INTO push_subscriptions (user_id, endpoint, endpoint_hash, p256dh, auth, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       p256dh = VALUES(p256dh),
       auth = VALUES(auth),
       user_agent = VALUES(user_agent),
       updated_at = NOW()`,
    [userId, endpoint, endpointHash, p256dh, auth, userAgent]
  );

  return { success: true };
}

/**
 * Deletes a push subscription by its endpoint.
 */
async function deleteSubscription(endpoint) {
  if (!endpoint) return;
  const endpointHash = hashEndpoint(endpoint);
  await pool.execute('DELETE FROM push_subscriptions WHERE endpoint_hash = ?', [endpointHash]);
}

/**
 * Sends a web push notification payload to all registered subscriptions of a user.
 * Automatically deletes permanently expired / unsubscribed endpoints (404/410).
 */
async function sendPushToUser(userId, payload) {
  if (!isConfigured) {
    return { success: false, reason: 'WebPush not configured' };
  }

  const [subscriptions] = await pool.execute(
    'SELECT id, endpoint, endpoint_hash, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
    [userId]
  );

  if (subscriptions.length === 0) {
    return { success: true, sentCount: 0, failedCount: 0 };
  }

  const payloadString = JSON.stringify({
    title: payload.title || 'FXEC Campus Events',
    body: payload.body || payload.message || '',
    icon: payload.icon || '/fxec-logo.png',
    badge: payload.badge || '/fxec-logo.png',
    data: {
      url: payload.url || payload.action_url || '/events',
      notificationId: payload.notificationId || null,
      category: payload.category || 'system'
    }
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    try {
      await webpush.sendNotification(pushSubscription, payloadString);
      sentCount++;
    } catch (err) {
      failedCount++;
      // Check for permanently expired or invalid subscriptions
      const statusCode = err.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Endpoint no longer exists, prune it
        await pool.execute('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
        console.log(`[PushService] Pruned expired push subscription ID ${sub.id}`);
      } else {
        console.warn(`[PushService] Failed to send push to subscription ${sub.id}:`, err.message);
      }
    }
  }

  return { success: true, sentCount, failedCount };
}

module.exports = {
  isConfigured: () => isConfigured,
  getPublicKey: () => publicKey,
  saveSubscription,
  deleteSubscription,
  sendPushToUser
};
