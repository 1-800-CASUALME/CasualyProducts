import OpenAI from 'openai';
import { getRawOpportunities, updateOpportunityScores } from '../db/client.js';
import { buildEvaluationRequest } from './promptBuilder.js';
import { parseScores }            from './scorer.js';
import { logger }                 from '../utils/logger.js';
import { withRetry }              from '../utils/retry.js';

const BATCH_SIZE = parseInt(process.env.EVALUATION_BATCH_SIZE || '5', 10);
const MAX_ITEMS  = parseInt(process.env.MAX_OPPORTUNITIES_PER_RUN || '50', 10);
const PROVIDER   = (process.env.LLM_PROVIDER || 'groq').toLowerCase();

const PROVIDERS = {
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey:  () => process.env.GROQ_API_KEY,
    model:   'llama-3.3-70b-versatile',
    label:   'Groq (Llama 3.3 70B) — free',
  },
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey:  () => process.env.GEMINI_API_KEY,
    model:   'gemini-1.5-flash',
    label:   'Google Gemini 1.5 Flash — free',
  },
};

function getClient() {
  const cfg = PROVIDERS[PROVIDER];
  if (!cfg) {
    throw new Error(`Unknown LLM_PROVIDER "${PROVIDER}". Choose: groq or gemini`);
  }
  const apiKey = cfg.apiKey();
  if (!apiKey) {
    const keyName = PROVIDER === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY';
    throw new Error(
      `${keyName} is not set in .env.\n` +
      (PROVIDER === 'groq'
        ? 'Get a free key at: https://console.groq.com'
        : 'Get a free key at: https://aistudio.google.com')
    );
  }
  return { client: new OpenAI({ apiKey, baseURL: cfg.baseURL }), cfg };
}

/**
 * Evaluate all raw opportunities using a free LLM API (Groq or Gemini).
 * No paid subscription needed — just a free account.
 *
 * @returns {Promise<{ evaluated: number, failed: number }>}
 */
export async function evaluateNewOpportunities() {
  let client, cfg;
  try {
    ({ client, cfg } = getClient());
  } catch (err) {
    logger.error(err.message);
    return { evaluated: 0, failed: 0 };
  }

  const rawItems = getRawOpportunities(MAX_ITEMS);
  if (rawItems.length === 0) {
    logger.info('No raw opportunities to evaluate');
    return { evaluated: 0, failed: 0 };
  }

  logger.info(`Evaluating ${rawItems.length} items via ${cfg.label} in batches of ${BATCH_SIZE}…`);

  let evaluated = 0;
  let failed    = 0;

  for (let i = 0; i < rawItems.length; i += BATCH_SIZE) {
    const batch      = rawItems.slice(i, i + BATCH_SIZE);
    const batchNum   = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rawItems.length / BATCH_SIZE);
    logger.info(`Batch ${batchNum}/${totalBatches} (${batch.length} items)…`);

    try {
      const { systemPrompt, userPrompt } = buildEvaluationRequest(batch);

      const response = await withRetry(() =>
        client.chat.completions.create({
          model:       cfg.model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
        }), 3, 2000
      );

      const responseText = response.choices?.[0]?.message?.content || '';
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
