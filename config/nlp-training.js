/**
 * Training data for NLP.js categorizer.
 * Each entry: { utterance, intent }
 * Intents map to opportunity categories.
 */
export const TRAINING_DATA = [
  // saas
  { utterance: 'build a SaaS product', intent: 'saas' },
  { utterance: 'monthly recurring revenue subscription', intent: 'saas' },
  { utterance: 'software as a service startup', intent: 'saas' },
  { utterance: 'launch a web app with paid tiers', intent: 'saas' },
  { utterance: 'API product developer tools', intent: 'saas' },
  { utterance: 'micro SaaS solo founder', intent: 'saas' },
  { utterance: 'chrome extension subscription model', intent: 'saas' },
  { utterance: 'no-code app monetize', intent: 'saas' },

  // freelance
  { utterance: 'freelance gig client work', intent: 'freelance' },
  { utterance: 'upwork fiverr freelancer hourly rate', intent: 'freelance' },
  { utterance: 'consulting clients projects', intent: 'freelance' },
  { utterance: 'sell services online agency', intent: 'freelance' },
  { utterance: 'remote work contract developer', intent: 'freelance' },
  { utterance: 'ghostwriting copywriting clients', intent: 'freelance' },
  { utterance: 'virtual assistant services', intent: 'freelance' },

  // content_creation
  { utterance: 'create youtube videos monetize', intent: 'content_creation' },
  { utterance: 'newsletter audience build email list', intent: 'content_creation' },
  { utterance: 'blog affiliate income', intent: 'content_creation' },
  { utterance: 'tiktok instagram creator fund', intent: 'content_creation' },
  { utterance: 'sell digital products ebooks courses', intent: 'content_creation' },
  { utterance: 'notion template gumroad', intent: 'content_creation' },
  { utterance: 'online course udemy teachable', intent: 'content_creation' },
  { utterance: 'podcast sponsorship', intent: 'content_creation' },
  { utterance: 'substack paid newsletter', intent: 'content_creation' },

  // automation
  { utterance: 'automate workflow make zapier', intent: 'automation' },
  { utterance: 'AI agent bot automation revenue', intent: 'automation' },
  { utterance: 'build automation tools for businesses', intent: 'automation' },
  { utterance: 'scraping data pipeline automated', intent: 'automation' },
  { utterance: 'n8n airtable integration automation', intent: 'automation' },
  { utterance: 'prompt engineering workflow AI tools', intent: 'automation' },

  // trading
  { utterance: 'crypto trading signals bot', intent: 'trading' },
  { utterance: 'stock market algorithmic trading', intent: 'trading' },
  { utterance: 'forex investing arbitrage', intent: 'trading' },
  { utterance: 'options trading income strategy', intent: 'trading' },
  { utterance: 'DeFi yield farming staking', intent: 'trading' },

  // consulting
  { utterance: 'AI consulting business strategy', intent: 'consulting' },
  { utterance: 'advise companies on technology', intent: 'consulting' },
  { utterance: 'fractional CTO advisor equity', intent: 'consulting' },
  { utterance: 'coaching clients one-on-one', intent: 'consulting' },

  // physical_product
  { utterance: 'sell physical products Amazon FBA', intent: 'physical_product' },
  { utterance: 'dropshipping ecommerce store', intent: 'physical_product' },
  { utterance: 'print on demand merch', intent: 'physical_product' },
  { utterance: 'etsy handmade products sell', intent: 'physical_product' },
  { utterance: 'wholesale resell products', intent: 'physical_product' },
];

export const CATEGORIES = [
  'saas',
  'freelance',
  'content_creation',
  'automation',
  'trading',
  'consulting',
  'physical_product',
  'unknown',
];
