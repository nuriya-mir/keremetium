import type { PersonId } from '../types';
import { buildForm, pickPastDySuffix, pickPresentAEYSuffix } from './form-builder';
import { joinWithBoundaryMerger, pickFullPersonalEnding, pickPluralSuffix, pickPossessiveSuffix, pickQuestionParticle, pickShortPersonalEnding, pickVerbNegationSuffix } from './phonetics';
import { PERSONS, ROOTS_BY_ID } from './roots';
import { CONSTRUCTOR_LEXEMES } from './constructor-realization';
import type { ConstructorStage4SourceId } from './constructor-stage4-evidence';

export const CONSTRUCTOR_STAGE4_PERSON_IDS = ['men', 'sen', 'siz', 'ol', 'biz', 'sender', 'sizder', 'olar'] as const satisfies readonly PersonId[];
export type ConstructorStage4Person = typeof CONSTRUCTOR_STAGE4_PERSON_IDS[number];
export type ConstructorStage4Time = 'now' | 'usual' | 'yesterday' | 'tomorrow';
export type ConstructorStage4Quantity = 'one' | 'several' | 2 | 3 | 4 | 5;
export type ConstructorStage4SoundWord = 'bala' | 'ui' | 'adam' | 'soz' | 'kitap' | 'mektep';
export type ConstructorStage4Gender = 'male' | 'female';
type PersonInput = { person: PersonId; gender?: ConstructorStage4Gender };
export type ConstructorStage4Input =
  | ({ kind: 'time'; time: ConstructorStage4Time } & PersonInput)
  | ({ kind: 'ownership'; number: 'one' | 'many' } & PersonInput)
  | { kind: 'quantity'; quantity: ConstructorStage4Quantity }
  | ({ kind: 'polarity'; negative: boolean; question: boolean } & PersonInput)
  | { kind: 'sounds'; wordId: ConstructorStage4SoundWord };
export interface ConstructorStage4Step { id: string; labelRu: string; text: string; explanationRu: string }
export interface ConstructorStage4Practice {
  part: { id: 'practice-part'; text: string; before: string; after: string; explanationRu: string };
  word: { id: 'practice-word'; text: string; labelRu: string };
}
export interface ConstructorStage4Result {
  status: 'ready' | 'limited';
  text: string | null;
  thoughtRu: string;
  steps: ConstructorStage4Step[];
  limits: string[];
  sourceIds: ConstructorStage4SourceId[];
  acceptedAnswers: string[];
  practice?: ConstructorStage4Practice;
}
export const SOUND_WORDS = ([
  ['bala', 'ребёнок', 'Дети'], ['ui', 'дом', 'Дома'], ['adam', 'человек', 'Люди'],
  ['soz', 'слово', 'Слова'], ['kitap', 'книга', 'Книги'], ['mektep', 'школа', 'Школы'],
] as const).map(([id, labelRu, pluralRu]) => ({ id, labelRu, pluralRu, kz: ROOTS_BY_ID[id].kz }));

const TIMES = { now: 'қазір', usual: 'әдетте', yesterday: 'кеше', tomorrow: 'ертең' } as const;
const PRESENT_RU: Record<ConstructorStage4Person, string> = { men: 'читаю', sen: 'читаешь', siz: 'читаете', ol: 'читает', biz: 'читаем', sender: 'читаете', sizder: 'читаете', olar: 'читают' };
const FUTURE_RU: Record<ConstructorStage4Person, string> = { men: 'буду', sen: 'будешь', siz: 'будете', ol: 'будет', biz: 'будем', sender: 'будете', sizder: 'будете', olar: 'будут' };
const own = (object: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(object, key);
const sentence = (words: string[], question = false) => {
  const text = words.filter(Boolean).join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1) + (question ? '?' : '.');
};
const step = (id: string, labelRu: string, text: string, explanationRu: string): ConstructorStage4Step => ({ id, labelRu, text, explanationRu });
function practice(before: string, text: string, after: string, word: string, explanationRu: string, labelRu = 'Напиши слово целиком'): ConstructorStage4Practice {
  return { part: { id: 'practice-part', before, text, after, explanationRu }, word: { id: 'practice-word', text: word, labelRu } };
}
function subjectRu(person: ConstructorStage4Person, gender: ConstructorStage4Gender) {
  return ({ men: 'Я', sen: 'Ты', siz: 'Вы', ol: gender === 'female' ? 'Она' : 'Он', biz: 'Мы', sender: 'Вы', sizder: 'Вы', olar: 'Они' })[person];
}
function limited(message: string): ConstructorStage4Result {
  return { status: 'limited', text: null, thoughtRu: '', steps: [], limits: [message], sourceIds: [], acceptedAnswers: [] };
}
function ready(thoughtRu: string, steps: ConstructorStage4Step[], exercise: ConstructorStage4Practice, sourceIds: ConstructorStage4SourceId[], limits: string[] = [], question = false): ConstructorStage4Result {
  const text = sentence(steps.map(item => item.text), question);
  const withoutSubject = sentence(steps.filter(item => item.id !== 'subject').map(item => item.text), question);
  return { status: 'ready', text, thoughtRu, steps, practice: exercise, sourceIds, limits, acceptedAnswers: [...new Set([text, withoutSubject])] };
}

/** Closed probe. A selected context is never inferred from the spelling alone. */
export function buildConstructorStage4(input: ConstructorStage4Input): ConstructorStage4Result {
  if (!input || typeof input !== 'object') return limited('Выбери один из примеров.');
  if (['time', 'ownership', 'polarity'].includes(input.kind) && (!('person' in input) || !CONSTRUCTOR_STAGE4_PERSON_IDS.includes(input.person as ConstructorStage4Person))) return limited('Выбери одно из восьми лиц.');
  if ('gender' in input && input.gender !== undefined && input.gender !== 'male' && input.gender !== 'female') return limited('Выбери подготовленный русский вариант.');
  const book = ROOTS_BY_ID.kitap.kz;
  if (input.kind === 'time' || input.kind === 'polarity') {
    const person = input.person as ConstructorStage4Person;
    const gender = input.gender ?? 'male';
    const root = ROOTS_BY_ID.oqy;
    let predicate: string;
    let exercise: ConstructorStage4Practice;
    let explanation: string;
    let thoughtRu: string;
    let question = false;
    const sourceIds: ConstructorStage4SourceId[] = ['stage4-time', 'stage4-object'];
    const limits = ['Книга здесь названа без уточнения «эта». Произвольный текст эта проба не переводит.'];
    const steps = [step('subject', 'Кто читает', PERSONS[person].pronounKz, 'Это человек, о чьём чтении идёт речь.')];
    if (input.kind === 'time') {
      if (!own(TIMES, input.time)) return limited('Выбери: сейчас, обычно, вчера или завтра.');
      const timeRu = ({ now: 'сейчас', usual: 'обычно', yesterday: 'вчера', tomorrow: 'завтра' })[input.time];
      const topic = input.time === 'now' ? 'T80_STD_PROG' : input.time === 'yesterday' ? 'T31_PAST_DY' : 'T26_PRES_FUT_AFF';
      predicate = buildForm(topic, 'oqy', person).afterCheck.canonicalFormKz;
      steps.push(step('time', 'Когда читать', TIMES[input.time], 'Это время самого чтения. Человек и книга сохраняются.'));
      if (input.time === 'now') {
        sourceIds.push('stage4-progressive');
        const words = predicate.split(' '), word = words.at(-1)!;
        const ending = pickFullPersonalEnding('жатыр', person, { rowOverride: 'hard', thirdPersonHasDyDi: false }).suffix;
        exercise = ending ? practice('жатыр', ending, '', word, 'Окончание на последнем слове показывает, кто читает сейчас.') : practice('', word, '', word, 'У третьего лица здесь нет личного окончания. Напиши последнее слово целиком.');
        explanation = 'Чтение идёт сейчас. Первая часть называет действие, последнее слово передаёт текущий процесс и лицо.';
        thoughtRu = `${subjectRu(person, gender)} ${timeRu} ${PRESENT_RU[person]} книгу.`;
      } else if (input.time === 'yesterday') {
        sourceIds.push('stage4-past');
        const past = pickPastDySuffix(root.kz).suffix;
        const ending = pickShortPersonalEnding(root.vowelRow, person).suffix;
        exercise = ending ? practice(root.kz + past, ending, '', predicate, 'Окончание показывает, кто читал. Суффикс прошлого уже стоит перед ним.') : practice(root.kz, past, '', predicate, 'В третьем лице допиши суффикс прошлого: отдельного личного окончания нет.');
        const pastRu = ['men', 'sen', 'ol'].includes(person) ? gender === 'female' ? 'читала' : 'читал' : 'читали';
        thoughtRu = `${subjectRu(person, gender)} ${timeRu} ${pastRu} книгу.`;
        explanation = 'Чтение было вчера. Эта фраза сама по себе не говорит, что книга дочитана.';
      } else {
        const base = joinWithBoundaryMerger(root.kz, pickPresentAEYSuffix(root.kz).suffix).mergedWord;
        const ending = pickFullPersonalEnding(base, person, { rowOverride: root.vowelRow, thirdPersonHasDyDi: true }).suffix;
        exercise = practice(base, ending, '', predicate, 'Личное окончание показывает, кто читает или будет читать.');
        thoughtRu = `${subjectRu(person, gender)} ${timeRu} ${input.time === 'tomorrow' ? FUTURE_RU[person] + ' читать' : PRESENT_RU[person]} книгу.`;
        explanation = input.time === 'tomorrow' ? 'Будущее здесь задаёт слово «завтра». Сам глагол имеет ту же форму, что и для обычного действия.' : 'Речь об обычном действии. Это не сообщение о чтении прямо сейчас.';
      }
    } else {
      if (typeof input.negative !== 'boolean' || typeof input.question !== 'boolean') return limited('Выбери утверждение, отрицание или вопрос.');
      question = input.question;
      const base = input.negative ? root.kz + pickVerbNegationSuffix(root.kz, 'mai').suffix : joinWithBoundaryMerger(root.kz, pickPresentAEYSuffix(root.kz).suffix).mergedWord;
      const ending = pickFullPersonalEnding(base, person, { rowOverride: root.vowelRow, thirdPersonHasDyDi: true, isQuestion: question }).suffix;
      const word = base + ending;
      const particle = question ? pickQuestionParticle(word, root.vowelRow).particle : '';
      predicate = word;
      exercise = question ? practice(word + ' ', particle, '', word, 'Вопросительная частица — отдельное слово после готового глагола.') : input.negative ? practice(root.kz, pickVerbNegationSuffix(root.kz, 'mai').suffix, ending, word, 'Эта часть отрицает чтение и уже включает показатель времени.') : practice(base, ending, '', word, 'Личное окончание согласовано с человеком.');
      thoughtRu = `${subjectRu(person, gender)} ${input.negative ? 'не ' : ''}${PRESENT_RU[person]} книгу${question ? '?' : '.'}`;
      explanation = input.negative ? 'Отрицается само чтение. Здесь ничего не говорится о нежелании или невозможности читать.' : 'Речь о чтении вообще. Время «прямо сейчас» здесь не добавлено.';
      if (question) limits.push('Вопрос относится ко всему сообщению о чтении. Он не утверждает его истинность.');
      steps.push(step('object', 'Что читать', book, 'Книга — предмет чтения, без уточнения «эта».'));
      steps.push(step('action', 'Читать или не читать', predicate, explanation));
      if (question) steps.push(step('question', 'Спросить о чтении', particle, person === 'ol' || person === 'olar' ? 'В третьем лице перед частицей нет окончания утверждения. Частица пишется отдельно.' : 'Частица выбирается по последнему звуку готового слова и пишется отдельно.'));
      exercise.word.labelRu = question ? 'Напиши глагол перед вопросительной частицей целиком' : 'Напиши слово со значением чтения целиком';
      return ready(thoughtRu, steps, exercise, sourceIds, limits, question);
    }
    steps.push(step('object', 'Что читать', book, 'Книга — предмет чтения, без уточнения «эта».'));
    steps.push(step('action', 'Как выражено чтение', predicate, explanation));
    exercise.word.labelRu = input.time === 'now' ? 'Напиши последнее слово фразы целиком' : 'Напиши слово со значением чтения целиком';
    return ready(thoughtRu, steps, exercise, sourceIds, limits);
  }
  if (input.kind === 'ownership') {
    if (input.number !== 'one' && input.number !== 'many') return limited('Выбери одну книгу или несколько книг.');
    const person = input.person as ConstructorStage4Person;
    const groupAddressee = person === 'sender' || person === 'sizder';
    const pluralComponent = input.number === 'many' || groupAddressee;
    const base = book + (pluralComponent ? pickPluralSuffix(book).suffix : '');
    // The plural addressee's component has already been added once above.
    const endingPerson = person === 'sender' ? 'sen' : person === 'sizder' ? 'siz' : person;
    const ending = pickPossessiveSuffix(base, endingPerson).suffix;
    const word = joinWithBoundaryMerger(base, ending).mergedWord;
    const adjective = ({ men: ['Моя', 'Мои'], sen: ['Твоя', 'Твои'], siz: ['Ваша', 'Ваши'], ol: [input.gender === 'female' ? 'Её' : 'Его', input.gender === 'female' ? 'Её' : 'Его'], biz: ['Наша', 'Наши'], sender: ['Ваша', 'Ваши'], sizder: ['Ваша', 'Ваши'], olar: ['Их', 'Их'] })[person][input.number === 'many' ? 1 : 0];
    const thoughtRu = `${adjective} ${input.number === 'many' ? 'книги' : 'книга'}.`;
    const limits = ['Принадлежность не означает, что книга сейчас с человеком.'];
    if (groupAddressee) limits.push('При обращении к нескольким людям эта форма может обозначать одну или несколько книг. Число книг известно из выбранной ситуации; написание при переключении может совпасть.');
    if (person === 'ol' || person === 'olar') limits.push('Окончание на книге совпадает для его, её и их. Местоимение уточняет владельца.');
    const explanation = groupAddressee ? 'Перед окончанием принадлежности уже есть показатель обращения к нескольким людям. Его не добавляют второй раз из-за нескольких книг.' : input.number === 'many' ? 'Сначала указываем несколько книг, затем добавляем окончание принадлежности.' : 'Окончание показывает владельца. Перед его гласной последняя согласная основы меняется.';
    return ready(thoughtRu, [step('subject', 'Чья книга', PERSONS[person].genitiveKz, 'Владелец задаётся отдельно от числа книг.'), step('owned', 'Книга с принадлежностью', word, explanation)], practice(word.slice(0, -ending.length), ending, '', word, 'Допиши окончание принадлежности. Основа уже дана в нужном написании.', 'Напиши слово с окончанием принадлежности целиком'), ['stage4-owner-one', 'stage4-owner-two', 'stage4-owner-three', 'stage4-plural'], limits);
  }
  if (input.kind === 'quantity') {
    if (!['one', 'several', 2, 3, 4, 5].includes(input.quantity)) return limited('Выбери одну, несколько, две, три, четыре или пять книг.');
    const count = input.quantity === 'several' ? 'бірнеше' : CONSTRUCTOR_LEXEMES.find(item => item.id === 'number' + (input.quantity === 'one' ? 1 : input.quantity))!.kz;
    const thoughtRu = ({ one: 'Одна книга.', several: 'Несколько книг.', 2: 'Две книги.', 3: 'Три книги.', 4: 'Четыре книги.', 5: 'Пять книг.' })[input.quantity];
    const explanation = 'Количество уже названо отдельным словом. К названию книги здесь не добавляем множественное окончание.';
    return ready(thoughtRu, [step('quantity', 'Сколько книг', count, input.quantity === 'several' ? 'Книг больше одной, но точное число не названо.' : 'Это точное количество книг.'), step('object', 'Что считаем', book, explanation)], practice('', count, ' ' + book, book, 'Допиши отдельное слово количества. Это часть фразы, а не окончание.', 'Напиши название вещи после количества'), ['stage4-quantity', 'stage4-several', 'stage4-plural'], [explanation]);
  }
  if (input.kind === 'sounds') {
    const selected = SOUND_WORDS.find(item => item.id === input.wordId);
    if (!selected) return limited('Выбери одно из шести подготовленных слов.');
    const root = ROOTS_BY_ID[selected.id];
    const suffix = pickPluralSuffix(root.kz, root.vowelRow);
    const word = buildForm('T10_PLURAL', root.id, 'men').afterCheck.canonicalFormKz;
    return ready(selected.pluralRu + '.', [step('plural', 'Слово во множественном числе', word, suffix.ruleRu)], practice(root.kz, suffix.suffix, '', word, suffix.ruleRu, 'Напиши слово во множественном числе целиком'), ['stage4-plural'], ['Меняется слово и условие выбора окончания. Лицо и время к этой пробе не относятся.']);
  }
  return limited('Выбери один из пяти примеров.');
}

const normalizedAnswer = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('kk').replace(/[.!?]+$/u, '').trim().replace(/\s+/gu, ' ');
export function checkConstructorStage4Answer(input: ConstructorStage4Input, answer: string, mode: 'part' | 'word' | 'full' = 'full'): { passed: boolean; messageRu: string; expected: string | null } {
  const built = buildConstructorStage4(input);
  if (built.status !== 'ready' || !built.text) return { passed: false, messageRu: built.limits[0], expected: null };
  if (!['part', 'word', 'full'].includes(mode)) return { passed: false, messageRu: 'Выбери часть, слово или целую фразу.', expected: null };
  const expected = mode === 'full' ? built.text : built.practice?.[mode].text;
  if (!expected) return { passed: false, messageRu: 'Для этого шага нет подготовленного ответа.', expected: null };
  const answers = mode === 'full' ? built.acceptedAnswers : [expected];
  const passed = answers.some(value => normalizedAnswer(value) === normalizedAnswer(answer));
  return { passed, expected, messageRu: passed ? 'Этот вариант совпадает с подготовленным ответом.' : 'Сравни с этим вариантом. Другой ответ здесь ещё не проверен.' };
}
