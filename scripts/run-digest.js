/**
 * Manual full-pipeline script — fetch → evaluate → schedule → digest.
 * Requires ANTHROPIC_API_KEY in .env.
 * Usage: node scripts/run-digest.js
 */
import 'dotenv/config';
import { runMigrations }            from '../src/db/schema.js';
import { fetchAllSources }          from '../src/sources/index.js';
import { evaluateNewOpportunities } from '../src/evaluator/index.js';
import { scheduleTopOpportunities } from '../src/scheduler/index.js';
import { generateDigest }           from '../src/digest/index.js';
import { logger }                   from '../src/utils/logger.js';

async function run() {
  runMigrations();

  logger.info('Fetching sources…');
  const { added, skipped } = await fetchAllSources();
  logger.info(`Fetched: added=${added} skipped=${skipped}`);

  logger.info('Evaluating with Claude…');
  const { evaluated, failed } = await evaluateNewOpportunities();
  logger.info(`Evaluated: ${evaluated} (failed: ${failed})`);

  logger.info('Scheduling…');
  const { scheduled } = await scheduleTopOpportunities();
  logger.info(`Scheduled: ${scheduled}`);

  logger.info('Generating digest…');
  await generateDigest();
}

run().catch(err => {
  logger.error(err.message);
  process.exit(1);
});
