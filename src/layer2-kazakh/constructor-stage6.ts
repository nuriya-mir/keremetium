import { buildForm } from './form-builder';
import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person, type ConstructorStage4Practice, type ConstructorStage4Result, type ConstructorStage4Step } from './constructor-stage4';
import { NOMINAL_WORDS_BY_ID } from './nominal-lexicon';
import { PERSONS, ROOTS_BY_ID } from './roots';
import type { ConstructorStage6SourceId } from './constructor-stage6-evidence';

export type ConstructorStage6Kind = 'presence' | 'identity' | 'quality';
export const CONSTRUCTOR_STAGE6_WORD_IDS = {
  presence: ['kitap', 'su', 'shai', 'nan', 'hat'],
  identity: ['dariger', 'mugalim', 'oqyushy'],
  quality: ['jas', 'bos', 'azir', 'kushti'],
} as const;
export type ConstructorStage6Word = typeof CONSTRUCTOR_STAGE6_WORD_IDS[ConstructorStage6Kind][number];
export interface ConstructorStage6Input {
  kind: ConstructorStage6Kind;
  person: ConstructorStage4Person;
  gender?: ConstructorStage4Gender;
  wordId: ConstructorStage6Word;
  negative: boolean;
  question: boolean;
}
export interface ConstructorStage6Result extends Omit<ConstructorStage4Result, 'sourceIds'> {
  sourceIds: ConstructorStage6SourceId[];
}

const subjects: Record<ConstructorStage4Person, string> = { men: 'Я', sen: 'Ты', siz: 'Вы', ol: 'Он', biz: 'Мы', sender: 'Вы', sizder: 'Вы', olar: 'Они' };
const holders: Record<ConstructorStage4Person, string> = { men: 'У меня', sen: 'У тебя', siz: 'У вас', ol: 'У него', biz: 'У нас', sender: 'У вас', sizder: 'У вас', olar: 'У них' };
const absent: Record<string, string> = { kitap: 'книги', su: 'воды', shai: 'чая', nan: 'хлеба', hat: 'письма' };
const qualities: Record<string, readonly [string, string, string]> = { jas: ['молод', 'молода', 'молоды'], bos: ['свободен', 'свободна', 'свободны'], azir: ['готов', 'готова', 'готовы'], kushti: ['силён', 'сильна', 'сильны'] };
const sentence = (text: string, question: boolean) => text.charAt(0).toLocaleUpperCase('kk') + text.slice(1) + (question ? '?' : '.');
const step = (id: string, labelRu: string, text: string, explanationRu: string): ConstructorStage4Step => ({ id, labelRu, text, explanationRu });

function invalidReason(input: ConstructorStage6Input): string | null {
  if (!input || typeof input !== 'object' || !Object.prototype.hasOwnProperty.call(CONSTRUCTOR_STAGE6_WORD_IDS, input.kind)) return 'Выбери один из примеров.';
  if (!CONSTRUCTOR_STAGE4_PERSON_IDS.includes(input.person)) return 'Выбери одно из восьми лиц.';
  if (input.gender !== undefined && input.gender !== 'male' && input.gender !== 'female') return 'Выбери подготовленный русский вариант.';
  if (typeof input.negative !== 'boolean' || typeof input.question !== 'boolean') return 'Выбери сообщение или вопрос и наличие отрицания.';
  if (!(CONSTRUCTOR_STAGE6_WORD_IDS[input.kind] as readonly string[]).includes(input.wordId)) return 'Выбери слово из этого примера.';
  // These fields are deliberately absent from the public input. Reject forged requests,
  // rather than quietly replacing a different time, number or location with this recipe.
  const extra = input as unknown as Record<string, unknown>;
  if ('time' in extra || 'number' in extra || 'quantity' in extra || 'location' in extra || 'owner' in extra) return 'В этом примере меняются человек, слово, отрицание и вопрос.';
  return null;
}

/** Prepared Russian meaning of the exact closed input; no translation of arbitrary text. */
export function constructorStage6ThoughtRu(input: ConstructorStage6Input): string {
  if (invalidReason(input)) return '';
  const female = input.gender === 'female';
  if (input.kind === 'presence') {
    const holder = input.person === 'ol' && female ? 'У неё' : holders[input.person];
    const noun = input.negative ? absent[input.wordId] : ROOTS_BY_ID[input.wordId].ru;
    return `${holder} с собой ${input.negative ? 'нет' : 'есть'} ${noun}${input.question ? '?' : '.'}`;
  }
  const subject = input.person === 'ol' && female ? 'Она' : subjects[input.person];
  const plural = ['biz', 'sender', 'sizder', 'olar'].includes(input.person);
  let predicate: string;
  if (input.kind === 'quality') {
    predicate = qualities[input.wordId][plural || input.person === 'siz' ? 2 : female ? 1 : 0];
  } else {
    predicate = NOMINAL_WORDS_BY_ID[input.wordId].predicateRu[plural ? 1 : 0];
    if (female && !plural && input.wordId === 'oqyushy') predicate = 'ученица';
  }
  return `${subject} ${input.negative ? 'не ' : ''}${predicate}${input.question ? '?' : '.'}`;
}

export function constructorStage6ThoughtAliases(input: ConstructorStage6Input): string[] {
  const thought = constructorStage6ThoughtRu(input);
  if (!thought) return [];
  return input.kind === 'presence' ? [thought, thought.replace(' с собой', '')] : [thought];
}

export function constructorStage6Topic(input: ConstructorStage6Input): string {
  if (input.kind === 'presence') return input.question ? input.negative ? 'KZ_PRESENCE_NEG_Q' : 'KZ_PRESENCE_Q' : input.negative ? 'KZ_PRESENCE_NEG' : 'T56_LOC_BAR';
  return `KZ_${input.kind === 'identity' ? 'IDENTITY' : 'QUALITY'}_${input.question ? input.negative ? 'NEG_Q' : 'Q' : input.negative ? 'NEG' : 'AFF'}`;
}

/** Adapts the already checked core recipes; it introduces no new Kazakh morphology. */
export function buildConstructorStage6(input: ConstructorStage6Input): ConstructorStage6Result {
  const reason = invalidReason(input);
  if (reason) return { status: 'limited', text: null, thoughtRu: '', steps: [], limits: [reason], sourceIds: [], acceptedAnswers: [] };
  const built = buildForm(constructorStage6Topic(input), input.wordId, input.person);
  const base = input.question ? buildForm(constructorStage6Topic({ ...input, question: false }), input.wordId, input.person) : built;
  const predicate = base.afterCheck.canonicalFormKz;
  const particle = input.question ? built.afterCheck.coloredSegments.find(part => part.role === 'particle')!.text : '';
  const pronoun = PERSONS[input.person].pronounKz;
  const steps: ConstructorStage4Step[] = [];
  let exercise: ConstructorStage4Practice;
  let text: string;
  const limits = ['Этот пример относится к настоящему. Слова выбираются из подготовленного списка.'];
  const sourceIds: ConstructorStage6SourceId[] = [];
  if (input.kind === 'presence') {
    sourceIds.push('stage6-presence');
    const pieces = predicate.split(' ');
    steps.push(step('holder', 'У кого', pieces[0], 'Эта форма местоимения показывает, у кого сейчас вещь. Она не указывает владельца.'));
    steps.push(step('object', 'Какая вещь', pieces[1], `Основа называет вещь: ${ROOTS_BY_ID[input.wordId].ru}. Название вещи не меняется из-за человека, отрицания или вопроса.`));
    steps.push(step('presence', input.negative ? 'Вещи нет' : 'Вещь есть', pieces[2], base.afterCheck.selectionRuleSummaryRu));
    const answer = input.question ? particle : pieces[2];
    exercise = {
      part: { id: 'practice-part', before: input.question ? predicate + ' ' : pieces.slice(0, 2).join(' ') + ' ', text: answer, after: '', explanationRu: input.question ? built.afterCheck.selectionRuleSummaryRu : 'Допиши отдельное слово: оно показывает, есть ли вещь у человека. Это не личное окончание.' },
      word: { id: 'practice-word', text: pieces[0], labelRu: 'Напиши слово со значением «у кого» целиком' },
    };
    text = sentence(built.afterCheck.canonicalFormKz, input.question);
    limits.push('Здесь рассматриваем вещь с собой. Наличие у человека не означает, что вещь принадлежит ему.');
  } else {
    sourceIds.push('stage6-nominal');
    if (input.question) sourceIds.push('stage6-nominal-question');
    const root = NOMINAL_WORDS_BY_ID[input.wordId];
    const finalWord = predicate.split(' ').at(-1)!;
    const blank = base.beforeCheck.multiStepBlanks![0];
    const ending = base.afterCheck.coloredSegments.find(part => part.role === 'core_block')?.text;
    const nounReason = `Основа «${root.kz}» ${input.kind === 'identity' ? 'называет роль человека' : 'называет признак человека'}: ${root.ru}.`;
    steps.push(step('subject', 'О ком говорим', pronoun, 'Местоимение называет человека. В подготовленном полном ответе его можно опустить: лицо уже известно из ситуации и формы слова.'));
    if (input.negative) {
      steps.push(step('predicate', input.kind === 'identity' ? 'Кем назвать человека' : 'Какой человек', root.kz, `${nounReason} При отрицании эта основа остаётся прежней.`));
      steps.push(step('negation', input.kind === 'identity' ? 'Не является' : 'Отрицать признак', finalWord, `Слово отрицания стоит отдельно. ${base.afterCheck.selectionRuleSummaryRu}`));
    } else {
      steps.push(step('predicate', input.kind === 'identity' ? 'Кем назвать человека' : 'Какой человек', finalWord, `${nounReason} ${base.afterCheck.selectionRuleSummaryRu}`));
    }
    exercise = {
      part: { id: 'practice-part', before: input.question ? predicate + ' ' : ending ? finalWord.slice(0, -ending.length) : '', text: input.question ? particle : blank.correctPiece, after: '', explanationRu: input.question ? built.afterCheck.selectionRuleSummaryRu : base.afterCheck.selectionRuleSummaryRu },
      word: { id: 'practice-word', text: finalWord, labelRu: input.negative ? 'Напиши слово отрицания с окончанием целиком' : 'Напиши слово о человеке целиком' },
    };
    if (input.negative && !ending) exercise.word.labelRu = 'Напиши слово отрицания целиком';
    text = sentence(`${pronoun} ${built.afterCheck.canonicalFormKz}`, input.question);
    limits.push(input.kind === 'identity' ? 'Речь о роли человека. Эта фраза не утверждает наличие вещи или её принадлежность.' : 'Признак относится к человеку. Его степень и причина здесь не добавляются.');
  }
  if (input.question) {
    steps.push(step('question', 'Спросить', particle, built.afterCheck.selectionRuleSummaryRu));
    limits.push('Вопрос уточняет всё сообщение и сам по себе не подтверждает его.');
  }
  return { status: 'ready', text, thoughtRu: constructorStage6ThoughtRu(input), steps, limits, sourceIds, practice: exercise, acceptedAnswers: [...new Set([text, ...built.afterCheck.acceptedFormsKz])] };
}

const normalizedAnswer = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('kk').replace(/[.!?]+$/u, '').trim().replace(/\s+/gu, ' ');

export function checkConstructorStage6Answer(input: ConstructorStage6Input, answer: string, mode: 'part' | 'word' | 'full' = 'full'): { passed: boolean; messageRu: string; expected: string | null } {
  const built = buildConstructorStage6(input);
  if (built.status !== 'ready' || !built.text) return { passed: false, messageRu: built.limits[0], expected: null };
  if (!['part', 'word', 'full'].includes(mode)) return { passed: false, messageRu: 'Выбери часть, слово или целую фразу.', expected: null };
  const expected = mode === 'full' ? built.text : built.practice![mode].text;
  const answers = mode === 'full' ? built.acceptedAnswers : [expected];
  const passed = typeof answer === 'string' && answers.some(value => normalizedAnswer(value) === normalizedAnswer(answer));
  return { passed, expected, messageRu: passed ? 'Этот вариант совпадает с подготовленным ответом.' : 'Сравни с этим вариантом. Другой ответ здесь ещё не проверен.' };
}
