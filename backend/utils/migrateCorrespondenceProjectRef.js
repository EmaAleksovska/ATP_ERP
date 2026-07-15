import pool from '../config/database.js';
import { UNIFIED_TABLE } from './migrateInputCorrespondenceTable.js';
import { DRAFT_PROJECT_ID, DRAFT_CLIENT } from './correspondenceUtils.js';

async function hasProjectRefMigration() {
  const sample = await pool.query(
    `SELECT c.project_id
     FROM ${UNIFIED_TABLE} c
     WHERE c.project_id != ?
       AND c.project_id NOT IN (SELECT id FROM projects)
     LIMIT 1`,
    [DRAFT_PROJECT_ID]
  );
  return sample.rows.length === 0;
}

export async function migrateCorrespondenceProjectRef() {
  const tableCheck = await pool.query(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [UNIFIED_TABLE]
  );
  if (tableCheck.rows.length === 0) {
    return { migrated: false, message: 'Correspondence table does not exist yet' };
  }

  if (await hasProjectRefMigration()) {
    return { migrated: false, message: 'Correspondence project_id already references projects.id' };
  }

  await pool.query(
    `DELETE FROM ${UNIFIED_TABLE}
     WHERE project_id = ? OR client = ?`,
    [DRAFT_PROJECT_ID, DRAFT_CLIENT]
  );

  await pool.query(`
    UPDATE ${UNIFIED_TABLE}
    SET project_id = (
      SELECT p.id FROM projects p
      WHERE p.project_id = ${UNIFIED_TABLE}.project_id
      LIMIT 1
    )
    WHERE project_id NOT IN (SELECT id FROM projects)
  `);

  return {
    migrated: true,
    message: 'Correspondence project_id now stores projects.id; display uses projects.project_id',
  };
}

export async function resolveProjectRefId(projectIdOrCode) {
  const value = String(projectIdOrCode || '').trim();
  if (!value || value === DRAFT_PROJECT_ID) return null;

  const byId = await pool.query('SELECT id FROM projects WHERE id = ?', [value]);
  if (byId.rows.length > 0) return byId.rows[0].id;

  const byCode = await pool.query('SELECT id FROM projects WHERE project_id = ?', [value]);
  if (byCode.rows.length > 0) return byCode.rows[0].id;

  return null;
}
