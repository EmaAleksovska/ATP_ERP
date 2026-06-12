import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import pool from '../backend/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements (SQLite doesn't support multiple statements in one query)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (error) {
        // Ignore errors for IF NOT EXISTS statements
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.warn('Warning executing statement:', error.message);
        }
      }
    }
    
    console.log('Database schema created successfully');
    
    // Check if admin user exists, if not, create one
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@btrip.com']);
    
    if (adminCheck.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const adminId = randomUUID();
      
      await pool.query(
        'INSERT INTO users (id, first_name, last_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [adminId, 'Admin', 'User', 'admin@btrip.com', hashedPassword, 'admin', 'active']
      );
      console.log('Default admin user created: admin@btrip.com / Admin123!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
