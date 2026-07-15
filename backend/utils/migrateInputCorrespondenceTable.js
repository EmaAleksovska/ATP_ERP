import pool from '../config/database.js';

export const UNIFIED_TABLE = 'input_output_correspondence';

const CREATE_UNIFIED_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${UNIFIED_TABLE} (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
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
`;

async function tableExists(name) {
  const result = await pool.query(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [name]
  );
  return result.rows.length > 0;
}

async function createUnifiedTableIndexes() {
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

async function migrateLegacyTable(legacyTable, caseInOut) {
  if (!(await tableExists(legacyTable))) {
    return 0;
  }

  const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${legacyTable}`);
  const rowCount = countResult.rows[0].count;
  if (rowCount === 0) {
    await pool.query(`DROP TABLE IF EXISTS ${legacyTable}`);
    return 0;
  }

  await pool.query(`
    INSERT OR IGNORE INTO ${UNIFIED_TABLE} (
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
      correspondence_no,
      NULL,
      client,
      description,
      COALESCE(NULLIF(sender, ''), created_by_id),
      correspondence_date,
      pdf_path,
      ?,
      created_at,
      updated_at
    FROM ${legacyTable}
  `, [caseInOut]);

  await pool.query(`DROP TABLE IF EXISTS ${legacyTable}`);
  return rowCount;
}

export async function migrateInputCorrespondenceTable() {
  await pool.query(CREATE_UNIFIED_TABLE_SQL);
  await createUnifiedTableIndexes();

  const inputMigrated = await migrateLegacyTable('input_correspondence', 'in');
  const outputMigrated = await migrateLegacyTable('output_correspondence', 'out');

  await pool.query('DROP INDEX IF EXISTS idx_input_correspondence_project');
  await pool.query('DROP INDEX IF EXISTS idx_input_correspondence_created_by');
  await pool.query('DROP INDEX IF EXISTS idx_output_correspondence_project');
  await pool.query('DROP INDEX IF EXISTS idx_output_correspondence_created_by');
  await pool.query('DROP TRIGGER IF EXISTS update_input_correspondence_updated_at');
  await pool.query('DROP TRIGGER IF EXISTS update_output_correspondence_updated_at');

  return {
    inputMigrated,
    outputMigrated,
    message: `Unified table ${UNIFIED_TABLE} is ready`,
  };
}
