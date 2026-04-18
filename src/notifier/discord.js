import axios from 'axios';
import { logger } from '../utils/logger.js';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const CATEGORY_COLOR = {
  saas:             0x00b4d8,
  freelance:        0xf4a261,
  content_creation: 0xc77dff,
  automation:       0x57cc99,
  trading:          0xe63946,
  consulting:       0x4361ee,
  physical_product: 0xadb5bd,
  unknown:          0x6c757d,
};

const CATEGORY_EMOJI = {
  saas:             '💻',
  freelance:        '💼',
  content_creation: '✍️',
  automation:       '🤖',
  trading:          '📈',
  consulting:       '🎯',
  physical_product: '📦',
  unknown:          '💡',
};

/**
 * Send the daily digest to a Discord channel via webhook.
 * Free, no API key — just a webhook URL from channel settings.
 *
 * @param {{ today: Array, week: Array, counts: object, date: Date }} data
 */
export async function sendDiscord({ today, week, counts, date }) {
  if (!WEBHOOK_URL) {
    logger.warn('Discord not configured — skipping (set DISCORD_WEBHOOK_URL in .env)');
    return;
  }

  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const total     = (counts.raw || 0) + (counts.evaluated || 0) + (counts.scheduled || 0);

  const embeds = [];

  // ── Header embed ──────────────────────────────────────────────
  embeds.push({
    title:       `🗓 AI Opportunity Scheduler — ${dateLabel}`,
    description: today.length === 0
      ? "📭 No opportunities scheduled today. Run a fetch to find new ones."
      : `Found **${total}** opportunities · **${counts.scheduled || 0}** scheduled this week`,
    color: 0x5865f2,
    footer: { text: `Next run: tomorrow at 6:00 AM` },
    timestamp: date.toISOString(),
  });

  // ── One embed per top opportunity (max 3) ─────────────────────
  today.slice(0, 3).forEach((opp, i) => {
    let actionItems = [];
    try { actionItems = JSON.parse(opp.action_items || '[]'); } catch { /* */ }

    const emoji   = CATEGORY_EMOJI[opp.category] || '💡';
    const color   = CATEGORY_COLOR[opp.category]  || 0x6c757d;
    const fitPct  = Math.round((opp.fit_score || 0) * 100);
    const earning = opp.earning_potential
      ? `~$${Math.round(opp.earning_potential).toLocaleString()}/mo`
      : '?';
    const slot = (opp.scheduled_slot || '').split(' ').slice(1).join(' ') || '—';

    embeds.push({
      title:       `${emoji} #${i + 1} ${opp.title.slice(0, 60)}`,
      description: opp.claude_summary?.slice(0, 150) || '',
      color,
      fields: [
        { name: '📊 Fit Score',   value: `**${fitPct}%**`,                      inline: true },
        { name: '💰 Potential',   value: earning,                                inline: true },
        { name: '⏰ Slot',        value: slot,                                   inline: true },
        { name: '⚡ AI Leverage', value: '⚡'.repeat(opp.ai_leverage || 1),      inline: true },
        { name: '🎯 Difficulty',  value: `${'★'.repeat(opp.difficulty || 3)}`,  inline: true },
        { name: '🕐 Time/week',  value: `${opp.time_required || '?'}h`,          inline: true },
        ...(actionItems.length ? [{
          name:   '✅ Action Items',
          value:  actionItems.slice(0, 3).map(s => `→ ${s}`).join('\n'),
          inline: false,
        }] : []),
      ],
    });
  });

  // ── Week schedule embed ───────────────────────────────────────
  if (week.length > 0) {
    const scheduleLines = week.map(item => {
      const day   = new Date(item.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
      const slot  = (item.scheduled_slot || '').split(' ').slice(1).join(' ');
      const emoji = CATEGORY_EMOJI[item.category] || '💡';
      return `${emoji} **${day}** ${slot} — ${item.title.slice(0, 45)}`;
    });

    embeds.push({
      title:       '📅 This Week\'s Schedule',
      description: scheduleLines.join('\n'),
      color:       0x5865f2,
    });
  }

  // Discord allows max 10 embeds per message
  await axios.post(WEBHOOK_URL, { embeds: embeds.slice(0, 10) }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  logger.info(`Discord digest sent (${embeds.length} embeds)`);
}
