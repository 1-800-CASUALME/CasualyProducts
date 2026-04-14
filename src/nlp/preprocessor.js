/**
 * Clean raw HTML/text from feed items into plain normalised text.
 */

// Strip HTML tags
function stripHtml(str) {
  return str.replace(/<[^>]*>/g, ' ');
}

// Decode common HTML entities
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// Remove URLs
function stripUrls(str) {
  return str.replace(/https?:\/\/\S+/g, ' ');
}

// Collapse whitespace
function normaliseWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * @param {string} raw - raw HTML or plain text from a feed item
 * @returns {string} clean plain text, max 1000 chars
 */
export function cleanText(raw) {
  if (!raw) return '';
  let text = raw;
  text = stripHtml(text);
  text = decodeEntities(text);
  text = stripUrls(text);
  text = normaliseWhitespace(text);
  // Cap length to avoid passing huge walls of text to NLP/Claude
  return text.slice(0, 1000);
}
