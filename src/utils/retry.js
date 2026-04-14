import { logger } from './logger.js';

/**
 * Retry an async function with exponential backoff.
 * @param {Function} fn       - async function to call
 * @param {number}   retries  - max retries (default 3)
 * @param {number}   baseMs   - base delay in ms (default 1000)
 */
export async function withRetry(fn, retries = 3, baseMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = baseMs * Math.pow(2, attempt);
        logger.warn(`Retry ${attempt + 1}/${retries} after ${delay}ms: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
