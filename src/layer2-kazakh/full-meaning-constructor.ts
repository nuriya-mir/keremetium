import { FORMULA_CARDS } from '../layer1-meanings/formulas';
import { buildForm } from './form-builder';
import { ROOTS_BY_ID } from './roots';
import { NOMINAL_WORDS } from './nominal-lexicon';
import { CONSTRUCTOR_LEXEMES, realizeConstructorWord, type ConstructorWord, type ConstructorOptions, type ConstructorResult } from './constructor-realization';
import type { PersonId } from '../types';

// Closed lexical additions. Evidence and limits: docs/grammar-checks/2026-10-22-full-constructor.md.
const extra = [
  { id: 'bul', base: 'pronoun', variant: 'pointing', kz: 'бұл', ru: 'это' },
  { id: 'sol', base: 'pronoun', variant: 'pointing', kz: 'сол', ru: 'то' },
  { id: 'kim', base: 'pronoun', variant: 'interrogative', kz: 'кім', ru: 'кто' },
  { id: 'ne', base: 'pronoun', variant: 'interrogative', kz: 'не', ru: 'что' },
  { id: 'oz', base: 'pronoun', variant: 'reflexive', kz: 'өз', ru: 'сам' },
  { id: 'tars', base: 'imitative', variant: 'basic', kz: 'тарс', ru: 'резкий звук удара' },
  { id: 'jalt', base: 'imitative', variant: 'basic', kz: 'жалт', ru: 'внезапный блеск или движение' },
  { id: 'jane', base: 'service', variant: 'conjunction', kz: 'және', ru: 'и' },
  { id: 'biraq', base: 'service', variant: 'conjunction', kz: 'бірақ', ru: 'но' },
  { id: 'ushin', base: 'service', variant: 'postposition', kz: 'үшін', ru: 'для, ради' },
  { id: 'keiyn', base: 'service', variant: 'postposition', kz: 'кейін', ru: 'после' },
  { id: 'gana', base: 'service', variant: 'particle', kz: 'ғана', ru: 'только' },
  { id: 'alaqai', base: 'interjection', variant: 'basic', kz: 'Алақай!', ru: 'Ура!' },
  { id: 'oi', base: 'interjection', variant: 'basic', kz: 'Ой!', ru: 'Ой!' },
  { id: 'masqara', base: 'interjection', variant: 'basic', kz: 'Масқара!', ru: 'Ужас!' },
];
export const FULL_LEXEMES = [...CONSTRUCTOR_LEXEMES.map(l => ({ ...l, variant: l.base === 'adjective' ? 'quality' : l.base === 'adverb' ? ['osynda', 'bunda'].includes(l.id) ? 'place' : l.id === 'tez' ? 'manner' : 'time' : l.base === 'numeral' ? Number(l.id.slice(6)) <= 7 ? 'small' : 'other' : 'basic' })),
  { id: 'personal', base: 'pronoun', variant: 'personal', kz: '', ru: 'я / ты / он / мы', aliases: [] },
  ...extra.map(l => ({ ...l, aliases: [] as string[] }))];
export interface FullConstructorWord extends ConstructorWord { recipe?: string; who?: number; future?: boolean }
const people: PersonId[] = ['men', 'sen', 'siz', 'ol', 'biz', 'sender', 'sizder', 'olar'];
const subjects = ['Я', 'Ты', 'Вы', 'Он или она', 'Мы', 'Вы', 'Вы', 'Они'];
const nounCards = new Set(['T10_PLURAL', 'T13_POSSESSIVE', 'T56_LOC_BAR', 'T64_GEN_POSS_BAR', 'T17_DATIVE', 'T18_LOCATIVE', 'T19_ABLATIVE', 'T20_INSTRUMENTAL', 'T21_ACCUSATIVE']);
export const FULL_RECIPES = FORMULA_CARDS.map(c => ({ id: c.id,
  base: c.id.startsWith('KZ_QUALITY') ? 'adjective' : c.id.startsWith('KZ_') || nounCards.has(c.id) ? 'noun' : 'verb',
  label: c.thoughtTitleRu.replace(/\s*\(.*/, '').replace(/\s*←.*/, '').trim(),
  family: /T8[3468]_/.test(c.id) ? 'Желание' : /T7[23]_/.test(c.id) ? 'Возможность' : /T9[349]_|T101_/.test(c.id) ? 'Необходимость и разрешение' : /T4[03689]_|T50_|T121_/.test(c.id) ? 'Связать мысли' : /T2[24]_/.test(c.id) ? 'Побуждение' : c.id.includes('PRESENCE') || /T56_|T64_/.test(c.id) ? 'Есть и нет' : /KZ_/.test(c.id) ? 'Кто и какой' : c.id.startsWith('T1') || c.id.startsWith('T20') || c.id.startsWith('T21') ? 'Предмет' : 'Время и вопрос',
  search: c.searchPhrasesRu,
}));
export function constructorRecipeApplies(id: string, lexId: string): boolean {
  const recipe = FULL_RECIPES.find(r => r.id === id), lex = FULL_LEXEMES.find(l => l.id === lexId);
  if (!recipe || !lex || recipe.base !== lex.base) return false;
  if (id.startsWith('KZ_QUALITY') || id.startsWith('KZ_IDENTITY')) return NOMINAL_WORDS.some(r => r.id === lexId);
  if (id === 'T78_MOTION_FOUR_PROG') return ['bar', 'kel', 'apar', 'akel'].includes(lexId);
  if (id === 'T121_PART_OBJECT_POSS') return lexId === 'oqy';
  if (id === 'T64_GEN_POSS_BAR' && ['qala', 'ui', 'mektep', 'el'].includes(lexId)) return false;
  if (id.includes('PRESENCE') || id === 'T56_LOC_BAR') return ['kitap', 'su', 'shai', 'nan', 'hat'].includes(lexId);
  return Boolean(ROOTS_BY_ID[lexId]);
}
export function realizeFullConstructorWord(word: FullConstructorWord, options: ConstructorOptions = {}): ConstructorResult {
  const lex = FULL_LEXEMES.find(l => l.base === word.base && (l.ru === word.meaning || l.aliases.includes(word.meaning)));
  const failure = (message: string): ConstructorResult => ({ status: 'unsupported', message });
  if (word.recipe) {
    if (!lex || !constructorRecipeApplies(word.recipe, lex.id)) return failure('Этот способ не применяется к выбранному слову. Выбери другое слово или значение.');
    const p = word.who ?? 0;
    if (!Number.isInteger(p) || p < 0 || p > 7) return failure('Выбери участника разговора.');
    if (word.recipe === 'T22_IMP_1SG' && p !== 0 || word.recipe === 'T24_IMP_1PL' && p !== 4) return failure('У этого побуждения своё лицо: «давай я» или «давайте мы».');
    const simpleNoun = ({ T10_PLURAL: [{ id: 'plural', value: 0 }], T13_POSSESSIVE: [{ id: 'poss', value: p }], T17_DATIVE: [{ id: 'case', value: 2 }], T18_LOCATIVE: [{ id: 'case', value: 4 }], T19_ABLATIVE: [{ id: 'case', value: 5 }], T20_INSTRUMENTAL: [{ id: 'case', value: 6 }], T21_ACCUSATIVE: [{ id: 'case', value: 3 }] } as Record<string, { id: string; value: number }[]>)[word.recipe];
    if (simpleNoun) return realizeConstructorWord({ ...word, steps: simpleNoun }, options);
    const b = buildForm(word.recipe, lex.id, people[p]);
    if (b.rootId !== lex.id) return failure('Для выбранного слова нет проверенного написания.');
    const ru = options.translateBuilt?.(b) || (word.recipe.startsWith('KZ_') ? b.beforeCheck.promptRu : undefined);
    if (!ru) return failure('Для этого сочетания нет проверенного перевода.');
    const kz = b.afterCheck.canonicalFormKz;
    const raw = b.afterCheck.coloredSegments.filter(s => !s.isOptionalBracket).map(s => s.text.trim()).filter(Boolean);
    const parts = raw.join('').replace(/\s/g, '') === kz.replace(/\s/g, '') ? raw : [kz];
    const subject = subjects[p], predicate = ru.startsWith(subject + ' ') ? ru.slice(subject.length + 1) : undefined;
    const conditional = /T46_|T48_|T88_|T49_|T50_/.test(word.recipe);
    return { status: 'ready', kz, ru, parts, kind: 'predicate', rootId: lex.id, person: p, verb: lex.base === 'verb', predicate: !conditional, conditional, question: word.recipe.endsWith('_Q'), ruSubject: subject, ruPredicate: predicate, subjectCaseIndex: /T8[3468]_/.test(word.recipe) ? 1 : /T9[349]_/.test(word.recipe) ? 2 : 0 };
  }
  const closed = lex && extra.find(l => l.id === lex.id);
  if (!closed) return realizeConstructorWord(word, options);
  const ci = word.steps.find(s => s.id === 'case')?.value ?? 0;
  if (['bul', 'sol'].includes(closed.id) && word.steps.every(s => s.id === 'case')) {
    const forms = closed.id === 'bul' ? ['бұл', 'бұның', 'бұған', 'бұны', 'бұнда', 'бұдан', 'бұнымен'] : ['сол', 'соның', 'соған', 'соны', 'сонда', 'содан', 'сонымен'];
    const ru = closed.id === 'bul' ? ['это', 'этого', 'этому', 'это', 'в этом', 'из этого', 'с этим'] : ['то', 'того', 'тому', 'то', 'в том', 'из того', 'с тем'];
    if (!forms[ci]) return failure('Выбери падеж.');
    return { status: 'ready', kz: forms[ci], ru: ru[ci], parts: [forms[ci]], kind: 'noun', caseIndex: ci, ruCases: ru };
  }
  if (closed.id === 'oz') {
    if (word.steps.some(s => s.id !== 'reflexiveOwner')) return failure('Для этого изменения возвратного местоимения здесь показана только схема.');
    const p = word.steps.find(s => s.id === 'reflexiveOwner')?.value;
    if (p === undefined) return { status: 'incomplete', message: 'Выбери, кто делает сам.' };
    const forms = ['өзім', 'өзің', 'өзіңіз', 'өзі', 'өзіміз', 'өздерің', 'өздеріңіз', 'өздері'];
    const ru = ['я сам / сама', 'ты сам / сама', 'Вы сами', 'он сам / она сама', 'мы сами', 'вы сами', 'Вы сами', 'они сами'];
    return forms[p] ? { status: 'ready', kz: forms[p], ru: ru[p], parts: [forms[p]], kind: 'noun', caseIndex: 0, person: p } : failure('Выбери участника.');
  }
  if (word.steps.length) {
    if (closed.base === 'imitative' && word.steps.length === 1 && word.steps[0].id === 'imitRepeat') {
      const kz = closed.id === 'tars' ? 'тарс-тұрс' : 'жалт-жұлт';
      return { status: 'ready', kz, ru: closed.id === 'tars' ? 'повторяющиеся резкие звуки' : 'повторяющийся блеск или мелькание', parts: [kz], kind: 'imitative' };
    }
    return failure('Для этой цепочки здесь показана схема. Проверенного написания пока нет.');
  }
  return { status: 'ready', kz: closed.kz, ru: closed.ru, parts: [closed.kz], kind: closed.base === 'pronoun' ? 'noun' : closed.base, caseIndex: 0 };
}
