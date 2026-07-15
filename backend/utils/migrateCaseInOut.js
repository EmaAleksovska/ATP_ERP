import pool from '../config/database.js';
import { UNIFIED_TABLE } from './migrateInputCorrespondenceTable.js';

export async function migrateCaseInOutValues() {
  await pool.query(
    `UPDATE ${UNIFIED_TABLE} SET case_in_out = 'in' WHERE case_in_out IN ('incoming', 'in')`
  );
  await pool.query(
    `UPDATE ${UNIFIED_TABLE} SET case_in_out = 'out' WHERE case_in_out IN ('outgoing', 'out')`
  );
}
