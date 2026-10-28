/** Read-only reference adapter. It adds no grammar rules or arbitrary word generation. */
import inventory from '../../../docs/grammar-checks/2026-10-23-affix-groups-regrouped.json';
import { realizeFullConstructorWord, type FullConstructorWord } from './full-meaning-constructor';
import { type ConstructorOptions, type ConstructorResult } from './constructor-realization';

export const AFFIX_GUIDE_FAMILIES = inventory.groups.map(g => ({
  number: g.number, id: g.id, section: g.section,
  variants: g.variants.map(v => ({ form: v.form, condition: v.condition })),
}));

export interface GuideCorePair { before: ConstructorResult; after: ConstructorResult }

export function getAffixGuideExamples(options: ConstructorOptions = {}): Record<string, GuideCorePair[]> {
  const output: Record<string, GuideCorePair[]> = {};
  const word = (base: string, meaning: string, steps: { id: string; value: number }[] = [], extra: Partial<FullConstructorWord> = {}): FullConstructorWord => ({ base, meaning, steps, ...extra, variant: extra.variant ?? 'basic' });
  const noun = (steps: { id: string; value: number }[] = []) => word('noun', 'книга', steps);
  const verb = (steps: { id: string; value: number }[] = []) => word('verb', 'говорить', steps);
  const step = (id: string, value = 0) => ({ id, value });
  const say = (time = 0, person = 0) => verb([step('vtime', time), step('person', person)]);
  const add = (id: string | number, before: FullConstructorWord, after: FullConstructorWord) => {
    const a = realizeFullConstructorWord(before, options), b = realizeFullConstructorWord(after, options);
    if (['ready', 'stem'].includes(a.status) && ['ready', 'stem'].includes(b.status) && a.kz && b.kz && a.ru && b.ru) (output[String(id)] ??= []).push({ before: a, after: b });
  };
  add(1, noun(), noun([step('plural')]));
  add(2, noun(), noun([step('poss')]));
  add(2, noun([step('plural')]), noun([step('plural'), step('poss')]));
  for (const [n, ci] of [[4, 2], [5, 4], [6, 5], [7, 6], [8, 3]]) add(n, noun(), noun([step('case', ci)]));
  add(3, word('pronoun', 'я', [step('pronounPerson')], { variant: 'personal' }), word('pronoun', 'я', [step('pronounPerson'), step('case', 1)], { variant: 'personal' }));
  add(9, say(0, 3), say());
  add(11, verb([step('actionNoun')]), say());
  add(12, say(), say(1));
  add(13, say(), say(2));
  add(14, say(), say(4));
  add(15, say(), say(5));
  add(16, say(), say(6));
  add(17, say(), verb([step('vneg'), step('vtime'), step('person')]));
  add(18, say(), verb([step('conditional'), step('person')]));
  add(19, say(), verb([step('wish'), step('wishOwner'), step('wishAux'), step('auxTime'), step('person', 3)]));
  add(21, say(), verb([step('command'), step('person')]));
  add(22, verb(), verb([step('actionNoun')]));
  add(23, say(), say(3));
  add(81, word('adjective', 'большой'), word('adjective', 'большой', [step('degree')]));
  add(82, word('adjective', 'большой'), word('adjective', 'большой', [step('degree', 1)]));
  add(84, word('numeral', 'пять'), word('numeral', 'пять', [step('ordinal')]));
  add(85, word('numeral', 'два'), word('numeral', 'два', [step('collective')]));
  add('want', say(), verb([step('wish'), step('wishOwner'), step('wishAux'), step('auxTime'), step('person', 3)]));
  add('can', say(), verb([step('link', 1), step('aux', 1), step('auxTime'), step('person')]));
  add('progress', say(), verb([step('link'), step('aux'), step('auxTime'), step('person')]));
  add('need', say(), verb([step('need'), step('poss'), step('modal')]));
  add('question', say(0, 1), verb([step('vtime'), step('person', 1), step('question')]));
  add('after', word('noun', 'работа'), word('noun', 'работа', [step('case', 5), step('postposition')]));
  add('pronoun', word('pronoun', 'я', [step('pronounPerson')], { variant: 'personal' }), word('pronoun', 'я', [step('pronounPerson', 4)], { variant: 'personal' }));
  add('negative', word('adjective', 'большой', [step('nominalPredicate'), step('person')]), word('adjective', 'большой', [step('nominalNeg'), step('person')]));
  add('identity', word('adjective', 'большой'), word('adjective', 'большой', [step('nominalPredicate'), step('person', 3)]));
  add('manner', word('adjective', 'хороший'), word('adjective', 'хороший', [step('adverbRole')]));
  add('repeat', word('imitative', 'резкий звук'), word('imitative', 'резкий звук', [step('imitRepeat')]));
  const chain = [noun(), noun([step('plural')]), noun([step('plural'), step('poss')]), noun([step('plural'), step('poss'), step('case', 5)])];
  chain.slice(1).forEach((v, i) => add('book-chain', chain[i], v));
  return output;
}
