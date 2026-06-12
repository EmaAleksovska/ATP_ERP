import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || join(__dirname, '..', '..', 'database', 'btrip.db');

// Ensure database directory exists
const dbDir = dirname(dbPath);
try {
  mkdirSync(dbDir, { recursive: true });
} catch (error) {
  // Directory might already exist, ignore error
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    // Enable WAL mode for better concurrency
    db.run('PRAGMA journal_mode = WAL');
  }
});

// Helper function to convert PostgreSQL-style parameters ($1, $2, etc.) to SQLite (?)
function convertParams(sql, params) {
  // If already using ? placeholders, return as is
  if (sql.includes('?') && !sql.includes('$')) {
    return { sql, params };
  }
  
  // Convert $1, $2, etc. to ?
  let convertedSql = sql;
  const paramOrder = [];
  
  // Find all $N patterns and replace with ?, tracking the order
  convertedSql = convertedSql.replace(/\$(\d+)/g, (match, num) => {
    const index = parseInt(num) - 1;
    paramOrder.push(index);
    return '?';
  });
  
  // Reorder params array according to the order they appear in SQL
  const convertedParams = paramOrder.map(index => params[index]);
  
  return { sql: convertedSql, params: convertedParams.length > 0 ? convertedParams : params };
}

// Promisify database methods
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

const dbAll = (db, sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Create a wrapper to make SQLite async-compatible
const pool = {
  query: async (sql, params = []) => {
    try {
      // Convert PostgreSQL-style parameters to SQLite
      const { sql: convertedSql, params: convertedParams } = convertParams(sql, params);
      
      // Handle different query types
      const trimmedSql = convertedSql.trim().toUpperCase();
      
      if (trimmedSql.startsWith('SELECT')) {
        const rows = await dbAll(db, convertedSql, convertedParams);
        return { rows };
      } else if (trimmedSql.startsWith('INSERT')) {
        // Check if id is in the INSERT and extract it for RETURNING
        let insertedId = null;
        const idMatch = convertedSql.match(/\([^)]*id[^)]*\)/i);
        if (idMatch) {
          // Find the position of id in the column list
          const columns = idMatch[0].replace(/[()]/g, '').split(',').map(c => c.trim());
          const idIndex = columns.findIndex(col => col.toLowerCase() === 'id');
          if (idIndex >= 0 && convertedParams[idIndex]) {
            insertedId = convertedParams[idIndex];
          }
        }
        
        const result = await dbRun(db, convertedSql, convertedParams);
        
        // If SQL has RETURNING clause, fetch the inserted row
        if (convertedSql.toUpperCase().includes('RETURNING')) {
          const returningMatch = convertedSql.match(/RETURNING\s+(.+)/i);
          if (returningMatch && insertedId) {
            const tableMatch = convertedSql.match(/INTO\s+(\w+)/i);
            if (tableMatch) {
              const rows = await dbAll(db, `SELECT ${returningMatch[1]} FROM ${tableMatch[1]} WHERE id = ?`, [insertedId]);
              return { rows, rowCount: (result && result.changes) || 0 };
            }
          } else if (returningMatch && result && result.lastID) {
            // Fallback: use lastInsertRowid if id not found
            const tableMatch = convertedSql.match(/INTO\s+(\w+)/i);
            if (tableMatch) {
              const rows = await dbAll(db, `SELECT ${returningMatch[1]} FROM ${tableMatch[1]} WHERE rowid = ?`, [result.lastID]);
              return { rows, rowCount: (result && result.changes) || 0 };
            }
          }
        }
        
        return { 
          rows: insertedId ? [{ id: insertedId }] : (result && result.lastID ? [{ id: result.lastID.toString() }] : [{ id: '' }]), 
          rowCount: (result && result.changes) || 0 
        };
      } else if (trimmedSql.startsWith('UPDATE')) {
        const result = await dbRun(db, convertedSql, convertedParams);
        
        // If SQL has RETURNING clause, fetch the updated row
        if (convertedSql.toUpperCase().includes('RETURNING')) {
          const returningMatch = convertedSql.match(/RETURNING\s+(.+)/i);
          if (returningMatch) {
            // Find the id parameter from WHERE clause
            const whereMatch = convertedSql.match(/WHERE\s+id\s*=\s*\?/i);
            if (whereMatch) {
              // Find the position of the id in the params array
              const whereIndex = convertedSql.indexOf('WHERE');
              const idParamIndex = (convertedSql.substring(0, whereIndex).match(/\?/g) || []).length;
              const id = convertedParams[idParamIndex];
              const tableMatch = convertedSql.match(/UPDATE\s+(\w+)/i);
              if (tableMatch) {
                const rows = await dbAll(db, `SELECT ${returningMatch[1]} FROM ${tableMatch[1]} WHERE id = ?`, [id]);
                return { rows, rowCount: (result && result.changes) || 0 };
              }
            }
          }
        }
        
        return { rows: [], rowCount: (result && result.changes) || 0 };
      } else if (trimmedSql.startsWith('DELETE')) {
        const result = await dbRun(db, convertedSql, convertedParams);
        return { rows: [], rowCount: (result && result.changes) || 0 };
      } else {
        // For other queries (CREATE, ALTER, etc.)
        await dbRun(db, convertedSql, convertedParams);
        return { rows: [], rowCount: 0 };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },
  
  // For transactions (simplified - SQLite handles this differently)
  connect: async () => {
    return {
      query: pool.query,
      release: () => {},
    };
  },
};

// Handle database errors
process.on('exit', () => {
  db.close();
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

export default pool;
