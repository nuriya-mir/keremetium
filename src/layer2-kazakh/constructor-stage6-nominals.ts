import { buildForm } from './form-builder';
import { buildConstructorStage4, CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person, type ConstructorStage4Quantity, type ConstructorStage4Result, type ConstructorStage4Step } from './constructor-stage4';
import { CONSTRUCTOR_LEXEMES, realizeConstructorWord } from './constructor-realization';
import { joinWithBoundaryMerger, pickPluralSuffix, pickPossessiveSuffix } from './phonetics';
import { PERSONS, ROOTS_BY_ID } from './roots';
import type { ConstructorStage6NominalsSourceId } from './constructor-stage6-nominals-evidence';

export const CONSTRUCTOR_STAGE6_NOMINAL_WORD_IDS = {
  ownership: ['kitap', 'ui', 'soz', 'mektep'],
  quantity: ['kitap', 'ui', 'soz', 'mektep', 'bala', 'adam'],
} as const;
export type ConstructorStage6NominalCase = keyof typeof CONSTRUCTOR_STAGE6_NOMINAL_WORD_IDS;
export type ConstructorStage6NominalWord = typeof CONSTRUCTOR_STAGE6_NOMINAL_WORD_IDS.quantity[number];
export interface ConstructorStage6NominalsInput {
  caseId: ConstructorStage6NominalCase;
  wordId: string;
  person: ConstructorStage4Person;
  number: 'one' | 'many';
  quantity: ConstructorStage4Quantity;
  gender?: ConstructorStage4Gender;
}
export interface ConstructorStage6NominalsResult extends Omit<ConstructorStage4Result, 'sourceIds'> {
  sourceIds: ConstructorStage6NominalsSourceId[];
}

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1) + '.';
const normalizedAnswer = (text: string) => text.normalize('NFC').trim().replace(/\s+/g, ' ').replace(/[.!]+$/, '').toLocaleLowerCase('kk');
const step = (id: string, labelRu: string, text: string, explanationRu: string): ConstructorStage4Step => ({ id, labelRu, text, explanationRu });
const limited = (reason: string): ConstructorStage6NominalsResult => ({ status: 'limited', text: null, thoughtRu: '', steps: [], limits: [reason], sourceIds: [], acceptedAnswers: [] });

/** Russian inflections are read from the existing core lexicon, not guessed in UI. */
export function constructorStage6NominalWordInfo(wordId: string) {
  if (!(CONSTRUCTOR_STAGE6_NOMINAL_WORD_IDS.quantity as readonly string[]).includes(wordId)) return null;
  const meaning = CONSTRUCTOR_LEXEMES.find(item => item.id === wordId && item.base === 'noun')!.ru;
  const singular = realizeConstructorWord({ base: 'noun', variant: '', meaning, steps: [] });
  const plural = realizeConstructorWord({ base: 'noun', variant: '', meaning, steps: [{ id: 'plural', value: 0 }] });
  if (singular.status !== 'ready' || plural.status !== 'ready' || !singular.ruCases || !plural.ruCases || !singular.gender) return null;
  const oneRu = singular.gender === 'f' ? 'Одна' : singular.gender === 'n' ? 'Одно' : 'Один';
  const twoRu = singular.gender === 'f' ? 'Две' : 'Два';
  // The counted form is normative Russian: «пять/несколько человек», not «людей».
  const countedMany = wordId === 'adam' ? 'человек' : plural.ruCases[1];
  const quantityPhrases: Record<ConstructorStage4Quantity, string> = {
    one: `${oneRu} ${singular.ruCases[0]}.`, several: `Несколько ${countedMany}.`,
    2: `${twoRu} ${singular.ruCases[1]}.`, 3: `Три ${singular.ruCases[1]}.`,
    4: `Четыре ${singular.ruCases[1]}.`, 5: `Пять ${countedMany}.`,
  };
  return {
    id: wordId as ConstructorStage6NominalWord, singular: singular.ruCases[0], plural: plural.ruCases[0],
    genitivePlural: plural.ruCases[1], oneLabel: oneRu, quantityPhrases, gender: singular.gender,
    relationRu: wordId === 'kitap' ? 'Принадлежность не означает, что книга сейчас с человеком.'
      : wordId === 'ui' ? '«Мой дом» связывает дом с человеком. Эта фраза сама по себе не доказывает собственность и не говорит, где человек сейчас.'
        : wordId === 'mektep' ? '«Моя школа» связывает школу с человеком, например с учеником. Эта фраза не утверждает, что он владеет школой.'
          : '«Моё слово» связывает слово с говорящим. Это не сообщение о вещи, которая находится у него с собой.',
  };
}

function invalidReason(input: ConstructorStage6NominalsInput): string | null {
  if (!input || typeof input !== 'object' || !['ownership', 'quantity'].includes(input.caseId)) return 'Выбери связь с человеком или количество.';
  if (!(CONSTRUCTOR_STAGE6_NOMINAL_WORD_IDS[input.caseId] as readonly string[]).includes(input.wordId)) return 'Выбери подготовленное слово для этой темы.';
  if (!CONSTRUCTOR_STAGE4_PERSON_IDS.includes(input.person)) return 'Выбери одно из восьми лиц.';
  if (!['one', 'many'].includes(input.number)) return 'Выбери один предмет или несколько.';
  if (!['one', 'several', 2, 3, 4, 5].includes(input.quantity)) return 'Выбери одно, несколько или число от двух до пяти.';
  if (input.gender !== undefined && !['male', 'female'].includes(input.gender)) return 'Выбери подготовленный русский вариант.';
  const extra = input as unknown as Record<string, unknown>;
  if (['time', 'negative', 'question', 'case', 'location', 'owner'].some(key => key in extra)) return 'Для этого примера меняются только слово, человек и число. Падеж, время и вопрос здесь не добавлены.';
  return null;
}

export function constructorStage6NominalThoughtRu(input: ConstructorStage6NominalsInput): string {
  if (invalidReason(input)) return '';
  const info = constructorStage6NominalWordInfo(input.wordId)!;
  if (input.caseId === 'quantity') return info.quantityPhrases[input.quantity];
  const genderIndex = input.number === 'many' ? 3 : info.gender === 'f' ? 1 : info.gender === 'n' ? 2 : 0;
  const possessive = ({
    men: ['Мой', 'Моя', 'Моё', 'Мои'], sen: ['Твой', 'Твоя', 'Твоё', 'Твои'],
    siz: ['Ваш', 'Ваша', 'Ваше', 'Ваши'], biz: ['Наш', 'Наша', 'Наше', 'Наши'],
    sender: ['Ваш', 'Ваша', 'Ваше', 'Ваши'], sizder: ['Ваш', 'Ваша', 'Ваше', 'Ваши'],
    ol: Array(4).fill(input.gender === 'female' ? 'Её' : 'Его'), olar: Array(4).fill('Их'),
  })[input.person][genderIndex];
  return `${possessive} ${input.number === 'many' ? info.plural : info.singular}.`;
}

export function constructorStage6NominalThoughtAliases(input: ConstructorStage6NominalsInput): string[] {
  const phrase = constructorStage6NominalThoughtRu(input);
  if (!phrase) return [];
  const aliases = [phrase, phrase.replace(/ё/g, 'е')];
  if (input.caseId === 'quantity' && input.quantity !== 'several') {
    const number = input.quantity === 'one' ? 1 : input.quantity;
    aliases.push(phrase.replace(/^\S+/, String(number)));
  }
  return [...new Set(aliases)];
}

export function buildConstructorStage6Nominals(input: ConstructorStage6NominalsInput): ConstructorStage6NominalsResult {
  const reason = invalidReason(input);
  if (reason) return limited(reason);
  const info = constructorStage6NominalWordInfo(input.wordId)!;
  const root = ROOTS_BY_ID[input.wordId];
  const thoughtRu = constructorStage6NominalThoughtRu(input);
  if (input.caseId === 'quantity') {
    // Reuse the already checked quantity words, without borrowing its book-specific text.
    const quantity = buildConstructorStage4({ kind: 'quantity', quantity: input.quantity }).steps.find(item => item.id === 'quantity')!.text;
    const explanationRu = 'Количество названо отдельным словом. После него название остаётся без окончания множественного числа.';
    const text = sentence(`${quantity} ${root.kz}`);
    return {
      status: 'ready', text, thoughtRu,
      steps: [step('quantity', `Сколько ${info.genitivePlural}`, quantity, input.quantity === 'several' ? 'Больше одного; точное число не названо.' : 'Названо точное количество.'), step('object', 'Кого или что считаем', root.kz, explanationRu)],
      limits: [explanationRu, 'Человек, с которым связано название, здесь не добавляется. Люди и предметы считаются без единицы измерения.'],
      sourceIds: ['stage6-nominals-lexicon', 'stage6-nominals-plural', 'stage6-nominals-quantity', 'stage6-nominals-several'], acceptedAnswers: [text],
      practice: { part: { id: 'practice-part', before: '', text: quantity, after: ' ' + root.kz, explanationRu: 'Напиши отдельное слово количества. Это часть фразы, а не окончание.' }, word: { id: 'practice-word', text: root.kz, labelRu: 'Напиши название после количества целиком' } },
    };
  }
  const groupAddressee = input.person === 'sender' || input.person === 'sizder';
  const hasPluralComponent = input.number === 'many' || groupAddressee;
  const base = hasPluralComponent ? buildForm('T10_PLURAL', root.id, input.person).afterCheck.canonicalFormKz : root.kz;
  const endingPerson = input.person === 'sender' ? 'sen' : input.person === 'sizder' ? 'siz' : input.person;
  const ending = pickPossessiveSuffix(base, endingPerson, root.vowelRow);
  const joined = joinWithBoundaryMerger(base, ending.suffix);
  const word = input.number === 'one' ? buildForm('T13_POSSESSIVE', root.id, input.person).afterCheck.canonicalFormKz : joined.mergedWord;
  const pluralReason = hasPluralComponent ? `${pickPluralSuffix(root.kz, root.vowelRow).ruleRu} ` : '';
  const numberReason = groupAddressee ? 'При обращении к нескольким людям показатель множественного уже стоит перед окончанием принадлежности. Второй такой показатель не добавляем.'
    : input.number === 'many' ? 'Сначала показываем несколько предметов, затем связь с человеком.' : 'Окончание показывает связь с выбранным человеком.';
  const explanationRu = `${numberReason} ${pluralReason}${ending.ruleRu}${joined.capsule ? ' ' + joined.capsule.explanationRu : ''}`;
  const steps = [step('subject', 'С кем связано', PERSONS[input.person].genitiveKz, 'Человек и число предметов задаются отдельно. Если человек уже известен, местоимение можно опустить.'), step('owned', 'Название со связью с человеком', word, explanationRu)];
  const text = sentence(steps.map(item => item.text).join(' '));
  const limits = [info.relationRu, 'Число людей и число названных предметов меняются отдельно.'];
  if (groupAddressee) limits.push('При обращении к нескольким людям одна и несколько вещей могут иметь одинаковое написание. Их число известно из выбранной ситуации.');
  if (input.person === 'ol' || input.person === 'olar') limits.push('Окончание совпадает для его, её и их. Местоимение уточняет, с кем связано название.');
  return {
    status: 'ready', text, thoughtRu, steps, limits,
    sourceIds: ['stage6-nominals-lexicon', 'stage6-nominals-owner-one', 'stage6-nominals-owner-two', 'stage6-nominals-owner-three', 'stage6-nominals-plural'],
    acceptedAnswers: [text, sentence(word)],
    practice: { part: { id: 'practice-part', before: word.slice(0, -ending.suffix.length), text: ending.suffix, after: '', explanationRu: `Допиши окончание принадлежности. Основа уже дана в нужном написании. ${ending.ruleRu}` }, word: { id: 'practice-word', text: word, labelRu: 'Напиши слово с окончанием принадлежности целиком' } },
  };
}

export function checkConstructorStage6NominalsAnswer(input: ConstructorStage6NominalsInput, answer: string, mode: 'part' | 'word' | 'full' = 'full'): { passed: boolean; messageRu: string; expected: string | null } {
  const built = buildConstructorStage6Nominals(input);
  if (built.status !== 'ready' || !built.text) return { passed: false, expected: null, messageRu: built.limits[0] };
  if (!['part', 'word', 'full'].includes(mode)) return { passed: false, expected: null, messageRu: 'Выбери часть, слово или целую фразу.' };
  const expected = mode === 'full' ? built.text : built.practice![mode].text;
  const answers = mode === 'full' ? built.acceptedAnswers : [expected];
  const passed = typeof answer === 'string' && answers.some(value => normalizedAnswer(value) === normalizedAnswer(answer));
  return { passed, expected, messageRu: passed ? 'Этот вариант совпадает с подготовленным ответом.' : 'Сравни с этим вариантом. Другой ответ здесь ещё не проверен.' };
}
