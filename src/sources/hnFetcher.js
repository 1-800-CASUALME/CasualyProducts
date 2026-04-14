import axios from 'axios';
import { withRetry } from '../utils/retry.js';

const HN_API = 'https://hn.algolia.com/api/v1/search';

/**
 * Fetch stories from HackerNews Algolia API.
 * @param {{ name: string, tags: string, query: string }} source
 * @returns {Promise<Array<{ title, url, raw_text, source_name, source_published_at }>>}
 */
export async function fetchHackerNews(source) {
  const params = {
    tags:          source.tags,
    query:         source.query,
    hitsPerPage:   20,
    numericFilters: 'created_at_i>0',
  };

  const response = await withRetry(() =>
    axios.get(HN_API, { params, timeout: 10000 })
  );

  const hits = response.data?.hits || [];
  return hits.map(hit => ({
    title:               (hit.title || hit.story_title || '').trim(),
    url:                 hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    raw_text:            [hit.title, hit.story_text || hit.comment_text || ''].join(' '),
    source_name:         source.name,
    source_published_at: hit.created_at || null,
  })).filter(i => i.title);
}
