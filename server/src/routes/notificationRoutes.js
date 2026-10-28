const express = require('express');
const {
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
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();

// Public / Authenticated route to get VAPID public key
router.get('/vapid-public-key', getVapidPublicKey);

// Route to get public client-safe Firebase config
router.get('/fcm-config', getFcmConfig);

// All subsequent routes require user authentication
router.use(authenticateToken);

// FCM Device Token Registration (Primary Web + Android)
router.post('/fcm-token', registerFcmToken);
router.delete('/fcm-token', unregisterFcmToken);

// Legacy Web Push Subscriptions
router.post('/push-subscribe', subscribePush);
router.post('/push-unsubscribe', unsubscribePush);

// User Notification Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Notification Retrieval & Status
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

// Admin-only deadline reminder trigger
router.post('/scan-deadlines', requireRole('admin'), triggerDeadlineScan);

module.exports = router;
