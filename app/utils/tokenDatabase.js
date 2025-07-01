import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database.sqlite');

// Initialize database connection
async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

// Initialize the database schema
export async function initDatabase() {
  const db = await getDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      token TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER
    )
  `);
  
  await db.close();
}

// Save a token to the database
export async function saveToken(service, token, expiresInSeconds = 3600) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expiresInSeconds;
  
  await db.run(
    `INSERT INTO tokens (service, token, created_at, expires_at) 
     VALUES (?, ?, ?, ?)`,
    [service, token, now, expiresAt]
  );
  
  await db.close();
  return token;
}

// Get the latest valid token for a service
export async function getValidToken(service) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  
  const token = await db.get(
    `SELECT token FROM tokens 
     WHERE service = ? AND expires_at > ? 
     ORDER BY created_at DESC LIMIT 1`,
    [service, now]
  );
  
  await db.close();
  return token ? token.token : null;
}

// Delete expired tokens to keep the database clean
export async function cleanupExpiredTokens() {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  
  await db.run(
    `DELETE FROM tokens WHERE expires_at < ?`, 
    [now]
  );
  
  await db.close();
} 