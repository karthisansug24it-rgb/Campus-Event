const { pool } = require('../config/db');
const pushService = require('./pushService');
const emailService = require('./emailService');
const fcmService = require('./fcmService');

/**
 * Centralized Notification Service:
 * Handles in-app records, Web Push delivery, SMTP email delivery,
 * idempotency enforcement, and user preference gating.
 */

/**
 * Fetch or initialize default notification preferences for a user.
 */
async function getUserPreferences(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM notification_preferences WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // Insert default preferences if not yet existing
  try {
    await pool.execute(
      'INSERT IGNORE INTO notification_preferences (user_id) VALUES (?)',
      [userId]
    );
    const [created] = await pool.execute(
      'SELECT * FROM notification_preferences WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (created.length > 0) return created[0];
  } catch (err) {
    console.warn('[NotificationService] Error creating default preferences:', err.message);
  }

  return {
    email_enabled: 1,
    push_enabled: 1,
    in_app_enabled: 1,
    notify_new_events: 1,
    notify_registration_updates: 1,
    notify_deadlines: 1,
    notify_event_changes: 1,
    notify_reward_points: 1
  };
}

/**
 * Dispatches a notification across all active channels for a user.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number|null} [params.eventId]
 * @param {string} params.category - 'event_published' | 'registration_status' | 'deadline_reminder' | 'event_updated' | 'points_awarded' | 'system'
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.actionUrl]
 * @param {string} [params.idempotencyKey]
 * @param {string} [params.recipientEmail] - Optional email override
 */
async function createNotification({
  userId,
  eventId = null,
  category = 'system',
  title,
  message,
  actionUrl = '/events',
  idempotencyKey = null,
  recipientEmail = null
}) {
  if (!userId || !title || !message) {
    throw new Error('userId, title, and message are required.');
  }

  // 1. Check idempotency if a key is provided
  if (idempotencyKey) {
    const [existing] = await pool.execute(
      'SELECT id FROM notifications WHERE idempotency_key = ? LIMIT 1',
      [idempotencyKey]
    );
    if (existing.length > 0) {
      // Already sent / created, skip silently
      return { success: true, duplicate: true, notificationId: existing[0].id };
    }
  }

  // 2. Fetch user preferences
  const prefs = await getUserPreferences(userId);

  // Check category gating
  if (category === 'event_published' && !prefs.notify_new_events) return { skipped: true };
  if (category === 'registration_status' && !prefs.notify_registration_updates) return { skipped: true };
  if (category === 'deadline_reminder' && !prefs.notify_deadlines) return { skipped: true };
  if (category === 'event_updated' && !prefs.notify_event_changes) return { skipped: true };
  if (category === 'points_awarded' && !prefs.notify_reward_points) return { skipped: true };

  // 3. Persistent In-App Notification Record
  let notificationId = null;
  try {
    const [insertResult] = await pool.execute(
      `INSERT INTO notifications (
        user_id, event_id, category, title, message, action_url, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, eventId, category, title, message, actionUrl, idempotencyKey]
    );
    notificationId = insertResult.insertId;

    // Log in_app delivery
    await pool.execute(
      `INSERT INTO notification_deliveries (notification_id, channel, status) VALUES (?, 'in_app', 'sent')`,
      [notificationId]
    );
  } catch (err) {
    // Check if ER_DUP_ENTRY for idempotency
    if (err.code === 'ER_DUP_ENTRY') {
      return { success: true, duplicate: true };
    }
    console.error('[NotificationService] Failed to insert notification:', err.message);
    throw err;
  }

  // 4. Asynchronous Multi-Channel Delivery (Push & Email)
  // Run asynchronously so caller is never blocked
  setImmediate(async () => {
    // A. Browser Web Push & FCM (Primary)
    if (prefs.push_enabled) {
      try {
        // 1. Primary FCM Push Delivery (Multi-device Web + Android)
        await fcmService.sendPushToUser(
          userId,
          {
            title,
            body: message,
            action_url: actionUrl,
            data: {
              notificationId: String(notificationId),
              category,
              eventId: eventId ? String(eventId) : '',
              url: actionUrl
            }
          },
          notificationId
        );

        // 2. Also send to standard VAPID Web Push subscriptions if any exist
        const pushResult = await pushService.sendPushToUser(userId, {
          title,
          message,
          action_url: actionUrl,
          notificationId,
          category
        });

        if (pushResult && pushResult.sentCount > 0) {
          await pool.execute(
            `INSERT INTO notification_deliveries (notification_id, channel, status, error_message)
             VALUES (?, 'push', 'sent', NULL)`,
            [notificationId]
          ).catch(() => {});
        }
      } catch (err) {
        if (err.code !== 'ER_NO_REFERENCED_ROW_2') {
          console.warn('[NotificationService Push Error]:', err.message);
        }
        await pool.execute(
          `INSERT INTO notification_deliveries (notification_id, channel, status, error_message)
           VALUES (?, 'push', 'failed', ?)`,
          [notificationId, err.message]
        ).catch(() => {});
      }
    }

    // B. SMTP Email
    if (prefs.email_enabled) {
      try {
        let emailTarget = recipientEmail;
        if (!emailTarget) {
          const [userRows] = await pool.execute('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
          if (userRows.length > 0) emailTarget = userRows[0].email;
        }

        if (emailTarget) {
          const emailResult = await emailService.sendEmailNotification(emailTarget, {
            title,
            message,
            actionUrl
          });

          await pool.execute(
            `INSERT INTO notification_deliveries (notification_id, channel, status, error_message)
             VALUES (?, 'email', ?, ?)`,
            [
              notificationId,
              emailResult.success ? 'sent' : 'failed',
              emailResult.error || (emailResult.simulated ? 'Simulated SMTP' : null)
            ]
          ).catch(logErr => {
            if (logErr.code !== 'ER_NO_REFERENCED_ROW_2') {
              console.warn('[NotificationService Email Delivery Log Warning]:', logErr.message);
            }
          });
        }
      } catch (err) {
        if (err.code !== 'ER_NO_REFERENCED_ROW_2') {
          console.warn('[NotificationService Email Error]:', err.message);
        }
        await pool.execute(
          `INSERT INTO notification_deliveries (notification_id, channel, status, error_message)
           VALUES (?, 'email', 'failed', ?)`,
          [notificationId, err.message]
        ).catch(() => {});
      }
    }
  });

  return { success: true, notificationId };
}

// ---------------------------------------------------------------------------
// Trigger 1: New Event Published
// ---------------------------------------------------------------------------
async function notifyEventPublished(event) {
  if (!event || !event.id) return;
  if (event.status !== 'published' || event.is_visible_on_dashboard === 0) return;

  try {
    const [students] = await pool.execute(
      'SELECT id, email, name FROM users WHERE role = "student"'
    );

    const title = `New Event: ${event.title}`;
    const dateFormatted = event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : 'Upcoming';
    const message = `A new campus event "${event.title}" is now open for registrations.\n\nDate: ${dateFormatted}\nVenue: ${event.venue || 'College Campus'}\nOrganizer: ${event.organizer || 'FXEC'}`;
    const actionUrl = `/events?event=${event.id}`;

    for (const student of students) {
      const idempotencyKey = `event_published:${event.id}:user:${student.id}`;
      await createNotification({
        userId: student.id,
        eventId: event.id,
        category: 'event_published',
        title,
        message,
        actionUrl,
        idempotencyKey,
        recipientEmail: student.email
      }).catch(err => console.warn(`[notifyEventPublished] Student ${student.id} error:`, err.message));
    }
  } catch (err) {
    console.error('[notifyEventPublished Error]:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Trigger 2: Registration Lifecycle Updates
// ---------------------------------------------------------------------------
async function notifyRegistrationStatus({
  requestId,
  userId,
  eventId,
  eventTitle,
  status,
  adminNote = null
}) {
  let title = '';
  let message = '';
  const actionUrl = '/my/requests';

  if (status === 'registration_approved') {
    title = `Registration Approved: ${eventTitle}`;
    message = `Congratulations! Your registration for "${eventTitle}" has been verified and your seat is officially confirmed.\n\nPlease attend on the scheduled date and make sure to collect your participation certificate.`;
  } else if (status === 'rejected') {
    title = `Registration Update: ${eventTitle}`;
    message = `Your registration request for "${eventTitle}" was declined by the administrator.` +
      (adminNote ? `\n\nReason: "${adminNote}"` : '');
  } else if (status === 'participated') {
    title = `Certificate Submitted: ${eventTitle}`;
    message = `Your participation certificate for "${eventTitle}" has been submitted successfully and is awaiting admin verification and award allocation.`;
  } else if (status === 'registered') {
    title = `Registration Received: ${eventTitle}`;
    message = `Your registration request for "${eventTitle}" was received and is currently under review by the faculty admin.`;
  } else {
    return;
  }

  const idempotencyKey = `reg_status:${requestId}:${status}`;

  return createNotification({
    userId,
    eventId,
    category: 'registration_status',
    title,
    message,
    actionUrl,
    idempotencyKey
  });
}

// ---------------------------------------------------------------------------
// Trigger 4: Meaningful Event Changes & Cancellation
// ---------------------------------------------------------------------------
async function notifyEventUpdated({
  eventId,
  eventTitle,
  changes = {},
  isCancellation = false
}) {
  try {
    // Target all students who have applied or registered for this event
    const [attendees] = await pool.execute(
      `SELECT DISTINCT user_id, email 
       FROM registration_requests 
       WHERE event_id = ? AND status != 'rejected'`,
      [eventId]
    );

    if (attendees.length === 0) return;

    let title = '';
    let message = '';

    if (isCancellation) {
      title = `CANCELLED: ${eventTitle}`;
      message = `Important Notice: The event "${eventTitle}" has been cancelled. Any scheduled sessions will not take place.`;
    } else {
      title = `Schedule Update: ${eventTitle}`;
      const changeList = [];
      if (changes.event_date) changeList.push(`Date/Time: ${new Date(changes.event_date).toLocaleString()}`);
      if (changes.venue) changeList.push(`Venue: ${changes.venue}`);
      if (changes.registration_deadline) changeList.push(`Registration Cutoff: ${new Date(changes.registration_deadline).toLocaleString()}`);
      if (changes.certificate_deadline) changeList.push(`Certificate Cutoff: ${new Date(changes.certificate_deadline).toLocaleString()}`);

      if (changeList.length === 0) return; // No critical change
      message = `Please note the following schedule updates for "${eventTitle}":\n\n` + changeList.map(c => `• ${c}`).join('\n');
    }

    const actionUrl = `/events?event=${eventId}`;
    const timestamp = Math.floor(Date.now() / 60000); // 1-minute bucket for change grouping

    for (const att of attendees) {
      const idempotencyKey = `event_change:${eventId}:${att.user_id}:${timestamp}`;
      await createNotification({
        userId: att.user_id,
        eventId,
        category: 'event_updated',
        title,
        message,
        actionUrl,
        idempotencyKey,
        recipientEmail: att.email
      }).catch(err => console.warn(`[notifyEventUpdated] User ${att.user_id} error:`, err.message));
    }
  } catch (err) {
    console.error('[notifyEventUpdated Error]:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Trigger 5: Reward Points & Ranking Awarded
// ---------------------------------------------------------------------------
async function notifyPointsAwarded({
  requestId,
  userId,
  eventId,
  eventTitle,
  rankPosition,
  totalPoints,
  note = null
}) {
  const rankLabel = rankPosition === '1' ? '1st Place Winner' :
                    rankPosition === '2' ? '2nd Place Runner-Up' :
                    rankPosition === '3' ? '3rd Place Runner-Up' : 'Official Participant';

  const title = `Points Awarded: +${totalPoints} PTS (${rankLabel})`;
  const message = `Congratulations! Your participation in "${eventTitle}" has been verified and awarded ${totalPoints} reward points.\n\nRecognition: ${rankLabel}` +
    (note ? `\nAdmin Remarks: "${note}"` : '') +
    `\n\nYour updated points balance is now visible in your student profile.`;

  const actionUrl = '/my/requests';
  const idempotencyKey = `points_awarded:${requestId}:${rankPosition}:${totalPoints}`;

  return createNotification({
    userId,
    eventId,
    category: 'points_awarded',
    title,
    message,
    actionUrl,
    idempotencyKey
  });
}

module.exports = {
  createNotification,
  getUserPreferences,
  notifyEventPublished,
  notifyRegistrationStatus,
  notifyEventUpdated,
  notifyPointsAwarded
};
