import pool from '../config/database.js';
import { UNIFIED_TABLE } from './migrateInputCorrespondenceTable.js';

async function getTableColumns(tableName) {
  const result = await pool.query(`SELECT name FROM pragma_table_info(?)`, [tableName]);
  return result.rows.map((column) => column.name);
}

async function recreateCorrespondenceIndexes() {
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_input_output_correspondence_case ON ${UNIFIED_TABLE}(case_in_out)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_input_output_correspondence_project ON ${UNIFIED_TABLE}(project_id)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_input_output_correspondence_sender ON ${UNIFIED_TABLE}(sender)`
  );
  await pool.query(`
    CREATE TRIGGER IF NOT EXISTS update_input_output_correspondence_updated_at
      AFTER UPDATE ON ${UNIFIED_TABLE}
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE ${UNIFIED_TABLE} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);
}

export async function migrateCorrespondenceSenderSchema() {
  const tableCheck = await pool.query(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [UNIFIED_TABLE]
  );
  if (tableCheck.rows.length === 0) {
    return { migrated: false, message: 'Correspondence table does not exist yet' };
  }

  const columns = await getTableColumns(UNIFIED_TABLE);
  if (!columns.includes('created_by_id')) {
    await pool.query('DROP INDEX IF EXISTS idx_input_output_correspondence_created_by');
    await recreateCorrespondenceIndexes();
    return { migrated: false, message: 'Correspondence sender schema already up to date' };
  }

  await pool.query(`
    UPDATE ${UNIFIED_TABLE}
    SET sender = created_by_id
    WHERE created_by_id IS NOT NULL
  `);

  await pool.query(`
    UPDATE ${UNIFIED_TABLE}
    SET sender = (
      SELECT u.id FROM users u
      WHERE TRIM(u.first_name || ' ' || u.last_name) = TRIM(${UNIFIED_TABLE}.sender)
      LIMIT 1
    )
    WHERE sender IS NOT NULL
      AND sender NOT IN (SELECT id FROM users)
  `);

  await pool.query('DROP INDEX IF EXISTS idx_input_output_correspondence_created_by');
  await pool.query('DROP TRIGGER IF EXISTS update_input_output_correspondence_updated_at');

  await pool.query(`
    CREATE TABLE ${UNIFIED_TABLE}_new (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (LENGTH(type) = 1),
      number INTEGER NOT NULL,
      total_number INTEGER,
      client TEXT NOT NULL,
      description TEXT,
      sender TEXT REFERENCES users(id) ON DELETE RESTRICT,
      correspondence_date TEXT NOT NULL,
      pdf_path TEXT,
      case_in_out TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    INSERT INTO ${UNIFIED_TABLE}_new (
      id,
      project_id,
      type,
      number,
      total_number,
      client,
      description,
      sender,
      correspondence_date,
      pdf_path,
      case_in_out,
      created_at,
      updated_at
    )
    SELECT
      id,
      project_id,
      type,
      number,
      total_number,
      client,
      description,
      sender,
      correspondence_date,
      pdf_path,
      case_in_out,
      created_at,
      updated_at
    FROM ${UNIFIED_TABLE}
  `);

  await pool.query(`DROP TABLE ${UNIFIED_TABLE}`);
  await pool.query(`ALTER TABLE ${UNIFIED_TABLE}_new RENAME TO ${UNIFIED_TABLE}`);

  await recreateCorrespondenceIndexes();

  return { migrated: true, message: 'Correspondence sender now references users.id; created_by_id removed' };
}
