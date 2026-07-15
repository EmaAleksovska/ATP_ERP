import { migrateInputCorrespondenceTable } from '../utils/migrateInputCorrespondenceTable.js';

migrateInputCorrespondenceTable()
  .then((result) => {
    console.log(result.message);
    if (result.inputMigrated) {
      console.log(`Migrated ${result.inputMigrated} incoming row(s)`);
    }
    if (result.outputMigrated) {
      console.log(`Migrated ${result.outputMigrated} outgoing row(s)`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
