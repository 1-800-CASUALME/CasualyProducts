import 'dotenv/config';
import cron from 'node-cron';
import { runMigrations }           from './db/schema.js';
import { fetchAllSources }         from './sources/index.js';
import { evaluateNewOpportunities } from './evaluator/index.js';
import { scheduleTopOpportunities } from './scheduler/index.js';
import { generateDigest }          from './digest/index.js';
import { logger }                  from './utils/logger.js';

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 6 * * *';

async function runFullPipeline() {
  logger.info('=== AI Opportunity Scheduler: Starting pipeline ===');
  try {
    const fetchResult    = await fetchAllSources();
    logger.info(`Fetch complete: added=${fetchResult.added} skipped=${fetchResult.skipped}`);

    const evalResult     = await evaluateNewOpportunities();
    logger.info(`Evaluate complete: evaluated=${evalResult.evaluated} failed=${evalResult.failed}`);

    const scheduleResult = await scheduleTopOpportunities();
    logger.info(`Schedule complete: scheduled=${scheduleResult.scheduled}`);

    await generateDigest();
  } catch (err) {
    logger.error(`Pipeline failed: ${err.message}`, err);
  }
  logger.info('=== Pipeline finished ===');
}

async function main() {
  // Run DB migrations on startup
  runMigrations();
  logger.info('Database ready');

  const args = process.argv.slice(2);

  if (args.includes('--run-now')) {
    await runFullPipeline();
    process.exit(0);
  }

  if (args.includes('--digest-only')) {
    await generateDigest();
    process.exit(0);
  }

  if (args.includes('--fetch-only')) {
    await fetchAllSources();
    process.exit(0);
  }

  // Start cron daemon
  logger.info(`Scheduler armed. Cron: "${CRON_SCHEDULE}"`);
  cron.schedule(CRON_SCHEDULE, runFullPipeline, { timezone: 'America/New_York' });
  logger.info('Waiting for next scheduled run… (Ctrl+C to stop)');
}

main().catch(err => {
  logger.error(err.message, err);
  process.exit(1);
});
