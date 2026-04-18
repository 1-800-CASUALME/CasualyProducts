import { format, addDays } from 'date-fns';

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
 * Format today-only digest as a concise WhatsApp-friendly message.
 *
 * @param {{ today: Array, counts: object, date: Date }} data
 * @returns {string}
 */
export function formatWhatsAppDigest({ today, counts, date }) {
  const dateLabel = format(date, 'EEE MMM d');
  const lines = [];

  lines.push(`🗓 *AI Opportunity Scheduler — ${dateLabel}*`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━');

  if (today.length === 0) {
    lines.push('📭 No opportunities for today yet.');
  } else {
    lines.push(`\n🔥 *TODAY\'S TOP PICKS*\n`);

    today.slice(0, 3).forEach((opp, i) => {
      let actionItems = [];
      try { actionItems = JSON.parse(opp.action_items || '[]'); } catch { /* */ }

      const emoji   = CATEGORY_EMOJI[opp.category] || '💡';
      const fitPct  = Math.round((opp.fit_score || 0) * 100);
      const earning = opp.earning_potential ? `$${Math.round(opp.earning_potential).toLocaleString()}/mo` : '?';
      const slot    = (opp.scheduled_slot || '').split(' ').slice(1).join(' ');

      lines.push(`${emoji} *#${i + 1} ${opp.title.slice(0, 50)}*`);
      lines.push(`📊 ${fitPct}% fit  |  💰 ~${earning}  |  ⏰ ${slot}`);
      if (opp.claude_summary) lines.push(`_${opp.claude_summary.slice(0, 100)}_`);
      if (actionItems.length) {
        lines.push('Actions:');
        actionItems.slice(0, 3).forEach(step => lines.push(`  → ${step}`));
      }
      lines.push('');
    });
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━');
  const total = (counts.raw || 0) + (counts.evaluated || 0) + (counts.scheduled || 0);
  lines.push(`📥 ${total} scanned  |  ✅ ${counts.scheduled || 0} for today`);
  lines.push(`⏰ Next run: ${format(addDays(date, 1), 'EEE MMM d')} at 6:00 AM`);

  return lines.join('\n');
}
