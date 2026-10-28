const { pool } = require('../config/db');

/**
 * Migration Script: Creates tables for Campus-Event Notification System:
 * - notifications (In-app notification records with idempotency key)
 * - push_subscriptions (Browser Web Push VAPID subscriptions per user)
 * - notification_preferences (Per-user channel and category toggles)
 * - notification_deliveries (Multi-channel delivery audit logs)
 */
async function migrateNotificationSystem() {
  console.log('[Migration] Starting Notification System Schema Migration...');
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Create notifications table
    console.log('[Migration] Creating notifications table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NULL,
        category ENUM(
          'event_published', 
          'registration_status', 
          'deadline_reminder', 
          'event_updated', 
          'points_awarded', 
          'system'
        ) NOT NULL DEFAULT 'system',
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        action_url VARCHAR(255) NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        read_at DATETIME NULL,
        idempotency_key VARCHAR(191) NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_notif (user_id, is_read, created_at),
        INDEX idx_event_notif (event_id),
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_notif_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create push_subscriptions table
    console.log('[Migration] Creating push_subscriptions table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        endpoint TEXT NOT NULL,
        endpoint_hash VARCHAR(64) NOT NULL UNIQUE,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        user_agent VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_push (user_id),
        CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Create notification_preferences table
    console.log('[Migration] Creating notification_preferences table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        email_enabled TINYINT(1) NOT NULL DEFAULT 1,
        push_enabled TINYINT(1) NOT NULL DEFAULT 1,
        in_app_enabled TINYINT(1) NOT NULL DEFAULT 1,
        notify_new_events TINYINT(1) NOT NULL DEFAULT 1,
        notify_registration_updates TINYINT(1) NOT NULL DEFAULT 1,
        notify_deadlines TINYINT(1) NOT NULL DEFAULT 1,
        notify_event_changes TINYINT(1) NOT NULL DEFAULT 1,
        notify_reward_points TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Create notification_deliveries table
    console.log('[Migration] Creating notification_deliveries table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        notification_id INT NOT NULL,
        channel ENUM('in_app', 'push', 'email') NOT NULL,
        status ENUM('sent', 'failed', 'skipped') NOT NULL,
        error_message TEXT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_delivery_notif (notification_id, channel),
        CONSTRAINT fk_delivery_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Initialize default preferences for existing users who do not have one
    console.log('[Migration] Seeding default preferences for existing users...');
    await conn.query(`
      INSERT IGNORE INTO notification_preferences (user_id)
      SELECT id FROM users;
    `);

    await conn.commit();
    console.log('[Migration] Notification System Migration completed successfully!');
  } catch (error) {
    await conn.rollback();
    console.error('[Migration Error]:', error);
    throw error;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  migrateNotificationSystem()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateNotificationSystem };
