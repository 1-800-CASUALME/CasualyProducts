import basicPkg from '@nlpjs/basic';
import { TRAINING_DATA } from '../../config/nlp-training.js';

const { dockStart } = basicPkg;

let _nlp = null;

/**
 * Returns a trained NLP.js instance singleton.
 * Training happens once on first call.
 */
export async function getNlpManager() {
  if (_nlp) return _nlp;

  const dock = await dockStart({ use: ['Basic'] });
  const nlp  = dock.get('nlp');

  nlp.addLanguage('en');

  for (const { utterance, intent } of TRAINING_DATA) {
    nlp.addDocument('en', utterance, intent);
  }

  // Suppress noisy epoch logs during training
  const origLog = console.log;
  console.log = () => {};
  await nlp.train();
  console.log = origLog;

  _nlp = nlp;
  return _nlp;
}
