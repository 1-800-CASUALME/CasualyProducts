/**
 * Wipe and re-initialise the database.
 * WARNING: destroys all stored opportunities, schedules, and digests.
 * Usage: node scripts/reset-db.js
 */
import { createRequire } from 'module';
import { existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from '../src/db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../data/opportunities.db');

if (existsSync(DB_PATH)) {
  unlinkSync(DB_PATH);
  console.log(`Deleted ${DB_PATH}`);
} else {
  console.log('No database file found, creating fresh.');
}

runMigrations();
console.log('Database re-initialised.');
