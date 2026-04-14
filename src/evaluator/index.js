import Anthropic from '@anthropic-ai/sdk';
import { getRawOpportunities, updateOpportunityScores } from '../db/client.js';
import { buildEvaluationRequest } from './promptBuilder.js';
import { parseScores }            from './scorer.js';
import { logger }                 from '../utils/logger.js';
import { withRetry }              from '../utils/retry.js';

const BATCH_SIZE = parseInt(process.env.EVALUATION_BATCH_SIZE || '5', 10);
const MAX_ITEMS  = parseInt(process.env.MAX_OPPORTUNITIES_PER_RUN || '50', 10);

/**
 * Evaluate all raw (unevaluated) opportunities using Claude.
 * Batches BATCH_SIZE items per API call, using prompt caching on the system prompt.
 *
 * @returns {Promise<{ evaluated: number, failed: number }>}
 */
export async function evaluateNewOpportunities() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const rawItems = getRawOpportunities(MAX_ITEMS);
  if (rawItems.length === 0) {
    logger.info('No raw opportunities to evaluate');
    return { evaluated: 0, failed: 0 };
  }

  logger.info(`Evaluating ${rawItems.length} opportunities in batches of ${BATCH_SIZE}…`);

  let evaluated = 0;
  let failed    = 0;

  // Process batches sequentially so the cached system prompt stays warm
  for (let i = 0; i < rawItems.length; i += BATCH_SIZE) {
    const batch = rawItems.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rawItems.length / BATCH_SIZE);
    logger.info(`Batch ${batchNum}/${totalBatches} (${batch.length} items)…`);

    try {
      const request = buildEvaluationRequest(batch);
      const response = await withRetry(() =>
        client.messages.create(request), 3, 2000
      );

      const responseText = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      const scores = parseScores(responseText);

      for (const score of scores) {
        const opp = batch.find(o => o.id === score.id);
        if (!opp) {
          logger.warn(`Score returned for unknown id ${score.id}, skipping`);
          continue;
        }
        updateOpportunityScores(opp.id, score);
        evaluated++;
      }

      // Log cache stats if available
      if (response.usage) {
        const u = response.usage;
        logger.debug(
          `Cache: read=${u.cache_read_input_tokens ?? 0} ` +
          `create=${u.cache_creation_input_tokens ?? 0} ` +
          `input=${u.input_tokens} output=${u.output_tokens}`
        );
      }

    } catch (err) {
      logger.error(`Batch ${batchNum} failed: ${err.message}`);
      failed += batch.length;
    }
  }

  logger.info(`Evaluation complete: evaluated=${evaluated} failed=${failed}`);
  return { evaluated, failed };
}
