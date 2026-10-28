const { pool } = require('../config/db');
const pushService = require('../services/pushService');
const fcmService = require('../services/fcmService');
const { runReminderScan } = require('../services/deadlineReminderJob');

/**
 * GET /api/notifications
 * Retrieves paginated notifications for the authenticated user.
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const unreadOnly = req.query.unread_only === 'true';

    let countQuery = 'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?';
    let dataQuery = `
      SELECT id, event_id, category, title, message, action_url, is_read, read_at, created_at
      FROM notifications
      WHERE user_id = ?
    `;
    const params = [userId];
    const countParams = [userId];

    if (category && category !== 'all') {
      countQuery += ' AND category = ?';
      dataQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }

    if (unreadOnly) {
      countQuery += ' AND is_read = 0';
      dataQuery += ' AND is_read = 0';
    }

    dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [[{ total }]] = await pool.execute(countQuery, countParams);
    const [notifications] = await pool.execute(dataQuery, params);

    // Get unread count
    const [[{ unreadCount }]] = await pool.execute(
      'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount: Number(unreadCount),
        pagination: {
          total: Number(total),
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[getNotifications Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.'
    });
  }
}

/**
 * GET /api/notifications/unread-count
 * Quick lightweight endpoint for navigation bar badges.
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const [[{ unreadCount }]] = await pool.execute(
      'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.json({
      success: true,
      data: {
        unreadCount: Number(unreadCount)
      }
    });
  } catch (error) {
    console.error('[getUnreadCount Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notification count.'
    });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 */
async function markAsRead(req, res) {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied.'
      });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    console.error('[markAsRead Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.'
    });
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Marks all notifications of the user as read.
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await pool.execute(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('[markAllAsRead Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read.'
    });
  }
}

/**
 * DELETE /api/notifications/:id
 * Deletes a single notification.
 */
async function deleteNotification(req, res) {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted.'
    });
  } catch (error) {
    console.error('[deleteNotification Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification.'
    });
  }
}

/**
 * GET /api/notifications/vapid-public-key
 * Returns the VAPID public key needed for browser PushManager subscription.
 */
async function getVapidPublicKey(req, res) {
  const key = pushService.getPublicKey();
  if (!key) {
    return res.status(503).json({
      success: false,
      message: 'Web Push is not configured on this server.'
    });
  }

  return res.json({
    success: true,
    data: {
      publicKey: key
    }
  });
}

/**
 * POST /api/notifications/push-subscribe
 * Stores or updates browser push subscription.
 */
async function subscribePush(req, res) {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;
    const userAgent = req.headers['user-agent'] || null;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Valid push subscription object is required.'
      });
    }

    await pushService.saveSubscription(userId, subscription, userAgent);

    return res.status(201).json({
      success: true,
      message: 'Browser push notifications successfully enabled!'
    });
  } catch (error) {
    console.error('[subscribePush Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register push subscription.'
    });
  }
}

/**
 * POST /api/notifications/push-unsubscribe
 * Removes browser push subscription.
 */
async function unsubscribePush(req, res) {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await pushService.deleteSubscription(endpoint);
    }

    return res.json({
      success: true,
      message: 'Push subscription removed.'
    });
  } catch (error) {
    console.error('[unsubscribePush Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove push subscription.'
    });
  }
}

/**
 * GET /api/notifications/fcm-config
 * Returns public, client-safe Firebase Web config.
 * Private service credentials remain strictly on the server.
 */
async function getFcmConfig(req, res) {
  try {
    const config = {
      apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '',
      vapidKey: process.env.FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY || process.env.VAPID_PUBLIC_KEY || ''
    };

    return res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('[getFcmConfig Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve Firebase configuration.'
    });
  }
}

/**
 * POST /api/notifications/fcm-token
 * Registers or updates an FCM token for the student's device.
 */
async function registerFcmToken(req, res) {
  try {
    const userId = req.user.id;
    const { token, platform = 'web', deviceName } = req.body;
    const userAgent = req.headers['user-agent'] || null;

    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A valid FCM registration token string is required.'
      });
    }

    await fcmService.saveFcmToken(userId, {
      token,
      platform,
      deviceName,
      userAgent
    });

    return res.status(201).json({
      success: true,
      message: 'FCM push registration token saved successfully.'
    });
  } catch (error) {
    console.error('[registerFcmToken Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register FCM device token.'
    });
  }
}

/**
 * DELETE /api/notifications/fcm-token
 * Unregisters an FCM token when the user opts out or logs out.
 */
async function unregisterFcmToken(req, res) {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required to unregister device.'
      });
    }

    await fcmService.removeFcmToken(userId, token);

    return res.json({
      success: true,
      message: 'FCM device token unregistered successfully.'
    });
  } catch (error) {
    console.error('[unregisterFcmToken Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unregister FCM device token.'
    });
  }
}

/**
 * GET /api/notifications/preferences
 * Returns user notification settings.
 */
async function getPreferences(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      'SELECT * FROM notification_preferences WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const prefs = rows.length > 0 ? rows[0] : {
      email_enabled: 1,
      push_enabled: 1,
      in_app_enabled: 1,
      notify_new_events: 1,
      notify_registration_updates: 1,
      notify_deadlines: 1,
      notify_event_changes: 1,
      notify_reward_points: 1
    };

    return res.json({
      success: true,
      data: prefs
    });
  } catch (error) {
    console.error('[getPreferences Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences.'
    });
  }
}

/**
 * PUT /api/notifications/preferences
 * Updates user notification settings.
 */
async function updatePreferences(req, res) {
  try {
    const userId = req.user.id;
    const {
      email_enabled,
      push_enabled,
      in_app_enabled,
      notify_new_events,
      notify_registration_updates,
      notify_deadlines,
      notify_event_changes,
      notify_reward_points
    } = req.body;

    await pool.execute(
      `INSERT INTO notification_preferences (
        user_id, email_enabled, push_enabled, in_app_enabled,
        notify_new_events, notify_registration_updates, notify_deadlines,
        notify_event_changes, notify_reward_points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email_enabled = COALESCE(VALUES(email_enabled), email_enabled),
        push_enabled = COALESCE(VALUES(push_enabled), push_enabled),
        in_app_enabled = COALESCE(VALUES(in_app_enabled), in_app_enabled),
        notify_new_events = COALESCE(VALUES(notify_new_events), notify_new_events),
        notify_registration_updates = COALESCE(VALUES(notify_registration_updates), notify_registration_updates),
        notify_deadlines = COALESCE(VALUES(notify_deadlines), notify_deadlines),
        notify_event_changes = COALESCE(VALUES(notify_event_changes), notify_event_changes),
        notify_reward_points = COALESCE(VALUES(notify_reward_points), notify_reward_points),
        updated_at = NOW()`,
      [
        userId,
        email_enabled !== undefined ? (email_enabled ? 1 : 0) : 1,
        push_enabled !== undefined ? (push_enabled ? 1 : 0) : 1,
        in_app_enabled !== undefined ? (in_app_enabled ? 1 : 0) : 1,
        notify_new_events !== undefined ? (notify_new_events ? 1 : 0) : 1,
        notify_registration_updates !== undefined ? (notify_registration_updates ? 1 : 0) : 1,
        notify_deadlines !== undefined ? (notify_deadlines ? 1 : 0) : 1,
        notify_event_changes !== undefined ? (notify_event_changes ? 1 : 0) : 1,
        notify_reward_points !== undefined ? (notify_reward_points ? 1 : 0) : 1
      ]
    );

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully.'
    });
  } catch (error) {
    console.error('[updatePreferences Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update preferences.'
    });
  }
}

/**
 * POST /api/notifications/scan-deadlines
 * Admin only trigger: manually executes deadline reminder scan.
 */
async function triggerDeadlineScan(req, res) {
  try {
    await runReminderScan();
    return res.json({
      success: true,
      message: 'Deadline reminder scan completed.'
    });
  } catch (error) {
    console.error('[triggerDeadlineScan Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute deadline scan.'
    });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  getFcmConfig,
  registerFcmToken,
  unregisterFcmToken,
  getPreferences,
  updatePreferences,
  triggerDeadlineScan
};
