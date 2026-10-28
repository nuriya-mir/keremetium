import type { PersonId } from '../types';
import { buildForm, pickDesireGhySuffix, pickParticipleGanSuffix, pickPastDySuffix, pickPresentAEYSuffix } from './form-builder';
import { getVowelRow, joinWithBoundaryMerger, pickCaseSuffix, pickFullPersonalEnding, pickPossessiveSuffix, pickShortPersonalEnding } from './phonetics';
import { PERSONS, ROOTS_BY_ID } from './roots';
import type { WantBookSourceId } from './want-book-evidence';

export const WANT_BOOK_PERSON_IDS = ['men', 'sen', 'siz', 'ol', 'biz', 'sender', 'sizder', 'olar'] as const satisfies readonly PersonId[];
export type WantBookThought = 'own-wish' | 'thing-wish' | 'other-wish' | 'can-buy' | 'purchase';
export type WantBookTime = 'past' | 'present' | 'future';
export type WantBookDay = 'unspecified' | 'day-before-yesterday' | 'yesterday' | 'today' | 'tomorrow' | 'day-after-tomorrow' | 'outside-range';

export interface WantBookInput {
  thought: WantBookThought;
  person: PersonId;
  outerTime: WantBookTime;
  purchaseTime: WantBookDay;
  /** The chosen narrator's present may be imagined. It never moves either event. */
  reference: 'now' | 'outer';
  /** Exact day of the desire/ability. For purchase this describes the purchase itself. */
  outerDayLabel?: WantBookDay;
}

export interface WantBookStep {
  id: string;
  labelRu: string;
  /** A complete written word or a phrase. Never an isolated ending or an empty answer. */
  text: string;
  explanationRu: string;
}

export interface WantBookPractice {
  part: { id: 'practice-part'; text: string; before: string; after: string; explanationRu: string };
  word: { id: 'practice-word'; text: string; labelRu: string };
}

export interface WantBookResult {
  status: 'ready' | 'limited';
  text: string | null;
  steps: WantBookStep[];
  limits: string[];
  sourceIds: WantBookSourceId[];
  /** Prepared alternatives, primarily omission of an optional outer pronoun. */
  acceptedAnswers: string[];
  practice?: WantBookPractice;
}

const DAYS: Record<Exclude<WantBookDay, 'outside-range'>, { text: string; offset: number | null }> = {
  unspecified: { text: '', offset: null },
  'day-before-yesterday': { text: 'алдыңгүні', offset: -2 },
  yesterday: { text: 'кеше', offset: -1 },
  today: { text: 'бүгін', offset: 0 },
  tomorrow: { text: 'ертең', offset: 1 },
  'day-after-tomorrow': { text: 'бүрсігүні', offset: 2 },
};
const SOURCES: Record<WantBookThought, WantBookSourceId[]> = {
  'own-wish': ['want-book-ten-desire', 'want-book-desire', 'want-book-buy'],
  'thing-wish': ['want-book-thing', 'want-book-present-future', 'want-book-past'],
  'other-wish': ['want-book-other', 'want-book-other-prospective', 'want-book-buy', 'want-book-present-future', 'want-book-past'],
  'can-buy': ['want-book-can', 'want-book-buy', 'want-book-present-future'],
  purchase: ['want-book-buy', 'want-book-past', 'want-book-present-future'],
};

function sentence(words: readonly string[]): string {
  const text = words.filter(Boolean).join(' ');
  return text ? text[0].toLocaleUpperCase('kk-KZ') + text.slice(1) + '.' : '';
}

/** The target word and its exercise gap come from the same assembled parts. */
function wordPractice(before: string, text: string, after: string, labelRu: string, explanationRu: string): WantBookPractice {
  return {
    part: { id: 'practice-part', text, before, after, explanationRu },
    word: { id: 'practice-word', text: before + text + after, labelRu },
  };
}

/** Only the two verified lexical stems used in this closed probe reach this helper. */
function finite(stem: string, time: 'past' | 'present', person: PersonId): WantBookPractice {
  if (time === 'past') {
    const past = pickPastDySuffix(stem).suffix;
    const ending = pickShortPersonalEnding(getVowelRow(stem), person).suffix;
    return ending
      ? wordPractice(stem + past, ending, '', 'Слово с временем и лицом', 'Окончание показывает, кто совершил действие. Время уже выражено перед ним.')
      : wordPractice(stem, past, '', 'Слово в прошедшем времени', 'В третьем лице отдельного личного окончания нет. Здесь дописывается суффикс прошедшего времени.');
  }
  const word = joinWithBoundaryMerger(stem, pickPresentAEYSuffix(stem).suffix).mergedWord;
  const ending = pickFullPersonalEnding(word, person, { thirdPersonHasDyDi: true }).suffix;
  return wordPractice(word, ending, '', 'Слово с лицом', 'Окончание согласовано с выбранным человеком. В третьем лице этой формы оно тоже есть.');
}

/** Closed corpus: one book, buying, a fixed Dana; no translation of arbitrary text. */
export function buildWantBook(input: WantBookInput): WantBookResult {
  const { thought, person, outerTime, purchaseTime, reference } = input;
  const outerDayLabel = input.outerDayLabel ?? 'unspecified';
  const hasOwn = (object: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(object, key);
  const sourceIds = hasOwn(SOURCES, thought) ? [...SOURCES[thought]] : [];
  const limited = (message: string): WantBookResult => ({ status: 'limited', text: null, steps: [], limits: [message], sourceIds, acceptedAnswers: [] });
  if (!hasOwn(SOURCES, thought) || !WANT_BOOK_PERSON_IDS.includes(person as typeof WANT_BOOK_PERSON_IDS[number])) return limited('В этой пробе выбери одну из пяти мыслей и одно из восьми лиц.');
  if (!['past', 'present', 'future'].includes(outerTime)) return limited('Это время ещё не подготовлено для пробы.');
  if (reference !== 'now') return limited('Отсчёт от самого желания требует отдельного проверенного варианта. Здесь дни отсчитываются от выбранного момента рассказчика.');
  if (purchaseTime === 'outside-range' || outerDayLabel === 'outside-range' || !hasOwn(DAYS, purchaseTime) || !hasOwn(DAYS, outerDayLabel)) return limited('Для этого расстояния между днями казахский вариант ещё не подготовлен. Сами выбранные дни сохраняются.');
  const outerDay = DAYS[outerDayLabel];
  const purchaseDay = DAYS[purchaseTime];
  const effectiveOuterOffset = outerDay.offset ?? (outerTime === 'present' ? 0 : null);
  if (outerDay.offset !== null && Math.sign(outerDay.offset) !== ({ past: -1, present: 0, future: 1 }[outerTime])) return limited('Выбранный день и время этой мысли не совпадают. Проверь их от одной точки отсчёта.');
  if (thought === 'thing-wish' && purchaseTime !== 'unspecified') return limited('В желании книги покупка не названа. Её день не входит в эту фразу.');
  if (thought !== 'purchase' && thought !== 'thing-wish' && effectiveOuterOffset !== null && purchaseDay.offset !== null && purchaseDay.offset < effectiveOuterOffset) return limited('В этой пробе желаемая или возможная покупка следует после желания или возможности. Для желания о прошлом нужен другой вариант.');
  if (thought !== 'purchase' && outerTime === 'future') return limited('Будущее именно желания или возможности ещё требует отдельной сверки. Его нельзя подменять будущим покупки или условием «если захочу».');
  if (thought === 'can-buy' && outerTime === 'past') return limited('Для «мог купить» нужно различить возможность и успешную покупку. Подготовленный вариант прошедшего не подставляется без этого выбора.');
  if (thought === 'purchase') {
    if (outerTime === 'present') return limited('Для результата покупки выбери завершённую покупку в прошлом или объявленную покупку в будущем. Процесс «покупаю сейчас» имеет другой смысл.');
    if (purchaseDay.offset !== null && Math.sign(purchaseDay.offset) !== ({ past: -1, present: 0, future: 1 }[outerTime])) return limited('День покупки и её время должны совпадать относительно рассказчика.');
    if (outerDay.offset !== null && purchaseDay.offset !== null && outerDay.offset !== purchaseDay.offset) return limited('У покупки один день. Два разных дня нельзя включить в эту фразу.');
    if (outerTime === 'future' && purchaseDay.offset === null && outerDay.offset === null) return limited('Для будущей покупки в этой пробе укажи будущий день. Без него эта форма также может означать обычное действие.');
  }

  const steps: WantBookStep[] = [];
  const add = (id: string, labelRu: string, text: string, explanationRu: string) => {
    if (text) steps.push({ id, labelRu, text, explanationRu });
  };
  const limits: string[] = [];
  let practice: WantBookPractice | undefined;
  const finiteTarget = (stem: string, time: 'past' | 'present') => {
    const target = finite(stem, time, person);
    practice ??= target;
    return target.word.text;
  };
  const subject = thought === 'own-wish' ? PERSONS[person].genitiveKz : PERSONS[person].pronounKz;
  const purchaseDate = thought === 'purchase' ? (purchaseDay.text || outerDay.text) : purchaseDay.text;
  if (thought !== 'purchase') add('outer-time', 'Когда возникло желание или была возможность', outerDay.text, 'Это день всей мысли. День покупки выбирается отдельно.');
  add('subject', thought === 'own-wish' ? 'Кто хочет выполнить действие' : 'Кто говорит о себе или о других', subject, thought === 'own-wish' ? 'Желающий совпадает с исполнителем. Лицо повторяется в окончании слова желания.' : 'Это человек, чьё желание, возможность или покупку мы описываем.');
  if (thought === 'other-wish') {
    const dana = 'Дана';
    add('actor', 'Кто покупает в этом желании', dana + pickCaseSuffix(dana, 'genitive').suffix, 'Покупатель — Дана. Выбранное лицо по-прежнему показывает, кто этого хочет.');
  }
  if (thought !== 'thing-wish') add('purchase-time', 'Когда купить', purchaseDate, 'Этот день относится к покупке, а не к возникновению желания.');
  const book = ROOTS_BY_ID.kitap.kz;
  const object = thought === 'thing-wish' ? book + pickCaseSuffix(book, 'accusative').suffix : book;
  add('object', 'Что хочет или покупает человек', object, thought === 'thing-wish' ? 'Здесь названа желаемая книга. Покупка или получение не добавляются.' : 'Книга названа без уточнения «эта». Такой предмет перед действием покупки не требует обязательного винительного окончания.');
  const al = ROOTS_BY_ID.al.kz;
  if (thought !== 'thing-wish') add('action', 'Начало выражения покупки', 'сатып', 'Это первая часть цельного выражения «сатып алу» — покупать. Следующая часть меняется.');
  if (thought === 'own-wish') {
    const built = buildForm(outerTime === 'past' ? 'T86_WANT_PAST' : 'T83_WANT_PRESENT', 'al', person);
    const [desire, auxiliary] = built.afterCheck.canonicalFormKz.split(' ');
    const desireStem = al + pickDesireGhySuffix(al).suffix;
    const owner = pickPossessiveSuffix(desireStem, person, ROOTS_BY_ID.al.vowelRow, true).suffix;
    practice = wordPractice(desireStem, owner, '', 'Слово желания со своим лицом', 'После суффикса желания окончание показывает желающего и исполнителя. Они здесь совпадают.');
    add('desire', 'Своё желание купить', desire, 'Суффикс желания и окончание лица пишутся с основой одним словом.');
    add('outer-predicate', 'Время желания', auxiliary, outerTime === 'past' ? 'Желание было в прошлом. Эта фраза не сообщает, состоялась ли покупка.' : 'Сейчас человек хочет купить. Покупка этим ещё не подтверждена.');
    limits.push('Желание не подтверждает покупку. Желание и покупка относятся к одному человеку или одной группе.');
  } else if (thought === 'thing-wish' || thought === 'other-wish') {
    if (thought === 'other-wish') {
      const participle = al + pickParticipleGanSuffix(al).suffix;
      const possessed = participle + pickPossessiveSuffix(participle, 'ol').suffix;
      const accusative = pickCaseSuffix(possessed, 'accusative', { afterPossessive: '3' }).suffix;
      const content = possessed + accusative;
      practice = wordPractice(possessed, accusative, '', 'Слово внутри желания о Дане', 'После принадлежности третьего лица окончание «н» связывает это содержание с глаголом желания.');
      add('content', 'Желаемое действие Даны', content, 'Эта часть завершает содержание желания: чтобы Дана купила. Здесь она не утверждает, что покупка уже произошла.');
      limits.push('Желание относится к действию Даны. Содержание желания не сообщает о совершившейся покупке.');
    } else {
      limits.push('Қалау также означает выбирать. Здесь это подготовленный вариант желания книги, без добавленного действия покупки.');
    }
    add('outer-predicate', 'Кто и когда хочет', finiteTarget('қала', outerTime === 'past' ? 'past' : 'present'), 'Окончание показывает желающего. Прошедшее относится к желанию, а не автоматически к покупке.');
  } else if (thought === 'can-buy') {
    add('complement', 'Возможное действие', joinWithBoundaryMerger(al, pickPresentAEYSuffix(al).suffix).mergedWord, 'Эта часть продолжает выражение покупки перед словом возможности.');
    add('outer-predicate', 'Возможность', finiteTarget(al, 'present'), 'Второе алу выражает возможность. Оно не означает, что покупка уже состоялась.');
    limits.push('Возможность купить не подтверждает ни желание, ни состоявшуюся покупку.');
  } else {
    add('outer-predicate', outerTime === 'past' ? 'Завершённая покупка' : 'Будущая покупка', finiteTarget(al, outerTime === 'past' ? 'past' : 'present'), outerTime === 'past' ? 'Покупка сообщается как событие прошлого.' : 'Выбранный будущий день придаёт этой форме будущее значение. Событие ещё не совершилось.');
    limits.push(outerTime === 'past' ? 'Сообщается о покупке. Фраза не доказывает, что книга и сейчас у человека.' : 'Сообщается о будущей покупке. Это ещё не состоявшийся результат.');
  }
  if (thought !== 'thing-wish') sourceIds.push('want-book-object');
  if (outerDay.text || purchaseDate) sourceIds.push('want-book-days');
  if (thought !== 'thing-wish' && thought !== 'purchase' && purchaseDay.offset !== null && purchaseDay.offset === effectiveOuterOffset) limits.push('Если оба события в один день, покупка здесь мыслится позже желания или возможности внутри этого дня.');
  const text = sentence(steps.map(step => step.text));
  const withoutSubject = sentence(steps.filter(step => step.id !== 'subject').map(step => step.text));
  return { status: 'ready', text, steps, limits, sourceIds: [...new Set(sourceIds)], acceptedAnswers: [text, withoutSubject], practice };
}

function normalizedAnswer(answer: string): string {
  return answer.normalize('NFC').toLocaleLowerCase('kk-KZ').trim().replace(/[.!?…]+$/u, '').trim().replace(/\s+/gu, ' ');
}

/** Match only prepared answers; failure is not a judgment about arbitrary Kazakh text. */
export function checkWantBookAnswer(input: WantBookInput, answer: string, stepId?: string): { passed: boolean; messageRu: string; expected: string | null } {
  const built = buildWantBook(input);
  if (built.status !== 'ready' || !built.text) return { passed: false, messageRu: built.limits[0], expected: null };
  const practiceTarget = stepId === built.practice?.part.id ? built.practice?.part : stepId === built.practice?.word.id ? built.practice?.word : undefined;
  const step = practiceTarget ?? (stepId === undefined ? undefined : built.steps.find(item => item.id === stepId));
  if (stepId !== undefined && !step) return { passed: false, messageRu: 'Этот шаг сейчас не входит в фразу.', expected: null };
  const expected = step?.text ?? built.text;
  const variants = step ? [step.text] : built.acceptedAnswers;
  const passed = variants.some(value => normalizedAnswer(value) === normalizedAnswer(answer));
  return { passed, messageRu: passed ? 'Этот вариант совпадает с подготовленным ответом.' : 'Сравни с этим вариантом. Другой ответ здесь ещё не проверен.', expected };
}
