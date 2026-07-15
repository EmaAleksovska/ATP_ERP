import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

async function check() {
  try {
    const users = await pool.query('SELECT id, email, role, status FROM users');
    console.log('Users count:', users.rows.length);
    users.rows.forEach((u) => console.log(`  ${u.email} | ${u.role} | ${u.status}`));

    const auditSchema = await pool.query(
      "SELECT sql FROM sqlite_master WHERE name='audit_log'"
    );
    console.log('\naudit_log schema:', auditSchema.rows[0]?.sql);

    const prt = await pool.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='password_reset_tokens'"
    );
    console.log('password_reset_tokens exists:', prt.rows.length > 0);

    const admin = await pool.query(
      'SELECT id, email, password_hash, role, status FROM users WHERE email = ?',
      ['admin@btrip.com']
    );
    if (admin.rows[0]) {
      const ok = await bcrypt.compare('Admin123!', admin.rows[0].password_hash);
      console.log('\nadmin@btrip.com password Admin123! matches:', ok);
    }

    const userId = users.rows[0]?.id;
    if (userId) {
      try {
        await pool.query(
          'INSERT INTO audit_log (user_id, action, entity_type, details) VALUES (?, ?, ?, ?)',
          [userId, 'login', 'user', '{}']
        );
        console.log('\nLogin-style audit_log INSERT without id: OK');
      } catch (e) {
        console.log('\nLogin-style audit_log INSERT without id FAILED:', e.message);
      }
    }
  } catch (e) {
    console.error('DB error:', e.message);
  }
  process.exit(0);
}

check();
