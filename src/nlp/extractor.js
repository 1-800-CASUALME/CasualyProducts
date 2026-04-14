/**
 * Extract meaningful signals from cleaned text:
 * keywords, monetary mentions, AI tool names, platform names, time estimates.
 */

const MONEY_PATTERN    = /\$[\d,]+(?:k|K|m|M)?(?:\/(?:mo(?:nth)?|yr|year|wk|week|hr|hour))?|\d+(?:\.\d+)?k?\/(?:mo(?:nth)?|yr|year|wk|week|hr|hour)/gi;
const TIME_PATTERN     = /\d+\s*(?:hours?|hrs?|minutes?|mins?|days?|weeks?)\s*(?:per|\/)\s*(?:week|month|day)?/gi;

const AI_TOOLS = [
  'chatgpt', 'gpt-4', 'gpt-3', 'claude', 'midjourney', 'stable diffusion',
  'dall-e', 'gemini', 'copilot', 'perplexity', 'llama', 'mistral',
  'openai', 'anthropic', 'hugging face', 'langchain', 'autogpt',
];

const PLATFORMS = [
  'upwork', 'fiverr', 'toptal', 'freelancer', 'guru',
  'gumroad', 'etsy', 'amazon', 'shopify', 'ebay',
  'youtube', 'tiktok', 'instagram', 'twitter', 'x.com',
  'substack', 'beehiiv', 'convertkit', 'mailchimp',
  'udemy', 'teachable', 'gumroad', 'notion', 'airtable',
  'zapier', 'make', 'n8n', 'bubble', 'webflow',
  'producthunt', 'indiehackers', 'reddit', 'hackernews',
];

// Very simple keyword extractor: top N non-stopwords
const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'is','was','are','were','be','been','have','has','had','do','does','did',
  'will','would','could','should','may','might','shall','can','need',
  'i','you','he','she','it','we','they','this','that','these','those',
  'my','your','his','her','its','our','their','what','which','who','how',
  'when','where','why','not','no','so','if','then','as','from','by','about',
  'get','got','make','made','use','used','just','more','also','than','like',
  'new','good','great','best','way','time','one','two','three','four','five',
]);

function extractKeywords(text, topN = 8) {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  // Count frequency
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

function findMatches(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter(t => lower.includes(t));
}

/**
 * @param {string} text - cleaned text
 * @returns {{ keywords, monetaryMentions, toolMentions, platformMentions, timeEstimates }}
 */
export function extractFeatures(text) {
  return {
    keywords:          extractKeywords(text),
    monetaryMentions:  (text.match(MONEY_PATTERN)  || []).slice(0, 5),
    timeEstimates:     (text.match(TIME_PATTERN)   || []).slice(0, 3),
    toolMentions:      findMatches(text, AI_TOOLS),
    platformMentions:  findMatches(text, PLATFORMS),
  };
}
