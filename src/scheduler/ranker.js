/**
 * Compute a normalised fit score and rank opportunities.
 */

/**
 * Recompute the canonical fit score from raw subscores.
 * Weights: earning 35%, ai_leverage 30%, ease-of-difficulty 20%, low-time 15%.
 *
 * @param {{ time_required, earning_potential, difficulty, ai_leverage }} opp
 * @returns {number} 0.0–1.0
 */
export function computeFitScore(opp) {
  const earningNorm = Math.min((opp.earning_potential || 0) / 5000, 1);
  const timeNorm    = Math.min((opp.time_required || 5) / 40, 1);
  const diffScore   = ((6 - (opp.difficulty || 3)) / 5);
  const aiScore     = ((opp.ai_leverage || 1) / 5);

  return Math.round(
    (earningNorm  * 0.35 +
     aiScore      * 0.30 +
     diffScore    * 0.20 +
     (1 - timeNorm) * 0.15) * 1000
  ) / 1000;
}

/**
 * Sort opportunities descending by fit_score (use stored score from Claude).
 * @param {Array} opportunities
 * @returns {Array} sorted copy
 */
export function rankOpportunities(opportunities) {
  return [...opportunities].sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
}
