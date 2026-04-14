export const SOURCES = [
  // Reddit — public JSON, no OAuth required
  { type: 'reddit', name: 'reddit:r/sidehustle',      sub: 'sidehustle',        limit: 25 },
  { type: 'reddit', name: 'reddit:r/entrepreneur',    sub: 'entrepreneur',      limit: 25 },
  { type: 'reddit', name: 'reddit:r/passive_income',  sub: 'passive_income',    limit: 25 },
  { type: 'reddit', name: 'reddit:r/aipromptmarket',  sub: 'aipromptmarketing', limit: 25 },
  { type: 'reddit', name: 'reddit:r/AIBusiness',      sub: 'AIBusiness',        limit: 20 },

  // HackerNews via Algolia API
  { type: 'hn', name: 'hn:ask',  tags: 'ask_hn',  query: 'money AI income earn' },
  { type: 'hn', name: 'hn:show', tags: 'show_hn', query: 'AI SaaS launch revenue product' },

  // RSS feeds — high-signal newsletters and communities
  {
    type: 'rss',
    name: 'rss:indiehackers',
    url: 'https://www.indiehackers.com/feed.rss',
  },
  {
    type: 'rss',
    name: 'rss:producthunt-ai',
    url: 'https://www.producthunt.com/feed?category=artificial-intelligence',
  },
  {
    type: 'rss',
    name: 'rss:thenextweb',
    url: 'https://thenextweb.com/feed/',
  },
  {
    type: 'rss',
    name: 'rss:bensbites',
    url: 'https://bensbites.beehiiv.com/feed',
  },
];
