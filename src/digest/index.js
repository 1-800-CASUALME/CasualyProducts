import { format } from 'date-fns';
import { getScheduledForDate, getTotalCounts, upsertDigest } from '../db/client.js';
import { formatDigest }          from './formatter.js';
import { saveDigest }            from './writer.js';
import { sendWhatsApp }          from '../notifier/whatsapp.js';
import { formatWhatsAppDigest }  from '../notifier/mobileFormatter.js';
import { sendDiscord }           from '../notifier/discord.js';
import { logger }                from '../utils/logger.js';

/**
 * Generate today's digest — fetch, evaluate, schedule, notify.
 * Only shows today's opportunities, no week-ahead view.
 *
 * @param {Date} [date=new Date()]
 */
export async function generateDigest(date = new Date()) {
  const todayStr = format(date, 'yyyy-MM-dd');

  const today  = getScheduledForDate(todayStr);
  const counts = getTotalCounts();

  const { terminal, plain } = formatDigest({ today, counts, date });

  console.log(terminal);

  const filepath = saveDigest(plain, date);
  upsertDigest(todayStr, plain);
  logger.info(`Digest saved → ${filepath}`);

  // Notifications — silently skipped if not configured
  const whatsappText = formatWhatsAppDigest({ today, counts, date });
  await sendWhatsApp(whatsappText);
  await sendDiscord({ today, counts, date });
}
