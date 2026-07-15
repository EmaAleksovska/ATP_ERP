import { ensureCorrespondenceTables } from '../utils/ensureCorrespondenceTables.js';

ensureCorrespondenceTables()
  .then(() => {
    console.log('Correspondence tables are ready');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create correspondence tables:', error);
    process.exit(1);
  });
