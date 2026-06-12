import { randomUUID } from 'crypto';
import pool from '../backend/config/database.js';

async function resetUserPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'Password123!';
    
    if (!email) {
      console.error('Usage: node reset-user-password.js <email> [new-password]');
      console.error('Example: node reset-user-password.js user@example.com Password123!');
      process.exit(1);
    }
    
    console.log(`Resetting password for user: ${email}`);
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id, email FROM users WHERE email = ?', [email.toLowerCase()]);
    
    if (userCheck.rows.length === 0) {
      console.error(`User with email ${email} not found!`);
      process.exit(1);
    }
    
    const user = userCheck.rows[0];
    
    // Hash the new password - use dynamic import
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email.toLowerCase()]);
    
    console.log(`✓ Password reset successfully for ${email}`);
    console.log(`  New password: ${newPassword}`);
    console.log(`  Please change this password after logging in!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetUserPassword();
