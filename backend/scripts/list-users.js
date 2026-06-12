import pool from '../config/database.js';

async function listUsers() {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, status FROM users ORDER BY email'
    );
    
    console.log(`\nFound ${result.rows.length} user(s):\n`);
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
}

listUsers();


