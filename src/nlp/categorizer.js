import { getNlpManager } from './index.js';

/**
 * Classify cleaned text into one of the predefined opportunity categories.
 * @param {string} text
 * @returns {Promise<{ category: string, confidence: number }>}
 */
export async function categorize(text) {
  const manager = await getNlpManager();
  const response = await manager.process('en', text.slice(0, 500));

  if (!response.intent || response.score < 0.3) {
    return { category: 'unknown', confidence: 0 };
  }

  return {
    category:   response.intent,
    confidence: Math.round(response.score * 100) / 100,
  };
}
