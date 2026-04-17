import axios from 'axios';
import { logger } from '../utils/logger.js';

const TOKEN          = process.env.WHATSAPP_TOKEN;
const PHONE_ID       = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TO             = process.env.WHATSAPP_TO;
const API_VERSION    = 'v19.0';

/**
 * Send a WhatsApp message via Meta Cloud API (free tier: 1,000 msgs/month).
 * @param {string} text - plain text message (max 4096 chars)
 */
export async function sendWhatsApp(text) {
  if (!TOKEN || !PHONE_ID || !TO) {
    logger.warn('WhatsApp not configured — skipping notification (set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TO in .env)');
    return;
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`;

  // WhatsApp has a 4096 char limit per message — split if needed
  const chunks = splitMessage(text, 4000);

  for (const chunk of chunks) {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to:   TO,
        type: 'text',
        text: { body: chunk, preview_url: false },
      },
      {
        headers: {
          Authorization:  `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
  }

  logger.info(`WhatsApp digest sent to ${TO} (${chunks.length} message${chunks.length > 1 ? 's' : ''})`);
}

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    // Try to break at a newline within the limit
    let end = i + maxLen;
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > i) end = lastNewline;
    }
    chunks.push(text.slice(i, end).trim());
    i = end;
  }
  return chunks;
}
