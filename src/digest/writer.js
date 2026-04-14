import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';

const OUTPUT_DIR = process.env.DIGEST_OUTPUT_DIR || './data/digests';

/**
 * Save the plain-text digest to a dated file.
 * @param {string} plainText
 * @param {Date}   date
 * @returns {string} absolute file path written
 */
export function saveDigest(plainText, date) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `${format(date, 'yyyy-MM-dd')}.txt`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, plainText, 'utf8');
  return filepath;
}
