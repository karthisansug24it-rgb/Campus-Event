const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seedTestData() {
  console.log('Seeding test past events and diverse student registration requests...');
  
  // 1. Insert 2 past events
  const defaultPasswordHash = await bcrypt.hash('Student@123', 10);
  
  await pool.query(`
    INSERT INTO events (id, title, description, poster_url, event_type, category, venue, organizer, event_date, registration_deadline, max_seats, reward_points, created_by)
    VALUES 
    (101, 'AICTE National Innovation Conclave 2026', 'National level symposium showcasing innovative student projects, patent guidance, and entrepreneurship pitch sessions evaluated by angel investors.', '/uploads/symposium.jpg', 'internal', 'Symposium', 'FX Innovation Hub & Auditorium', 'FXEC Institution Innovation Council', '2026-10-05 10:00:00', '2026-10-01 18:00:00', 120, 80, 1),
    (102, 'Web3 & Cloud DevFest 2026', 'Hands-on bootcamp on modern decentralized applications, AWS cloud-native serverless architecture, and distributed ledger fundamentals with industry mentors.', '/uploads/workshop.jpg', 'internal', 'Workshop', 'Lab 2, Department of IT', 'Google Developer Student Clubs & Department of IT', '2026-10-12 09:30:00', '2026-10-08 17:00:00', 60, 50, 1)
    ON DUPLICATE KEY UPDATE title = VALUES(title);
  `);

  // 2. Insert student users across departments and years
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

  // 3. Insert registration requests for upcoming events (Pending for testing filters & Accept All / Reject All)
  const pendingRequests = [
    { eventId: 1, email: 'aravind.ug.26.cse@francisxavier.ac.in', name: 'Aravind Kumar', dept: 'cse', adm: 2026, year: 1, sec: 'A', reg: '953626104012' },
    { eventId: 1, email: 'priya.ug.25.it@francisxavier.ac.in', name: 'Priya Dharshini', dept: 'it', adm: 2025, year: 2, sec: 'B', reg: '953625205045' },
    { eventId: 1, email: 'muthu.ug.25.ece@francisxavier.ac.in', name: 'Muthu Krishnan', dept: 'ece', adm: 2025, year: 2, sec: 'A', reg: '953625106023' },
    { eventId: 1, email: 'siva.ug.24.mech@francisxavier.ac.in', name: 'Siva Ranjani', dept: 'mech', adm: 2024, year: 3, sec: 'A', reg: '953624114008' },
    { eventId: 1, email: 'dinesh.ug.24.eee@francisxavier.ac.in', name: 'Dinesh Karthik', dept: 'eee', adm: 2024, year: 3, sec: 'B', reg: '953624105019' },
    { eventId: 2, email: 'ananya.ug.23.cse@francisxavier.ac.in', name: 'Ananya Sharma', dept: 'cse', adm: 2023, year: 4, sec: 'A', reg: '953623104005' },
    { eventId: 2, email: 'vignesh.ug.23.it@francisxavier.ac.in', name: 'Vigneshwaran R', dept: 'it', adm: 2023, year: 4, sec: 'A', reg: '953623205088' },
    { eventId: 2, email: 'kavitha.ug.26.it@francisxavier.ac.in', name: 'Kavitha S', dept: 'it', adm: 2026, year: 1, sec: 'B', reg: '953626205011' }
  ];

  for (const pr of pendingRequests) {
    const userId = userIds[pr.email];
    await pool.query(`
      INSERT INTO registration_requests (event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      ON DUPLICATE KEY UPDATE status = 'pending';
    `, [pr.eventId, userId, pr.name, pr.dept, pr.sec, pr.reg, pr.email, pr.adm, pr.year]);
  }

  // 4. Insert registration requests for PAST events 101 and 102 (Approved & Attended)
  const pastRegistrations = [
    { eventId: 101, email: 'aravind.ug.26.cse@francisxavier.ac.in', name: 'Aravind Kumar', dept: 'cse', adm: 2026, year: 1, sec: 'A', reg: '953626104012', attended: 1 },
    { eventId: 101, email: 'priya.ug.25.it@francisxavier.ac.in', name: 'Priya Dharshini', dept: 'it', adm: 2025, year: 2, sec: 'B', reg: '953625205045', attended: 1 },
    { eventId: 101, email: 'muthu.ug.25.ece@francisxavier.ac.in', name: 'Muthu Krishnan', dept: 'ece', adm: 2025, year: 2, sec: 'A', reg: '953625106023', attended: 0 },
    { eventId: 102, email: 'ananya.ug.23.cse@francisxavier.ac.in', name: 'Ananya Sharma', dept: 'cse', adm: 2023, year: 4, sec: 'A', reg: '953623104005', attended: 1 },
    { eventId: 102, email: 'vignesh.ug.23.it@francisxavier.ac.in', name: 'Vigneshwaran R', dept: 'it', adm: 2023, year: 4, sec: 'A', reg: '953623205088', attended: 1 }
  ];

  for (const pr of pastRegistrations) {
    const userId = userIds[pr.email];
    await pool.query(`
      INSERT INTO registration_requests (event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, status, reviewed_by, reviewed_at, attended)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, '2026-10-02 12:00:00', ?)
      ON DUPLICATE KEY UPDATE status = 'approved', attended = VALUES(attended);
    `, [pr.eventId, userId, pr.name, pr.dept, pr.sec, pr.reg, pr.email, pr.adm, pr.year, pr.attended]);
  }

  console.log('Test data successfully seeded!');
  process.exit(0);
}

seedTestData().catch(err => {
  console.error(err);
  process.exit(1);
});
