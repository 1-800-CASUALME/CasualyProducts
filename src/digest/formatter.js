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

function formatOpportunity(opp, rank) {
  let actionItems = [];
  try { actionItems = JSON.parse(opp.action_items || '[]'); } catch { /* */ }

  const slotLabel  = (opp.scheduled_slot || '—').split(' ').slice(1).join(' ');
  const fitPct     = Math.round((opp.fit_score || 0) * 100);
  const earning    = opp.earning_potential ? `~$${Math.round(opp.earning_potential).toLocaleString()}/mo` : '?';
  const timeReq    = opp.time_required ? `${opp.time_required}h/wk` : '?';
  const difficulty = '★'.repeat(opp.difficulty || 3) + '☆'.repeat(5 - (opp.difficulty || 3));
  const aiLeverage = '⚡'.repeat(opp.ai_leverage || 1);

  const lines = [''];
  lines.push(`  ${chalk.bold.white(`#${rank}`)}  ${chalk.bold(opp.title.slice(0, 55))} ${categoryTag(opp.category)}`);
  lines.push(`      ${chalk.green(scoreBar(opp.fit_score || 0))} ${chalk.bold.green(`${fitPct}%`)} fit`);
  lines.push(`      Earn: ${chalk.yellow(earning)}  |  Time: ${chalk.cyan(timeReq)}  |  Difficulty: ${chalk.red(difficulty)}  |  AI: ${chalk.magenta(aiLeverage)}`);
  if (opp.claude_summary) lines.push(`      ${chalk.dim(opp.claude_summary.slice(0, 90))}`);
  lines.push(`      ${chalk.bold('Slot:')} ${chalk.underline(slotLabel)}`);
  if (actionItems.length) {
    lines.push(`      ${chalk.bold('Actions:')}`);
    actionItems.forEach(step => lines.push(`        ${chalk.green('→')} ${step}`));
  }
  return lines.join('\n');
}

/**
 * Build a chalk-formatted terminal string and a plain-text version (today only).
 *
 * @param {{ today: Array, counts: object, date: Date }} data
 * @returns {{ terminal: string, plain: string }}
 */
export function formatDigest({ today, counts, date }) {
  const dateLabel = format(date, 'EEE MMM d yyyy');

  // ── Terminal ──────────────────────────────────────────────────
  const termLines = [];
  termLines.push(chalk.bold.blue(`╔${border()}╗`));
  termLines.push(chalk.bold.blue(`║${center(`AI OPPORTUNITY SCHEDULER — ${dateLabel}`)}║`));
  termLines.push(chalk.bold.blue(`╚${border()}╝`));
  termLines.push('');

  if (today.length === 0) {
    termLines.push(chalk.yellow("  No opportunities for today. Run 'npm run digest' to fetch new ones."));
  } else {
    termLines.push(chalk.bold.white(`TODAY'S TOP ${today.length} OPPORTUNITIES`));
    termLines.push(chalk.dim(`  ${border('─')}`));
    today.slice(0, 5).forEach((opp, i) => termLines.push(formatOpportunity(opp, i + 1)));
  }

  termLines.push('');
  termLines.push(chalk.dim(`  ${border('─')}`));
  const total = (counts.raw || 0) + (counts.evaluated || 0) + (counts.scheduled || 0);
  termLines.push(chalk.dim(`  ${total} scanned today  |  ${counts.scheduled || 0} scheduled for today`));
  termLines.push(chalk.dim(`  Next run: ${format(new Date(date.getTime() + 86400000), 'EEE MMM d')} 6:00 AM`));
  termLines.push('');

  // ── Plain text ────────────────────────────────────────────────
  const plainLines = [];
  plainLines.push(`AI OPPORTUNITY SCHEDULER — ${dateLabel}`);
  plainLines.push('='.repeat(WIDTH));
  plainLines.push('');
  if (today.length === 0) {
    plainLines.push('  No opportunities scheduled today.');
  } else {
    today.slice(0, 5).forEach((opp, i) => {
      let actionItems = [];
      try { actionItems = JSON.parse(opp.action_items || '[]'); } catch { /* */ }
      const slot = (opp.scheduled_slot || '').split(' ').slice(1).join(' ');
      plainLines.push(`#${i + 1}  ${opp.title}`);
      plainLines.push(`    Fit: ${Math.round((opp.fit_score || 0) * 100)}%  |  Earn: ~$${Math.round(opp.earning_potential || 0)}/mo  |  Slot: ${slot}`);
      if (opp.claude_summary) plainLines.push(`    ${opp.claude_summary}`);
      actionItems.forEach(step => plainLines.push(`    → ${step}`));
      plainLines.push('');
    });
  }

  return { terminal: termLines.join('\n'), plain: plainLines.join('\n') };
}
