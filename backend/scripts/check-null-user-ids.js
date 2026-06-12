import pool from '../config/database.js';

async function checkNullUserIds() {
  try {
    console.log('Checking for users with null IDs...');
    
    // Find users with null IDs
    const usersWithNullId = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE id IS NULL OR id = ?',
      ['']
    );
    
    if (usersWithNullId.rows.length === 0) {
      console.log('✓ No users with null IDs found. All good!');
      process.exit(0);
    }
    
    console.log(`\nFound ${usersWithNullId.rows.length} user(s) with null IDs:`);
    usersWithNullId.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking null user IDs:', error);
    process.exit(1);
  }
}

checkNullUserIds();


