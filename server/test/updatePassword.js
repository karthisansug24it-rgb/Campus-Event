const mysql = require('mysql2/promise');

async function setPassword() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: ''
    });
    await conn.query("ALTER USER 'root'@'localhost' IDENTIFIED BY 'admin@123';");
    await conn.query("FLUSH PRIVILEGES;");
    await conn.end();
    console.log("Successfully set MySQL root password to 'admin@123'");
  } catch (err) {
    console.log("Empty password connect failed (might already have password):", err.message);
  }
}

setPassword();
