import pool from '../config/database.js';
import { migrateCaseInOutValues } from '../utils/migrateCaseInOut.js';

migrateCaseInOutValues()
  .then(() => {
    console.log('case_in_out migration complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
