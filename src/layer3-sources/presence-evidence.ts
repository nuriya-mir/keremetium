import type { LanguageConstruction } from './registry';

export const PRESENCE_CONSTRUCTIONS: LanguageConstruction[] = ['T56_LOC_BAR', 'KZ_PRESENCE_NEG', 'KZ_PRESENCE_Q', 'KZ_PRESENCE_NEG_Q'].map(id => ({
  id, language: 'kk', intentionIds: ['presence'],
  evidence: [{
    sourceId: 'kuzekova-masakova-2018', status: 'checked',
    locator: 'https://tilqural.kz/assets/books/d76b6b1027365e54f79e08d1acbe3fd8.pdf — printed/PDF pp. 59, 108, 140, 210; eight locative pronouns, бар/жоқ, separate бар ма and жоқ па questions; checked 2026-10-19; docs/grammar-checks/2026-10-19-presence.md; docs/grammar-checks/2026-10-19-presence-questions.md',
  }],
}));
