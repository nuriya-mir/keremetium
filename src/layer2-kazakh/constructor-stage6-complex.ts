import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person, type ConstructorStage4Result, type ConstructorStage4Step } from './constructor-stage4';
import { realizeConstructorSentence, type ConstructorWord, type ConstructorOptions } from './constructor-realization';
import { realizeFullConstructorWord } from './full-meaning-constructor';
import { buildForm } from './form-builder';
import { joinWithBoundaryMerger, pickPossessiveSuffix } from './phonetics';
import { ROOTS_BY_ID } from './roots';
import { buildWantBook } from './want-book';
import { buildAtlasThought } from './atlas-thought-corpus';
import type { ConstructorStage6ComplexSourceId } from './constructor-stage6-complex-evidence';

export const CONSTRUCTOR_STAGE6_COMPLEX_PATTERNS = ['dana-wish', 'read-book-description', 'condition-read', 'contrast-fixed', 'reported-fixed'] as const;
export type ConstructorStage6ComplexPattern = typeof CONSTRUCTOR_STAGE6_COMPLEX_PATTERNS[number];
export interface ConstructorStage6ComplexInput {
  caseId: 'complex-links';
  pattern: ConstructorStage6ComplexPattern;
  person: ConstructorStage4Person;
  gender?: ConstructorStage4Gender;
}
export interface ConstructorStage6ComplexResult extends Omit<ConstructorStage4Result, 'sourceIds'> {
  outputKind: 'phrase' | 'sentence' | null;
  answerScopeRu: 'Часть фразы' | 'Целое предложение' | '';
  partKind: 'suffix' | 'word' | null;
  sourceIds: ConstructorStage6ComplexSourceId[];
}

/** An adapter must use this matrix, rather than infer controls from a pattern name. */
export const CONSTRUCTOR_STAGE6_COMPLEX_MATRIX = {
  'dana-wish': {
    outputKind: 'sentence', persons: CONSTRUCTOR_STAGE4_PERSON_IDS, femalePersons: ['ol'],
    personRoleRu: 'Кто хочет', fixedRu: ['Покупатель — Дана.', 'Предмет — одна неуточнённая книга.', 'Желание сейчас; срок покупки не назван.'],
  },
  'read-book-description': {
    outputKind: 'phrase', persons: ['men', 'sen', 'siz', 'ol', 'biz', 'olar'], femalePersons: ['men', 'sen', 'ol'],
    personRoleRu: 'Кто прочитал', fixedRu: ['Одна книга.', 'Выполненное чтение.', 'Внешнее сообщение о книге ещё не задано.'],
  },
  'condition-read': {
    outputKind: 'sentence', persons: ['men'], femalePersons: [],
    personRoleRu: '', fixedRu: ['Условие: ты прочитаешь.', 'Следствие: я прочитаю книгу.', 'Условие стоит первым; ни одно событие не утверждается как состоявшееся.'],
  },
  'contrast-fixed': {
    outputKind: 'sentence', persons: ['men'], femalePersons: [],
    personRoleRu: '', fixedRu: ['Говорящий — я.', 'Дом есть, сегодня сил нет.', 'Порядок частей и отрицание второй части сохранены.'],
  },
  'reported-fixed': {
    outputKind: 'sentence', persons: ['men'], femalePersons: [],
    personRoleRu: '', fixedRu: ['Неуказанный чужой источник.', 'Событие было давно; рассказчик сам не видел.', 'Слова источника не представлены дословной цитатой.'],
  },
} as const;

const subjects = ['Я', 'Ты', 'Вы', 'Он', 'Мы', 'Вы', 'Вы', 'Они'];
const wantRu = ['хочу', 'хочешь', 'хотите', 'хочет', 'хотим', 'хотите', 'хотите', 'хотят'];
const normal = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').replace(/[.]+$/, '').toLocaleLowerCase('kk');
const limited = (reason: string): ConstructorStage6ComplexResult => ({ status: 'limited', text: null, thoughtRu: '', steps: [], limits: [reason], acceptedAnswers: [], sourceIds: [], outputKind: null, answerScopeRu: '', partKind: null });
const step = (id: string, labelRu: string, text: string, explanationRu: string): ConstructorStage4Step => ({ id, labelRu, text, explanationRu });
const wordPractice = (text: string, labelRu: string, explanationRu: string) => ({
  part: { id: 'practice-part' as const, text, before: '', after: '', explanationRu },
  word: { id: 'practice-word' as const, text, labelRu },
});

function invalidReason(input: ConstructorStage6ComplexInput): string | null {
  if (!input || typeof input !== 'object' || input.caseId !== 'complex-links' || !CONSTRUCTOR_STAGE6_COMPLEX_PATTERNS.includes(input.pattern)) return 'Выбери подготовленный пример связи частей.';
  if (Object.keys(input).some(key => !['caseId', 'pattern', 'person', 'gender'].includes(key))) return 'Изменение этого параметра для выбранного примера не подготовлено.';
  const matrix = CONSTRUCTOR_STAGE6_COMPLEX_MATRIX[input.pattern];
  if (!(matrix.persons as readonly string[]).includes(input.person)) return 'Для этого примера выбери участника из подготовленного списка.';
  if (input.gender !== undefined && !['male', 'female'].includes(input.gender)) return 'Выбери подготовленный русский вариант.';
  if (input.gender === 'female' && !(matrix.femalePersons as readonly string[]).includes(input.person)) return 'В этом примере отдельный русский вариант женского рода не задан.';
  return null;
}

function readerRu(input: ConstructorStage6ComplexInput): string {
  const i = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person);
  const subject = input.person === 'ol' && input.gender === 'female' ? 'она' : subjects[i].toLocaleLowerCase('ru');
  const verb = ['siz', 'biz', 'olar'].includes(input.person) ? 'прочитали' : input.gender === 'female' ? 'прочитала' : 'прочитал';
  return `Книга, которую ${subject} ${verb}`;
}

/** This is a closed translation table for the existing two-word board, not a translator. */
const conditionOptions: ConstructorOptions = { translateBuilt: built => {
  if (built.rootId !== 'oqy') return undefined;
  if (built.formulaId === 'T46_COND_SA' && built.person === 'sen') return 'Если ты прочитаешь';
  if (built.formulaId === 'T26_PRES_FUT_AFF' && built.person === 'men') return 'Я прочитаю';
  return undefined;
} };
const word = (base: string, meaning: string, steps: ConstructorWord['steps']): ConstructorWord => ({ base, meaning, variant: base === 'pronoun' ? 'personal' : 'basic', steps });

export function buildConstructorStage6Complex(input: ConstructorStage6ComplexInput): ConstructorStage6ComplexResult {
  const reason = invalidReason(input);
  if (reason) return limited(reason);
  const matrix = CONSTRUCTOR_STAGE6_COMPLEX_MATRIX[input.pattern];
  const base = { outputKind: matrix.outputKind, answerScopeRu: matrix.outputKind === 'phrase' ? 'Часть фразы' as const : 'Целое предложение' as const };
  if (input.pattern === 'dana-wish') {
    const built = buildWantBook({ thought: 'other-wish', person: input.person, outerTime: 'present', purchaseTime: 'unspecified', reference: 'now' });
    if (built.status !== 'ready' || !built.text || !built.practice) return limited('Этот пример желания сейчас недоступен.');
    const i = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person);
    const subject = input.person === 'ol' && input.gender === 'female' ? 'Она' : subjects[i];
    return { ...built, ...base, steps: built.steps.map(item => item.id === 'outer-predicate' ? { ...item, explanationRu: 'Окончание показывает, кто хочет сейчас. Покупатель внутри желания по-прежнему Дана.' } : item), thoughtRu: `${subject} ${wantRu[i]}, чтобы Дана купила книгу.`, partKind: 'suffix', sourceIds: ['stage6-complex-wish', 'stage6-complex-buy', 'stage6-complex-finite'], limits: [...built.limits, 'Лицо меняет желающего. Покупатель остаётся Даной; отрицание, время и другую книгу здесь не выбирают.'] };
  }
  if (input.pattern === 'read-book-description') {
    const thoughtRu = readerRu(input);
    const recipe = buildForm('T121_PART_OBJECT_POSS', 'oqy', input.person);
    const result = realizeFullConstructorWord({ ...word('verb', 'читать', []), recipe: 'T121_PART_OBJECT_POSS', who: CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person) }, { translateBuilt: built => built.formulaId === 'T121_PART_OBJECT_POSS' && built.rootId === 'oqy' && built.person === input.person ? thoughtRu : undefined });
    const text = recipe.afterCheck.fullFormWithBracketsKz;
    const parts = result.kz?.split(' ');
    if (result.status !== 'ready' || !text || !parts || parts.length !== 2 || !recipe.afterCheck.acceptedFormsKz.includes(text)) return limited('Для этого описания книги нет подтверждённого результата.');
    const suffix = pickPossessiveSuffix(ROOTS_BY_ID.kitap.kz, input.person, ROOTS_BY_ID.kitap.vowelRow, false).suffix;
    const joined = joinWithBoundaryMerger(ROOTS_BY_ID.kitap.kz, suffix);
    if (!suffix || joined.mergedWord !== parts[1]) return limited('Число книг или связь с читателем не совпали с подготовленным примером.');
    const explanationRu = 'Окончание связывает книгу с тем, кто её прочитал. Это не доказательство собственности. Перед гласным п основы переходит в б; слово пишется слитно.';
    return { status: 'ready', ...base, text, thoughtRu, partKind: 'suffix', sourceIds: ['stage6-complex-relative'], acceptedAnswers: [...recipe.afterCheck.acceptedFormsKz],
      steps: [step('reader', 'Кто прочитал', text.slice(0, text.length - result.kz!.length).trim(), 'Здесь назван участник чтения. При известном участнике местоимение можно не повторять.'), step('description', 'Описание через действие', parts[0], 'Книга описана выполненным чтением.'), step('head', 'Описываемая книга', parts[1], explanationRu)],
      limits: ['Это часть фразы, которая описывает одну книгу. Сообщение о ней ещё не задано.', 'Читатель и владелец книги не обязаны совпадать.', 'Для обращения к нескольким людям этот рецепт даёт книги; такие варианты здесь не подменяют одну книгу.'],
      practice: { part: { id: 'practice-part', text: suffix, before: joined.mergedWord.slice(0, -suffix.length), after: '', explanationRu }, word: { id: 'practice-word', text: joined.mergedWord, labelRu: 'Напиши название книги со связью с читателем' } },
    };
  }
  if (input.pattern === 'condition-read') {
    const board = {
      condition: word('verb', 'читать', [{ id: 'conditional', value: 0 }, { id: 'person', value: 1 }]),
      subject: word('pronoun', 'я', [{ id: 'pronounPerson', value: 0 }, { id: 'case', value: 0 }]),
      object: word('noun', 'книга', [{ id: 'case', value: 3 }]),
      predicate: word('verb', 'читать', [{ id: 'vtime', value: 0 }, { id: 'person', value: 0 }]),
    };
    const built = realizeConstructorSentence(board, 'condition', ['condition', 'subject', 'object', 'predicate'], conditionOptions);
    if (built.status !== 'ready' || !built.kz || !built.ru || built.parts?.length !== 4) return limited('Эта пара связанных действий сейчас недоступна.');
    const explanationRu = 'Это условие «если ты прочитаешь». Напиши всё слово; само условие не сообщает, что чтение уже состоялось.';
    return { status: 'ready', ...base, text: built.kz, thoughtRu: built.ru, partKind: 'word', sourceIds: ['stage6-complex-condition', 'stage6-complex-finite'], acceptedAnswers: [built.kz],
      steps: [step('condition', 'Условие', built.parts[0], explanationRu), step('consequence', 'Что будет при этом условии', built.parts.slice(1).join(' '), 'При этом условии говорящий прочитает книгу. Чтение ещё не утверждается как факт.')],
      limits: ['Подготовлена только эта пара действий с условием первым.', 'Будущее значение задано контекстом. Уступка, нереальное условие и другой порядок требуют отдельных образцов.'],
      practice: wordPractice(built.parts[0], 'Напиши слово с условием', explanationRu),
    };
  }
  const reported = input.pattern === 'reported-fixed';
  const thoughtRu = reported ? 'Говорят, это было давно: сам не видел.' : 'У меня есть дом, но сегодня нет сил.';
  const text = buildAtlasThought(thoughtRu);
  if (!text) return limited('Этот готовый пример сейчас недоступен.');
  const clauses = text.replace(/[.]$/, '').split(', ');
  if (clauses.length !== 2) return limited('Границы частей этого примера изменились.');
  const words = clauses[reported ? 0 : 1].split(' ');
  const link = words[reported ? words.length - 1 : 0];
  const explanationRu = reported ? 'Слово передаёт чужое сообщение. Следующая часть отдельно говорит, что рассказчик сам этого не видел. Это не дословная цитата.' : 'Союз связывает два разных сообщения через противопоставление. Отсутствие сил относится ко второй части; дом этим не отрицается.';
  const steps = reported
    ? [step('content', 'Сообщаемое событие', words.slice(0, -1).join(' '), 'Событие отнесено к давнему прошлому.'), step('source', 'Со слов других', link, explanationRu), step('witness', 'Личное свидетельство', clauses[1], 'Рассказчик сам не видел событие. Это не утверждение, что сообщение ложно.')]
    : [step('first', 'Первое сообщение', clauses[0], 'Дом есть у говорящего.'), step('link', 'Связь частей', link, explanationRu), step('second', 'Второе сообщение', words.slice(1).join(' '), 'Сегодня у говорящего нет сил.')];
  return { status: 'ready', ...base, text, thoughtRu, steps, partKind: 'word', sourceIds: reported ? ['stage6-complex-report', 'stage6-complex-atlas'] : ['stage6-complex-contrast', 'stage6-complex-atlas'], acceptedAnswers: [text],
    limits: [reported ? 'Автор источника не назван. Цитата, пересказ с другим лицом и изменение времени или места здесь не строятся.' : 'Готов только этот пример. Замена союза, отрицания или порядка частей не подготовлена.'],
    practice: wordPractice(link, reported ? 'Напиши слово передачи сообщения' : 'Напиши союз', explanationRu),
  };
}

export function constructorStage6ComplexThoughtAliases(input: ConstructorStage6ComplexInput): string[] {
  const built = buildConstructorStage6Complex(input);
  return built.status === 'ready' ? [...new Set([built.thoughtRu, built.thoughtRu.replace(/ё/g, 'е')])] : [];
}

export function checkConstructorStage6ComplexAnswer(input: ConstructorStage6ComplexInput, answer: string, mode: 'part' | 'word' | 'full' = 'full') {
  const built = buildConstructorStage6Complex(input);
  if (built.status !== 'ready' || !built.practice || !['part', 'word', 'full'].includes(mode)) return { passed: false, expected: null, reasonRu: built.limits[0] || 'Этот способ ответа не подготовлен.' };
  const expected = mode === 'full' ? built.text! : built.practice[mode].text;
  const accepted = mode === 'full' ? built.acceptedAnswers : [expected];
  return { passed: Boolean(normal(answer)) && accepted.some(value => normal(value) === normal(answer)), expected, reasonRu: mode === 'full' ? built.outputKind === 'phrase' ? 'Нужно всё подготовленное описание книги. Оно остаётся частью фразы.' : 'Нужно всё предложение с обеими смысловыми частями.' : built.practice.part.explanationRu };
}
