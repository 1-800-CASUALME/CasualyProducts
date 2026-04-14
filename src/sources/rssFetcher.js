import Parser from 'rss-parser';
import { withRetry } from '../utils/retry.js';

const parser = new Parser({
  customFields: { item: ['content:encoded', 'description'] },
  timeout: 10000,
});

/**
 * Fetch a single RSS/Atom feed and normalise items.
 * @param {{ name: string, url: string }} source
 * @returns {Promise<Array<{ title, url, raw_text, source_name, source_published_at }>>}
 */
export async function fetchRssFeed(source) {
  const feed = await withRetry(() => parser.parseURL(source.url));
  return (feed.items || []).map(item => ({
    title:               (item.title || '').trim(),
    url:                 item.link || item.guid || null,
    raw_text:            item['content:encoded'] || item.content || item.contentSnippet || item.description || '',
    source_name:         source.name,
    source_published_at: item.isoDate || item.pubDate || null,
  })).filter(i => i.title);
}
