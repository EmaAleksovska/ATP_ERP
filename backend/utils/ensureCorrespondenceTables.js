import { migrateInputCorrespondenceTable } from './migrateInputCorrespondenceTable.js';
import { migrateCaseInOutValues } from './migrateCaseInOut.js';
import { migrateCorrespondenceSenderSchema } from './migrateCorrespondenceSender.js';
import { migrateCorrespondenceProjectRef } from './migrateCorrespondenceProjectRef.js';

export async function ensureCorrespondenceTables() {
  const result = await migrateInputCorrespondenceTable();
  await migrateCaseInOutValues();
  const senderResult = await migrateCorrespondenceSenderSchema();
  const projectRefResult = await migrateCorrespondenceProjectRef();
  return { ...result, senderMigration: senderResult, projectRefMigration: projectRefResult };
}

export { UNIFIED_TABLE } from './migrateInputCorrespondenceTable.js';
