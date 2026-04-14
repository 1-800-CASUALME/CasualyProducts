import { format, addDays } from 'date-fns';
import { getScheduledForDate, getScheduledForWeek, getTotalCounts, upsertDigest } from '../db/client.js';
import { formatDigest } from './formatter.js';
import { saveDigest }   from './writer.js';
import { logger }       from '../utils/logger.js';

/**
 * Generate and output today's digest.
 * Prints to stdout (chalk) and saves a plain-text file.
 *
 * @param {Date} [date=new Date()]
 */
export async function generateDigest(date = new Date()) {
  const todayStr = format(date, 'yyyy-MM-dd');
  const weekEnd  = format(addDays(date, 6), 'yyyy-MM-dd');

  const today  = getScheduledForDate(todayStr);
  const week   = getScheduledForWeek(todayStr, weekEnd);
  const counts = getTotalCounts();

  const { terminal, plain } = formatDigest({ today, week, counts, date });

  console.log(terminal);

  const filepath = saveDigest(plain, date);
  upsertDigest(todayStr, plain);

  logger.info(`Digest saved → ${filepath}`);
}
