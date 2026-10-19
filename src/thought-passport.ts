/** A thought has no book page, word ending or language-specific person identifier. */
export interface ThoughtParticipant {
  person: 1 | 2 | 3;
  number: 'singular' | 'plural';
  address: 'familiar' | 'respectful' | 'unspecified';
}

export interface ThoughtPassport {
  intentionId: string;
  depth: 'impulse' | 'precise' | 'nuanced';
  participants: { actor?: ThoughtParticipant; addressee?: ThoughtParticipant; experiencer?: ThoughtParticipant; possessor?: ThoughtParticipant };
  polarity: 'positive' | 'negative';
  speechAct: 'statement' | 'question';
  time: 'present' | 'past' | 'future' | 'unspecified';
  habitual: boolean;
  modality: 'actual' | 'hypothetical';
  /** A relation connects thoughts; the second thought is supplied separately. */
  links: Array<{ kind: 'cause' | 'purpose' | 'condition'; targetThoughtId?: string }>;
}

export interface MeaningPath {
  id: string;
  coreId: string;
  title: string;
  /** Semantic prerequisites, independent of a textbook's chapters. */
  foundations: Array<'persons' | 'pronouns' | 'plural' | 'cases' | 'negation' | 'sounds'>;
}

/** The product's scope. Missing language material does not remove a path. */
export const MEANING_PATHS: MeaningPath[] = [
  { id: 'presence', coreId: 'existence', title: 'Сказать, что есть или нет', foundations: ['pronouns', 'cases', 'negation'] },
  { id: 'identity', coreId: 'existence', title: 'Назвать, кто или что это', foundations: ['persons', 'negation'] },
  { id: 'ownership', coreId: 'existence', title: 'Сказать, что у кого-то есть', foundations: ['pronouns', 'persons'] },
  { id: 'want', coreId: 'will', title: 'Сказать, чего хочу', foundations: ['sounds', 'persons', 'negation'] },
  { id: 'intend', coreId: 'will', title: 'Сказать, что собираюсь сделать', foundations: ['persons', 'sounds'] },
  { id: 'volunteer', coreId: 'will', title: 'Предложить сделать самому', foundations: ['persons', 'sounds'] },
  { id: 'wish', coreId: 'will', title: 'Пожелать или сказать, на что надеюсь', foundations: ['persons'] },
  { id: 'can', coreId: 'will', title: 'Сказать, что могу или умею', foundations: ['sounds', 'persons', 'negation'] },
  { id: 'need', coreId: 'will', title: 'Сказать, что нужно сделать', foundations: ['persons', 'negation'] },
  { id: 'may', coreId: 'will', title: 'Спросить или дать разрешение', foundations: ['pronouns', 'persons', 'negation'] },
  { id: 'action', coreId: 'action', title: 'Сказать, что делаю, делал или буду делать', foundations: ['persons', 'sounds', 'negation'] },
  { id: 'location', coreId: 'action', title: 'Сказать, где это происходит', foundations: ['cases', 'sounds'] },
  { id: 'destination', coreId: 'action', title: 'Сказать, куда иду', foundations: ['cases', 'sounds'] },
  { id: 'origin', coreId: 'action', title: 'Сказать, откуда иду', foundations: ['cases', 'sounds'] },
  { id: 'route', coreId: 'action', title: 'Сказать, куда и зачем иду', foundations: ['cases', 'persons'] },
  { id: 'possessive', coreId: 'belonging', title: 'Назвать, чьё это', foundations: ['persons', 'pronouns', 'sounds'] },
  { id: 'together', coreId: 'belonging', title: 'Сказать, с кем или чем', foundations: ['cases', 'sounds'] },
  { id: 'relationship', coreId: 'belonging', title: 'Описать связь людей и вещей', foundations: ['cases', 'persons'] },
  { id: 'physical-state', coreId: 'feeling', title: 'Сказать, как себя чувствую', foundations: ['persons', 'pronouns'] },
  { id: 'like', coreId: 'feeling', title: 'Сказать, что нравится', foundations: ['persons', 'cases'] },
  { id: 'miss', coreId: 'feeling', title: 'Сказать, по чему скучаю', foundations: ['persons', 'cases'] },
  { id: 'emotion', coreId: 'feeling', title: 'Рассказать о своих чувствах', foundations: ['persons', 'negation'] },
  { id: 'know', coreId: 'knowledge', title: 'Сказать, что знаю или понимаю', foundations: ['persons', 'negation'] },
  { id: 'opinion', coreId: 'knowledge', title: 'Сказать, что думаю', foundations: ['persons'] },
  { id: 'memory', coreId: 'knowledge', title: 'Рассказать о воспоминании', foundations: ['persons'] },
  { id: 'guess', coreId: 'knowledge', title: 'Сказать, что может быть', foundations: ['persons', 'sounds'] },
  { id: 'evidence', coreId: 'knowledge', title: 'Сказать, откуда это знаю', foundations: ['persons'] },
  { id: 'quality', coreId: 'evaluation', title: 'Описать качество', foundations: ['sounds'] },
  { id: 'degree', coreId: 'evaluation', title: 'Сказать, насколько сильно', foundations: ['plural', 'sounds'] },
  { id: 'comparison', coreId: 'evaluation', title: 'Сравнить', foundations: ['cases', 'sounds'] },
  { id: 'value', coreId: 'evaluation', title: 'Сказать, что для меня важно', foundations: ['negation', 'cases'] },
  { id: 'greet', coreId: 'contact', title: 'Поздороваться и обратиться', foundations: ['persons', 'pronouns'] },
  { id: 'thank', coreId: 'contact', title: 'Поблагодарить', foundations: ['persons'] },
  { id: 'apologize', coreId: 'contact', title: 'Извиниться', foundations: ['persons'] },
  { id: 'invite', coreId: 'contact', title: 'Пригласить или предложить вместе', foundations: ['persons', 'sounds'] },
  { id: 'request', coreId: 'contact', title: 'Попросить вежливо или по-дружески', foundations: ['persons', 'negation'] },
  { id: 'blessing', coreId: 'contact', title: 'Пожелать доброго пути и удачи', foundations: ['persons'] },
];
