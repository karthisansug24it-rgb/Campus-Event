const { pool } = require('../config/db');

async function migrateProgressStages() {
  console.log('[Migration] Starting progress stages and proof verification schema update...');
  const conn = await pool.getConnection();

  try {
    // 1. Update status enum in registration_requests
    console.log('[Migration] Updating registration_requests status enum...');
    await conn.query(`
      ALTER TABLE registration_requests 
      MODIFY COLUMN status ENUM('registered', 'registration_approved', 'participated', 'ranked', 'rejected', 'pending', 'approved') 
      NOT NULL DEFAULT 'registered';
    `);

    // 2. Add columns to registration_requests if they don't already exist
    const [cols] = await conn.query('DESCRIBE registration_requests;');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('registration_screenshot')) {
      console.log('[Migration] Adding registration_screenshot column...');
      await conn.query(`
        ALTER TABLE registration_requests
        ADD COLUMN registration_screenshot VARCHAR(255) NULL AFTER status;
      `);
    }

    if (!colNames.includes('screenshot_uploaded_at')) {
      console.log('[Migration] Adding screenshot_uploaded_at column...');
      await conn.query(`
        ALTER TABLE registration_requests
        ADD COLUMN screenshot_uploaded_at DATETIME NULL AFTER registration_screenshot;
      `);
    }

    if (!colNames.includes('certificate_url')) {
      console.log('[Migration] Adding certificate_url column...');
      await conn.query(`
        ALTER TABLE registration_requests
        ADD COLUMN certificate_url VARCHAR(255) NULL AFTER screenshot_uploaded_at;
      `);
    }

    if (!colNames.includes('certificate_uploaded_at')) {
      console.log('[Migration] Adding certificate_uploaded_at column...');
      await conn.query(`
        ALTER TABLE registration_requests
        ADD COLUMN certificate_uploaded_at DATETIME NULL AFTER certificate_url;
      `);
    }

    if (!colNames.includes('rank_position')) {
      console.log('[Migration] Adding rank_position column...');
      await conn.query(`
        ALTER TABLE registration_requests
        ADD COLUMN rank_position ENUM('1', '2', '3', 'participated', 'none') NOT NULL DEFAULT 'none' AFTER certificate_uploaded_at;
      `);
    }

    if (!colNames.includes('rank_points_awarded')) {
      console.log('[Migration] Adding rank_points_awarded column...');
      await conn.query(`
        ALTER TABLE registration_requests
        ADD COLUMN rank_points_awarded INT NOT NULL DEFAULT 0 AFTER rank_position;
      `);
    }

    if (!colNames.includes('ranked_by')) {
      console.log('[Migration] Adding ranked_by column...');
      await conn.query(`
        ALTER TABLE registration_requests
        ADD COLUMN ranked_by INT NULL AFTER rank_points_awarded,
        ADD CONSTRAINT fk_requests_ranked_by FOREIGN KEY (ranked_by) REFERENCES users(id) ON DELETE SET NULL;
      `);
    }

    if (!colNames.includes('ranked_at')) {
      console.log('[Migration] Adding ranked_at column...');
      await conn.query(`
        ALTER TABLE registration_requests
        ADD COLUMN ranked_at DATETIME NULL AFTER ranked_by;
      `);
    }

    // 3. Add certificate_deadline to events table
    const [eventCols] = await conn.query('DESCRIBE events;');
    const eventColNames = eventCols.map(c => c.Field);

    if (!eventColNames.includes('certificate_deadline')) {
      console.log('[Migration] Adding certificate_deadline to events table...');
      await conn.query(`
        ALTER TABLE events
        ADD COLUMN certificate_deadline DATETIME NULL AFTER registration_deadline;
      `);
    }

    // 4. Normalize existing data: map 'pending' to 'registered' and 'approved' to 'registration_approved'
    console.log('[Migration] Normalizing existing status values...');
    await conn.query(`
      UPDATE registration_requests 
      SET status = 'registered' 
      WHERE status = 'pending';
    `);

    await conn.query(`
      UPDATE registration_requests 
      SET status = 'registration_approved' 
      WHERE status = 'approved';
    `);

    console.log('[Migration] Progress stages migration completed successfully!');
  } catch (error) {
    console.error('[Migration Error]:', error);
    throw error;
  } finally {
    conn.release();
  }
}

migrateProgressStages()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
