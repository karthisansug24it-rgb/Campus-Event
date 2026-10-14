const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
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
  namedPlaceholders: false
});

// Test database connection helper
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected successfully to MySQL database "${process.env.DB_NAME || 'campus_events'}"`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection
};
