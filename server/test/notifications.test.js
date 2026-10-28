const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { pool } = require('../src/config/db');
const {
  createNotification,
  getUserPreferences,
  notifyEventPublished,
  notifyRegistrationStatus,
  notifyEventUpdated,
  notifyPointsAwarded
} = require('../src/services/notificationService');
const { runReminderScan } = require('../src/services/deadlineReminderJob');
const pushService = require('../src/services/pushService');
const emailService = require('../src/services/emailService');
const fcmService = require('../src/services/fcmService');

test('Notification System Suite', async (t) => {
  // Setup: Fetch student user
  const [users] = await pool.execute('SELECT * FROM users WHERE role = "student" LIMIT 1');
  assert.ok(users.length > 0, 'At least one student must exist in database for testing.');
  const student = users[0];
  const token = jwt.sign(
    { id: student.id, email: student.email, role: student.role },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_here'
  );

  // 1. Test VAPID public key availability
  await t.test('1. Push Service has configured VAPID key', async () => {
    const key = pushService.getPublicKey();
    assert.ok(key, 'VAPID public key must be defined in environment.');
    assert.ok(key.length > 30, 'VAPID public key should be a valid base64 key.');
  });

  // 2. Test User Notification Preferences
  await t.test('2. Retrieve and default user notification preferences', async () => {
    const prefs = await getUserPreferences(student.id);
    assert.ok(prefs, 'Preferences object should exist.');
    assert.strictEqual(Number(prefs.in_app_enabled), 1);
    assert.strictEqual(Number(prefs.notify_new_events), 1);
  });

  // 3. Test In-App Notification Creation with Idempotency
  await t.test('3. Create In-App Notification & verify idempotency', async () => {
    const testKey = `test:idempotency:${Date.now()}`;
    const result1 = await createNotification({
      userId: student.id,
      category: 'system',
      title: 'Test Notification 1',
      message: 'This is a test notification message.',
      actionUrl: '/events',
      idempotencyKey: testKey
    });

    assert.strictEqual(result1.success, true);
    assert.ok(result1.notificationId);

    // Call again with the exact same idempotency key
    const result2 = await createNotification({
      userId: student.id,
      category: 'system',
      title: 'Duplicate Test Notification',
      message: 'This message should not be duplicated.',
      actionUrl: '/events',
      idempotencyKey: testKey
    });

    assert.strictEqual(result2.success, true);
    assert.strictEqual(result2.duplicate, true, 'Second call must be flagged as duplicate.');

    // Verify only 1 record exists in database
    const [rows] = await pool.execute(
      'SELECT id, title, is_read FROM notifications WHERE idempotency_key = ?',
      [testKey]
    );
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].title, 'Test Notification 1');
    assert.strictEqual(rows[0].is_read, 0);

    // Clean up
    await pool.execute('DELETE FROM notifications WHERE id = ?', [rows[0].id]);
  });

  // 4. Test Registration Status Notification Trigger
  await t.test('4. Trigger Registration Status Notification', async () => {
    const res = await notifyRegistrationStatus({
      requestId: 9999,
      userId: student.id,
      eventId: 1,
      eventTitle: 'Smart City Hackathon 2026',
      status: 'registration_approved'
    });

    assert.ok(res.success);

    // Verify record in DB
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE idempotency_key = ?',
      ['reg_status:9999:registration_approved']
    );
    assert.strictEqual(rows.length, 1);
    assert.ok(rows[0].title.includes('Registration Approved'));
    assert.strictEqual(rows[0].category, 'registration_status');

    // Clean up
    await pool.execute('DELETE FROM notifications WHERE id = ?', [rows[0].id]);
  });

  // 5. Test Reward Points Awarded Notification Trigger
  await t.test('5. Trigger Points Awarded Notification', async () => {
    const res = await notifyPointsAwarded({
      requestId: 9999,
      userId: student.id,
      eventId: 1,
      eventTitle: 'Smart City Hackathon 2026',
      rankPosition: '1',
      totalPoints: 100,
      note: 'Outstanding IoT prototype submission'
    });

    assert.ok(res.success);

    // Verify record in DB
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE idempotency_key = ?',
      ['points_awarded:9999:1:100']
    );
    assert.strictEqual(rows.length, 1);
    assert.ok(rows[0].title.includes('+100 PTS'));
    assert.ok(rows[0].message.includes('Outstanding IoT prototype submission'));
    assert.strictEqual(rows[0].category, 'points_awarded');

    // Clean up
    await pool.execute('DELETE FROM notifications WHERE id = ?', [rows[0].id]);
  });

  // 6. Test Push Subscription Upsert and Deletion
  await t.test('6. Save and prune push subscription', async () => {
    const dummySub = {
      endpoint: `https://fcm.googleapis.com/fcm/send/test-token-${Date.now()}`,
      keys: {
        p256dh: 'BNcRdreALRF8JxDe5SlQfWmgEKSrYzU4mQGpvPiEmrM3vWzTQEk5OceK-W78yCQyPTET3rV4W0C156uCGwtTnt8',
        auth: 'tBHItJI5svbpez7KI4CCXg'
      }
    };

    const saveResult = await pushService.saveSubscription(student.id, dummySub, 'Test Agent');
    assert.strictEqual(saveResult.success, true);

    // Verify in DB
    const [subs] = await pool.execute(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [student.id, dummySub.endpoint]
    );
    assert.strictEqual(subs.length, 1);

    // Delete subscription
    await pushService.deleteSubscription(dummySub.endpoint);
    const [afterDel] = await pool.execute(
      'SELECT id FROM push_subscriptions WHERE endpoint = ?',
      [dummySub.endpoint]
    );
    assert.strictEqual(afterDel.length, 0);
  });

  // 7. Test Deadline Reminder Scan executes cleanly
  await t.test('7. Run Deadline Reminder Scan without errors', async () => {
    await assert.doesNotReject(async () => {
      await runReminderScan();
    });
  });

  // 8. Test Email Service unconfigured fallback behavior
  await t.test('8. Email service handles unconfigured SMTP gracefully', async () => {
    const res = await emailService.sendEmailNotification(student.email, {
      title: 'Test Email Notification',
      message: 'This is a test notification email body.',
      actionUrl: '/events'
    });

    assert.strictEqual(res.success, true);
  });

  // 9. Test FCM Token Registration & Multi-Device Support
  await t.test('9. Save and query multi-device FCM registration tokens', async () => {
    const dummyWebToken = `fcm_web_test_token_${Date.now()}`;
    const dummyAndroidToken = `fcm_android_test_token_${Date.now()}`;

    // Register Web device
    await fcmService.saveFcmToken(student.id, {
      token: dummyWebToken,
      platform: 'web',
      deviceName: 'Chrome on Windows 11'
    });

    // Register Android device (future-proofing Requirement 12)
    await fcmService.saveFcmToken(student.id, {
      token: dummyAndroidToken,
      platform: 'android',
      deviceName: 'Pixel 8 Android'
    });

    const tokens = await fcmService.getUserFcmTokens(student.id);
    assert.ok(tokens.length >= 2, 'Student should have at least 2 registered devices.');

    const webDevice = tokens.find(t => t.token === dummyWebToken);
    const androidDevice = tokens.find(t => t.token === dummyAndroidToken);

    assert.ok(webDevice, 'Web device token should be registered.');
    assert.strictEqual(webDevice.platform, 'web');
    assert.ok(androidDevice, 'Android device token should be registered.');
    assert.strictEqual(androidDevice.platform, 'android');
  });

  // 10. Test FCM Push Notification Dispatch & Delivery Logging
  await t.test('10. FCM Push Service delivers push notification and creates delivery log', async () => {
    const dummyToken = `fcm_send_test_token_${Date.now()}`;
    await fcmService.saveFcmToken(student.id, {
      token: dummyToken,
      platform: 'web',
      deviceName: 'Test Browser'
    });

    // Create notification to link delivery audit
    const [inserted] = await pool.execute(
      'INSERT INTO notifications (user_id, category, title, message) VALUES (?, "system", "FCM Test", "Test FCM body")',
      [student.id]
    );
    const testNotifId = inserted.insertId;

    const res = await fcmService.sendPushToUser(
      student.id,
      {
        title: 'FCM Test Push',
        body: 'Testing FCM delivery logic',
        action_url: '/events/1'
      },
      testNotifId
    );

    assert.strictEqual(res.success, true);

    // Verify delivery log exists in notification_deliveries
    const [deliveries] = await pool.execute(
      'SELECT channel, status FROM notification_deliveries WHERE notification_id = ? AND channel = "push"',
      [testNotifId]
    );
    assert.ok(deliveries.length > 0, 'Notification delivery row must be recorded.');

    // Cleanup test notification and token
    await pool.execute('DELETE FROM notifications WHERE id = ?', [testNotifId]);
    await fcmService.removeFcmToken(student.id, dummyToken);
  });

  // 11. Test FCM Invalid Token Pruning
  await t.test('11. Prune invalid FCM token automatically', async () => {
    const staleToken = `fcm_stale_token_${Date.now()}`;
    await fcmService.saveFcmToken(student.id, {
      token: staleToken,
      platform: 'web'
    });

    // Prune token
    await fcmService.pruneInvalidToken(staleToken);

    // Verify pruned from DB
    const [tokens] = await pool.execute(
      'SELECT id FROM fcm_tokens WHERE token = ?',
      [staleToken]
    );
    assert.strictEqual(tokens.length, 0, 'Stale token must be removed from fcm_tokens.');
  });

  // 12. Test FCM Token Unregistration
  await t.test('12. Unregister FCM token on student opt-out', async () => {
    const optOutToken = `fcm_optout_token_${Date.now()}`;
    await fcmService.saveFcmToken(student.id, {
      token: optOutToken,
      platform: 'web'
    });

    await fcmService.removeFcmToken(student.id, optOutToken);

    const [after] = await pool.execute(
      'SELECT id FROM fcm_tokens WHERE token = ?',
      [optOutToken]
    );
    assert.strictEqual(after.length, 0);
  });
});
