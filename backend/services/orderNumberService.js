import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database instance for transactions
function getDb() {
  const dbPath = process.env.DB_PATH || join(__dirname, '..', '..', 'database', 'btrip.db');
  return new sqlite3.Database(dbPath);
}

const dbRun = (db, sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (db, sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

/**
 * Generate a unique travel order number in format TO-YYYY-NNN
 * @returns {Promise<string>} Unique order number
 */
export const generateOrderNumber = async () => {
  const db = getDb();
  
  try {
    // Begin transaction
    await dbRun(db, 'BEGIN IMMEDIATE TRANSACTION', []);
    
    const currentYear = new Date().getFullYear();
    
    // Get or create tracking record for current year
    const trackingResult = await dbGet(db, 'SELECT last_number FROM order_number_tracking WHERE year = ?', [currentYear]);
    
    let lastNumber;
    
    if (!trackingResult) {
      // First order for this year
      lastNumber = 0;
      await dbRun(db, 'INSERT INTO order_number_tracking (year, last_number) VALUES (?, ?)', [currentYear, 1]);
    } else {
      // Increment existing number
      lastNumber = trackingResult.last_number;
      await dbRun(db, 'UPDATE order_number_tracking SET last_number = last_number + 1, updated_at = CURRENT_TIMESTAMP WHERE year = ?', [currentYear]);
    }
    
    const newNumber = lastNumber + 1;
    const orderNumber = `TO-${currentYear}-${String(newNumber).padStart(3, '0')}`;
    
    // Commit transaction
    await dbRun(db, 'COMMIT', []);
    
    return orderNumber;
  } catch (error) {
    // Rollback on error
    try {
      await dbRun(db, 'ROLLBACK', []);
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    throw error;
  } finally {
    db.close();
  }
};
