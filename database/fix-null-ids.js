import { randomUUID } from 'crypto';
import pool from '../backend/config/database.js';

async function fixNullIds() {
  try {
    console.log('Checking for projects with null IDs...');
    
    // Find projects with null IDs
    const projectsWithNullId = await pool.query(
      'SELECT * FROM projects WHERE id IS NULL OR id = ?',
      ['']
    );
    
    if (projectsWithNullId.rows.length === 0) {
      console.log('No projects with null IDs found. All good!');
      process.exit(0);
    }
    
    console.log(`Found ${projectsWithNullId.rows.length} project(s) with null IDs. Fixing...`);
    
    for (const project of projectsWithNullId.rows) {
      const newId = randomUUID();
      console.log(`Updating project "${project.name}" (project_id: ${project.project_id}) with new ID: ${newId}`);
      
      // Get the project_id to use as identifier
      const projectId = project.project_id;
      
      // Update the project with a new UUID using project_id as identifier
      await pool.query(
        'UPDATE projects SET id = ? WHERE project_id = ? AND (id IS NULL OR id = ?)',
        [newId, projectId, '']
      );
      
      console.log(`✓ Fixed project: ${project.name}`);
    }
    
    console.log('\nAll projects with null IDs have been fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing null IDs:', error);
    process.exit(1);
  }
}

fixNullIds();

