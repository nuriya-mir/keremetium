import { buildForm } from './form-builder';
import { PERSONS, ROOTS_BY_ID } from './roots';
import { getExplanationSegments, type ExplanationSegment } from './explanation-segments';
import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person, type ConstructorStage4Practice, type ConstructorStage4Result, type ConstructorStage4Time } from './constructor-stage4';
import type { ConstructorStage6ActionsSourceId } from './constructor-stage6-actions-evidence';

/** Closed lexical sets already checked in K151 and K152. */
export const CONSTRUCTOR_STAGE6_ACTION_WORD_IDS = ['ish', 'bar', 'kel', 'jaz', 'ait', 'kor', 'oqy', 'tap', 'al', 'ber', 'soile', 'jur', 'apar', 'akel'] as const;
export type ConstructorStage6ActionWord = typeof CONSTRUCTOR_STAGE6_ACTION_WORD_IDS[number];
export const CONSTRUCTOR_STAGE6_ACTION_ORDINARY_WORD_IDS = CONSTRUCTOR_STAGE6_ACTION_WORD_IDS.slice(0, 12);
export const CONSTRUCTOR_STAGE6_ACTION_MOTION_WORD_IDS = ['bar', 'kel', 'apar', 'akel'] as const;
export const CONSTRUCTOR_STAGE6_ACTION_PROGRESSIVE_WORD_IDS = ['ish', 'jaz', 'ait', 'kor', 'oqy', 'tap', 'al', 'ber', 'soile', 'jur'] as const;

export interface ConstructorStage6ActionsInput {
  person: ConstructorStage4Person;
  gender?: ConstructorStage4Gender;
  wordId: ConstructorStage6ActionWord;
  time: ConstructorStage4Time;
  negative: boolean;
  question: boolean;
}
export interface ConstructorStage6ActionsResult extends Omit<ConstructorStage4Result, 'sourceIds'> {
  sourceIds: ConstructorStage6ActionsSourceId[];
  translationRu: string;
  topicId: string | null;
  wordId: ConstructorStage6ActionWord | null;
  formulaChainText: string;
  morphologySegments: ExplanationSegment[];
}

const TIMES = { now: { kz: 'қазір', ru: 'сейчас' }, usual: { kz: 'әдетте', ru: 'обычно' }, yesterday: { kz: 'кеше', ru: 'вчера' }, tomorrow: { kz: 'ертең', ru: 'завтра' } } as const;
const own = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key);
const sentence = (value: string, question = false) => value.charAt(0).toUpperCase() + value.slice(1) + (question ? '?' : '.');
const normalizedAnswer = (value: string) => value.normalize('NFC').toLocaleLowerCase('kk-KZ').trim().replace(/[.!?]+$/u, '').replace(/\s+/gu, ' ');

/** Russian wording selects one checked lexical meaning, never generates a Kazakh form. */
export const CONSTRUCTOR_STAGE6_ACTION_RUSSIAN: Record<ConstructorStage6ActionWord, { label: string; present: readonly string[]; past: readonly [string, string, string] }> = {
  ish: { label: 'Пить', present: ['пью', 'пьёшь', 'пьёт', 'пьём', 'пьёте', 'пьют'], past: ['пил', 'пила', 'пили'] },
  bar: { label: 'Идти', present: ['иду', 'идёшь', 'идёт', 'идём', 'идёте', 'идут'], past: ['ходил', 'ходила', 'ходили'] },
  kel: { label: 'Приходить', present: ['прихожу', 'приходишь', 'приходит', 'приходим', 'приходите', 'приходят'], past: ['приходил', 'приходила', 'приходили'] },
  jaz: { label: 'Писать', present: ['пишу', 'пишешь', 'пишет', 'пишем', 'пишете', 'пишут'], past: ['писал', 'писала', 'писали'] },
  ait: { label: 'Говорить', present: ['говорю', 'говоришь', 'говорит', 'говорим', 'говорите', 'говорят'], past: ['говорил', 'говорила', 'говорили'] },
  kor: { label: 'Видеть', present: ['вижу', 'видишь', 'видит', 'видим', 'видите', 'видят'], past: ['видел', 'видела', 'видели'] },
  oqy: { label: 'Читать', present: ['читаю', 'читаешь', 'читает', 'читаем', 'читаете', 'читают'], past: ['читал', 'читала', 'читали'] },
  tap: { label: 'Находить', present: ['нахожу', 'находишь', 'находит', 'находим', 'находите', 'находят'], past: ['находил', 'находила', 'находили'] },
  al: { label: 'Брать', present: ['беру', 'берёшь', 'берёт', 'берём', 'берёте', 'берут'], past: ['брал', 'брала', 'брали'] },
  ber: { label: 'Давать', present: ['даю', 'даёшь', 'даёт', 'даём', 'даёте', 'дают'], past: ['давал', 'давала', 'давали'] },
  soile: { label: 'Разговаривать', present: ['разговариваю', 'разговариваешь', 'разговаривает', 'разговариваем', 'разговариваете', 'разговаривают'], past: ['разговаривал', 'разговаривала', 'разговаривали'] },
  jur: { label: 'Ходить', present: ['хожу', 'ходишь', 'ходит', 'ходим', 'ходите', 'ходят'], past: ['ходил', 'ходила', 'ходили'] },
  apar: { label: 'Относить', present: ['отношу', 'относишь', 'относит', 'относим', 'относите', 'относят'], past: ['относил', 'относила', 'относили'] },
  akel: { label: 'Приносить', present: ['приношу', 'приносишь', 'приносит', 'приносим', 'приносите', 'приносят'], past: ['приносил', 'приносила', 'приносили'] },
};

export function constructorStage6ActionsEligibility(input: ConstructorStage6ActionsInput): { supported: boolean; reasonRu: string | null; topicId: string | null } {
  let reasonRu: string | null = null;
  if (!input || typeof input !== 'object') reasonRu = 'Выбери подготовленный пример действия.';
  else if (!CONSTRUCTOR_STAGE4_PERSON_IDS.includes(input.person)) reasonRu = 'Выбери одно из восьми лиц.';
  else if (input.gender !== undefined && input.gender !== 'male' && input.gender !== 'female') reasonRu = 'Выбери подготовленный русский вариант.';
  else if (!CONSTRUCTOR_STAGE6_ACTION_WORD_IDS.includes(input.wordId)) reasonRu = 'Выбери действие из списка.';
  else if (!own(TIMES, input.time)) reasonRu = 'Выбери: сейчас, обычно, вчера или завтра.';
  else if (typeof input.negative !== 'boolean' || typeof input.question !== 'boolean') reasonRu = 'Выбери утверждение, отрицание или вопрос.';
  else if (input.time !== 'now' && !CONSTRUCTOR_STAGE6_ACTION_ORDINARY_WORD_IDS.includes(input.wordId)) reasonRu = 'С этим действием здесь разбирается только происходящее сейчас. Выбери другое действие или сохрани «Сейчас».';
  else if (input.time === 'now' && (input.negative || input.question)) reasonRu = 'Для действия сейчас выбери утверждение. Отрицание и вопрос в этой пробе пока не разбираются.';
  else if (input.time === 'yesterday' && (input.negative || input.question)) reasonRu = 'Для прошлого действия выбери утверждение. Отрицание и вопрос в этой пробе пока не разбираются.';
  else if (input.negative && input.question) reasonRu = 'Выбери отрицание или вопрос по отдельности. Вопрос с отрицанием в этой пробе пока не разбирается.';
  if (reasonRu) return { supported: false, reasonRu, topicId: null };
  const topicId = input.time === 'now'
    ? (CONSTRUCTOR_STAGE6_ACTION_MOTION_WORD_IDS as readonly string[]).includes(input.wordId) ? 'T78_MOTION_FOUR_PROG' : 'T80_STD_PROG'
    : input.time === 'yesterday' ? 'T31_PAST_DY'
      : input.question ? 'T28_PRES_FUT_Q' : input.negative ? 'T27_PRES_FUT_NEG' : 'T26_PRES_FUT_AFF';
  return { supported: true, reasonRu: null, topicId };
}

export function constructorStage6ActionsThoughtRu(input: ConstructorStage6ActionsInput): string {
  if (!constructorStage6ActionsEligibility(input).supported) return '';
  const i = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person);
  const actor = input.person === 'ol' ? input.gender === 'female' ? 'Она' : 'Он' : ['Я', 'Ты', 'Вы', 'Он', 'Мы', 'Вы', 'Вы', 'Они'][i];
  const lexeme = CONSTRUCTOR_STAGE6_ACTION_RUSSIAN[input.wordId];
  const verbIndex = [0, 1, 4, 2, 3, 4, 4, 5][i];
  const pastIndex = ['men', 'sen', 'ol'].includes(input.person) ? input.gender === 'female' ? 1 : 0 : 2;
  const future = ['буду', 'будешь', 'будет', 'будем', 'будете', 'будут'][verbIndex];
  const verb = input.time === 'yesterday' ? lexeme.past[pastIndex] : input.time === 'tomorrow' ? `${future} ${lexeme.label.toLocaleLowerCase('ru-RU')}` : lexeme.present[verbIndex];
  return `${actor} ${TIMES[input.time].ru} ${input.negative ? 'не ' : ''}${verb}${input.question ? '?' : '.'}`;
}

export function constructorStage6ActionsThoughtAliases(input: ConstructorStage6ActionsInput): string[] {
  const phrase = constructorStage6ActionsThoughtRu(input);
  if (!phrase) return [];
  return input.time === 'now' ? [phrase, phrase.replace(' сейчас ', ' прямо сейчас ')] : [phrase];
}

export function buildConstructorStage6Actions(input: ConstructorStage6ActionsInput): ConstructorStage6ActionsResult {
  const eligibility = constructorStage6ActionsEligibility(input);
  if (!eligibility.supported || !eligibility.topicId) return { status: 'limited', text: null, thoughtRu: '', translationRu: '', topicId: null, wordId: null, steps: [], limits: [eligibility.reasonRu!], sourceIds: [], acceptedAnswers: [], formulaChainText: '', morphologySegments: [] };
  const topicId = eligibility.topicId;
  const built = buildForm(topicId, input.wordId, input.person);
  const predicate = built.afterCheck.canonicalFormKz;
  const pronoun = PERSONS[input.person].pronounKz;
  const time = TIMES[input.time];
  const particle = input.question ? built.afterCheck.coloredSegments.find(part => part.coreBlockId === 'KB-6')!.text : '';
  const action = particle ? predicate.slice(0, -(particle.length + 1)) : predicate;
  const finalWord = action.split(' ').at(-1)!;
  const ending = built.afterCheck.coloredSegments.find(part => part.coreBlockId === 'KB-3' || part.coreBlockId === 'KB-4')?.text ?? '';
  const part = input.question ? particle : input.negative ? built.beforeCheck.multiStepBlanks![0].correctPiece : ending || finalWord;
  const explanationRu = input.question
    ? ['ol', 'olar'].includes(input.person) ? 'В третьем лице перед частицей нет окончания утверждения. Частица пишется отдельно.' : 'Вопросительная частица выбирается по последнему звуку готового слова. Она пишется отдельно.'
    : input.negative ? 'Суффикс отрицает действие и уже включает показатель времени. Личное окончание идёт после него.'
      : ending ? input.time === 'now' ? 'Окончание на последнем слове показывает, кто действует сейчас.' : 'Личное окончание показывает, кто действует.'
        : 'В третьем лице здесь нет личного окончания. Напиши последнее слово целиком.';
  const practice: ConstructorStage4Practice = {
    part: { id: 'practice-part', text: part, before: input.question ? action + ' ' : input.negative ? ROOTS_BY_ID[input.wordId].kz : ending ? finalWord.slice(0, -ending.length) : '', after: input.negative ? ending : '', explanationRu },
    word: { id: 'practice-word', text: finalWord, labelRu: input.time === 'now' ? 'Напиши последнее слово фразы целиком' : 'Напиши слово действия целиком' },
  };
  const meaningRu = input.time === 'now' ? 'Действие происходит сейчас. Лицо выражено на вспомогательном слове.'
    : input.time === 'yesterday' ? 'Действие было вчера. Эта форма сама по себе не говорит, что дело доведено до конца.'
      : input.time === 'tomorrow' ? 'Слово «завтра» задаёт будущее. Форма действия совпадает с формой обычного действия.'
        : 'Речь об обычном действии. Указание «прямо сейчас» сюда не добавлено.';
  const steps = [
    { id: 'subject', labelRu: 'Кто действует', text: pronoun, explanationRu: 'Местоимение называет исполнителя. Смена лица сохраняет выбранное действие и время.' },
    { id: 'time', labelRu: 'Когда', text: time.kz, explanationRu: meaningRu },
    { id: 'action', labelRu: input.negative ? 'Не делать' : 'Какое действие', text: action, explanationRu: `${meaningRu} ${input.negative ? 'Отрицается действие, а не желание или возможность.' : ''} ${built.afterCheck.mergerCapsule?.explanationRu ?? ''}`.trim() },
  ];
  if (input.question) steps.push({ id: 'question', labelRu: 'Спросить', text: particle, explanationRu });
  const text = sentence(`${pronoun} ${time.kz} ${predicate}`, input.question);
  const thoughtRu = constructorStage6ActionsThoughtRu(input);
  const sourceIds: ConstructorStage6ActionsSourceId[] = [input.time === 'now' ? 'stage6-actions-current' : input.time === 'yesterday' ? 'stage6-actions-past' : input.negative ? 'stage6-actions-negative' : 'stage6-actions-ordinary', 'stage6-actions-time-context'];
  const limits = ['Здесь названо только действие. Предмет, место и другие слова не добавляются автоматически.'];
  if (input.time === 'now') limits.push('В этой пробе выбрано одно вспомогательное слово. Другие варианты могут менять оттенок смысла.');
  if (input.time === 'yesterday') limits.push('Прошедшее время не доказывает, что действие завершено.');
  if (input.question) limits.push('Вопрос относится ко всему сообщению и сам по себе не подтверждает его.');
  return { status: 'ready', text, thoughtRu, translationRu: thoughtRu, topicId, wordId: input.wordId, steps, limits, sourceIds, practice,
    acceptedAnswers: [text, sentence(`${time.kz} ${predicate}`, input.question)], formulaChainText: built.afterCheck.formulaChainText, morphologySegments: getExplanationSegments(built) };
}

export function checkConstructorStage6ActionsAnswer(input: ConstructorStage6ActionsInput, answer: string, mode: 'part' | 'word' | 'full' = 'full'): { passed: boolean; messageRu: string; expected: string | null } {
  const built = buildConstructorStage6Actions(input);
  if (built.status !== 'ready') return { passed: false, messageRu: built.limits[0], expected: null };
  if (!['part', 'word', 'full'].includes(mode)) return { passed: false, messageRu: 'Выбери часть, слово или целую фразу.', expected: null };
  const expected = mode === 'full' ? built.text! : built.practice![mode].text;
  const answers = mode === 'full' ? built.acceptedAnswers : [expected];
  const passed = typeof answer === 'string' && answers.some(value => normalizedAnswer(value) === normalizedAnswer(answer));
  return { passed, expected, messageRu: passed ? 'Этот вариант совпадает с подготовленным ответом.' : 'Сравни с этим вариантом. Другой ответ здесь ещё не проверен.' };
}
