import type { KazakhRoot } from '../types';

/** Attested words; sentence forms are built by the core, never stored as UI copy. */
export const NOMINAL_WORDS = [
  { id: 'dariger', kz: 'дәрігер', ru: 'врач', pos: 'noun', vowelRow: 'soft', endingClass: 'R', alternation: null, predicateRu: ['врач', 'врачи'] },
  { id: 'mugalim', kz: 'мұғалім', ru: 'учитель', pos: 'noun', vowelRow: 'soft', endingClass: 'ZMN', alternation: null, predicateRu: ['учитель', 'учителя'] },
  { id: 'oqyushy', kz: 'оқушы', ru: 'ученик', pos: 'noun', vowelRow: 'hard', endingClass: 'V', alternation: null, predicateRu: ['ученик', 'ученики'] },
  { id: 'jas', kz: 'жас', ru: 'молодой', pos: 'adjective', vowelRow: 'hard', endingClass: 'VOICELESS', alternation: null, predicateRu: ['молод(а)', 'молоды'] },
  { id: 'bos', kz: 'бос', ru: 'свободный', pos: 'adjective', vowelRow: 'hard', endingClass: 'VOICELESS', alternation: null, predicateRu: ['свободен / свободна', 'свободны'] },
  { id: 'azir', kz: 'әзір', ru: 'готовый', pos: 'adjective', vowelRow: 'soft', endingClass: 'R', alternation: null, predicateRu: ['готов(а)', 'готовы'] },
  { id: 'kushti', kz: 'күшті', ru: 'сильный', pos: 'adjective', vowelRow: 'soft', endingClass: 'V', alternation: null, predicateRu: ['силён / сильна', 'сильны'] },
] satisfies (KazakhRoot & { predicateRu: string[] })[];

export const NOMINAL_WORDS_BY_ID = Object.fromEntries(NOMINAL_WORDS.map(word => [word.id, word]));
export const NOMINAL_TOPIC_IDS: readonly string[] = ['KZ_IDENTITY_AFF', 'KZ_IDENTITY_NEG', 'KZ_IDENTITY_Q', 'KZ_IDENTITY_NEG_Q', 'KZ_QUALITY_AFF', 'KZ_QUALITY_NEG', 'KZ_QUALITY_Q', 'KZ_QUALITY_NEG_Q'];
export const isNominalTopic = (id: string) => NOMINAL_TOPIC_IDS.includes(id);
export function nominalRootIds(topic: string): string[] {
  return NOMINAL_WORDS.filter(word => word.pos === (topic.startsWith('KZ_QUALITY_') ? 'adjective' : 'noun')).map(word => word.id);
}

export const isNegativeNominalTopic = (topic: string) => isNominalTopic(topic) && topic.includes('_NEG');
export const isQuestionNominalTopic = (topic: string) => isNominalTopic(topic) && topic.endsWith('_Q');
