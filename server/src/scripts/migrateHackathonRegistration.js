const { pool } = require('../config/db');

async function migrateHackathonRegistration() {
  console.log('[Migration] Starting Hackathon & External Event Registration Migration...');

  // Helper to check if column exists
  async function columnExists(table, column) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = ? 
         AND COLUMN_NAME = ?`,
      [table, column]
    );
    return rows[0].cnt > 0;
  }

  // 1. Add registration_url to events if missing
  if (!(await columnExists('events', 'registration_url'))) {
    console.log('[Migration] Adding registration_url column to events...');
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN registration_url VARCHAR(500) NULL AFTER external_link;
    `);
  }

  // 2. Add start_time to events if missing
  if (!(await columnExists('events', 'start_time'))) {
    console.log('[Migration] Adding start_time column to events...');
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN start_time VARCHAR(20) NULL AFTER event_date;
    `);
  }

  // 3. Add end_time to events if missing
  if (!(await columnExists('events', 'end_time'))) {
    console.log('[Migration] Adding end_time column to events...');
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN end_time VARCHAR(20) NULL AFTER start_time;
    `);
  }

  // 4. Add registration_open_date to events if missing
  if (!(await columnExists('events', 'registration_open_date'))) {
    console.log('[Migration] Adding registration_open_date column to events...');
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN registration_open_date DATETIME NULL AFTER registration_deadline;
    `);
  }

  // 5. Add status to events if missing (draft, published, registration_closed)
  if (!(await columnExists('events', 'status'))) {
    console.log('[Migration] Adding status column to events...');
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN status ENUM('draft', 'published', 'registration_closed') NOT NULL DEFAULT 'published' AFTER certificate_deadline,
      ADD INDEX idx_event_status (status);
    `);
  }

  // 6. Add is_visible_on_dashboard to events if missing
  if (!(await columnExists('events', 'is_visible_on_dashboard'))) {
    console.log('[Migration] Adding is_visible_on_dashboard column to events...');
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN is_visible_on_dashboard BOOLEAN NOT NULL DEFAULT TRUE AFTER status;
    `);
  }

  // 7. Populate registration_url from external_link if registration_url is NULL
  await pool.query(`
    UPDATE events 
    SET registration_url = external_link 
    WHERE registration_url IS NULL AND external_link IS NOT NULL;
  `);

  // 8. Create external_registrations table for unverified / self-reported external submissions
  console.log('[Migration] Ensuring external_registrations table exists...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS external_registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      user_id INT NULL,
      student_name VARCHAR(100) NULL,
      student_email VARCHAR(150) NULL,
      verification_status ENUM('self_reported', 'unverified') NOT NULL DEFAULT 'unverified',
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      source_provider VARCHAR(50) DEFAULT 'google_forms',
      INDEX idx_ext_event (event_id),
      INDEX idx_ext_user (user_id),
      CONSTRAINT fk_ext_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      CONSTRAINT fk_ext_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 9. Configure the initial Hackathon Event with the user's provided Google Forms URL
  const googleFormsUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSe40YITCEQyQB4RHcVBfs4PshHTK0Lbhq67nZ3dRNEtdMBqIg/viewform?usp=header';
  console.log('[Migration] Configuring / Updating Hackathon event with Google Forms URL...');

  // Check if Hackathon event exists
  const [existingHackathon] = await pool.query(
    "SELECT id FROM events WHERE category = 'Hackathon' ORDER BY id LIMIT 1"
  );

  if (existingHackathon.length > 0) {
    const hackathonId = existingHackathon[0].id;
    await pool.query(`
      UPDATE events 
      SET 
        registration_url = ?,
        external_link = ?,
        status = 'published',
        is_visible_on_dashboard = TRUE,
        start_time = COALESCE(start_time, '09:00 AM'),
        end_time = COALESCE(end_time, '06:00 PM')
      WHERE id = ?
    `, [googleFormsUrl, googleFormsUrl, hackathonId]);
    console.log(`[Migration] Updated existing Hackathon event #${hackathonId} with Google Forms URL.`);
  } else {
    // Insert initial Hackathon event
    await pool.query(`
      INSERT INTO events (
        title, description, poster_url, event_type, category, venue, organizer,
        event_date, start_time, end_time, registration_deadline, registration_open_date,
        registration_url, external_link, status, is_visible_on_dashboard, max_seats, reward_points, created_by
      ) VALUES (
        'FXEC National Hackathon 2026',
        '24-hour national level hackathon fostering innovative solutions in AI, IoT, Web3, and Sustainable Tech. Cash prizes, investor mentorship, and networking opportunities with top tech leaders.',
        '/uploads/hackathon.jpg',
        'internal',
        'Hackathon',
        'FX Innovation Center & Computer Labs',
        'FXEC IEEE Student Branch & Dept of CSE',
        '2026-11-20 09:00:00',
        '09:00 AM',
        '06:00 PM',
        '2026-11-15 23:59:59',
        NOW(),
        ?,
        ?,
        'published',
        TRUE,
        150,
        100,
        1
      )
    `, [googleFormsUrl, googleFormsUrl]);
    console.log('[Migration] Inserted initial Hackathon event with Google Forms URL.');
  }

  console.log('[Migration] Hackathon event migration completed successfully!');
  process.exit(0);
}

migrateHackathonRegistration().catch(err => {
  console.error('[Migration Error]:', err);
  process.exit(1);
});
