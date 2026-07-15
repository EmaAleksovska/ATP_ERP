import pool from '../config/database.js';

export async function ensureProjectsSchema() {
  const columns = await pool.query(
    "SELECT name FROM pragma_table_info('projects')"
  );
  const hasClientCode = columns.rows.some((column) => column.name === 'client_code');

  if (!hasClientCode) {
    await pool.query('ALTER TABLE projects ADD COLUMN client_code TEXT');
  }
}
