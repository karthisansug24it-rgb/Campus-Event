const { pool } = require('../config/db');

async function migrateCategories() {
  console.log('[MigrateCategories] Starting category consolidation...');

  // Normalize workshop
  await pool.query("UPDATE events SET category = 'Workshop' WHERE LOWER(category) = 'workshop'");

  // Normalize hackathon
  await pool.query("UPDATE events SET category = 'Hackathon' WHERE LOWER(category) = 'hackathon'");

  // Update seminars / symposia to Conference
  await pool.query("UPDATE events SET category = 'Conference' WHERE LOWER(category) IN ('seminar', 'symposium', 'conclave', 'summit')");

  // Update legacy sample cultural event to Conference
  await pool.query(`
    UPDATE events 
    SET category = 'Conference',
        title = 'Dhwani 2026 - National Tech & Research Conference',
        description = 'Annual premier collegiate conference featuring research paper presentations, keynote talks, innovation exhibits, and technical symposia.'
    WHERE id = 4
  `);

  // Update legacy sample sports event to Workshop
  await pool.query(`
    UPDATE events 
    SET category = 'Workshop',
        title = 'South Zone Cloud Computing & DevOps Workshop',
        description = 'Hands-on intensive workshop covering modern cloud infrastructure, containerization, and continuous deployment pipelines.'
    WHERE id = 5
  `);

  // Any remaining non-matching category defaults to Conference
  await pool.query("UPDATE events SET category = 'Conference' WHERE category NOT IN ('Hackathon', 'Workshop', 'Conference')");

  const [rows] = await pool.query('SELECT id, title, category FROM events');
  console.log('[MigrateCategories] All events now categorized as:');
  console.table(rows);

  const [catCounts] = await pool.query('SELECT category, COUNT(*) as count FROM events GROUP BY category');
  console.log('[MigrateCategories] Distribution:');
  console.table(catCounts);

  await pool.end();
  console.log('[MigrateCategories] Done.');
}

migrateCategories().catch(err => {
  console.error('[MigrateCategories Error]:', err);
  process.exit(1);
});
