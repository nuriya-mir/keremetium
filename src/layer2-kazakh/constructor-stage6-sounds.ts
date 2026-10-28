import { buildConstructorStage4, SOUND_WORDS, type ConstructorStage4SoundWord, type ConstructorStage4Practice } from './constructor-stage4';
import { realizeConstructorWord, type ConstructorStep } from './constructor-realization';
import { FULL_LEXEMES, realizeFullConstructorWord } from './full-meaning-constructor';
import { ROOTS_BY_ID } from './roots';
import { getVowelRow, getEndingClass, pickPluralSuffix } from './phonetics';
import type { ConstructorStage6SoundsSourceId } from './constructor-stage6-sounds-evidence';
import { buildConstructorWave3WordFormation, type ConstructorWave3DerivationInput, type ConstructorWave3DerivationMetadata } from './constructor-wave3-word-formation';

export const CONSTRUCTOR_STAGE6_CHAIN_WORDS = [
  { id: 'kitap', labelRu: 'книга' }, { id: 'esik', labelRu: 'дверь' },
  { id: 'suraq', labelRu: 'вопрос' }, { id: 'bala', labelRu: 'ребёнок' },
] as const;
export const CONSTRUCTOR_STAGE6_CHAIN_OWNERS = ['none', 'men', 'sen', 'siz', 'ol', 'biz', 'sender', 'sizder', 'olar'] as const;
export const CONSTRUCTOR_STAGE6_CHAIN_CASES = ['nominative', 'dative', 'locative', 'ablative'] as const;
export type ConstructorStage6WordChainInput = {
  kind: 'word-chain';
  wordId: typeof CONSTRUCTOR_STAGE6_CHAIN_WORDS[number]['id'];
  number: 'one' | 'many';
  owner: typeof CONSTRUCTOR_STAGE6_CHAIN_OWNERS[number];
  case: typeof CONSTRUCTOR_STAGE6_CHAIN_CASES[number];
};
export interface ConstructorStage6SoundChainStep {
  role: 'stem' | 'plural' | 'possessive' | 'case';
  labelRu: string;
  /** Part of the final spelling. The stem can differ from its dictionary form. */
  text: string;
  /** Complete intermediate word; never show a changed stem as a dictionary word. */
  word: string;
  thoughtRu: string;
  explanationRu: string;
}
export const CONSTRUCTOR_STAGE6_SOUND_STAGES = ['root', 'plural', 'possessive', 'plural-possessive', 'plural-possessive-ablative'] as const;
export type ConstructorStage6SoundStage = typeof CONSTRUCTOR_STAGE6_SOUND_STAGES[number];
export type ConstructorStage6SoundsInput =
  | ConstructorWave3DerivationInput
  | ConstructorStage6WordChainInput
  | { kind: 'plural'; wordId: ConstructorStage4SoundWord }
  | { kind: 'structure'; stage: ConstructorStage6SoundStage }
  | { kind: 'depiction'; wordId: 'tars' | 'jalt'; repeated: boolean };
export interface ConstructorStage6SoundsResult {
  status: 'prepared' | 'needs-evidence';
  integrationStatus: 'prepared';
  outputKind: 'written-word';
  text: string | null;
  thoughtRu: string;
  parts: string[];
  explanationRu: string;
  condition: { row: 'hard' | 'soft'; endingClass: string; suffix: string } | null;
  sourceIds: ConstructorStage6SoundsSourceId[];
  limits: string[];
  audio: null;
  acceptedAnswers: string[];
  chainSteps?: ConstructorStage6SoundChainStep[];
  derivation?: ConstructorWave3DerivationMetadata;
  practice?: ConstructorStage4Practice;
  stemChange?: { before: string; after: string; explanationRu: string } | null;
  writingBoundary?: { kind: 'solid' | 'hyphen'; explanationRu: string };
}
const limits = ['Проверяется только подготовленное написание. Аудио, произношение, ударение и интонация не проверяются.'];
const result = (text: string | null, thoughtRu: string, parts: string[], explanationRu: string, sourceIds: ConstructorStage6SoundsSourceId[], boundary: string, condition: ConstructorStage6SoundsResult['condition'] = null): ConstructorStage6SoundsResult => ({ status: text ? 'prepared' : 'needs-evidence', integrationStatus: 'prepared', outputKind: 'written-word', text, thoughtRu, parts, explanationRu, condition, sourceIds, limits: [...limits, boundary], audio: null, acceptedAnswers: text ? [text] : [] });
const rejected = () => result(null, '', [], 'Выбери подготовленный пример и только его доступные изменения.', [], 'Для переданного сочетания нет отдельного проверенного результата.');
const exactKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key));

const chainCaseIndices = { nominative: 0, dative: 2, locative: 4, ablative: 5 } as const;
const chainNouns = {
  kitap: { gender: 'f', animate: false, one: ['книга', 'книге', 'книге', 'книги'], many: ['книги', 'книгам', 'книгах', 'книг'] },
  esik: { gender: 'f', animate: false, one: ['дверь', 'двери', 'двери', 'двери'], many: ['двери', 'дверям', 'дверях', 'дверей'] },
  suraq: { gender: 'm', animate: false, one: ['вопрос', 'вопросу', 'вопросе', 'вопроса'], many: ['вопросы', 'вопросам', 'вопросах', 'вопросов'] },
  bala: { gender: 'm', animate: true, one: ['ребёнок', 'ребёнку', 'ребёнка', 'ребёнка'], many: ['дети', 'детям', 'детей', 'детей'] },
} as const;

/** Russian labels reflect the selected number even when a group owner's ending contains plural. */
function chainThought(input: ConstructorStage6WordChainInput): string {
  const noun = chainNouns[input.wordId], ci = CONSTRUCTOR_STAGE6_CHAIN_CASES.indexOf(input.case);
  const modifierIndex = noun.animate && input.case === 'locative' ? 3 : ci;
  const soft = input.owner === 'men' || input.owner === 'sen';
  const stems = { men: 'мо', sen: 'тво', siz: 'Ваш', biz: 'наш', sender: 'ваш', sizder: 'Ваш' } as const;
  const endings = input.number === 'many' ? ['и', 'им', 'их', 'их']
    : noun.gender === 'f' ? (soft ? ['я', 'ей', 'ей', 'ей'] : ['а', 'ей', 'ей', 'ей'])
      : (soft ? ['й', 'ему', 'ём', 'его'] : ['', 'ему', 'ем', 'его']);
  const owner = input.owner === 'none' ? '' : input.owner === 'ol' ? 'его / её ' : input.owner === 'olar' ? 'их ' : stems[input.owner] + endings[modifierIndex] + ' ';
  const prefix = input.case === 'dative' ? 'к ' : input.case === 'locative' ? (noun.animate ? 'у ' : 'в ') : input.case === 'ablative' ? (noun.animate ? 'от ' : 'из ') : '';
  return prefix + owner + noun[input.number][ci];
}

function realizeChain(input: ConstructorStage6WordChainInput) {
  const steps: ConstructorStep[] = [];
  if (input.number === 'many') steps.push({ id: 'plural', value: 0 });
  if (input.owner !== 'none') steps.push({ id: 'poss', value: CONSTRUCTOR_STAGE6_CHAIN_OWNERS.indexOf(input.owner) - 1 });
  if (input.case !== 'nominative') steps.push({ id: 'case', value: chainCaseIndices[input.case] });
  return realizeConstructorWord({ base: 'noun', variant: 'basic', meaning: chainNouns[input.wordId].one[0], steps });
}

function buildWordChain(input: ConstructorStage6WordChainInput): ConstructorStage6SoundsResult {
  const record = input as unknown as Record<string, unknown>;
  if (!exactKeys(record, ['kind', 'wordId', 'number', 'owner', 'case'])
    || !CONSTRUCTOR_STAGE6_CHAIN_WORDS.some(word => word.id === input.wordId)
    || !['one', 'many'].includes(input.number)
    || !(CONSTRUCTOR_STAGE6_CHAIN_OWNERS as readonly string[]).includes(input.owner)
    || !(CONSTRUCTOR_STAGE6_CHAIN_CASES as readonly string[]).includes(input.case)) return rejected();
  const built = realizeChain(input);
  if (built.status !== 'ready' || !built.kz || !built.parts || built.parts.join('') !== built.kz) return rejected();
  const root = ROOTS_BY_ID[input.wordId], parts = built.parts;
  const groupOwner = input.owner === 'sender' || input.owner === 'sizder';
  const pluralPart = input.number === 'many' || groupOwner;
  const row = root.vowelRow ?? getVowelRow(root.kz);
  const rowRu = row === 'hard' ? 'твёрдого' : 'мягкого';
  const stemChange = parts[0] === root.kz ? null : {
    before: root.kz, after: parts[0],
    explanationRu: 'Перед гласной окончания принадлежности последняя буква этой основы меняется: «' + root.kz.at(-1) + '» → «' + parts[0].at(-1) + '». Это написание основы внутри готового слова.',
  };
  const stemExplanation = input.wordId === 'kitap'
    ? 'Слово содержит «і» и «а». Для этих окончаний важен последний слог с «а»: выбираем твёрдый ряд.'
    : 'Исходное слово — «' + root.kz + '». Для выбранных окончаний берём варианты ' + rowRu + ' ряда гласных.';
  const chainSteps: ConstructorStage6SoundChainStep[] = [{
    role: 'stem', labelRu: 'Основа', text: parts[0], word: root.kz,
    thoughtRu: chainThought({ ...input, number: 'one', owner: 'none', case: 'nominative' }),
    explanationRu: stemExplanation + (stemChange ? ' ' + stemChange.explanationRu : ''),
  }];
  let partIndex = 1;
  if (pluralPart) {
    const pluralInput: ConstructorStage6WordChainInput = { ...input, number: 'many', owner: 'none', case: 'nominative' };
    const plural = realizeChain(pluralInput);
    const reason = pickPluralSuffix(root.kz, row).ruleRu;
    chainSteps.push({
      role: 'plural', labelRu: groupOwner && input.number === 'one' ? 'Часть формы для «вы»' : 'Число',
      text: parts[partIndex++], word: plural.kz!, thoughtRu: chainThought(pluralInput),
      explanationRu: reason + (groupOwner ? ' В форме принадлежности группе «вы» эта часть нужна и для одной вещи. Число вещей задаёт выбранный смысл.' : ' Эта часть показывает, что предметов несколько.')
        + ' Перед ней последняя буква основы сохраняется.',
    });
  }
  if (input.owner !== 'none') {
    const ownedInput: ConstructorStage6WordChainInput = { ...input, case: 'nominative' };
    const owned = realizeChain(ownedInput);
    const suffix = parts[partIndex++];
    const preceding = pluralPart ? chainSteps.at(-1)!.word : root.kz;
    const afterVowel = getEndingClass(preceding) === 'V';
    chainSteps.push({
      role: 'possessive', labelRu: 'Принадлежность', text: suffix, word: owned.kz!, thoughtRu: chainThought(ownedInput),
      explanationRu: 'Окончание «-' + suffix + '» показывает связь с выбранным человеком. Перед ним ' + (afterVowel ? 'гласная' : 'согласная') + '; выбран вариант ' + rowRu + ' ряда.'
        + (stemChange ? ' ' + stemChange.explanationRu : pluralPart ? ' Оно следует за окончанием множественного числа; исходная основа уже не стоит рядом с этой гласной.' : '')
        + (input.owner === 'ol' || input.owner === 'olar' ? ' Одинаковое окончание само по себе не различает «его / её» и «их».' : ''),
    });
  }
  if (input.case !== 'nominative') {
    const before = chainSteps.at(-1)!.word, suffix = parts[partIndex++];
    const thirdOwner = input.owner === 'ol' || input.owner === 'olar';
    const shortDative = input.case === 'dative' && ['men', 'sen', 'sender'].includes(input.owner);
    const condition = thirdOwner ? 'После окончания принадлежности третьего лица'
      : shortDative ? 'После окончания принадлежности на «м» или «ң»'
        : 'После конца «' + before.at(-1) + '» в уже собранном слове';
    chainSteps.push({
      role: 'case', labelRu: 'Связь во фразе', text: suffix, word: built.kz, thoughtRu: chainThought(input),
      explanationRu: condition + ' здесь добавляется «-' + suffix + '». ' + ({ dative: 'Показываем, к кому или к чему направлена связь.', locative: 'Показываем, у кого или в чём находится что-либо.', ablative: 'Показываем, от кого или из чего что-либо исходит.' }[input.case]),
    });
  }
  const writingBoundary = { kind: 'solid' as const, explanationRu: 'Части показаны отдельно только для разбора. В готовом слове между ними нет пробелов или дефисов.' };
  const explanation = 'Сначала выбираем основу, затем добавляем число, принадлежность и связь во фразе. ' + stemExplanation + ' ' + (stemChange?.explanationRu ?? 'В этой цепочке написание исходной основы сохраняется.') + ' ' + writingBoundary.explanationRu;
  return {
    ...result(built.kz, chainThought(input), parts, explanation, ['sounds-word-chain', 'sounds-written-boundaries'],
      'Только четыре подготовленных слова, восемь вариантов владельца или отсутствие владельца, одно/несколько и четыре формы. Это часть фразы; событие, время и новые слова не добавляются.',
      { row, endingClass: getEndingClass(chainSteps.length > 1 ? chainSteps.at(-2)!.word : root.kz), suffix: parts.length > 1 ? parts.at(-1)! : '' }),
    chainSteps, stemChange, writingBoundary,
  };
}

export function buildConstructorStage6Sounds(input: ConstructorStage6SoundsInput): ConstructorStage6SoundsResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return rejected();
  const record = input as unknown as Record<string, unknown>;
  if (input.kind === 'word-chain') return buildWordChain(input);
  if (input.kind === 'derivation') return buildConstructorWave3WordFormation(input) ?? rejected();
  if (input.kind === 'plural') {
    if (!exactKeys(record, ['kind', 'wordId']) || !SOUND_WORDS.some(word => word.id === input.wordId)) return rejected();
    const built = buildConstructorStage4({ kind: 'sounds', wordId: input.wordId });
    const root = ROOTS_BY_ID[input.wordId], suffix = pickPluralSuffix(root.kz, root.vowelRow);
    if (built.status !== 'ready' || !built.text || !built.practice) return rejected();
    return result(built.practice.word.text, built.thoughtRu, [root.kz, suffix.suffix], suffix.ruleRu, ['sounds-plural'], 'Доступны шесть слов. Выбор окончания не заменяет полный разбор системы звуков.', { row: root.vowelRow ?? getVowelRow(root.kz), endingClass: getEndingClass(root.kz), suffix: suffix.suffix });
  }
  if (input.kind === 'structure') {
    if (!exactKeys(record, ['kind', 'stage']) || !(CONSTRUCTOR_STAGE6_SOUND_STAGES as readonly string[]).includes(input.stage)) return rejected();
    const steps: ConstructorStep[] = [];
    if (input.stage.includes('plural')) steps.push({ id: 'plural', value: 0 });
    if (input.stage.includes('possessive')) steps.push({ id: 'poss', value: 0 });
    if (input.stage.includes('ablative')) steps.push({ id: 'case', value: 5 });
    const built = realizeConstructorWord({ base: 'noun', variant: 'basic', meaning: 'книга', steps });
    if (built.status !== 'ready' || !built.kz || !built.ru || !built.parts || built.parts.join('') !== built.kz) return rejected();
    const explanation = input.stage === 'possessive' ? 'Перед окончанием принадлежности написание последней согласной основы меняется. Части показаны в готовом слове.' : input.stage === 'root' ? 'Показан корень без добавленных частей.' : 'Показаны только выбранные части: сначала число, затем принадлежность, затем падеж. Готовое слово пишется слитно.';
    return result(built.kz, built.ru, built.parts, explanation, ['sounds-structure'], 'Только слово «книга», принадлежность «моя» и один исходный падеж. Это показ порядка частей, а не свободное словообразование.');
  }
  if (input.kind === 'depiction') {
    if (!exactKeys(record, ['kind', 'wordId', 'repeated']) || !['tars', 'jalt'].includes(input.wordId) || typeof input.repeated !== 'boolean') return rejected();
    const lex = FULL_LEXEMES.find(word => word.id === input.wordId)!;
    const built = realizeFullConstructorWord({ base: lex.base, variant: lex.variant, meaning: lex.ru, steps: input.repeated ? [{ id: 'imitRepeat', value: 0 }] : [] });
    if (built.status !== 'ready' || !built.kz || !built.ru) return rejected();
    const writingBoundary = input.repeated
      ? { kind: 'hyphen' as const, explanationRu: 'Между частями этой закреплённой пары пишется дефис без пробелов. Вторую часть нельзя получить свободной заменой гласной.' }
      : { kind: 'solid' as const, explanationRu: 'Исходная форма пишется одним словом. Парный вариант выбирается отдельно.' };
    return { ...result(built.kz, built.ru, built.parts ?? [built.kz], 'Это закреплённый пример. Парная форма берётся целиком из подготовленного набора. ' + writingBoundary.explanationRu, ['sounds-depiction', 'sounds-written-boundaries'], 'Русская подпись передаёт общий характер впечатления. Произвольный звук, движение, фраза или глагол не добавляются.'), writingBoundary };
  }
  return rejected();
}

export function checkConstructorStage6SoundsAnswer(input: ConstructorStage6SoundsInput, answer: string) {
  const built = buildConstructorStage6Sounds(input);
  if (!built.text || typeof answer !== 'string') return { passed: null, expected: built.text, messageRu: 'Для этой проверки нет подготовленного ответа.' };
  const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('kk');
  const passed = normalize(answer) === normalize(built.text);
  return { passed, expected: built.text, messageRu: passed ? 'Написание совпадает с подготовленным примером.' : 'Сравни с подготовленным написанием. Другой вариант здесь ещё не проверен.' };
}

/** Only the reviewed derivation branch exposes a part exercise. */
export function checkConstructorStage6SoundsPartAnswer(input: ConstructorStage6SoundsInput, answer: unknown) {
  const built = buildConstructorStage6Sounds(input);
  const expected = built.practice?.part.text ?? null;
  if (!expected || typeof answer !== 'string') return { passed: null, expected, messageRu: 'Для этой проверки нет подготовленной части слова.' };
  const passed = answer.normalize('NFC').trim().toLocaleLowerCase('kk') === expected;
  return { passed, expected, messageRu: passed ? 'Часть подходит к выбранному слову и смыслу.' : 'Сравни часть и её задачу в этом слове.' };
}
