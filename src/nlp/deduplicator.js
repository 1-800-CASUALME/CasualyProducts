import { createHash } from 'crypto';
import { opportunityExists } from '../db/client.js';

/**
 * Generate a fingerprint from title tokens + top keywords + source domain.
 * Two items with the same fingerprint are considered duplicates.
 */
export function generateFingerprint(title, features, sourceName) {
  const titleTokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 6)
    .sort()
    .join('|');

  const kwTokens = (features.keywords || []).slice(0, 5).sort().join('|');

  // Extract domain from source name (e.g. 'reddit:r/sidehustle' → 'reddit')
  const domain = sourceName.split(':')[0];

  const raw = `${domain}::${titleTokens}::${kwTokens}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * @param {string} fingerprint
 * @returns {boolean} true if already in DB
 */
export function isDuplicate(fingerprint) {
  return opportunityExists(fingerprint);
}
