const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_events',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+05:30',
  dateStrings: true
};

let mysqlPool = null;
let useFallback = false;
let sqliteDb = null;

// Initialize native SQLite fallback instance if MySQL is offline
function getSqliteDb() {
  if (sqliteDb) return sqliteDb;

  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.join(__dirname, '..', '..', 'campus_events.sqlite');
  sqliteDb = new DatabaseSync(dbPath);

  // Initialize tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      department_code TEXT NULL,
      admission_year INTEGER NULL,
      study_level TEXT NULL,
      section TEXT NULL,
      register_number TEXT NULL,
      total_points INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      poster_url TEXT NULL,
      event_type TEXT NOT NULL DEFAULT 'internal',
      category TEXT NOT NULL DEFAULT 'Workshop',
      venue TEXT NOT NULL,
      organizer TEXT NOT NULL,
      event_date DATETIME NOT NULL,
      registration_deadline DATETIME NOT NULL,
      max_seats INTEGER NULL,
      reward_points INTEGER NOT NULL DEFAULT 0,
      external_link TEXT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registration_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      department_code TEXT NOT NULL,
      section TEXT NOT NULL,
      register_number TEXT NOT NULL,
      email TEXT NOT NULL,
      admission_year INTEGER NOT NULL,
      year_of_study INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT NULL,
      reviewed_by INTEGER NULL,
      reviewed_at DATETIME NULL,
      attended INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS points_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NULL,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default departments if empty
  const deptCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM departments').get().c;
  if (deptCount === 0) {
    const insertDept = sqliteDb.prepare('INSERT OR IGNORE INTO departments (code, name) VALUES (?, ?)');
    const depts = [
      ['it', 'Information Technology'],
      ['cse', 'Computer Science and Engineering'],
      ['ece', 'Electronics and Communication Engineering'],
      ['eee', 'Electrical and Electronics Engineering'],
      ['mech', 'Mechanical Engineering'],
      ['civil', 'Civil Engineering'],
      ['aids', 'Artificial Intelligence and Data Science'],
      ['bme', 'Biomedical Engineering']
    ];
    for (const [code, name] of depts) {
      insertDept.run(code, name);
    }
  }

  // Seed admin user if not present
  const adminCount = sqliteDb.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
  if (adminCount === 0) {
    const adminPassHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
    const insertAdmin = sqliteDb.prepare(`
      INSERT INTO users (name, email, password_hash, role, department_code, admission_year, study_level, section, register_number)
      VALUES (?, ?, ?, 'admin', 'cse', 2020, 'ug', 'A', '950720104001')
    `);
    insertAdmin.run(
      process.env.ADMIN_NAME || 'Admin FXEC',
      process.env.ADMIN_EMAIL || 'admin@francisxavier.ac.in',
      adminPassHash
    );

    // Seed student user
    const studentPassHash = bcrypt.hashSync('Student@123', 10);
    const insertStudent = sqliteDb.prepare(`
      INSERT INTO users (name, email, password_hash, role, department_code, admission_year, study_level, section, register_number, total_points)
      VALUES ('Karthisan S', 'karthisans.ug.24.it@francisxavier.ac.in', ?, 'student', 'it', 2024, 'ug', 'A', '950724104042', 25)
    `);
    insertStudent.run(studentPassHash);

    // Seed sample events
    const insertEvent = sqliteDb.prepare(`
      INSERT INTO events (id, title, description, poster_url, event_type, category, venue, organizer, event_date, registration_deadline, max_seats, reward_points, external_link, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' days'), datetime('now', '+' || ? || ' days'), ?, ?, ?, 1)
    `);

    const sampleEvents = [
      [
        1,
        'HackFX 2026: 24-Hour National Hackathon',
        'Flagship annual hackathon at FXEC! Build innovative AI, IoT, and Web3 solutions. Cash prizes up to Rs. 50,000, internship opportunities, and mentorship.',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
        'internal',
        'Hackathon',
        'FXEC Central Auditorium & Innovation Lab',
        'Department of Information Technology & IIC',
        7, 5, 120, 50, 'https://francisxavier.ac.in/hackfx'
      ],
      [
        2,
        'Hands-on Workshop: Modern Full-Stack Development with React & Node',
        'A rigorous 2-day technical workshop covering Vite, React 19, Express, MySQL optimization, RESTful API architecture, and cloud deployment.',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        'internal',
        'Workshop',
        'Turing Computer Center - Lab 3',
        'FXEC Coding Club & CSI Student Chapter',
        12, 10, 60, 30, null
      ],
      [
        3,
        'National Technical Symposium: INNOVISION 2026',
        'Annual inter-college symposium featuring Paper Presentation, Code Debugging, Web Design, Robo Race, and Project Display.',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        'internal',
        'Seminar',
        'Mechanical Seminar Hall & Open Stage',
        'Department of CSE & ECE',
        18, 14, 250, 20, 'https://francisxavier.ac.in/innovision'
      ],
      [
        4,
        'Smart India Hackathon 2026 - Regional Finale',
        'Premier national level competition conducted by MoE. FXEC teams selected for regional rounds will represent our college at Anna University.',
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
        'external',
        'Hackathon',
        'Anna University Regional Campus, Tirunelveli',
        'Ministry of Education & FXEC EDC Cell',
        25, 20, 20, 100, 'https://sih.gov.in'
      ],
      [
        5,
        'Guest Lecture: Frontiers in Generative AI & LLM Systems',
        'Distinguished lecture delivered by Dr. Arvind Ramanathan, Principal AI Research Scientist. Deep dive into transformer models and responsible AI.',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        'internal',
        'Seminar',
        'APJ Abdul Kalam Conference Hall',
        'Department of AI & DS',
        4, 2, 150, 15, null
      ]
    ];

    for (const ev of sampleEvents) {
      insertEvent.run(...ev);
    }

    // Seed sample request
    const insertReq = sqliteDb.prepare(`
      INSERT INTO registration_requests (id, event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, status, admin_note, reviewed_by, reviewed_at, attended)
      VALUES (1, 1, 2, 'Karthisan S', 'it', 'A', '950724104042', 'karthisans.ug.24.it@francisxavier.ac.in', 2024, 3, 'approved', 'Verified and confirmed seat.', 1, datetime('now'), 0)
    `);
    insertReq.run();
  }

  return sqliteDb;
}

// Convert MySQL SQL dialect to SQLite if using fallback
function adaptSql(sql) {
  let adapted = sql
    .replace(/\bNOW\(\)/gi, "datetime('now', 'localtime')")
    .replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s*\?\s*DAY\)/gi, "datetime('now', '+' || ? || ' days')")
    .replace(/\s+FOR\s+UPDATE/gi, '')
    .replace(/COALESCE\(section,\s*\?\)/gi, "CASE WHEN section IS NULL THEN ? ELSE section END")
    .replace(/COALESCE\(register_number,\s*\?\)/gi, "CASE WHEN register_number IS NULL THEN ? ELSE register_number END");
  return adapted;
}

function executeSqliteQuery(sql, params = []) {
  const db = getSqliteDb();
  const cleanSql = adaptSql(sql);
  const trimmed = cleanSql.trim().toUpperCase();

  // If transaction commands
  if (trimmed === 'BEGIN' || trimmed === 'START TRANSACTION') {
    db.exec('BEGIN TRANSACTION');
    return [{ affectedRows: 0 }, []];
  }
  if (trimmed === 'COMMIT') {
    db.exec('COMMIT');
    return [{ affectedRows: 0 }, []];
  }
  if (trimmed === 'ROLLBACK') {
    try { db.exec('ROLLBACK'); } catch {}
    return [{ affectedRows: 0 }, []];
  }

  const isSelect = trimmed.startsWith('SELECT');

  if (isSelect) {
    const stmt = db.prepare(cleanSql);
    const rows = stmt.all(...params);
    return [rows, []];
  } else {
    const stmt = db.prepare(cleanSql);
    const info = stmt.run(...params);
    return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }, []];
  }
}

// Unified Database Pool Proxy
const pool = {
  async query(sql, params = []) {
    if (useFallback) {
      return executeSqliteQuery(sql, params);
    }
    try {
      return await mysqlPool.query(sql, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        useFallback = true;
        console.warn('[DB Fallback] MySQL disconnected. Switched to local SQLite engine.');
        return executeSqliteQuery(sql, params);
      }
      throw err;
    }
  },

  async getConnection() {
    if (useFallback) {
      return {
        async query(sql, params = []) {
          return executeSqliteQuery(sql, params);
        },
        async beginTransaction() {
          executeSqliteQuery('BEGIN TRANSACTION');
        },
        async commit() {
          executeSqliteQuery('COMMIT');
        },
        async rollback() {
          executeSqliteQuery('ROLLBACK');
        },
        release() {}
      };
    }

    try {
      return await mysqlPool.getConnection();
    } catch (err) {
      useFallback = true;
      console.warn('[DB Fallback] MySQL connection failed. Switched to local SQLite engine.');
      return this.getConnection();
    }
  }
};

async function testConnection() {
  try {
    mysqlPool = mysql.createPool(dbConfig);
    const connection = await mysqlPool.getConnection();
    console.log(`[DB] Connected to MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    useFallback = false;
    return true;
  } catch (error) {
    useFallback = true;
    console.log(`[DB Notice] MySQL at ${dbConfig.host}:${dbConfig.port} is not running (${error.message}).`);
    console.log(`[DB Notice] Automatically activated built-in SQLite engine with pre-seeded Francis Xavier data.`);
    getSqliteDb();
    return true;
  }
}

module.exports = {
  pool,
  dbConfig,
  testConnection
};
