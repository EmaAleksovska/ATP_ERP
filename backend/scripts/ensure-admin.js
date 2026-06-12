import pool from '../config/database.js';

async function ensureAdmin() {
  try {
    console.log('Checking for admin user...');
    
    // Check if admin user exists
    const adminCheck = await pool.query('SELECT id, email, role FROM users WHERE email = ?', ['admin@btrip.com']);
    
    if (adminCheck.rows.length > 0) {
      const admin = adminCheck.rows[0];
      console.log(`✓ Admin user already exists:`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  ID: ${admin.id}`);
      console.log(`\nDefault credentials:`);
      console.log(`  Email: admin@btrip.com`);
      console.log(`  Password: Admin123!`);
      console.log(`\nIf you forgot the password, reset it with:`);
      console.log(`  npm run reset-password -- admin@btrip.com Admin123!`);
      process.exit(0);
    }
    
    console.log('Admin user not found. Creating admin user...');
    
    // Import bcrypt
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    // Generate UUID for admin
    const { randomUUID } = await import('crypto');
    const adminId = randomUUID();
    
    // Create admin user
    await pool.query(
      'INSERT INTO users (id, first_name, last_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [adminId, 'Admin', 'User', 'admin@btrip.com', hashedPassword, 'admin', 'active']
    );
    
    console.log('✓ Admin user created successfully!');
    console.log(`\nCredentials:`);
    console.log(`  Email: admin@btrip.com`);
    console.log(`  Password: Admin123!`);
    console.log(`\n⚠️  Please change this password after first login!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    process.exit(1);
  }
}

ensureAdmin();


