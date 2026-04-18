import { getUnscheduledEvaluated, setScheduledSlot } from '../db/client.js';
import { rankOpportunities }  from './ranker.js';
import { getAvailableSlots }  from './slotManager.js';
import { logger }             from '../utils/logger.js';

const MIN_FIT_SCORE = parseFloat(process.env.MIN_FIT_SCORE || '0.4');

/**
 * Greedily assign top-scored opportunities to available time slots.
 * Each opportunity needs `time_required` hours; we fill slots until full.
 *
 * @returns {Promise<{ scheduled: number }>}
 */
export async function scheduleTopOpportunities() {
  const unscheduled = getUnscheduledEvaluated(30);
  if (unscheduled.length === 0) {
    logger.info('No evaluated opportunities to schedule');
    return { scheduled: 0 };
  }

  const ranked = rankOpportunities(unscheduled).filter(o => (o.fit_score || 0) >= MIN_FIT_SCORE);
  if (ranked.length === 0) {
    logger.info(`No opportunities meet minimum fit score of ${MIN_FIT_SCORE}`);
    return { scheduled: 0 };
  }

  const slots = getAvailableSlots(new Date(), 1);
  if (slots.length === 0) {
    logger.warn("No free time slots today (check config/schedule.js for today's day)");
    return { scheduled: 0 };
  }

  let scheduled = 0;

  for (const opp of ranked) {
    const needed = opp.time_required || 1;

    // Find the first slot with enough remaining capacity
    const slot = slots.find(s => s.capacityHours - s.usedHours >= Math.min(needed, 1.5));
    if (!slot) break; // All slots full

    // Rebuild action_items from DB JSON string if needed
    let actionItems = [];
    try {
      actionItems = opp.action_items ? JSON.parse(opp.action_items) : [];
    } catch { /* ignore */ }

    setScheduledSlot(opp.id, slot.label, slot.date, actionItems);
    slot.usedHours += Math.min(needed, slot.capacityHours - slot.usedHours);
    scheduled++;

    logger.info(`Scheduled "${opp.title.slice(0, 60)}" → ${slot.label}`);
  }

  logger.info(`Scheduling complete: ${scheduled} opportunities assigned`);
  return { scheduled };
}
