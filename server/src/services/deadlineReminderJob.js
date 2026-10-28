const cron = require('node-cron');
const { pool } = require('../config/db');
const { createNotification } = require('./notificationService');

let cronTask = null;

/**
 * Scans for upcoming registration and certificate deadlines and dispatches
 * 24-hour and 1-hour reminders to eligible students using idempotent keys.
 */
async function runReminderScan() {
  const now = new Date();

  try {
    // =========================================================================
    // 1. REGISTRATION DEADLINE REMINDERS
    // =========================================================================
    // Find published events whose registration deadline is in the future
    const [eventsWithDeadlines] = await pool.execute(`
      SELECT id, title, registration_deadline, max_seats,
             (SELECT COUNT(*) FROM registration_requests WHERE event_id = events.id AND status IN ('registration_approved', 'approved', 'participated', 'ranked')) AS approved_count
      FROM events
      WHERE status = 'published'
        AND is_visible_on_dashboard = 1
        AND registration_deadline > NOW()
        AND registration_deadline <= DATE_ADD(NOW(), INTERVAL 25 HOUR)
    `);

    for (const ev of eventsWithDeadlines) {
      // Check if event is already full
      if (ev.max_seats !== null && Number(ev.approved_count) >= ev.max_seats) {
        continue;
      }

      const deadline = new Date(ev.registration_deadline);
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      let reminderType = null;
      let timeLabel = '';

      if (hoursUntilDeadline > 0.1 && hoursUntilDeadline <= 1.5) {
        reminderType = '1h';
        timeLabel = '1 Hour Remaining';
      } else if (hoursUntilDeadline > 22.5 && hoursUntilDeadline <= 24.5) {
        reminderType = '24h';
        timeLabel = 'Closing Tomorrow (24 Hours Remaining)';
      }

      if (!reminderType) continue;

      // Find students who have NOT registered yet for this event
      const [eligibleStudents] = await pool.execute(`
        SELECT u.id, u.email 
        FROM users u 
        WHERE u.role = 'student' 
          AND u.id NOT IN (
            SELECT user_id FROM registration_requests WHERE event_id = ?
          )
      `, [ev.id]);

      const title = `Deadline Alert: ${ev.title} (${timeLabel})`;
      const message = `Registration for "${ev.title}" closes soon! Only ${timeLabel.toLowerCase()} to submit your application and reserve a seat.`;
      const actionUrl = `/events?event=${ev.id}`;

      for (const student of eligibleStudents) {
        const idempotencyKey = `reminder:reg:${reminderType}:event:${ev.id}:user:${student.id}`;
        await createNotification({
          userId: student.id,
          eventId: ev.id,
          category: 'deadline_reminder',
          title,
          message,
          actionUrl,
          idempotencyKey,
          recipientEmail: student.email
        }).catch(err => console.warn(`[ReminderScan Reg Error]:`, err.message));
      }
    }

    // =========================================================================
    // 2. CERTIFICATE DEADLINE REMINDERS
    // =========================================================================
    // Find events whose certificate upload deadline is closing soon
    const [eventsWithCertDeadlines] = await pool.execute(`
      SELECT id, title, certificate_deadline
      FROM events
      WHERE certificate_deadline IS NOT NULL
        AND certificate_deadline > NOW()
        AND certificate_deadline <= DATE_ADD(NOW(), INTERVAL 25 HOUR)
    `);

    for (const ev of eventsWithCertDeadlines) {
      const certDeadline = new Date(ev.certificate_deadline);
      const hoursUntilCertDeadline = (certDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      let reminderType = null;
      let timeLabel = '';

      if (hoursUntilCertDeadline > 0.1 && hoursUntilCertDeadline <= 1.5) {
        reminderType = '1h';
        timeLabel = '1 Hour Remaining';
      } else if (hoursUntilCertDeadline > 22.5 && hoursUntilCertDeadline <= 24.5) {
        reminderType = '24h';
        timeLabel = 'Closing Tomorrow (24 Hours Remaining)';
      }

      if (!reminderType) continue;

      // Find students who are approved but haven't uploaded certificate yet
      const [pendingCertStudents] = await pool.execute(`
        SELECT rr.id AS request_id, rr.user_id, rr.email
        FROM registration_requests rr
        WHERE rr.event_id = ?
          AND rr.status IN ('registration_approved', 'approved')
          AND (rr.certificate_url IS NULL OR rr.certificate_url = '')
      `, [ev.id]);

      const title = `Certificate Deadline: ${ev.title} (${timeLabel})`;
      const message = `Certificate upload deadline for "${ev.title}" is closing in ${timeLabel.toLowerCase()}!\n\nPlease upload your participation or winner certificate now to receive official verification and reward points.`;
      const actionUrl = '/my/requests';

      for (const student of pendingCertStudents) {
        const idempotencyKey = `reminder:cert:${reminderType}:event:${ev.id}:user:${student.user_id}`;
        await createNotification({
          userId: student.user_id,
          eventId: ev.id,
          category: 'deadline_reminder',
          title,
          message,
          actionUrl,
          idempotencyKey,
          recipientEmail: student.email
        }).catch(err => console.warn(`[ReminderScan Cert Error]:`, err.message));
      }
    }
  } catch (error) {
    console.error('[runReminderScan Error]:', error);
  }
}

/**
 * Initializes the background scheduled cron job.
 * Runs every 10 minutes.
 */
function startDeadlineScheduler() {
  if (cronTask) return;

  // Run every 10 minutes: */10 * * * *
  cronTask = cron.schedule('*/10 * * * *', async () => {
    await runReminderScan();
  });

  console.log('[Scheduler] Deadline reminder job initialized (running every 10 minutes).');
}

function stopDeadlineScheduler() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}

module.exports = {
  startDeadlineScheduler,
  stopDeadlineScheduler,
  runReminderScan
};
