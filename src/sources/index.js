import { SOURCES } from '../../config/sources.js';
import { fetchRssFeed }     from './rssFetcher.js';
import { fetchSubreddit }   from './redditFetcher.js';
import { fetchHackerNews }  from './hnFetcher.js';
import { cleanText }        from '../nlp/preprocessor.js';
import { extractFeatures }  from '../nlp/extractor.js';
import { generateFingerprint, isDuplicate } from '../nlp/deduplicator.js';
import { categorize }       from '../nlp/categorizer.js';
import { insertOpportunity, recordSourceRun } from '../db/client.js';
import { logger }           from '../utils/logger.js';

const ENABLE_RSS    = process.env.ENABLE_RSS_FETCH    !== 'false';
const ENABLE_REDDIT = process.env.ENABLE_REDDIT_FETCH !== 'false';
const ENABLE_HN     = process.env.ENABLE_HN_FETCH     !== 'false';

async function fetchSource(source) {
  if (source.type === 'rss'    && !ENABLE_RSS)    return [];
  if (source.type === 'reddit' && !ENABLE_REDDIT) return [];
  if (source.type === 'hn'     && !ENABLE_HN)     return [];

  if (source.type === 'rss')    return fetchRssFeed(source);
  if (source.type === 'reddit') return fetchSubreddit(source);
  if (source.type === 'hn')     return fetchHackerNews(source);
  return [];
}

/**
 * Fetch all sources, run NLP preprocessing, deduplicate, and persist new items.
 * @returns {Promise<{ added: number, skipped: number }>}
 */
export async function fetchAllSources() {
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const source of SOURCES) {
    let rawItems = [];
    let errorMessage = null;

    try {
      rawItems = await fetchSource(source);
    } catch (err) {
      errorMessage = err.message;
      logger.error(`Source ${source.name} failed: ${err.message}`);
    }

    let added = 0;
    let skipped = 0;

    for (const item of rawItems) {
      try {
        const cleanedText = cleanText(item.raw_text || item.title);
        const features    = extractFeatures(`${item.title} ${cleanedText}`);
        const fingerprint = generateFingerprint(item.title, features, source.name);

        if (isDuplicate(fingerprint)) {
          skipped++;
          continue;
        }

        const { category, confidence } = await categorize(`${item.title} ${cleanedText}`);

        insertOpportunity({
          fingerprint,
          title:               item.title,
          source_name:         item.source_name,
          url:                 item.url,
          raw_text:            cleanedText,
          category,
          category_confidence: confidence,
          keywords:            features.keywords,
          extracted_features:  features,
          source_published_at: item.source_published_at,
        });

        added++;
      } catch (err) {
        logger.warn(`Failed to process item "${item.title}": ${err.message}`);
        skipped++;
      }
    }

    recordSourceRun(source.name, rawItems.length, added, errorMessage);
    logger.info(`${source.name}: fetched=${rawItems.length} added=${added} skipped=${skipped}`);

    totalAdded   += added;
    totalSkipped += skipped;
  }

  return { added: totalAdded, skipped: totalSkipped };
}
