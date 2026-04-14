import { logger } from '../utils/logger.js';

/**
 * Parse Claude's JSON response into an array of score objects.
 * Validates and clamps all fields.
 *
 * @param {string} responseText - raw text from Claude
 * @returns {Array<{ id, time_required, earning_potential, difficulty, ai_leverage, fit_score, claude_summary, action_items }>}
 */
export function parseScores(responseText) {
  // Extract JSON array even if surrounded by stray text
  const match = responseText.match(/\[[\s\S]*\]/);
  if (!match) {
    logger.warn('No JSON array found in Claude response');
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch (err) {
    logger.warn(`Failed to parse Claude JSON: ${err.message}`);
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.map(item => {
    const difficulty   = clampInt(item.difficulty,   1, 5, 3);
    const ai_leverage  = clampInt(item.ai_leverage,  1, 5, 3);
    const time_req     = clampFloat(item.time_required,    0.5, 40, 5);
    const earning      = clampFloat(item.earning_potential, 0, 50000, 500);

    // Recompute fit_score with the canonical formula to catch any drift
    const fit_score = computeFitScore({ time_req, earning, difficulty, ai_leverage });

    return {
      id:                item.id,
      time_required:     time_req,
      earning_potential: earning,
      difficulty,
      ai_leverage,
      fit_score,
      claude_summary:    typeof item.claude_summary === 'string' ? item.claude_summary.slice(0, 300) : '',
      action_items:      Array.isArray(item.action_items)
        ? item.action_items.slice(0, 3).map(String)
        : [],
    };
  }).filter(item => item.id != null);
}

function clampInt(val, min, max, fallback) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampFloat(val, min, max, fallback) {
  const n = parseFloat(val);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function computeFitScore({ time_req, earning, difficulty, ai_leverage }) {
  const earningNorm  = Math.min(earning / 5000, 1);
  const timeNorm     = Math.min(time_req / 40, 1);
  const score =
    earningNorm           * 0.35 +
    (ai_leverage / 5)     * 0.30 +
    ((6 - difficulty) / 5)* 0.20 +
    (1 - timeNorm)        * 0.15;
  return Math.round(score * 1000) / 1000;
}
