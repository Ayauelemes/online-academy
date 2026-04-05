// Migration script: if `users` table has a plaintext `password` column,
// copy and bcrypt-hash values into `password_hash`, then drop `password`.
// Run: node migrate_passwords.js

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'online_academy',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

(async function migrate() {
  try {
    console.log('Checking users table columns...');
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='users'`);
    const cols = colsRes.rows.map(r => r.column_name);

    if (!cols.includes('password_hash')) {
      console.log('Adding password_hash column...');
      await pool.query("ALTER TABLE users ADD COLUMN password_hash text;");
    } else {
      console.log('password_hash column already exists.');
    }

    if (cols.includes('password')) {
      console.log('Found plaintext password column. Migrating values to password_hash...');
      const users = await pool.query('SELECT id, email, password FROM users WHERE password IS NOT NULL');
      for (const u of users.rows) {
        try {
          const hash = await bcrypt.hash(String(u.password), 10);
          await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, u.id]);
          console.log(`Migrated user ${u.email}`);
        } catch (err) {
          console.error('Error hashing for', u.email, err);
        }
      }

      console.log('Dropping old plaintext password column...');
      await pool.query('ALTER TABLE users DROP COLUMN password;');
      console.log('Migration complete.');
    } else {
      console.log('No plaintext password column found. No per-row migration needed.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
