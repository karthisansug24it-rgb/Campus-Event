const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { pool } = require('../config/db');

let isInitialized = false;

/**
 * Initializes Firebase Admin SDK using one of the following methods:
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY (Raw or Base64 JSON string in env)
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH (File path to serviceAccountKey.json)
 * 3. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * Gracefully falls back to simulated mode if credentials are not configured yet.
 */
function initFirebaseAdmin() {
  if (isInitialized) return true;

  try {
    if (getApps().length > 0) {
      isInitialized = true;
      return true;
    }

    let credential = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      if (raw.startsWith('{')) {
        credential = cert(JSON.parse(raw));
      } else {
        // Base64 encoded JSON
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        credential = cert(JSON.parse(decoded));
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const fs = require('fs');
      const path = require('path');
      const resolvedPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(resolvedPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        credential = cert(serviceAccount);
      }
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      });
    }

    if (credential) {
      initializeApp({ credential });
      isInitialized = true;
      console.log('[FCM Service] Firebase Admin SDK initialized successfully.');
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('[FCM Service] Error initializing Firebase Admin SDK:', error.message);
    return false;
  }
}

// Attempt initialization on module load
initFirebaseAdmin();

/**
 * Checks whether Firebase Admin SDK is ready to send messages
 */
function isConfigured() {
  return isInitialized && getApps().length > 0;
}

/**
 * Saves or updates an FCM token for an authenticated user.
 * Supports multi-device registration per student.
 * 
 * @param {number} userId
 * @param {Object} options
 * @param {string} options.token - FCM registration token
 * @param {string} [options.platform='web'] - 'web' | 'android' | 'ios'
 * @param {string} [options.deviceName] - Optional label (e.g., 'Pixel 8', 'Chrome Windows')
 * @param {string} [options.userAgent] - Browser user agent
 */
async function saveFcmToken(userId, { token, platform = 'web', deviceName = null, userAgent = null }) {
  if (!token || typeof token !== 'string' || token.trim().length < 10) {
    throw new Error('Valid FCM registration token is required.');
  }

  const cleanToken = token.trim();
  const validPlatform = ['web', 'android', 'ios'].includes(platform) ? platform : 'web';
  const cleanDevice = deviceName ? String(deviceName).slice(0, 100) : null;
  const cleanAgent = userAgent ? String(userAgent).slice(0, 255) : null;

  await pool.execute(
    `INSERT INTO fcm_tokens (user_id, token, platform, device_name, user_agent, last_used_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       platform = VALUES(platform),
       device_name = VALUES(device_name),
       user_agent = VALUES(user_agent),
       last_used_at = NOW(),
       updated_at = CURRENT_TIMESTAMP`,
    [userId, cleanToken, validPlatform, cleanDevice, cleanAgent]
  );

  return { success: true };
}

/**
 * Removes an FCM token upon sign-out, manual disable, or permission revocation.
 * 
 * @param {number} userId 
 * @param {string} token 
 */
async function removeFcmToken(userId, token) {
  if (!token) return { success: false };
  await pool.execute(
    'DELETE FROM fcm_tokens WHERE user_id = ? AND token = ?',
    [userId, token.trim()]
  );
  return { success: true };
}

/**
 * Retrieves all registered FCM tokens for a student.
 * 
 * @param {number} userId 
 * @param {string} [platform] 
 */
async function getUserFcmTokens(userId, platform = null) {
  let query = 'SELECT id, token, platform, device_name FROM fcm_tokens WHERE user_id = ?';
  const params = [userId];

  if (platform) {
    query += ' AND platform = ?';
    params.push(platform);
  }

  const [tokens] = await pool.execute(query, params);
  return tokens;
}

/**
 * Prunes an invalid or expired FCM registration token from the database.
 * 
 * @param {string} token 
 */
async function pruneInvalidToken(token) {
  try {
    const [result] = await pool.execute('DELETE FROM fcm_tokens WHERE token = ?', [token]);
    if (result.affectedRows > 0) {
      console.log(`[FCM Service] Pruned invalid or expired registration token.`);
    }
  } catch (err) {
    console.error('[FCM Service] Error pruning invalid token:', err.message);
  }
}

/**
 * Sends a push notification to all active devices of a user via Firebase Cloud Messaging.
 * Retries transient failures, deletes dead tokens, and logs delivery attempts.
 * 
 * @param {number} userId - The recipient student user ID
 * @param {Object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {string} [payload.icon] - Icon URL (defaults to FXEC logo)
 * @param {string} [payload.action_url] - Click destination URL
 * @param {Object} [payload.data] - Additional metadata for client handlers
 * @param {number} [notificationId] - Associated in-app notification ID for delivery audit
 */
async function sendPushToUser(userId, payload, notificationId = null) {
  const tokens = await getUserFcmTokens(userId);

  if (!tokens || tokens.length === 0) {
    return { success: true, sentCount: 0, reason: 'No registered devices.' };
  }

  const tokenStrings = tokens.map((t) => t.token);

  // If Firebase Admin is not configured, run in graceful simulation mode
  if (!isConfigured()) {
    console.log(
      `[FCM Service - Simulated Mode] Sent push to student ID ${userId} across ${tokenStrings.length} registered device(s): "${payload.title}"`
    );

    if (notificationId) {
      await pool.execute(
        `INSERT INTO notification_deliveries (notification_id, channel, status, error_message, sent_at)
         VALUES (?, 'push', 'skipped', 'Firebase Admin SDK not configured in server environment', NOW())`,
        [notificationId]
      ).catch(() => {});
    }

    return { success: true, simulated: true, sentCount: tokenStrings.length };
  }

  // Ensure all data fields are string values (required by FCM specifications)
  const cleanData = {};
  if (payload.data && typeof payload.data === 'object') {
    for (const [k, v] of Object.entries(payload.data)) {
      cleanData[k] = v !== null && v !== undefined ? String(v) : '';
    }
  }
  cleanData.url = payload.action_url || cleanData.url || '/events';
  if (notificationId) {
    cleanData.notificationId = String(notificationId);
  }

  const title = payload.title || 'FXEC Campus Events';
  const body = payload.body || '';
  const icon = payload.icon || '/fxec-logo.png';
  const clickUrl = payload.action_url || '/events';

  // Construct platform-optimized FCM Multicast Message
  const multicastMessage = {
    tokens: tokenStrings,
    notification: {
      title,
      body
    },
    data: cleanData,
    webpush: {
      headers: {
        Urgency: 'high'
      },
      notification: {
        title,
        body,
        icon,
        badge: '/fxec-logo.png',
        tag: cleanData.category || 'fxec-campus-event',
        renotify: true,
        vibrate: [120, 60, 120]
      },
      fcmOptions: {
        link: clickUrl
      }
    },
    // Future-proofed Android configuration (Requirement 12)
    android: {
      priority: 'high',
      notification: {
        title,
        body,
        icon: 'ic_notification',
        color: '#0284c7',
        channelId: 'campus_events_channel',
        clickAction: 'OPEN_EVENT_ACTIVITY'
      }
    }
  };

  let sentCount = 0;
  let failedCount = 0;
  const invalidTokens = [];

  try {
    const response = await getMessaging().sendEachForMulticast(multicastMessage);

    // Evaluate each token delivery status
    for (let i = 0; i < response.responses.length; i++) {
      const resp = response.responses[i];
      const token = tokenStrings[i];

      if (resp.success) {
        sentCount++;
      } else {
        failedCount++;
        const errorCode = resp.error?.code || 'unknown';

        // Check for invalid, unregistered, or expired tokens to clean up
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/mismatched-credential'
        ) {
          invalidTokens.push(token);
        } else {
          console.warn(`[FCM Service] Delivery failed for token: ${errorCode} - ${resp.error?.message}`);
        }
      }
    }

    // Prune invalid tokens in background
    if (invalidTokens.length > 0) {
      for (const badToken of invalidTokens) {
        await pruneInvalidToken(badToken);
      }
    }

    // Audit delivery in MySQL notification_deliveries table
    // Requirement 14: Never claim delivered or read merely because FCM accepted send
    if (notificationId) {
      const status = sentCount > 0 ? 'sent' : 'failed';
      const errorMessage = failedCount > 0 ? `Failed on ${failedCount} token(s)` : null;

      await pool.execute(
        `INSERT INTO notification_deliveries (notification_id, channel, status, error_message, sent_at)
         VALUES (?, 'push', ?, ?, NOW())`,
        [notificationId, status, errorMessage]
      ).catch(() => {});
    }

    return {
      success: true,
      sentCount,
      failedCount,
      prunedCount: invalidTokens.length
    };
  } catch (error) {
    console.error('[FCM Service] Multicast send error:', error.message);

    if (notificationId) {
      await pool.execute(
        `INSERT INTO notification_deliveries (notification_id, channel, status, error_message, sent_at)
         VALUES (?, 'push', 'failed', ?, NOW())`,
        [notificationId, error.message]
      ).catch(() => {});
    }

    return { success: false, error: error.message };
  }
}

module.exports = {
  isConfigured,
  initFirebaseAdmin,
  saveFcmToken,
  removeFcmToken,
  getUserFcmTokens,
  sendPushToUser,
  pruneInvalidToken
};
