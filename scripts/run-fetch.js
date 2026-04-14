/**
 * Manual fetch script — run without starting the cron daemon.
 * Usage: node scripts/run-fetch.js
 */
import 'dotenv/config';
import { runMigrations }   from '../src/db/schema.js';
import { fetchAllSources } from '../src/sources/index.js';
import { logger }          from '../src/utils/logger.js';

runMigrations();
logger.info('Starting manual fetch…');

fetchAllSources()
  .then(({ added, skipped }) => {
    logger.info(`Done: added=${added} skipped=${skipped}`);
    process.exit(0);
  })
  .catch(err => {
    logger.error(err.message);
    process.exit(1);
  });
