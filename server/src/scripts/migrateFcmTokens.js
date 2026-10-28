const { pool } = require('../config/db');

/**
 * Migration Script: Creates fcm_tokens table for Firebase Cloud Messaging (Web + Android).
 * Supports multi-device per student, device platforms, and token invalidation.
 */
async function migrateFcmTokens() {
  console.log('[Migration] Starting FCM Tokens Schema Migration...');
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    console.log('[Migration] Creating fcm_tokens table...');
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

    await conn.commit();
    console.log('[Migration] FCM Tokens Migration completed successfully!');
  } catch (error) {
    await conn.rollback();
    console.error('[Migration Error]:', error);
    throw error;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  migrateFcmTokens()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateFcmTokens };
