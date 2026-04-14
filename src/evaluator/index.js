import { Ollama } from 'ollama';
import { getRawOpportunities, updateOpportunityScores } from '../db/client.js';
import { buildEvaluationRequest } from './promptBuilder.js';
import { parseScores }            from './scorer.js';
import { logger }                 from '../utils/logger.js';
import { withRetry }              from '../utils/retry.js';

const BATCH_SIZE  = parseInt(process.env.EVALUATION_BATCH_SIZE || '3', 10);
const MAX_ITEMS   = parseInt(process.env.MAX_OPPORTUNITIES_PER_RUN || '50', 10);
const OLLAMA_HOST = process.env.OLLAMA_HOST  || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Evaluate all raw opportunities using a local Ollama LLM.
 * Free, no API key required — just needs Ollama running locally.
 *
 * @returns {Promise<{ evaluated: number, failed: number }>}
 */
export async function evaluateNewOpportunities() {
  const ollama = new Ollama({ host: OLLAMA_HOST });

  // Verify Ollama is reachable
  try {
    await ollama.list();
  } catch {
    logger.error(`Cannot reach Ollama at ${OLLAMA_HOST}. Is it running? Try: ollama serve`);
    return { evaluated: 0, failed: 0 };
  }

  const rawItems = getRawOpportunities(MAX_ITEMS);
  if (rawItems.length === 0) {
    logger.info('No raw opportunities to evaluate');
    return { evaluated: 0, failed: 0 };
  }

  logger.info(`Evaluating ${rawItems.length} opportunities with ${OLLAMA_MODEL} in batches of ${BATCH_SIZE}…`);

  let evaluated = 0;
  let failed    = 0;

  for (let i = 0; i < rawItems.length; i += BATCH_SIZE) {
    const batch     = rawItems.slice(i, i + BATCH_SIZE);
    const batchNum  = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rawItems.length / BATCH_SIZE);
    logger.info(`Batch ${batchNum}/${totalBatches} (${batch.length} items)…`);

    try {
      const { systemPrompt, userPrompt } = buildEvaluationRequest(batch);

      const response = await withRetry(() =>
        ollama.chat({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
          options: { temperature: 0.2 },
        }), 3, 2000
      );

      const responseText = response.message?.content || '';
      const scores = parseScores(responseText);

      for (const score of scores) {
        const opp = batch.find(o => o.id === score.id);
        if (!opp) continue;
        updateOpportunityScores(opp.id, score);
        evaluated++;
      }

    } catch (err) {
      logger.error(`Batch ${batchNum} failed: ${err.message}`);
      failed += batch.length;
    }
  }

  logger.info(`Evaluation complete: evaluated=${evaluated} failed=${failed}`);
  return { evaluated, failed };
}
