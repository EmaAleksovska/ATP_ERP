import { randomUUID } from 'crypto';
import pool from '../backend/config/database.js';

async function fixNullTravelRequestIds() {
  try {
    console.log('Checking for travel requests with null IDs...');
    
    // Find travel requests with null IDs
    const requestsWithNullId = await pool.query(
      'SELECT * FROM travel_requests WHERE id IS NULL OR id = ?',
      ['']
    );
    
    if (requestsWithNullId.rows.length === 0) {
      console.log('No travel requests with null IDs found. All good!');
      process.exit(0);
    }
    
    console.log(`Found ${requestsWithNullId.rows.length} travel request(s) with null IDs. Fixing...`);
    
    for (const request of requestsWithNullId.rows) {
      const newId = randomUUID();
      console.log(`Updating travel request (user: ${request.user_id}, project: ${request.project_id}) with new ID: ${newId}`);
      
      // Update the travel request with a new UUID
      // We'll use a combination of user_id, project_id, and created_at to identify unique requests
      await pool.query(
        'UPDATE travel_requests SET id = ? WHERE user_id = ? AND project_id = ? AND created_at = ? AND (id IS NULL OR id = ?)',
        [newId, request.user_id, request.project_id, request.created_at, '']
      );
      
      // Update foreign key references in travel_orders
      await pool.query(
        'UPDATE travel_orders SET travel_request_id = ? WHERE travel_request_id IN (SELECT id FROM travel_requests WHERE id IS NULL OR id = ?)',
        [newId, '']
      );
      
      console.log(`✓ Fixed travel request`);
    }
    
    console.log('\nAll travel requests with null IDs have been fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing null travel request IDs:', error);
    process.exit(1);
  }
}

fixNullTravelRequestIds();



