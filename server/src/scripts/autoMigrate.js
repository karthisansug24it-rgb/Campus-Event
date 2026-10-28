const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { pool } = require('../config/db');

async function autoMigrate() {
  console.log('[AutoMigrate] Starting complete database schema synchronization...');
  const conn = await pool.getConnection();

  try {
    async function addCol(table, col, def) {
      try {
        await conn.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
        console.log(`[AutoMigrate] Added column "${col}" to "${table}".`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          // Column already exists, safe to ignore
        } else {
          console.warn(`[AutoMigrate] Note on ${table}.${col}:`, err.message);
        }
      }
    }

    // 1. Events table columns
    await addCol('events', 'start_time', 'VARCHAR(20) NULL');
    await addCol('events', 'end_time', 'VARCHAR(20) NULL');
    await addCol('events', 'registration_open_date', 'DATETIME NULL');
    await addCol('events', 'certificate_deadline', 'DATETIME NULL');
    await addCol('events', 'status', "ENUM('draft', 'published', 'registration_closed') NOT NULL DEFAULT 'published'");
    await addCol('events', 'is_visible_on_dashboard', 'BOOLEAN NOT NULL DEFAULT TRUE');
    await addCol('events', 'registration_url', 'VARCHAR(500) NULL');

    // 2. Registration requests columns
    await addCol('registration_requests', 'registration_screenshot', 'VARCHAR(255) NULL');
    await addCol('registration_requests', 'screenshot_uploaded_at', 'DATETIME NULL');
    await addCol('registration_requests', 'certificate_url', 'VARCHAR(255) NULL');
    await addCol('registration_requests', 'certificate_uploaded_at', 'DATETIME NULL');
    await addCol('registration_requests', 'rank_position', "ENUM('1', '2', '3', 'participated', 'none') NOT NULL DEFAULT 'none'");
    await addCol('registration_requests', 'rank_points_awarded', 'INT NOT NULL DEFAULT 0');
    await addCol('registration_requests', 'admin_note', 'TEXT NULL');
    await addCol('registration_requests', 'reviewed_by', 'INT NULL');
    await addCol('registration_requests', 'reviewed_at', 'DATETIME NULL');
    await addCol('registration_requests', 'ranked_by', 'INT NULL');
    await addCol('registration_requests', 'ranked_at', 'DATETIME NULL');
    await addCol('registration_requests', 'attended', 'BOOLEAN NOT NULL DEFAULT FALSE');

    // 3. Create notifications table
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
    console.log('[AutoMigrate] Verified "notifications" table.');

    // 4. Create push_subscriptions table
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
    console.log('[AutoMigrate] Verified "push_subscriptions" table.');

    // 5. Create notification_preferences table
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
    console.log('[AutoMigrate] Verified "notification_preferences" table.');

    // 6. Create notification_deliveries table
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
    console.log('[AutoMigrate] Verified "notification_deliveries" table.');

    // 7. Create fcm_tokens table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS fcm_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        platform ENUM('web', 'android', 'ios') NOT NULL DEFAULT 'web',
        device_name VARCHAR(100) NULL,
        user_agent VARCHAR(255) NULL,
        last_used_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_platform (user_id, platform),
        INDEX idx_token (token),
        CONSTRAINT fk_fcm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[AutoMigrate] Verified "fcm_tokens" table.');

    // 8. Seed default notification preferences
    await conn.query(`
      INSERT IGNORE INTO notification_preferences (user_id)
      SELECT id FROM users;
    `);
    console.log('[AutoMigrate] Synced default notification preferences for all users.');

    console.log('[AutoMigrate] Database schema is fully up to date!');
  } catch (err) {
    console.error('[AutoMigrate Error]:', err);
    throw err;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  autoMigrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { autoMigrate };
