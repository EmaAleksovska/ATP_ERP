import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../backend/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('Database schema created successfully');
    
    // Check if admin user exists, if not, create one
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@btrip.com']);
    
    if (adminCheck.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      await pool.query(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Admin', 'User', 'admin@btrip.com', hashedPassword, 'admin', 'active']
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

