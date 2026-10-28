import { getEndingClass, getVowelRow, joinWithBoundaryMerger, pickPossessiveSuffix } from './phonetics';
import type { ConstructorStage6SoundsResult } from './constructor-stage6-sounds';

/** A closed lexical list, reviewed in the wave-three evidence document. */
export const CONSTRUCTOR_WAVE3_DERIVATION_WORDS = [
  { id: 'an', text: 'ән', labelRu: 'песня', ownedRu: 'моя песня' },
  { id: 'balyq', text: 'балық', labelRu: 'рыба', ownedRu: 'моя рыба' },
  { id: 'kitap', text: 'кітап', labelRu: 'книга', ownedRu: 'моя книга' },
  { id: 'dari', text: 'дәрі', labelRu: 'лекарство', ownedRu: 'моё лекарство' },
  { id: 'tuz', text: 'тұз', labelRu: 'соль', ownedRu: 'моя соль' },
  { id: 'kush', text: 'күш', labelRu: 'сила', ownedRu: 'моя сила' },
] as const;
export const CONSTRUCTOR_WAVE3_DERIVATION_RELATIONS = [
  { id: 'person', labelRu: 'Назвать человека по занятию' },
  { id: 'place', labelRu: 'Назвать место' },
  { id: 'with', labelRu: 'Описать то, что есть' },
  { id: 'without', labelRu: 'Сказать, чего нет или мало' },
] as const;
export const CONSTRUCTOR_WAVE3_DERIVATION_VIEWS = [
  { id: 'derived', labelRu: 'Новое слово' },
  { id: 'base-form', labelRu: 'Форма: мой или моя' },
] as const;
export type ConstructorWave3DerivationInput = {
  kind: 'derivation';
  wordId: typeof CONSTRUCTOR_WAVE3_DERIVATION_WORDS[number]['id'];
  relation: typeof CONSTRUCTOR_WAVE3_DERIVATION_RELATIONS[number]['id'];
  view: typeof CONSTRUCTOR_WAVE3_DERIVATION_VIEWS[number]['id'];
};

interface DerivationEntry {
  wordId: ConstructorWave3DerivationInput['wordId'];
  relation: ConstructorWave3DerivationInput['relation'];
  suffix: string;
  text: string;
  thoughtRu: string;
  meaningChangeRu: string;
  suffixReasonRu: string;
  aliasesRu: readonly string[];
  questionNumbers: readonly string[];
}

// Every derivative exists independently in the normative dictionary. Neither the
// suffix spelling nor the Russian gloss licenses another base/suffix combination.
export const CONSTRUCTOR_WAVE3_DERIVATIONS: readonly DerivationEntry[] = [
  { wordId: 'an', relation: 'person', suffix: 'ші', text: 'әнші', thoughtRu: 'певец',
    meaningChangeRu: 'Песня — то, что поют. Новое слово называет человека, который поёт.',
    suffixReasonRu: 'В слове «ән» мягкий ряд гласных. Для этого названия человека добавляется «-ші».',
    aliasesRu: ['певица', 'от песни к певцу', 'как назвать человека который поёт'],
    questionNumbers: ['2.2', '4.4', '4.8', '4.11', '5.1', '5.4', '5.5'] },
  { wordId: 'balyq', relation: 'person', suffix: 'шы', text: 'балықшы', thoughtRu: 'рыбак',
    meaningChangeRu: 'Рыба — животное. Новое слово называет человека, который ловит рыбу.',
    suffixReasonRu: 'В слове «балық» твёрдый ряд гласных. Для этого названия человека добавляется «-шы».',
    aliasesRu: ['от рыбы к рыбаку', 'как назвать человека который ловит рыбу'],
    questionNumbers: ['2.2', '4.4', '4.8', '4.11', '5.1', '5.4', '5.5'] },
  { wordId: 'kitap', relation: 'place', suffix: 'хана', text: 'кітапхана', thoughtRu: 'библиотека',
    meaningChangeRu: 'Книга — предмет. Новое слово называет место, где хранят и выдают книги для чтения.',
    suffixReasonRu: 'В этом слове добавляется «-хана». Эта часть сохраняет своё написание; мягкий вариант для неё здесь не выбирают.',
    aliasesRu: ['от книги к библиотеке', 'как образовано слово библиотека'],
    questionNumbers: ['4.4', '4.11', '5.1', '5.7'] },
  { wordId: 'dari', relation: 'place', suffix: 'хана', text: 'дәріхана', thoughtRu: 'аптека',
    meaningChangeRu: 'Лекарство — средство для лечения. Новое слово называет место, где получают и покупают лекарства.',
    suffixReasonRu: 'После «дәрі» тоже добавляется «-хана». Мягкие гласные основы не меняют написание этой части.',
    aliasesRu: ['от лекарства к аптеке', 'как образовано слово аптека'],
    questionNumbers: ['4.4', '4.11', '5.1', '5.7'] },
  { wordId: 'tuz', relation: 'with', suffix: 'ды', text: 'тұзды', thoughtRu: 'солёный',
    meaningChangeRu: 'Соль — вещество. Новое слово описывает вкус: в чём-то есть соль.',
    suffixReasonRu: 'После «з» в этой основе твёрдого ряда выбирается «-ды». Здесь эта часть создаёт признак.',
    aliasesRu: ['соленый', 'с солью', 'от соли к солёному', 'признак с солью'],
    questionNumbers: ['2.2', '4.4', '4.8', '4.11', '5.11', '5.13'] },
  { wordId: 'tuz', relation: 'without', suffix: 'сыз', text: 'тұзсыз', thoughtRu: 'несолёный',
    meaningChangeRu: 'Соль — вещество. Новое слово описывает то, в чём нет соли.',
    suffixReasonRu: 'Для отсутствия соли в этой основе твёрдого ряда выбирается «-сыз». Это часть нового слова, а не отдельное отрицание всей фразы.',
    aliasesRu: ['несоленый', 'без соли', 'от соли к несолёному', 'признак без соли'],
    questionNumbers: ['2.2', '4.4', '4.8', '4.11', '5.11', '5.14'] },
  { wordId: 'kush', relation: 'with', suffix: 'ті', text: 'күшті', thoughtRu: 'сильный',
    meaningChangeRu: 'Сила — то, чем можно обладать. Новое слово описывает того или то, у кого или у чего есть сила.',
    suffixReasonRu: 'После «ш» в этой основе мягкого ряда выбирается «-ті». Здесь эта часть создаёт признак.',
    aliasesRu: ['сильная', 'обладающий силой', 'от силы к сильному'],
    questionNumbers: ['2.2', '4.4', '4.8', '4.11', '5.11', '5.13'] },
  { wordId: 'kush', relation: 'without', suffix: 'сіз', text: 'күшсіз', thoughtRu: 'бессильный',
    meaningChangeRu: 'Сила — то, чем можно обладать. Новое слово описывает того или то, у кого или у чего мало силы: слабого, бессильного.',
    suffixReasonRu: 'Для недостатка силы в этой основе мягкого ряда выбирается «-сіз». Это часть нового слова, а не отдельное отрицание всей фразы.',
    aliasesRu: ['бессильная', 'без сил', 'слабый', 'от силы к бессильному'],
    questionNumbers: ['2.2', '4.4', '4.8', '4.11', '5.11', '5.14'] },
];

export interface ConstructorWave3DerivationMetadata {
  base: { text: string; thoughtRu: string };
  derived: { text: string; thoughtRu: string; suffix: string };
  baseForm: { text: string; thoughtRu: string; parts: string[]; owner: 'men' };
  selectedWordKind: 'new-word' | 'word-form';
  addedPart: { text: string; role: 'derivational-suffix' | 'possessive-ending'; explanationRu: string };
  meaningChangeRu: string;
  contrastRu: string;
  /** Only lexical options confirmed for this base; never a free suffix menu. */
  availableRelations: ConstructorWave3DerivationInput['relation'][];
  /** Context-specific source anchors: -хана does not establish vowel harmony. */
  questionNumbers: string[];
}

export function buildConstructorWave3WordFormation(input: unknown): ConstructorStage6SoundsResult | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  if (Object.keys(record).sort().join('|') !== 'kind|relation|view|wordId'
    || record.kind !== 'derivation' || !['derived', 'base-form'].includes(record.view as string)) return null;
  const entry = CONSTRUCTOR_WAVE3_DERIVATIONS.find(item => item.wordId === record.wordId && item.relation === record.relation);
  const base = CONSTRUCTOR_WAVE3_DERIVATION_WORDS.find(item => item.id === record.wordId);
  if (!entry || !base) return null;
  const derived = joinWithBoundaryMerger(base.text, entry.suffix).mergedWord;
  if (derived !== entry.text) return null;
  const possessive = pickPossessiveSuffix(base.text, 'men');
  const owned = joinWithBoundaryMerger(base.text, possessive.suffix);
  const ownedStem = owned.mergedWord.slice(0, -possessive.suffix.length);
  const baseForm = { text: owned.mergedWord, thoughtRu: base.ownedRu, parts: [ownedStem, possessive.suffix], owner: 'men' as const };
  const isDerived = record.view === 'derived';
  const text = isDerived ? derived : baseForm.text;
  const parts = isDerived ? [base.text, entry.suffix] : baseForm.parts;
  const thoughtRu = isDerived ? entry.thoughtRu : baseForm.thoughtRu;
  const contrastRu = '«' + derived + '» — ' + entry.thoughtRu + ': появилось новое значение. «' + baseForm.text + '» — ' + baseForm.thoughtRu + ': это форма слова «' + base.text + '», которая показывает связь со мной.';
  const meaningChangeRu = isDerived ? entry.meaningChangeRu : 'Название «' + base.labelRu + '» сохраняется. Окончание показывает связь со мной; нового названия человека, места или признака не возникает.';
  const suffixExplanation = isDerived ? entry.suffixReasonRu : possessive.ruleRu + ' Здесь сравниваем только «мой / моя / моё».';
  const stemChange = !isDerived && ownedStem !== base.text ? {
    before: base.text, after: ownedStem,
    explanationRu: 'Перед гласной окончания принадлежности конец основы меняется: «' + base.text.at(-1) + '» → «' + ownedStem.at(-1) + '». Название предмета при этом сохраняется.',
  } : null;
  const writingBoundary = { kind: 'solid' as const, explanationRu: 'Части видны отдельно только в разборе. Готовое слово пишется слитно, без дефиса.' };
  return {
    status: 'prepared', integrationStatus: 'prepared', outputKind: 'written-word', text, thoughtRu, parts,
    explanationRu: meaningChangeRu + ' ' + suffixExplanation + (stemChange ? ' ' + stemChange.explanationRu : '') + ' ' + contrastRu,
    condition: isDerived && entry.relation === 'place' ? null : { row: getVowelRow(base.text), endingClass: getEndingClass(base.text), suffix: parts[1] },
    sourceIds: ['sounds-derivation', 'sounds-derivation-dictionary'],
    limits: ['Проверяется только подготовленное написание. Аудио, произношение, ударение и интонация не проверяются.',
      'Шесть исходных слов и восемь проверенных производных. Для сравнения формы выбран только владелец «я». Свободные сочетания, другие значения, два словообразовательных суффикса и целые предложения не добавляются.'],
    audio: null, acceptedAnswers: [text], stemChange, writingBoundary,
    practice: {
      part: { id: 'practice-part', before: parts[0], text: parts[1], after: '', explanationRu: suffixExplanation },
      word: { id: 'practice-word', text, labelRu: isDerived ? 'Напиши новое слово целиком' : 'Напиши форму слова целиком: мой / моя / моё' },
    },
    derivation: {
      base: { text: base.text, thoughtRu: base.labelRu }, derived: { text: derived, thoughtRu: entry.thoughtRu, suffix: entry.suffix }, baseForm,
      selectedWordKind: isDerived ? 'new-word' : 'word-form',
      addedPart: { text: parts[1], role: isDerived ? 'derivational-suffix' : 'possessive-ending', explanationRu: suffixExplanation },
      meaningChangeRu, contrastRu,
      availableRelations: CONSTRUCTOR_WAVE3_DERIVATIONS.filter(item => item.wordId === base.id).map(item => item.relation),
      questionNumbers: isDerived ? [...entry.questionNumbers] : ['4.5', '4.11'],
    },
  };
}

/** The part exercise checks an actual suffix/ending; full words remain a separate step. */
export function checkConstructorWave3DerivationPart(input: unknown, answer: unknown) {
  const built = buildConstructorWave3WordFormation(input);
  const expected = built?.derivation?.addedPart.text ?? null;
  if (!expected || typeof answer !== 'string') return { passed: null, expected, messageRu: 'Для этой проверки нет подготовленной части слова.' };
  const passed = answer.normalize('NFC').trim().toLocaleLowerCase('kk') === expected;
  return { passed, expected, messageRu: passed ? 'Часть подходит к выбранному слову и смыслу.' : 'Сравни часть и её задачу в этом слове.' };
}

export function constructorWave3DerivationAliases(input: ConstructorWave3DerivationInput): string[] {
  const built = buildConstructorWave3WordFormation(input);
  const entry = CONSTRUCTOR_WAVE3_DERIVATIONS.find(item => item.wordId === input.wordId && item.relation === input.relation);
  if (!built?.derivation || !entry) return [];
  const detail = built.derivation;
  return input.view === 'derived'
    ? [built.thoughtRu, ...entry.aliasesRu, 'Новое слово: ' + built.thoughtRu,
      'Как образовано слово ' + built.thoughtRu, 'Образование слов: ' + detail.base.thoughtRu + ' — ' + built.thoughtRu,
      'Чем новое слово отличается от формы: ' + built.thoughtRu]
    : [built.thoughtRu, 'Форма слова: ' + built.thoughtRu,
      'Новое слово или форма: ' + detail.derived.thoughtRu + ' и ' + built.thoughtRu];
}
