import { randomUUID } from 'crypto';
import pool from '../config/database.js';

async function fixNullUserIds() {
  try {
    console.log('Checking for users with null IDs...');
    
    // Find users with null IDs
    const usersWithNullId = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE id IS NULL OR id = ?',
      ['']
    );
    
    if (usersWithNullId.rows.length === 0) {
      console.log('No users with null IDs found. All good!');
      process.exit(0);
    }
    
    console.log(`Found ${usersWithNullId.rows.length} user(s) with null IDs. Fixing...`);
    
    for (const user of usersWithNullId.rows) {
      const newId = randomUUID();
      console.log(`Updating user "${user.email}" with new ID: ${newId}`);
      
      // Update the user with a new UUID using email as identifier
      await pool.query(
        'UPDATE users SET id = ? WHERE email = ? AND (id IS NULL OR id = ?)',
        [newId, user.email, '']
      );
      
      // Update foreign key references in projects
      // Note: We need to find projects where responsible_user_id might reference this user by email
      // Since responsible_user_id should be a UUID, we'll check if there are any mismatches
      const projectsToUpdate = await pool.query(
        'SELECT id FROM projects WHERE responsible_user_id IN (SELECT email FROM users WHERE email = ? AND (id IS NULL OR id = ?))',
        [user.email, '']
      );
      
      if (projectsToUpdate.rows.length > 0) {
        await pool.query(
          'UPDATE projects SET responsible_user_id = ? WHERE responsible_user_id = ?',
          [newId, user.email]
        );
        console.log(`  Updated ${projectsToUpdate.rows.length} project(s)`);
      }
      
      // Update foreign key references in travel_requests
      const travelRequestsToUpdate = await pool.query(
        'SELECT id FROM travel_requests WHERE user_id IN (SELECT email FROM users WHERE email = ? AND (id IS NULL OR id = ?))',
        [user.email, '']
      );
      
      if (travelRequestsToUpdate.rows.length > 0) {
        await pool.query(
          'UPDATE travel_requests SET user_id = ? WHERE user_id = ?',
          [newId, user.email]
        );
        console.log(`  Updated ${travelRequestsToUpdate.rows.length} travel request(s)`);
      }
      
      // Update foreign key references in travel_orders
      const travelOrdersToUpdate = await pool.query(
        'SELECT id FROM travel_orders WHERE approved_by_id IN (SELECT email FROM users WHERE email = ? AND (id IS NULL OR id = ?))',
        [user.email, '']
      );
      
      if (travelOrdersToUpdate.rows.length > 0) {
        await pool.query(
          'UPDATE travel_orders SET approved_by_id = ? WHERE approved_by_id = ?',
          [newId, user.email]
        );
        console.log(`  Updated ${travelOrdersToUpdate.rows.length} travel order(s)`);
      }
      
      // Update foreign key references in password_reset_tokens
      await pool.query(
        'UPDATE password_reset_tokens SET user_id = ? WHERE user_id = ?',
        [newId, user.email]
      );
      
      // Update foreign key references in audit_log
      await pool.query(
        'UPDATE audit_log SET user_id = ? WHERE user_id = ?',
        [newId, user.email]
      );
      
      console.log(`✓ Fixed user: ${user.email}`);
    }
    
    console.log('\nAll users with null IDs have been fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing null user IDs:', error);
    process.exit(1);
  }
}

fixNullUserIds();


