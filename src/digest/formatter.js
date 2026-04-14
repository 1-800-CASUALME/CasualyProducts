import chalk from 'chalk';
import { format } from 'date-fns';

const WIDTH = 62;

function border(char = '═') {
  return char.repeat(WIDTH);
}

function center(text) {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function scoreBar(score) {
  const filled = Math.round(score * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function categoryTag(cat) {
  const COLORS = {
    saas:             chalk.cyan,
    freelance:        chalk.yellow,
    content_creation: chalk.magenta,
    automation:       chalk.green,
    trading:          chalk.red,
    consulting:       chalk.blue,
    physical_product: chalk.white,
    unknown:          chalk.gray,
  };
  const fn = COLORS[cat] || chalk.gray;
  const label = (cat || 'unknown').replace('_', ' ').toUpperCase();
  return fn(`[${label}]`);
}

function formatOpportunity(opp, rank, isToday) {
  let actionItems = [];
  try { actionItems = JSON.parse(opp.action_items || '[]'); } catch { /* */ }

  const slotLabel  = opp.scheduled_slot || '—';
  const fitPct     = Math.round((opp.fit_score || 0) * 100);
  const earning    = opp.earning_potential ? `~$${Math.round(opp.earning_potential).toLocaleString()}/mo` : '?';
  const timeReq    = opp.time_required ? `${opp.time_required}h/wk` : '?';
  const difficulty = '★'.repeat(opp.difficulty || 3) + '☆'.repeat(5 - (opp.difficulty || 3));
  const aiLeverage = '⚡'.repeat(opp.ai_leverage || 1);

  const lines = [];
  lines.push('');

  const rankLabel = isToday ? chalk.bold.white(`#${rank}`) : chalk.dim(`#${rank}`);
  const title     = chalk.bold(opp.title.slice(0, 55));
  const cat       = categoryTag(opp.category);
  lines.push(`  ${rankLabel}  ${title} ${cat}`);
  lines.push(`      ${chalk.green(scoreBar(opp.fit_score || 0))} ${chalk.bold.green(`${fitPct}%`)} fit`);
  lines.push(`      Earn: ${chalk.yellow(earning)}  |  Time: ${chalk.cyan(timeReq)}  |  Difficulty: ${chalk.red(difficulty)}  |  AI: ${chalk.magenta(aiLeverage)}`);

  if (opp.claude_summary) {
    lines.push(`      ${chalk.dim(opp.claude_summary.slice(0, 90))}`);
  }

  lines.push(`      ${chalk.bold('Slot:')} ${chalk.underline(slotLabel)}`);

  if (actionItems.length) {
    lines.push(`      ${chalk.bold('Actions:')}`);
    actionItems.forEach(step => lines.push(`        ${chalk.green('→')} ${step}`));
  }

  return lines.join('\n');
}

function formatWeekSchedule(weekItems) {
  if (weekItems.length === 0) return chalk.dim('  No items scheduled this week yet.');

  const byDate = {};
  for (const item of weekItems) {
    if (!byDate[item.scheduled_date]) byDate[item.scheduled_date] = [];
    byDate[item.scheduled_date].push(item);
  }

  const lines = [];
  for (const [date, items] of Object.entries(byDate)) {
    const dayLabel = format(new Date(date + 'T12:00:00'), 'EEE MMM d');
    lines.push(`  ${chalk.bold.white(dayLabel)}`);
    for (const item of items) {
      const slotTime = (item.scheduled_slot || '').split(' ').slice(1).join(' ');
      lines.push(`    ${chalk.cyan(slotTime.padEnd(14))} ${item.title.slice(0, 45)}`);
    }
  }
  return lines.join('\n');
}

/**
 * Build a chalk-formatted terminal string and a plain-text version.
 *
 * @param {{ today: Array, week: Array, counts: object, date: Date }} data
 * @returns {{ terminal: string, plain: string }}
 */
export function formatDigest({ today, week, counts, date }) {
  const dateLabel = format(date, 'EEE MMM d yyyy');

  // ── Terminal version ──────────────────────────────────────────────
  const termLines = [];

  termLines.push(chalk.bold.blue(`╔${border()}╗`));
  termLines.push(chalk.bold.blue(`║${center(`AI OPPORTUNITY SCHEDULER — ${dateLabel}`)}║`));
  termLines.push(chalk.bold.blue(`╚${border()}╝`));
  termLines.push('');

  if (today.length === 0) {
    termLines.push(chalk.yellow("  No opportunities scheduled for today. Run 'npm run fetch' to find new ones."));
  } else {
    termLines.push(chalk.bold.white(`TODAY'S TOP ${today.length} OPPORTUNITIES`));
    termLines.push(chalk.dim(`  ${border('─')}`));
    today.slice(0, 5).forEach((opp, i) => {
      termLines.push(formatOpportunity(opp, i + 1, true));
    });
  }

  termLines.push('');
  termLines.push(chalk.bold.white('THIS WEEK\'S SCHEDULE'));
  termLines.push(chalk.dim(`  ${border('─')}`));
  termLines.push(formatWeekSchedule(week));

  termLines.push('');
  termLines.push(chalk.dim(`  ${border('─')}`));
  const raw       = counts.raw       || 0;
  const evaluated = counts.evaluated || 0;
  const scheduled = counts.scheduled || 0;
  termLines.push(chalk.dim(
    `  ${raw + evaluated + scheduled} total in DB  |  ` +
    `${raw} new  |  ${evaluated} evaluated  |  ${scheduled} scheduled`
  ));
  const nextRun = format(new Date(date.getTime() + 86400000), 'EEE MMM d') + ' 6:00 AM';
  termLines.push(chalk.dim(`  Next run: ${nextRun}`));
  termLines.push('');

  const terminal = termLines.join('\n');

  // ── Plain text version ────────────────────────────────────────────
  const plainLines = [];
  plainLines.push(`AI OPPORTUNITY SCHEDULER — ${dateLabel}`);
  plainLines.push('='.repeat(WIDTH));
  plainLines.push('');
  plainLines.push("TODAY'S OPPORTUNITIES");
  plainLines.push('-'.repeat(WIDTH));
  if (today.length === 0) {
    plainLines.push('  No opportunities scheduled today.');
  } else {
    today.slice(0, 5).forEach((opp, i) => {
      let actionItems = [];
      try { actionItems = JSON.parse(opp.action_items || '[]'); } catch { /* */ }
      plainLines.push(`#${i + 1}  ${opp.title}`);
      plainLines.push(`    Fit: ${Math.round((opp.fit_score || 0) * 100)}%  |  Earn: ~$${Math.round(opp.earning_potential || 0)}/mo  |  Slot: ${opp.scheduled_slot}`);
      if (opp.claude_summary) plainLines.push(`    ${opp.claude_summary}`);
      actionItems.forEach(step => plainLines.push(`    → ${step}`));
      plainLines.push('');
    });
  }

  plainLines.push("THIS WEEK'S SCHEDULE");
  plainLines.push('-'.repeat(WIDTH));
  week.forEach(item => {
    const slotTime = (item.scheduled_slot || '').split(' ').slice(1).join(' ');
    plainLines.push(`  ${item.scheduled_date}  ${slotTime.padEnd(12)}  ${item.title.slice(0, 50)}`);
  });

  const plain = plainLines.join('\n');

  return { terminal, plain };
}
