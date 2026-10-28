import { pickGerundYpSuffix, pickPastDySuffix, pickPresentAEYSuffix } from './form-builder';
import { getVowelRow, joinWithBoundaryMerger, pickCaseSuffix, pickFullPersonalEnding, pickShortPersonalEnding } from './phonetics';
import { PERSONS } from './roots';
import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person, type ConstructorStage4Result, type ConstructorStage4Step } from './constructor-stage4';
import type { ConstructorWave4PhasesSourceId } from './constructor-wave4-phases-evidence';

export const CONSTRUCTOR_WAVE4_PHASES = [
  { id: 'begin', labelRu: 'Начать', sourceElementId: 'grammar-question:32.2' },
  { id: 'continue', labelRu: 'Продолжать', sourceElementId: 'grammar-question:32.3' },
  { id: 'finish', labelRu: 'Закончить', sourceElementId: 'grammar-question:32.10' },
  { id: 'complete', labelRu: 'Выполнить до конца', sourceElementId: 'grammar-question:32.11' },
  { id: 'retain', labelRu: 'Результат ещё есть', sourceElementId: 'grammar-question:32.13' },
] as const;
export const CONSTRUCTOR_WAVE4_PHASES_ACTIONS = [
  { id: 'read-book', labelRu: 'Читать книгу', phases: ['begin', 'continue', 'finish', 'complete'] },
  { id: 'write-letter', labelRu: 'Писать письмо', phases: ['begin', 'continue', 'finish', 'complete'] },
  { id: 'close-door', labelRu: 'Закрыть дверь', phases: ['retain'] },
  { id: 'open-window', labelRu: 'Открыть окно', phases: ['retain'] },
] as const;
export const CONSTRUCTOR_WAVE4_PHASES_TIMES = [
  { id: 'past', labelRu: 'Вчера' }, { id: 'future', labelRu: 'Завтра' },
] as const;
export type ConstructorWave4Phase = typeof CONSTRUCTOR_WAVE4_PHASES[number]['id'];
export type ConstructorWave4PhaseAction = typeof CONSTRUCTOR_WAVE4_PHASES_ACTIONS[number]['id'];
export type ConstructorWave4PhaseTime = typeof CONSTRUCTOR_WAVE4_PHASES_TIMES[number]['id'];
export interface ConstructorWave4PhasesInput {
  caseId: 'phases';
  phase: ConstructorWave4Phase;
  action: ConstructorWave4PhaseAction;
  person: ConstructorStage4Person;
  gender: ConstructorStage4Gender;
  time: ConstructorWave4PhaseTime;
}
export interface ConstructorWave4PhasesVisual {
  phase: ConstructorWave4Phase;
  actionLabelRu: string;
  stageLabelRu: string;
  resultLabelRu: string;
  completion: 'not-asserted' | 'finished' | 'whole-task' | 'retained';
  time: ConstructorWave4PhaseTime;
  eventAsserted: boolean;
  resultNowAsserted: boolean;
  stoppedContrastRu: string;
}
export interface ConstructorWave4PhasesResult extends Omit<ConstructorStage4Result, 'sourceIds' | 'steps'> {
  packageId: 'phases';
  sourceIds: ConstructorWave4PhasesSourceId[];
  sourceElementIds: string[];
  steps: (ConstructorStage4Step & { kazakh: string; meaningRu: string })[];
  outputKind: 'sentence';
  answerScopeRu: string;
  translationRu: string;
  visual?: ConstructorWave4PhasesVisual;
}

const LEXICON = {
  'read-book': { stem: 'оқы', object: 'кітап', infinitiveRu: 'читать книгу', objectRu: 'книгу', completePastRu: 'прочитал', completeFutureRu: ['прочитаю', 'прочитаешь', 'прочитаете', 'прочитает', 'прочитаем', 'прочитаете', 'прочитаете', 'прочитают'], wholeAux: 'шық', stateKz: '', stateRu: '' },
  'write-letter': { stem: 'жаз', object: 'хат', infinitiveRu: 'писать письмо', objectRu: 'письмо', completePastRu: 'дописал', completeFutureRu: ['допишу', 'допишешь', 'допишете', 'допишет', 'допишем', 'допишете', 'допишете', 'допишут'], wholeAux: 'бітір', stateKz: '', stateRu: '' },
  'close-door': { stem: 'жап', object: 'есік', infinitiveRu: 'закрыть дверь', objectRu: 'дверь', completePastRu: 'закрыл', completeFutureRu: [], wholeAux: '', stateKz: 'жабық', stateRu: 'дверь всё ещё закрыта' },
  'open-window': { stem: 'аш', object: 'терезе', infinitiveRu: 'открыть окно', objectRu: 'окно', completePastRu: 'открыл', completeFutureRu: [], wholeAux: '', stateKz: 'ашық', stateRu: 'окно всё ещё открыто' },
} as const;
const KEYS = ['caseId', 'phase', 'action', 'person', 'gender', 'time'];
const upper = (value: string) => value.charAt(0).toLocaleUpperCase('ru-RU') + value.slice(1);
const normalizedAnswer = (value: string) => value.normalize('NFC').toLocaleLowerCase('kk-KZ').trim().replace(/[.!?]+$/u, '').replace(/\s+/gu, ' ');

export function constructorWave4PhasesActions(phase: ConstructorWave4Phase) {
  return CONSTRUCTOR_WAVE4_PHASES_ACTIONS.filter(action => (action.phases as readonly string[]).includes(phase));
}

export function constructorWave4PhasesTimes(phase: ConstructorWave4Phase) {
  return CONSTRUCTOR_WAVE4_PHASES_TIMES.filter(time => phase !== 'retain' || time.id === 'past');
}

/** Unknown fields and unsupported combinations must never silently become a prepared phrase. */
export function decodeConstructorWave4PhasesInput(raw: unknown): ConstructorWave4PhasesInput | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (Object.keys(value).length !== KEYS.length || Object.keys(value).some(key => !KEYS.includes(key))) return null;
  if (value.caseId !== 'phases' || !CONSTRUCTOR_WAVE4_PHASES.some(phase => phase.id === value.phase)
    || !CONSTRUCTOR_WAVE4_PHASES_ACTIONS.some(action => action.id === value.action)
    || !(CONSTRUCTOR_STAGE4_PERSON_IDS as readonly unknown[]).includes(value.person)
    || !['male', 'female'].includes(value.gender as string) || !['past', 'future'].includes(value.time as string)) return null;
  const input = value as unknown as ConstructorWave4PhasesInput;
  if (!constructorWave4PhasesActions(input.phase).some(action => action.id === input.action)
    || !constructorWave4PhasesTimes(input.phase).some(time => time.id === input.time)) return null;
  return { caseId: 'phases', phase: input.phase, action: input.action, person: input.person, gender: input.gender, time: input.time };
}

function limited(): ConstructorWave4PhasesResult {
  return { packageId: 'phases', status: 'limited', text: null, thoughtRu: '', translationRu: '', sourceIds: [], sourceElementIds: [], steps: [], acceptedAnswers: [], outputKind: 'sentence', answerScopeRu: 'Целое сообщение', limits: ['Это сочетание действия, этапа и времени здесь ещё не подготовлено.'] };
}

function subjectRu(input: ConstructorWave4PhasesInput): string {
  return input.person === 'ol' ? input.gender === 'female' ? 'Она' : 'Он'
    : ({ men: 'Я', sen: 'Ты', siz: 'Вы', biz: 'Мы', sender: 'Вы', sizder: 'Вы', olar: 'Они' } as const)[input.person];
}

function pastRu(base: string, input: ConstructorWave4PhasesInput): string {
  return ['men', 'sen', 'ol'].includes(input.person) ? base + (input.gender === 'female' ? 'а' : '') : base + 'и';
}

export function constructorWave4PhasesThoughtRu(raw: ConstructorWave4PhasesInput): string {
  const input = decodeConstructorWave4PhasesInput(raw);
  if (!input) return '';
  const word = LEXICON[input.action];
  const index = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person);
  let eventRu: string;
  if (input.phase === 'retain') eventRu = `${pastRu(word.completePastRu, input)} ${word.objectRu}. Сейчас ${word.stateRu}`;
  else if (input.phase === 'complete') eventRu = `${input.time === 'past' ? pastRu(word.completePastRu, input) : word.completeFutureRu[index]} ${word.objectRu} ${input.action === 'read-book' ? 'целиком' : 'до конца'}`;
  else {
    const past = { begin: 'начал', continue: 'продолжал', finish: 'закончил' }[input.phase];
    const future = {
      begin: ['начну', 'начнёшь', 'начнёте', 'начнёт', 'начнём', 'начнёте', 'начнёте', 'начнут'],
      continue: ['продолжу', 'продолжишь', 'продолжите', 'продолжит', 'продолжим', 'продолжите', 'продолжите', 'продолжат'],
      finish: ['закончу', 'закончишь', 'закончите', 'закончит', 'закончим', 'закончите', 'закончите', 'закончат'],
    }[input.phase][index];
    eventRu = `${input.time === 'past' ? pastRu(past, input) : future} ${word.infinitiveRu}`;
  }
  return `${subjectRu(input)} ${input.time === 'past' ? 'вчера' : 'завтра'} ${eventRu}.`;
}

export function constructorWave4PhasesThoughtAliases(raw: ConstructorWave4PhasesInput): string[] {
  const input = decodeConstructorWave4PhasesInput(raw);
  if (!input) return [];
  const phrase = constructorWave4PhasesThoughtRu(input);
  const noTime = phrase.replace(input.time === 'past' ? ' вчера ' : ' завтра ', ' ');
  const aliases = [phrase, noTime];
  if (input.phase === 'finish') aliases.push(phrase.replace(/закончил/gu, 'завершил'), noTime.replace(/закончил/gu, 'завершил'));
  if (input.phase === 'complete') aliases.push(phrase.replace(/целиком/gu, 'до конца'), noTime.replace(/целиком/gu, 'до конца'));
  return [...new Set(aliases)];
}

export function buildConstructorWave4Phases(raw: ConstructorWave4PhasesInput): ConstructorWave4PhasesResult {
  const input = decodeConstructorWave4PhasesInput(raw);
  if (!input) return limited();
  const word = LEXICON[input.action];
  const aey = input.phase === 'begin' || input.phase === 'continue';
  const connector = aey ? joinWithBoundaryMerger(word.stem, pickPresentAEYSuffix(word.stem).suffix).mergedWord : pickGerundYpSuffix(word.stem).mergedStem;
  const auxStem = input.phase === 'begin' ? 'баста' : input.phase === 'continue' ? 'бер' : input.phase === 'finish' ? 'бол' : input.phase === 'complete' ? word.wholeAux : 'қой';
  const auxBase = input.time === 'past' ? auxStem + pickPastDySuffix(auxStem).suffix : joinWithBoundaryMerger(auxStem, pickPresentAEYSuffix(auxStem).suffix).mergedWord;
  const ending = input.time === 'past' ? pickShortPersonalEnding(getVowelRow(auxStem), input.person).suffix : pickFullPersonalEnding(auxBase, input.person, { thirdPersonHasDyDi: true }).suffix;
  const auxWord = auxBase + ending;
  const subject = upper(PERSONS[input.person].pronounKz);
  const when = input.time === 'past' ? 'кеше' : 'ертең';
  const object = word.object + pickCaseSuffix(word.object, 'accusative').suffix;
  const presentState = input.phase === 'retain' ? ` Қазір ${word.object} әлі ${word.stateKz}.` : '';
  const content = `${when} ${object} ${connector} ${auxWord}.`;
  const text = `${subject} ${content}${presentState}`;
  const thoughtRu = constructorWave4PhasesThoughtRu(input);
  const labels = CONSTRUCTOR_WAVE4_PHASES.find(phase => phase.id === input.phase)!;
  const meaning = {
    begin: 'Сообщаем о начале действия. Его завершение ещё не утверждается.',
    continue: 'То же действие продолжается. Здесь нет значения «сделать для другого».',
    finish: 'Действие закончено. Эта форма не означает просто «перестать» и не сообщает, сохранился ли результат сейчас.',
    complete: input.action === 'read-book' ? 'Прочитана вся названная книга. Простая остановка чтения этого не означает.' : 'Написание письма доведено до конца. Сколько было подходов, здесь не сообщается.',
    retain: 'Действие выполнено. Отдельное предложение прямо сообщает, что результат есть сейчас; что будет дальше, не утверждается.',
  }[input.phase];
  const explanationRu = input.time === 'future' ? `Слово «завтра» относит выбранный этап к будущему. Это сообщение о будущем, а не подтверждение уже сделанного. ${input.phase === 'begin' ? 'Начало не обещает завершения.' : ''}`.trim() : meaning;
  const partExplanation = ending ? 'Окончание на последнем глаголе показывает, кто действует. Основное действие остаётся в связующей форме.' : 'В третьем лице прошедшего времени личного окончания нет. Напиши последнее слово действия целиком.';
  const step = (id: string, labelRu: string, kazakh: string, meaningRu: string, explanation: string) => ({ id, labelRu, text: kazakh, kazakh, meaningRu, explanationRu: explanation });
  const steps = [
    step('phases-person', 'Кто действует', subject, subjectRu(input), 'Местоимение называет человека. Его лицо выражено и на последнем глаголе.'),
    step('phases-time', 'Когда', when, input.time === 'past' ? 'вчера' : 'завтра', input.time === 'past' ? 'Время сообщает, когда это было. Начало, продолжение и завершение различаются выбранным сочетанием.' : 'Завтра — будущее. Этот вариант не утверждает уже полученного результата.'),
    step('phases-object', 'С чем связано действие', object, word.objectRu, 'Предмет назван явно и сохраняется при совместимой смене этапа.'),
    step('phases-action', 'Какое действие', connector, `Часть сочетания «${word.infinitiveRu}»`, aey ? input.action === 'read-book' ? 'Основу «оқы» и суффикс -й записываем слитно: «оқи». Это связующая форма перед словом начала или продолжения.' : 'После согласной в основе «жаз» нужен суффикс -а: «жаза». Это связующая форма перед словом начала или продолжения.' : input.action === 'close-door' ? 'Перед вспомогательным словом «жап» получает связующую форму «жауып».' : pickGerundYpSuffix(word.stem).ruleRu),
    step('phases-stage', input.phase === 'retain' ? 'Действие выполнено' : labels.labelRu, auxWord, input.phase === 'retain' ? 'Часть сочетания о выполненном действии' : labels.labelRu.toLocaleLowerCase('ru-RU'), explanationRu),
  ];
  if (presentState) steps.push(step('phases-state', 'Что есть сейчас', presentState.trim(), `Сейчас ${word.stateRu}.`, 'Сохранённое состояние сообщено отдельно. Одно прошедшее действие не заменяет эту часть.'));
  const sourceIds: ConstructorWave4PhasesSourceId[] = ['wave4-phases-academic', 'wave4-phases-person'];
  sourceIds.push(input.phase === 'begin' ? 'wave4-phases-begin' : input.phase === 'continue' ? 'wave4-phases-continue' : input.phase === 'finish' ? 'wave4-phases-finish' : input.phase === 'complete' ? input.action === 'read-book' ? 'wave4-phases-read-through' : 'wave4-phases-write-through' : 'wave4-phases-retain');
  if (input.phase === 'retain') sourceIds.push('wave4-phases-lexicon', 'wave4-phases-still');
  if (input.time === 'future') sourceIds.push('wave4-phases-future');
  return {
    packageId: 'phases', status: 'ready', text, thoughtRu, translationRu: thoughtRu, steps, sourceIds, sourceElementIds: [labels.sourceElementId], outputKind: 'sentence', answerScopeRu: input.phase === 'retain' ? 'Действие и состояние сейчас — два предложения' : 'Целое сообщение',
    acceptedAnswers: [text, `${upper(content)}${presentState}`],
    limits: [explanationRu, 'Здесь подготовлены только указанные действия и сочетания. Русский вид не выбирает казахское вспомогательное слово автоматически.', 'Вопросы, отрицание, остановка без завершения, другие времена и произвольные действия этим набором не проверяются.'],
    practice: { part: { id: 'practice-part', text: ending || auxWord, before: `${subject} ${when} ${object} ${connector} ${ending ? auxBase : ''}`, after: `.${presentState}`, explanationRu: partExplanation }, word: { id: 'practice-word', text: auxWord, labelRu: 'Напиши последнее слово действия целиком' } },
    visual: { phase: input.phase, actionLabelRu: CONSTRUCTOR_WAVE4_PHASES_ACTIONS.find(action => action.id === input.action)!.labelRu, stageLabelRu: labels.labelRu, resultLabelRu: input.time === 'future' ? 'Результат ещё не утверждается' : input.phase === 'retain' ? upper(word.stateRu) : input.phase === 'complete' ? 'Всё указанное действие выполнено' : input.phase === 'finish' ? 'Действие закончено; состояние сейчас не сообщено' : 'Завершение не утверждается', completion: input.phase === 'retain' ? 'retained' : input.phase === 'complete' ? 'whole-task' : input.phase === 'finish' ? 'finished' : 'not-asserted', time: input.time, eventAsserted: input.time === 'past', resultNowAsserted: input.phase === 'retain', stoppedContrastRu: 'Перестать делать — значит остановиться. Это само по себе не означает выполнить всё до конца.' },
  };
}

export function constructorWave4PhasesPreparedContexts(): ConstructorWave4PhasesInput[] {
  const result: ConstructorWave4PhasesInput[] = [];
  for (const phase of CONSTRUCTOR_WAVE4_PHASES) for (const action of constructorWave4PhasesActions(phase.id)) for (const time of constructorWave4PhasesTimes(phase.id)) for (const person of CONSTRUCTOR_STAGE4_PERSON_IDS) {
    const genders: ConstructorStage4Gender[] = person === 'ol' || (time.id === 'past' && ['men', 'sen'].includes(person)) ? ['male', 'female'] : ['male'];
    for (const gender of genders) result.push({ caseId: 'phases', phase: phase.id, action: action.id, person, gender, time: time.id });
  }
  return result;
}

export function checkConstructorWave4PhasesAnswer(input: ConstructorWave4PhasesInput, answer: string, mode: 'part' | 'word' | 'full' = 'full'): { passed: boolean; expected: string | null; messageRu: string } {
  const built = buildConstructorWave4Phases(input);
  if (built.status !== 'ready') return { passed: false, expected: null, messageRu: built.limits[0] };
  if (!['part', 'word', 'full'].includes(mode) || typeof answer !== 'string') return { passed: false, expected: null, messageRu: 'Выбери часть, слово или целое сообщение.' };
  const expected = mode === 'full' ? built.text! : built.practice![mode].text;
  const answers = mode === 'full' ? built.acceptedAnswers : [expected];
  const passed = answers.some(candidate => normalizedAnswer(candidate) === normalizedAnswer(answer));
  return { passed, expected, messageRu: passed ? 'Этот вариант совпадает с подготовленным ответом.' : 'Сравни с этим вариантом. Другой ответ здесь ещё не проверен.' };
}
