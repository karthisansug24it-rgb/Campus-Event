const mysql = require('mysql2/promise');

async function migrateData() {
  console.log('[MigrateToTiDB] Connecting to local MySQL and remote TiDB Cloud...');

  // Local MySQL connection
  const localPool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'admin123',
    database: 'campus_events',
    waitForConnections: true,
    connectionLimit: 5
  });

  // Remote TiDB Cloud connection
  const tidbPool = mysql.createPool({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'G6W4bWYgBpTZS6V.root',
    password: 'ktJnhjm589BCTdXo',
    database: 'campus_events',
    ssl: { rejectUnauthorized: true },
    waitForConnections: true,
    connectionLimit: 5
  });

  // 1. Get all table names in local database
  const [tables] = await localPool.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log('[MigrateToTiDB] Found local tables:', tableNames);

  // 2. Recreate schema for each table on TiDB Cloud
  await tidbPool.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of tableNames) {
    console.log(`[MigrateToTiDB] Creating table '${table}' on TiDB...`);
    const [createTableResult] = await localPool.query(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createTableResult[0]['Create Table'];
    
    await tidbPool.query(`DROP TABLE IF EXISTS \`${table}\``);
    await tidbPool.query(createSql);

    // 3. Copy rows
    const [rows] = await localPool.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      console.log(`[MigrateToTiDB] Copying ${rows.length} rows for table '${table}'...`);
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const insertSql = `INSERT INTO \`${table}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = columns.map(c => row[c]);
        await tidbPool.execute(insertSql, values);
      }
    } else {
      console.log(`[MigrateToTiDB] Table '${table}' is empty (0 rows).`);
    }
  }

  await tidbPool.query('SET FOREIGN_KEY_CHECKS = 1');

  // Verify migrated counts
  console.log('\n[MigrateToTiDB] --- VERIFYING ROW COUNTS ON TIDB CLOUD ---');
  for (const table of tableNames) {
    const [res] = await tidbPool.query(`SELECT COUNT(*) as count FROM \`${table}\``);
    console.log(`  - ${table}: ${res[0].count} rows`);
  }

  await localPool.end();
  await tidbPool.end();
  console.log('\n[MigrateToTiDB] Database migration completed successfully!');
}

migrateData().catch(err => {
  console.error('[MigrateToTiDB Fatal Error]:', err);
  process.exit(1);
});
