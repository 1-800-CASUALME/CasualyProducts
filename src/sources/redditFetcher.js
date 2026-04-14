import axios from 'axios';
import { withRetry } from '../utils/retry.js';

const USER_AGENT = process.env.REDDIT_USER_AGENT || 'ai-opportunity-scheduler/1.0';

/**
 * Fetch newest posts from a subreddit using Reddit's public JSON API.
 * @param {{ name: string, sub: string, limit?: number }} source
 * @returns {Promise<Array<{ title, url, raw_text, source_name, source_published_at }>>}
 */
export async function fetchSubreddit(source) {
  const limit = source.limit || 25;
  const url = `https://www.reddit.com/r/${source.sub}/new.json?limit=${limit}`;

  const response = await withRetry(() =>
    axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
    })
  );

  const posts = response.data?.data?.children || [];
  return posts.map(({ data: post }) => ({
    title:               (post.title || '').trim(),
    url:                 post.url || `https://reddit.com${post.permalink}`,
    raw_text:            [post.title, post.selftext].filter(Boolean).join(' '),
    source_name:         source.name,
    source_published_at: post.created_utc
      ? new Date(post.created_utc * 1000).toISOString()
      : null,
  })).filter(i => i.title);
}
