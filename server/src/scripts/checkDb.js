const { pool } = require('../config/db');

async function checkDatabase() {
  console.log('\n===============================================================');
  console.log('       CAMPUS EVENT MANAGEMENT SYSTEM - DATABASE STATUS        ');
  console.log('===============================================================\n');

  try {
    // 1. Table Counts
    const [counts] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM departments) AS departments,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM events) AS events,
        (SELECT COUNT(*) FROM registration_requests) AS requests,
        (SELECT COUNT(*) FROM points_log) AS points_logs
    `);
    console.log('📊 Table Record Summary:');
    console.table(counts);

    // 2. Events List
    const [events] = await pool.query(`
      SELECT id, title, category, event_type, max_seats, reward_points, event_date 
      FROM events 
      ORDER BY id ASC
    `);
    console.log('\n📅 Events:');
    console.table(events);

    // 3. Registered Users
    const [users] = await pool.query(`
      SELECT id, name, email, role, department_code, total_points, created_at 
      FROM users 
      ORDER BY id ASC
    `);
    console.log('\n👥 Users:');
    console.table(users);

    // 4. Registration Requests
    const [requests] = await pool.query(`
      SELECT rr.id, rr.event_id, e.title AS event_title, rr.name AS student_name, rr.email, rr.status, rr.created_at
      FROM registration_requests rr
      LEFT JOIN events e ON rr.event_id = e.id
      ORDER BY rr.id DESC
      LIMIT 10
    `);
    console.log('\n📝 Recent Registration Requests:');
    console.table(requests);

    console.log('\n===============================================================\n');
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
