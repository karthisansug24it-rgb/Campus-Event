const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSeed() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'campus_events';

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@francisxavier.ac.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Admin FXEC';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  let connection;
  try {
    // 1. Connect without selecting database first to ensure database exists
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log(`Creating database "${database}" if not exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${database}\`;`);

    // 2. Read and run schema.sql
    console.log('Applying database schema (schema.sql)...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log('Schema applied successfully.');

    // 3. Insert / update departments
    console.log('Seeding departments...');
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
      await connection.query(
        'INSERT INTO departments (code, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
        [code, name]
      );
    }

    // 4. Seed admin user with dynamic bcrypt hash
    console.log(`Seeding admin user (${adminEmail})...`);
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, department_code, admission_year, study_level, section, register_number)
       VALUES (?, ?, ?, 'admin', 'cse', 2020, 'ug', 'A', '950720104001')
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin'`,
      [adminName, adminEmail, adminHash]
    );

    // 5. Seed sample student
    console.log('Seeding sample student (karthisans.ug.24.it@francisxavier.ac.in)...');
    const studentHash = await bcrypt.hash('Student@123', 10);
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, department_code, admission_year, study_level, section, register_number, total_points)
       VALUES ('Karthisan S', 'karthisans.ug.24.it@francisxavier.ac.in', ?, 'student', 'it', 2024, 'ug', 'A', '950724104042', 25)
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'student'`,
      [studentHash]
    );

    // 6. Seed sample events
    console.log('Seeding sample events...');
    const [adminRow] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    const adminId = adminRow[0]?.id || 1;

    const sampleEvents = [
      {
        id: 1,
        title: 'HackFX 2026: 24-Hour National Hackathon',
        description: 'Flagship annual hackathon at FXEC! Build innovative AI, IoT, and Web3 solutions to real-world industrial and societal problems. Cash prizes up to Rs. 50,000, internship opportunities, and mentorship from top industry leaders. Food and refreshments provided.',
        poster_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
        event_type: 'internal',
        category: 'Hackathon',
        venue: 'FXEC Central Auditorium & Innovation Lab',
        organizer: 'Department of Information Technology & IIC',
        daysAhead: 7,
        deadlineDaysAhead: 5,
        max_seats: 120,
        reward_points: 50,
        external_link: 'https://francisxavier.ac.in/hackfx'
      },
      {
        id: 2,
        title: 'Hands-on Workshop: Modern Full-Stack Development with React & Node',
        description: 'A rigorous 2-day technical workshop covering Vite, React 19, Express, MySQL optimization, RESTful API architecture, and cloud deployment on AWS/Vercel. Bring your laptops.',
        poster_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        event_type: 'internal',
        category: 'Workshop',
        venue: 'Turing Computer Center - Lab 3',
        organizer: 'FXEC Coding Club & CSI Student Chapter',
        daysAhead: 12,
        deadlineDaysAhead: 10,
        max_seats: 60,
        reward_points: 30,
        external_link: null
      },
      {
        id: 3,
        title: 'National Technical Symposium: INNOVISION 2026',
        description: 'Annual inter-college symposium featuring Paper Presentation, Code Debugging, Web Design, Robo Race, and Project Display. Exciting trophies and certificates for all participants.',
        poster_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        event_type: 'internal',
        category: 'Seminar',
        venue: 'Mechanical Seminar Hall & Open Stage',
        organizer: 'Department of CSE & ECE',
        daysAhead: 18,
        deadlineDaysAhead: 14,
        max_seats: 250,
        reward_points: 20,
        external_link: 'https://francisxavier.ac.in/innovision'
      },
      {
        id: 4,
        title: 'Smart India Hackathon 2026 - Regional Finale',
        description: 'Premier national level competition conducted by MoE. FXEC teams selected for the regional rounds will represent our college at Anna University Regional Center.',
        poster_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
        event_type: 'external',
        category: 'Hackathon',
        venue: 'Anna University Regional Campus, Tirunelveli',
        organizer: 'Ministry of Education & FXEC EDC Cell',
        daysAhead: 25,
        deadlineDaysAhead: 20,
        max_seats: 20,
        reward_points: 100,
        external_link: 'https://sih.gov.in'
      },
      {
        id: 5,
        title: 'Guest Lecture: Frontiers in Generative AI & LLM Systems',
        description: 'Distinguished lecture delivered by Dr. Arvind Ramanathan, Principal AI Research Scientist. Deep dive into transformer models, retrieval-augmented generation (RAG), and responsible AI.',
        poster_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        event_type: 'internal',
        category: 'Seminar',
        venue: 'APJ Abdul Kalam Conference Hall',
        organizer: 'Department of AI & DS',
        daysAhead: 4,
        deadlineDaysAhead: 2,
        max_seats: 150,
        reward_points: 15,
        external_link: null
      },
      {
        id: 6,
        title: 'DHWANI 2026 - Intra-College Cultural Extravaganza',
        description: 'Showcase your artistic flair in Solo & Group Dance, Western & Classical Music, Theatrics, Photography, and Fine Arts. Celebrate college spirit and creativity.',
        poster_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
        event_type: 'internal',
        category: 'Cultural',
        venue: 'FXEC Open Air Amphitheatre',
        organizer: 'FXEC Fine Arts Club',
        daysAhead: 30,
        deadlineDaysAhead: 24,
        max_seats: 500,
        reward_points: 10,
        external_link: null
      }
    ];

    for (const ev of sampleEvents) {
      await connection.query(
        `INSERT INTO events (id, title, description, poster_url, event_type, category, venue, organizer, event_date, registration_deadline, max_seats, reward_points, external_link, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           poster_url = VALUES(poster_url),
           event_type = VALUES(event_type),
           category = VALUES(category),
           venue = VALUES(venue),
           organizer = VALUES(organizer),
           max_seats = VALUES(max_seats),
           reward_points = VALUES(reward_points),
           external_link = VALUES(external_link)`,
        [
          ev.id,
          ev.title,
          ev.description,
          ev.poster_url,
          ev.event_type,
          ev.category,
          ev.venue,
          ev.organizer,
          ev.daysAhead,
          ev.deadlineDaysAhead,
          ev.max_seats,
          ev.reward_points,
          ev.external_link,
          adminId
        ]
      );
    }

    console.log('Seed completed successfully!');
    console.log(`===============================================`);
    console.log(`Admin account: ${adminEmail}`);
    console.log(`Admin password: ${adminPassword}`);
    console.log(`Sample student: karthisans.ug.24.it@francisxavier.ac.in (Student@123)`);
    console.log(`===============================================`);
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runSeed();
