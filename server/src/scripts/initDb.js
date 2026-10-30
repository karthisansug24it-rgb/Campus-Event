const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'campus_events';

async function initDatabase() {
  console.log('----------------------------------------------------');
  console.log(`[Database Init] Connecting to MySQL at ${host}:${port}...`);
  
  // Step 1: Connect without selecting a database
  const rootConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    charset: 'utf8mb4'
  });

  try {
    console.log(`[Database Init] Ensuring database "${dbName}" exists...`);
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  } finally {
    await rootConn.end();
  }

  // Step 2: Connect to the specific database with multipleStatements allowed for schema
  const dbConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  try {
    console.log(`[Database Init] Executing schema.sql...`);
    const schemaPath = path.join(__dirname, '../../sql/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await dbConn.query(schemaSql);
    console.log(`[Database Init] Schema created successfully.`);

    // Step 3: Seed Departments
    console.log(`[Database Init] Seeding departments...`);
    const departments = [
      ['it', 'Information Technology'],
      ['cse', 'Computer Science and Engineering'],
      ['ece', 'Electronics and Communication Engineering'],
      ['eee', 'Electrical and Electronics Engineering'],
      ['mech', 'Mechanical Engineering'],
      ['civil', 'Civil Engineering'],
      ['aids', 'Artificial Intelligence and Data Science'],
      ['bme', 'Biomedical Engineering']
    ];

    for (const [code, name] of departments) {
      await dbConn.execute(
        `INSERT INTO departments (code, name) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [code, name]
      );
    }
    console.log(`[Database Init] Seeded ${departments.length} departments.`);

    // Step 4: Seed Admin User from .env
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@francisxavier.ac.in').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'FXEC Event Admin';
    const adminHash = bcrypt.hashSync(adminPassword, 10);

    await dbConn.execute(
      `INSERT INTO users (id, name, email, password_hash, role, department_code, total_points)
       VALUES (1, ?, ?, ?, 'admin', 'it', 0)
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin'`,
      [adminName, adminEmail, adminHash]
    );
    console.log(`[Database Init] Seeded Admin account: ${adminEmail} (password: ${adminPassword})`);

    // Step 4b: Seed Faculty / Department Admin Accounts
    const facultyList = [
      { id: 201, name: 'Dr. David Ayling', email: 'davidayling@francisxavier.ac.in', dept: 'cse' },
      { id: 202, name: 'HOD - Information Technology', email: 'ithod@francisxavier.ac.in', dept: 'it' }
    ];

    for (const f of facultyList) {
      await dbConn.execute(
        `INSERT INTO users (id, name, email, password_hash, role, department_code, total_points)
         VALUES (?, ?, ?, ?, 'admin', ?, 0)
         ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin', department_code = VALUES(department_code)`,
        [f.id, f.name, f.email, adminHash, f.dept]
      );
      console.log(`[Database Init] Seeded Faculty/Admin account: ${f.email} (password: ${adminPassword})`);
    }

    // Step 5: Seed Sample Student User
    const studentEmail = 'karthisans.ug.24.it@francisxavier.ac.in';
    const studentPassword = 'Student@123';
    const studentHash = bcrypt.hashSync(studentPassword, 10);

    await dbConn.execute(
      `INSERT INTO users (id, name, email, password_hash, role, department_code, admission_year, study_level, section, register_number, total_points)
       VALUES (2, 'Karthisans', ?, ?, 'student', 'it', 2024, 'ug', 'A', '953624104001', 50)
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)`,
      [studentEmail, studentHash]
    );
    console.log(`[Database Init] Seeded Student account: ${studentEmail} (password: ${studentPassword})`);

    // Step 6: Seed Sample Events
    console.log(`[Database Init] Seeding sample events...`);
    const events = [
      [
        1,
        'Smart City Hackathon 2026',
        'A 24-hour flagship hackathon designed to solve urban mobility, clean energy, and smart campus challenges. Build real-time IoT and AI prototypes with industry mentorship, cloud credits, and cash prizes.',
        '/uploads/hackathon.jpg',
        'internal',
        'Hackathon',
        'Campus Auditorium & FX Innovation Hub',
        'FXEC Department of Information Technology & IEEE Student Branch',
        '2026-11-15 09:00:00',
        '2026-11-10 23:59:59',
        80,
        100,
        'https://francisxavier.ac.in/events/hackathon2026',
        1
      ],
      [
        2,
        'Hands-on GenAI & Full-Stack Workshop',
        'Deep dive into Large Language Models, prompt engineering, vector databases, and modern full-stack deployment with React and Node.js. Practical exercises with attendance certificates.',
        '/uploads/workshop.jpg',
        'internal',
        'Workshop',
        'Lab 3, Department of CSE & IT',
        'CSI Student Chapter & FXEC Centre for Applied AI',
        '2026-11-05 10:00:00',
        '2026-11-02 18:00:00',
        50,
        50,
        null,
        1
      ],
      [
        3,
        'National Robotics & Automation Conference',
        'Premier state-level conference featuring line follower bots, drone obstacle navigation, CAD modeling sprints, and tech paper presentations evaluated by leading industry experts.',
        '/uploads/symposium.jpg',
        'external',
        'Conference',
        'Anna University Regional Campus Conference Hall',
        'State Board of Technical Education & Robotics Guild',
        '2026-11-20 09:30:00',
        '2026-11-12 17:00:00',
        40,
        75,
        'https://symposium.techconnect.org',
        1
      ],
      [
        4,
        'Dhwani 2026 - National Tech & Research Conference',
        'Annual premier collegiate conference bringing together keynote sessions, research presentations, technological exhibits, and student innovation awards.',
        '/uploads/cultural.jpg',
        'internal',
        'Conference',
        'Open Air Amphitheatre, FXEC Campus',
        'FXEC Student Council & Research Cell',
        '2026-11-28 17:00:00',
        '2026-11-22 23:59:59',
        250,
        30,
        null,
        1
      ],
      [
        5,
        'South Zone Cloud Computing & DevOps Workshop',
        'Compete and collaborate in hands-on cloud architecture sprints. Master Docker, Kubernetes, and CI/CD pipelines with industry cloud architects.',
        '/uploads/sports.jpg',
        'external',
        'Workshop',
        'District Technology & Computing Center',
        'Regional Cloud Computing & DevOps Chapter',
        '2026-12-02 08:00:00',
        '2026-11-25 18:00:00',
        25,
        60,
        'https://workshop.fxec.ac.in',
        1
      ]
    ];

    for (const ev of events) {
      await dbConn.execute(
        `INSERT INTO events (id, title, description, poster_url, event_type, category, venue, organizer, event_date, registration_deadline, max_seats, reward_points, external_link, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), poster_url = VALUES(poster_url)`,
        ev
      );
    }
    console.log(`[Database Init] Seeded ${events.length} sample events.`);

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate clean visual SVGs for sample event posters
    const samplePosters = [
      { name: 'sample-hackathon.svg', title: 'FX HACKATHON 2026', subtitle: 'Smart City & AI Solutions', color1: '#1E3A8A', color2: '#3B82F6', icon: '💻' },
      { name: 'sample-workshop.svg', title: 'GEN-AI WORKSHOP', subtitle: 'Hands-on Full-Stack & LLMs', color1: '#0F766E', color2: '#14B8A6', icon: '🤖' },
      { name: 'sample-symposium.svg', title: 'ROBOTICS SYMPOSIUM', subtitle: 'Automation & Drone Tech', color1: '#4338CA', color2: '#6366F1', icon: '⚙️' },
      { name: 'sample-cultural.svg', title: 'DHWANI CULTURAL FEST', subtitle: 'Music, Dance & Drama', color1: '#BE185D', color2: '#EC4899', icon: '🎭' },
      { name: 'sample-sports.svg', title: 'BASKETBALL TOURNEY', subtitle: 'South Zone Championship', color1: '#C2410C', color2: '#F97316', icon: '🏀' }
    ];

    for (const p of samplePosters) {
      const pPath = path.join(uploadsDir, p.name);
      if (!fs.existsSync(pPath)) {
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${p.color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${p.color2};stop-opacity:1" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" />
  <rect width="100%" height="100%" fill="url(#grid)" />
  <circle cx="700" cy="100" r="180" fill="white" opacity="0.05" />
  <circle cx="100" cy="400" r="120" fill="white" opacity="0.05" />
  
  <text x="60" y="80" font-family="Georgia, serif" font-size="20" font-weight="700" fill="#93C5FD" letter-spacing="3">FRANCIS XAVIER ENGINEERING COLLEGE</text>
  <text x="60" y="240" font-family="Georgia, serif" font-size="52" font-weight="900" fill="#FFFFFF">${p.title}</text>
  <text x="60" y="295" font-family="Georgia, serif" font-size="24" font-weight="500" fill="#E2E8F0">${p.subtitle}</text>
  
  <rect x="60" y="340" width="220" height="44" rx="22" fill="rgba(255,255,255,0.2)" />
  <text x="170" y="368" font-family="Georgia, serif" font-size="16" font-weight="600" fill="#FFFFFF" text-anchor="middle">Official Campus Event</text>
</svg>`;
        fs.writeFileSync(pPath, svgContent, 'utf8');
      }
    }
    console.log(`[Database Init] Sample visual posters generated in ${uploadsDir}`);

    // Sync uploads to client/public/uploads for direct client serving
    const clientPublicUploads = path.join(__dirname, '../../../client/public/uploads');
    if (!fs.existsSync(clientPublicUploads)) {
      fs.mkdirSync(clientPublicUploads, { recursive: true });
    }
    const uploadedFiles = fs.readdirSync(uploadsDir);
    for (const f of uploadedFiles) {
      fs.copyFileSync(path.join(uploadsDir, f), path.join(clientPublicUploads, f));
    }
    console.log(`[Database Init] Synced ${uploadedFiles.length} poster files to ${clientPublicUploads}`);

    console.log('----------------------------------------------------');
    console.log('[Database Init] Database initialization completed successfully!');
    console.log('----------------------------------------------------');
  } finally {
    await dbConn.end();
  }
}

initDatabase().catch(err => {
  console.error('[Database Init] Error initializing database:', err);
  process.exit(1);
});
