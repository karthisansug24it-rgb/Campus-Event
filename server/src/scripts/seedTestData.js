const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seedTestData() {
  console.log('Seeding comprehensive 4-stage event registration records...');
  const defaultPasswordHash = await bcrypt.hash('Student@123', 10);
  
  // 1. Insert/Update Past and Active Events with certificate_deadline
  await pool.query(`
    INSERT INTO events (id, title, description, poster_url, event_type, category, venue, organizer, event_date, registration_deadline, certificate_deadline, max_seats, reward_points, created_by)
    VALUES 
    (101, 'AICTE National Innovation Conclave 2026', 'National level symposium showcasing innovative student projects, patent guidance, and entrepreneurship pitch sessions evaluated by angel investors.', '/uploads/symposium.jpg', 'internal', 'Symposium', 'FX Innovation Hub & Auditorium', 'FXEC Institution Innovation Council', '2026-10-05 10:00:00', '2026-10-01 18:00:00', '2026-10-28 23:59:59', 120, 80, 1),
    (102, 'Web3 & Cloud DevFest 2026', 'Hands-on bootcamp on modern decentralized applications, AWS cloud-native serverless architecture, and distributed ledger fundamentals with industry mentors.', '/uploads/workshop.jpg', 'internal', 'Workshop', 'Lab 2, Department of IT', 'Google Developer Student Clubs & Department of IT', '2026-10-12 09:30:00', '2026-10-08 17:00:00', '2026-10-31 23:59:59', 60, 50, 1)
    ON DUPLICATE KEY UPDATE 
      title = VALUES(title),
      certificate_deadline = VALUES(certificate_deadline);
  `);

  // 2. Insert student users across departments and cohorts
  const students = [
    { name: 'Aravind Kumar', email: 'aravind.ug.26.cse@francisxavier.ac.in', dept: 'cse', adm: 2026, year: 1, sec: 'A', reg: '953626104012' },
    { name: 'Priya Dharshini', email: 'priya.ug.25.it@francisxavier.ac.in', dept: 'it', adm: 2025, year: 2, sec: 'B', reg: '953625205045' },
    { name: 'Muthu Krishnan', email: 'muthu.ug.25.ece@francisxavier.ac.in', dept: 'ece', adm: 2025, year: 2, sec: 'A', reg: '953625106023' },
    { name: 'Siva Ranjani', email: 'siva.ug.24.mech@francisxavier.ac.in', dept: 'mech', adm: 2024, year: 3, sec: 'A', reg: '953624114008' },
    { name: 'Dinesh Karthik', email: 'dinesh.ug.24.eee@francisxavier.ac.in', dept: 'eee', adm: 2024, year: 3, sec: 'B', reg: '953624105019' },
    { name: 'Ananya Sharma', email: 'ananya.ug.23.cse@francisxavier.ac.in', dept: 'cse', adm: 2023, year: 4, sec: 'A', reg: '953623104005' },
    { name: 'Vigneshwaran R', email: 'vignesh.ug.23.it@francisxavier.ac.in', dept: 'it', adm: 2023, year: 4, sec: 'A', reg: '953623205088' },
    { name: 'Kavitha S', email: 'kavitha.ug.26.it@francisxavier.ac.in', dept: 'it', adm: 2026, year: 1, sec: 'B', reg: '953626205011' }
  ];

  const userIds = {};

  for (const s of students) {
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, department_code, admission_year, study_level, section, register_number)
      VALUES (?, ?, ?, 'student', ?, ?, 'ug', ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), department_code = VALUES(department_code);
    `, [s.name, s.email, defaultPasswordHash, s.dept, s.adm, s.sec, s.reg]);

    const [[u]] = await pool.query('SELECT id FROM users WHERE email = ?', [s.email]);
    userIds[s.email] = u.id;
  }

  // 3. Stage 1: Registered with screenshot proof (waiting for admin to verify screenshot)
  const registeredWithProof = [
    { eventId: 1, email: 'aravind.ug.26.cse@francisxavier.ac.in', name: 'Aravind Kumar', dept: 'cse', adm: 2026, year: 1, sec: 'A', reg: '953626104012' },
    { eventId: 1, email: 'priya.ug.25.it@francisxavier.ac.in', name: 'Priya Dharshini', dept: 'it', adm: 2025, year: 2, sec: 'B', reg: '953625205045' },
    { eventId: 2, email: 'ananya.ug.23.cse@francisxavier.ac.in', name: 'Ananya Sharma', dept: 'cse', adm: 2023, year: 4, sec: 'A', reg: '953623104005' }
  ];

  for (const r of registeredWithProof) {
    await pool.query(`
      INSERT INTO registration_requests (
        event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, 
        status, registration_screenshot, screenshot_uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', '/uploads/proof-sample.jpg', NOW())
      ON DUPLICATE KEY UPDATE 
        status = 'registered',
        registration_screenshot = '/uploads/proof-sample.jpg',
        screenshot_uploaded_at = NOW();
    `, [r.eventId, userIds[r.email], r.name, r.dept, r.sec, r.reg, r.email, r.adm, r.year]);
  }

  // 4. Stage 1: Registered WITHOUT screenshot (waiting for student to upload screenshot)
  const registeredWithoutProof = [
    { eventId: 1, email: 'muthu.ug.25.ece@francisxavier.ac.in', name: 'Muthu Krishnan', dept: 'ece', adm: 2025, year: 2, sec: 'A', reg: '953625106023' },
    { eventId: 2, email: 'vignesh.ug.23.it@francisxavier.ac.in', name: 'Vigneshwaran R', dept: 'it', adm: 2023, year: 4, sec: 'A', reg: '953623205088' }
  ];

  for (const r of registeredWithoutProof) {
    await pool.query(`
      INSERT INTO registration_requests (
        event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, 
        status, registration_screenshot, screenshot_uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', NULL, NULL)
      ON DUPLICATE KEY UPDATE 
        status = 'registered',
        registration_screenshot = NULL;
    `, [r.eventId, userIds[r.email], r.name, r.dept, r.sec, r.reg, r.email, r.adm, r.year]);
  }

  // 5. Stage 2: Registration Approved (Seat confirmed, event upcoming)
  const approvedRegistrations = [
    { eventId: 1, email: 'siva.ug.24.mech@francisxavier.ac.in', name: 'Siva Ranjani', dept: 'mech', adm: 2024, year: 3, sec: 'A', reg: '953624114008' },
    { eventId: 2, email: 'dinesh.ug.24.eee@francisxavier.ac.in', name: 'Dinesh Karthik', dept: 'eee', adm: 2024, year: 3, sec: 'B', reg: '953624105019' }
  ];

  for (const r of approvedRegistrations) {
    await pool.query(`
      INSERT INTO registration_requests (
        event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, 
        status, registration_screenshot, screenshot_uploaded_at, reviewed_by, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registration_approved', '/uploads/proof-sample.jpg', NOW(), 1, NOW())
      ON DUPLICATE KEY UPDATE 
        status = 'registration_approved',
        registration_screenshot = '/uploads/proof-sample.jpg',
        reviewed_by = 1,
        reviewed_at = NOW();
    `, [r.eventId, userIds[r.email], r.name, r.dept, r.sec, r.reg, r.email, r.adm, r.year]);
  }

  // 6. Stage 3: Participated (Certificate uploaded, awaiting admin ranking)
  const participatedPendingRanking = [
    { eventId: 101, email: 'kavitha.ug.26.it@francisxavier.ac.in', name: 'Kavitha S', dept: 'it', adm: 2026, year: 1, sec: 'B', reg: '953626205011' },
    { eventId: 102, email: 'muthu.ug.25.ece@francisxavier.ac.in', name: 'Muthu Krishnan', dept: 'ece', adm: 2025, year: 2, sec: 'A', reg: '953625106023' }
  ];

  for (const r of participatedPendingRanking) {
    await pool.query(`
      INSERT INTO registration_requests (
        event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, 
        status, registration_screenshot, screenshot_uploaded_at, certificate_url, certificate_uploaded_at,
        reviewed_by, reviewed_at, attended
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'participated', '/uploads/proof-sample.jpg', NOW(), '/uploads/cert-sample.jpg', NOW(), 1, NOW(), 1)
      ON DUPLICATE KEY UPDATE 
        status = 'participated',
        certificate_url = '/uploads/cert-sample.jpg',
        certificate_uploaded_at = NOW(),
        attended = 1;
    `, [r.eventId, userIds[r.email], r.name, r.dept, r.sec, r.reg, r.email, r.adm, r.year]);
  }

  // 7. Stage 4: Ranked & Awarded (Ranks 1, 2, 3, and Participated)
  const rankedAwards = [
    { 
      eventId: 101, 
      email: 'aravind.ug.26.cse@francisxavier.ac.in', 
      name: 'Aravind Kumar', 
      dept: 'cse', 
      adm: 2026, 
      year: 1, 
      sec: 'A', 
      reg: '953626104012',
      rank: '1',
      points: 130, // 80 base + 50 bonus
      note: 'Winner of 1st Prize for Outstanding AI Innovation'
    },
    { 
      eventId: 101, 
      email: 'priya.ug.25.it@francisxavier.ac.in', 
      name: 'Priya Dharshini', 
      dept: 'it', 
      adm: 2025, 
      year: 2, 
      sec: 'B', 
      reg: '953625205045',
      rank: '2',
      points: 110, // 80 base + 30 bonus
      note: 'Runner Up - 2nd Prize in Project Pitch'
    },
    { 
      eventId: 102, 
      email: 'ananya.ug.23.cse@francisxavier.ac.in', 
      name: 'Ananya Sharma', 
      dept: 'cse', 
      adm: 2023, 
      year: 4, 
      sec: 'A', 
      reg: '953623104005',
      rank: '3',
      points: 70, // 50 base + 20 bonus
      note: '3rd Place in Web3 Smart Contract Deployment'
    },
    { 
      eventId: 102, 
      email: 'vignesh.ug.23.it@francisxavier.ac.in', 
      name: 'Vigneshwaran R', 
      dept: 'it', 
      adm: 2023, 
      year: 4, 
      sec: 'A', 
      reg: '953623205088',
      rank: 'participated',
      points: 50, // 50 base
      note: 'Verified Participation & Active Completion'
    }
  ];

  for (const r of rankedAwards) {
    const userId = userIds[r.email];
    await pool.query(`
      INSERT INTO registration_requests (
        event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, 
        status, registration_screenshot, screenshot_uploaded_at, certificate_url, certificate_uploaded_at,
        rank_position, rank_points_awarded, ranked_by, ranked_at, reviewed_by, reviewed_at, attended, admin_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ranked', '/uploads/proof-sample.jpg', NOW(), '/uploads/cert-sample.jpg', NOW(), ?, ?, 1, NOW(), 1, NOW(), 1, ?)
      ON DUPLICATE KEY UPDATE 
        status = 'ranked',
        rank_position = VALUES(rank_position),
        rank_points_awarded = VALUES(rank_points_awarded),
        ranked_by = 1,
        ranked_at = NOW(),
        attended = 1,
        admin_note = VALUES(admin_note);
    `, [r.eventId, userId, r.name, r.dept, r.sec, r.reg, r.email, r.adm, r.year, r.rank, r.points, r.note]);

    // Update student's profile points and points_log
    await pool.query('UPDATE users SET total_points = ? WHERE id = ?', [r.points, userId]);
    await pool.query('DELETE FROM points_log WHERE user_id = ? AND event_id = ?', [userId, r.eventId]);
    await pool.query(`
      INSERT INTO points_log (user_id, event_id, points, reason)
      VALUES (?, ?, ?, ?)
    `, [userId, r.eventId, r.points, `Rank ${r.rank.toUpperCase()} Award: ${r.note}`]);
  }

  console.log('Seeded 4-stage registration requests, certificates, and ranked awards successfully!');
  process.exit(0);
}

seedTestData().catch(err => {
  console.error(err);
  process.exit(1);
});
