import { buildForm, pickConditionalSaSuffix, pickGerundYpSuffix, pickParticipleGanSuffix, pickPastDySuffix } from './form-builder';
import { getVowelRow, pickCaseSuffix, pickPossessiveSuffix, pickShortPersonalEnding, pickVerbNegationSuffix } from './phonetics';
import { PERSONS, ROOTS_BY_ID } from './roots';
import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person, type ConstructorStage4Result, type ConstructorStage4Step } from './constructor-stage4';
import type { ConstructorWave4EventsSourceId } from './constructor-wave4-events-evidence';

export const CONSTRUCTOR_WAVE4_EVENTS_RELATIONS = ['while', 'before', 'as-soon-as', 'if', 'because', 'when'] as const;
export type ConstructorWave4EventsRelation = typeof CONSTRUCTOR_WAVE4_EVENTS_RELATIONS[number];
export type ConstructorWave4EventsOrder = 'dependent-first' | 'main-first';
export interface ConstructorWave4EventsInput {
  caseId: 'event-links';
  relation: ConstructorWave4EventsRelation;
  person: ConstructorStage4Person;
  dependentPerson: ConstructorStage4Person;
  dependentNegative: boolean;
  mainNegative: boolean;
  order: ConstructorWave4EventsOrder;
  gender?: ConstructorStage4Gender;
  dependentGender?: ConstructorStage4Gender;
}
export interface ConstructorWave4EventsStep extends ConstructorStage4Step { kazakh: string; meaningRu: string }
export interface ConstructorWave4EventsVisual {
  kind: 'two-events';
  relation: 'overlap' | 'before' | 'immediate-after' | 'condition' | 'cause' | 'time-point';
  relationLabelRu: string;
  dependent: { person: ConstructorStage4Person; labelRu: string; kazakh: string; meaningRu: string; negative: boolean };
  main: { person: ConstructorStage4Person; labelRu: string; kazakh: string; meaningRu: string; negative: boolean };
  order: ConstructorWave4EventsOrder;
  timeLabelRu: string;
  explanationRu: string;
}
export interface ConstructorWave4EventsResult extends Omit<ConstructorStage4Result, 'steps' | 'sourceIds'> {
  steps: ConstructorWave4EventsStep[];
  sourceIds: ConstructorWave4EventsSourceId[];
  sourceElementIds: string[];
  outputKind: 'sentence' | null;
  answerScopeRu: 'Целое предложение' | '';
  partKind: 'suffix' | 'word' | null;
  visual?: ConstructorWave4EventsVisual;
  controls?: ReturnType<typeof constructorWave4EventsDimensions>;
}
export const CONSTRUCTOR_WAVE4_EVENTS_MATRIX = {
  while: { labelRu: 'Пока происходит', visual: 'overlap', timeRu: 'Оба действия сейчас', dependentNegative: [false], mainNegative: [false], orders: ['dependent-first'], differentPeople: false, explanationRu: 'Чтение и питьё чая происходят одновременно. Здесь нет ожидания конца чтения.' },
  before: { labelRu: 'До того как', visual: 'before', timeRu: 'Уход в прошлом, раньше прихода', dependentNegative: [false], mainNegative: [false], orders: ['dependent-first'], differentPeople: true, explanationRu: 'Один человек ушёл до прихода другого. Форма перед «бұрын» отмечает предшествование. Она не утверждает, что второй человек так и не пришёл.' },
  'as-soon-as': { labelRu: 'Как только', visual: 'immediate-after', timeRu: 'Приход, затем сразу уход — в прошлом', dependentNegative: [false], mainNegative: [false], orders: ['dependent-first'], differentPeople: false, explanationRu: 'Приход сразу сменяется уходом. Простого «после» здесь недостаточно: промежуток не выделяется.' },
  if: { labelRu: 'Если / если не', visual: 'condition', timeRu: 'Возможная будущая ситуация', dependentNegative: [false, true], mainNegative: [false, true], orders: ['dependent-first'], differentPeople: false, explanationRu: 'Чтение или его отсутствие — условие для письма. Ни чтение, ни письмо не утверждаются как уже случившиеся. «Если не» не означает «пока не» и не является запретом.' },
  because: { labelRu: 'Потому что', visual: 'cause', timeRu: 'Объясняем прошлое событие', dependentNegative: [false, true], mainNegative: [false, true], orders: ['dependent-first', 'main-first'], differentPeople: true, explanationRu: 'Приход или его отсутствие объясняет уход либо отсутствие ухода. Причина и результат сохраняются при смене порядка слов. После «өйткені» причина получает личную форму.' },
  when: { labelRu: 'Когда произошло', visual: 'time-point', timeRu: 'Приход и сообщение об уходе — в прошлом', dependentNegative: [false], mainNegative: [false, true], orders: ['dependent-first'], differentPeople: false, explanationRu: 'Приход задаёт момент. Отрицание главного сообщения говорит, что человек не ушёл; приход при этом состоялся.' },
} as const;

const keys = ['caseId', 'relation', 'person', 'dependentPerson', 'dependentNegative', 'mainNegative', 'order', 'gender', 'dependentGender'];
const subjectsRu = ['я', 'ты', 'вы', 'он', 'мы', 'вы', 'вы', 'они'];
const readRu = ['читаю', 'читаешь', 'читаете', 'читает', 'читаем', 'читаете', 'читаете', 'читают'];
const drinkRu = ['пью', 'пьёшь', 'пьёте', 'пьёт', 'пьём', 'пьёте', 'пьёте', 'пьют'];
const willReadRu = ['прочитаю', 'прочитаешь', 'прочитаете', 'прочитает', 'прочитаем', 'прочитаете', 'прочитаете', 'прочитают'];
const willWriteRu = ['напишу', 'напишешь', 'напишете', 'напишет', 'напишем', 'напишете', 'напишете', 'напишут'];
const upper = (value: string) => value.charAt(0).toLocaleUpperCase('kk-KZ') + value.slice(1);
const index = (person: ConstructorStage4Person) => CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(person);
const subjectRu = (person: ConstructorStage4Person, gender?: ConstructorStage4Gender) => person === 'ol' && gender === 'female' ? 'она' : subjectsRu[index(person)];
const pastRu = (person: ConstructorStage4Person, gender: ConstructorStage4Gender | undefined, kind: 'come' | 'leave') => ['men', 'sen', 'ol'].includes(person) ? kind === 'come' ? gender === 'female' ? 'пришла' : 'пришёл' : gender === 'female' ? 'ушла' : 'ушёл' : kind === 'come' ? 'пришли' : 'ушли';
const arrivalRu = (person: ConstructorStage4Person, gender?: ConstructorStage4Gender) => `${person === 'ol' && gender === 'female' ? 'её' : ['моего', 'твоего', 'вашего', 'его', 'нашего', 'вашего', 'вашего', 'их'][index(person)]} прихода`;
const genders = (relation: ConstructorWave4EventsRelation, person: ConstructorStage4Person, role: 'main' | 'dependent' = 'main'): readonly ConstructorStage4Gender[] => person === 'ol' || (!['while', 'if'].includes(relation) && !(relation === 'before' && role === 'dependent') && ['men', 'sen'].includes(person)) ? ['male', 'female'] : ['male'];
const step = (id: string, labelRu: string, text: string, meaningRu: string, explanationRu: string): ConstructorWave4EventsStep => ({ id, labelRu, text, kazakh: text, meaningRu, explanationRu });

export function constructorWave4EventsDimensions(input: ConstructorWave4EventsInput) {
  const matrix = CONSTRUCTOR_WAVE4_EVENTS_MATRIX[input.relation];
  const people = (other: ConstructorStage4Person) => CONSTRUCTOR_STAGE4_PERSON_IDS.filter(person => !matrix.differentPeople || person !== other);
  return {
    relation: { enabled: true, labelRu: 'Как связаны события', values: CONSTRUCTOR_WAVE4_EVENTS_RELATIONS },
    person: { enabled: true, labelRu: 'Кто действует в главном сообщении', values: people(input.dependentPerson) },
    dependentPerson: { enabled: true, labelRu: 'Кто действует в пояснении', values: people(input.person) },
    gender: { enabled: genders(input.relation, input.person).length > 1, labelRu: 'Русский род главного участника', values: genders(input.relation, input.person) },
    dependentGender: { enabled: genders(input.relation, input.dependentPerson, 'dependent').length > 1, labelRu: 'Русский род участника пояснения', values: genders(input.relation, input.dependentPerson, 'dependent') },
    dependentNegative: { enabled: matrix.dependentNegative.length > 1, labelRu: 'Отрицание в пояснении', values: matrix.dependentNegative },
    mainNegative: { enabled: matrix.mainNegative.length > 1, labelRu: 'Отрицание главного сообщения', values: matrix.mainNegative },
    order: { enabled: matrix.orders.length > 1, labelRu: 'С чего начать сообщение', values: matrix.orders },
    fixedRu: matrix.timeRu,
  };
}

export function decodeConstructorWave4EventsInput(raw: unknown): ConstructorWave4EventsInput | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (Object.keys(value).some(key => !keys.includes(key)) || value.caseId !== 'event-links'
    || !CONSTRUCTOR_WAVE4_EVENTS_RELATIONS.includes(value.relation as ConstructorWave4EventsRelation)
    || !CONSTRUCTOR_STAGE4_PERSON_IDS.includes(value.person as ConstructorStage4Person)
    || !CONSTRUCTOR_STAGE4_PERSON_IDS.includes(value.dependentPerson as ConstructorStage4Person)) return null;
  const input = value as unknown as ConstructorWave4EventsInput;
  const matrix = CONSTRUCTOR_WAVE4_EVENTS_MATRIX[input.relation];
  if (!(matrix.dependentNegative as readonly unknown[]).includes(input.dependentNegative)
    || !(matrix.mainNegative as readonly unknown[]).includes(input.mainNegative)
    || !(matrix.orders as readonly unknown[]).includes(input.order)
    || (matrix.differentPeople && input.person === input.dependentPerson)
    || (input.gender !== undefined && !genders(input.relation, input.person).includes(input.gender))
    || (input.dependentGender !== undefined && !genders(input.relation, input.dependentPerson, 'dependent').includes(input.dependentGender))) return null;
  return { ...input, gender: input.gender ?? 'male', dependentGender: input.dependentGender ?? 'male' };
}

function limited(): ConstructorWave4EventsResult {
  return { status: 'limited', text: null, thoughtRu: '', steps: [], limits: ['Выбери подготовленную пару событий и доступные настройки. Время и исполнители не заменяются автоматически.'], sourceIds: [], sourceElementIds: [], acceptedAnswers: [], outputKind: null, answerScopeRu: '', partKind: null };
}

/** Local closed lexical recipe: кет — уйти. Other stems remain unavailable. */
function past(stem: string, person: ConstructorStage4Person, negative: boolean) {
  const negativeStem = stem + (negative ? pickVerbNegationSuffix(stem).suffix : '');
  return negativeStem + pickPastDySuffix(negativeStem).suffix + pickShortPersonalEnding(getVowelRow(negativeStem), person).suffix;
}

export function buildConstructorWave4Events(raw: ConstructorWave4EventsInput): ConstructorWave4EventsResult {
  const input = decodeConstructorWave4EventsInput(raw);
  if (!input) return limited();
  const matrix = CONSTRUCTOR_WAVE4_EVENTS_MATRIX[input.relation];
  const mainSubject = PERSONS[input.person].pronounKz;
  const depSubject = PERSONS[input.dependentPerson].pronounKz;
  const mainRu = subjectRu(input.person, input.gender);
  const depRu = subjectRu(input.dependentPerson, input.dependentGender);
  const kel = ROOTS_BY_ID.kel.kz;
  let depPredicate: string;
  let mainPredicate: string;
  let dependent: string;
  let main: string;
  let dependentRu: string;
  let mainMeaningRu: string;
  let thoughtRu: string;
  let targetWord: string;
  let part: string;
  let partExplanation: string;
  const sourceElementIds = ['grammar-question:42.8'];
  const sourceIds: ConstructorWave4EventsSourceId[] = ['wave4-events-finite'];
  if (input.relation === 'while') {
    const auxiliary = 'жат';
    const participle = auxiliary + pickParticipleGanSuffix(auxiliary).suffix;
    targetWord = participle + pickCaseSuffix(participle, 'locative').suffix;
    part = targetWord.slice(auxiliary.length);
    depPredicate = pickGerundYpSuffix(ROOTS_BY_ID.oqy.kz).mergedStem + ' ' + targetWord;
    mainPredicate = buildForm('T80_STD_PROG', 'ish', input.person).afterCheck.canonicalFormKz;
    dependent = `${depSubject} қазір кітап ${depPredicate}`;
    main = `${mainSubject} шай ${mainPredicate}`;
    dependentRu = `${depRu} сейчас ${readRu[index(input.dependentPerson)]} книгу`;
    mainMeaningRu = `${mainRu} ${drinkRu[index(input.person)]} чай`;
    thoughtRu = `Пока ${dependentRu}, ${mainMeaningRu}.`;
    partExplanation = 'У чтения сохраняется продолжающийся процесс. Вспомогательная основа получает причастие и местное окончание: «пока происходит». Не ставим здесь границу «пока не закончится».';
    sourceElementIds.push('grammar-question:43.2');
    sourceIds.push('wave4-events-time', 'wave4-events-process', 'wave4-events-academic-time');
  } else if (input.relation === 'if') {
    const root = ROOTS_BY_ID.oqy.kz;
    const base = root + (input.dependentNegative ? pickVerbNegationSuffix(root).suffix : '');
    targetWord = base + pickConditionalSaSuffix(base).suffix + pickShortPersonalEnding(getVowelRow(base), input.dependentPerson).suffix;
    part = targetWord.slice(root.length);
    depPredicate = targetWord;
    mainPredicate = buildForm(input.mainNegative ? 'T27_PRES_FUT_NEG' : 'T26_PRES_FUT_AFF', 'jaz', input.person).afterCheck.canonicalFormKz;
    dependent = `егер ${depSubject} кітап ${depPredicate}`;
    main = `${mainSubject} хат ${mainPredicate}`;
    dependentRu = `${depRu} ${input.dependentNegative ? 'не ' : ''}${willReadRu[index(input.dependentPerson)]} книгу`;
    mainMeaningRu = `${mainRu} ${input.mainNegative ? 'не ' : ''}${willWriteRu[index(input.person)]} письмо`;
    thoughtRu = `Если ${dependentRu}, ${mainMeaningRu}.`;
    partExplanation = 'Сначала отрицание чтения, если оно выбрано. Затем показатель условия и окончание того, кто читает. Окончание письма относится к другому выбранному участнику.';
    if (input.dependentNegative) sourceElementIds.push('grammar-question:43.19');
    sourceIds.push('wave4-events-condition', 'wave4-events-academic-condition');
  } else {
    mainPredicate = past('кет', input.person, input.mainNegative);
    main = `${mainSubject} ${mainPredicate}`;
    dependentRu = `${depRu} ${input.dependentNegative ? 'не ' : ''}${pastRu(input.dependentPerson, input.dependentGender, 'come')}`;
    mainMeaningRu = `${mainRu} ${input.mainNegative ? 'не ' : ''}${pastRu(input.person, input.gender, 'leave')}`;
    const base = kel + (input.dependentNegative ? pickVerbNegationSuffix(kel).suffix : '');
    const participle = base + pickParticipleGanSuffix(base).suffix;
    if (input.relation === 'before') {
      targetWord = kel + pickVerbNegationSuffix(kel, 'mas').suffix;
      part = targetWord.slice(kel.length);
      depPredicate = targetWord + ' бұрын';
      thoughtRu = `До ${arrivalRu(input.dependentPerson, input.dependentGender)} ${mainMeaningRu}.`;
      dependentRu = `Событие-граница: приход (${depRu})`;
      partExplanation = 'Перед «бұрын» нужна отрицательная форма будущего причастия. Здесь она значит «до прихода», а не «не пришёл». Приход после ухода этой фразой не подтверждается и не отрицается.';
      sourceElementIds.push('grammar-question:43.3');
      sourceIds.push('wave4-events-before', 'wave4-events-academic-time');
    } else if (input.relation === 'as-soon-as') {
      // This recipe is closed to кел; it does not expose an unchecked suffix on arbitrary roots.
      const actionNoun = kel + (getVowelRow(kel) === 'soft' ? 'іс' : 'ыс');
      const possessed = actionNoun + pickPossessiveSuffix(actionNoun, 'ol').suffix;
      targetWord = possessed + pickCaseSuffix(possessed, 'instrumental').suffix;
      part = targetWord.slice(kel.length);
      depPredicate = targetWord;
      thoughtRu = `Как только ${dependentRu}, ${mainRu} сразу ${pastRu(input.person, input.gender, 'leave')}.`;
      partExplanation = 'Название наступившего действия получает принадлежность третьего лица и «-мен». Всё слово означает «как только пришёл». Эта принадлежность не выбирает исполнителя: он назван отдельно.';
      sourceElementIds.push('grammar-question:43.5');
      sourceIds.push('wave4-events-time', 'wave4-events-academic-time');
    } else if (input.relation === 'because') {
      targetWord = input.order === 'main-first' ? past(kel, input.dependentPerson, input.dependentNegative) : participle + (getVowelRow(participle) === 'soft' ? 'діктен' : 'дықтан');
      part = targetWord.slice(kel.length);
      depPredicate = targetWord;
      thoughtRu = input.order === 'main-first' ? `${upper(mainMeaningRu)}, потому что ${dependentRu}.` : `Поскольку ${dependentRu}, ${mainMeaningRu}.`;
      partExplanation = input.order === 'main-first' ? 'После союза причина становится отдельным личным сообщением. Отрицание, время и окончание относятся к тому, кто должен был прийти.' : 'Внутри причины сначала ставится отрицание, если оно выбрано, затем причастие и показатель причины. Оно не меняет отрицание главного сообщения.';
      sourceElementIds.push('grammar-question:42.11');
      if (input.dependentNegative) sourceElementIds.push('grammar-question:42.20');
      sourceIds.push('wave4-events-cause', 'wave4-events-order');
    } else {
      depPredicate = participle + pickCaseSuffix(participle, 'locative').suffix;
      targetWord = input.mainNegative ? mainPredicate : depPredicate;
      part = targetWord.slice(input.mainNegative ? 'кет'.length : kel.length);
      thoughtRu = `Когда ${dependentRu}, ${mainMeaningRu}.`;
      partExplanation = input.mainNegative ? 'Отрицание стоит в слове об уходе, затем идут прошлое время и личное окончание. Приход в пояснении остаётся утвердительным.' : 'Приход получает причастие и местное окончание. Он задаёт момент главного сообщения в прошлом.';
      if (input.mainNegative) sourceElementIds.push('grammar-question:42.21');
      sourceIds.push('wave4-events-time', 'wave4-events-academic-time');
    }
    dependent = `${depSubject} ${depPredicate}`;
  }
  const text = input.order === 'main-first' ? `${upper(main)}, өйткені ${dependent}.` : `${upper(dependent)}, ${main}.`;
  const targetStart = text.lastIndexOf(targetWord);
  const partStart = targetStart + targetWord.length - part.length;
  const dependentExplanation = input.relation === 'if' ? 'Местоимение называет исполнителя условия; личное окончание в условном слове относится к нему. У главного действия своё лицо.' : 'Этот участник назван явно. Его не заменяет лицо главного действия. Личное окончание добавляется только там, где его требует выбранная форма.';
  const dependentMeaning = input.relation === 'while' ? `Пока ${dependentRu}` : input.relation === 'if' ? `Если ${dependentRu}` : input.relation === 'before' ? `До ${arrivalRu(input.dependentPerson, input.dependentGender)}` : input.relation === 'as-soon-as' ? `Как только ${dependentRu}` : input.relation === 'when' ? `Когда ${dependentRu}` : input.order === 'main-first' ? upper(dependentRu) : `Поскольку ${dependentRu}`;
  const steps = [
    step('event-dependent-actor', 'Кто в пояснении', depSubject, depRu, dependentExplanation),
    step('event-dependent', input.relation === 'because' ? 'Причина' : input.relation === 'if' ? 'Условие' : 'Событие для сравнения', dependent, dependentMeaning, input.relation === 'before' ? partExplanation : matrix.explanationRu),
    step('event-main-actor', 'Кто в главном сообщении', mainSubject, mainRu, 'Главное действие согласуется с этим участником. Смена исполнителя пояснения его не меняет.'),
    step('event-main', 'Главное сообщение', main, upper(mainMeaningRu), input.mainNegative ? 'Отрицается только это действие. Пояснение сохраняет своё утверждение или отрицание.' : 'Это главное действие. Его лицо и отрицание выбираются независимо от пояснения.'),
  ];
  if (input.relation === 'because' && input.order === 'main-first') steps.push(step('event-cause-link', 'Связь причины', 'өйткені', 'потому что', matrix.explanationRu));
  return {
    status: 'ready', text, thoughtRu, steps, sourceIds, sourceElementIds, acceptedAnswers: [text],
    outputKind: 'sentence', answerScopeRu: 'Целое предложение', partKind: 'suffix', controls: constructorWave4EventsDimensions(input),
    visual: { kind: 'two-events', relation: matrix.visual, relationLabelRu: matrix.labelRu,
      dependent: { person: input.dependentPerson, labelRu: input.relation === 'because' ? 'Причина' : input.relation === 'if' ? 'Условие' : 'Пояснение времени', kazakh: dependent, meaningRu: upper(dependentRu), negative: input.dependentNegative },
      main: { person: input.person, labelRu: 'Главное сообщение', kazakh: main, meaningRu: upper(mainMeaningRu), negative: input.mainNegative },
      order: input.order, timeLabelRu: matrix.timeRu, explanationRu: matrix.explanationRu },
    limits: [matrix.explanationRu, 'Подготовлены только эти действия и указанное время. Произвольные глаголы, вопросы, нереальное условие и свободная смена времени здесь не собираются.',
      matrix.differentPeople ? 'В этом коротком образце выбери разных участников. Места прихода и ухода не заданы; вариант с одним исполнителем требует отдельного контекста.' : 'Обе роли выбираются независимо. При одинаковом лице короткий образец говорит об одном участнике или одной группе.',
      input.relation === 'because' ? 'Смена порядка меняет способ связи причины, а не порядок событий. Причина не превращается в условие.' : 'Для этой связи подготовлен порядок: сначала пояснение, затем главное сообщение.',
      ['before', 'while', 'as-soon-as'].includes(input.relation) ? 'Отрицание частей в этом образце не выбирается.' : input.relation === 'when' ? 'Приход в этой временной паре остаётся утвердительным.' : 'Отрицания двух действий выбираются отдельно.'],
    practice: { part: { id: 'practice-part', text: part, before: text.slice(0, partStart), after: text.slice(partStart + part.length), explanationRu: partExplanation }, word: { id: 'practice-word', text: targetWord, labelRu: 'Напиши выделенное слово целиком' } },
  };
}

export function constructorWave4EventsPreparedContexts(): ConstructorWave4EventsInput[] {
  const contexts: ConstructorWave4EventsInput[] = [];
  for (const relation of CONSTRUCTOR_WAVE4_EVENTS_RELATIONS) {
    const matrix = CONSTRUCTOR_WAVE4_EVENTS_MATRIX[relation];
    for (const person of CONSTRUCTOR_STAGE4_PERSON_IDS) for (const dependentPerson of CONSTRUCTOR_STAGE4_PERSON_IDS) {
      if (matrix.differentPeople && person === dependentPerson) continue;
      for (const gender of genders(relation, person)) for (const dependentGender of genders(relation, dependentPerson, 'dependent'))
        for (const dependentNegative of matrix.dependentNegative) for (const mainNegative of matrix.mainNegative) for (const order of matrix.orders)
          contexts.push({ caseId: 'event-links', relation, person, dependentPerson, dependentNegative, mainNegative, order, gender, dependentGender });
    }
  }
  return contexts;
}

export function constructorWave4EventsThoughtAliases(input: ConstructorWave4EventsInput): string[] {
  const built = buildConstructorWave4Events(input);
  if (built.status !== 'ready') return [];
  const aliases = [built.thoughtRu];
  if (input.relation === 'while') aliases.push(built.thoughtRu.replace('Пока ', 'В то время как ').replace(' сейчас', ''), built.thoughtRu.replace(' сейчас', ''));
  if (input.relation === 'before') {
    const main = `${subjectRu(input.person, input.gender)} ${pastRu(input.person, input.gender, 'leave')}`;
    aliases.push(`${upper(main)} до ${arrivalRu(input.dependentPerson, input.dependentGender)}.`);
    // These are prepared Russian paraphrases, not a new claim that the boundary occurred.
    aliases.push(`До того как ${subjectRu(input.dependentPerson, input.dependentGender)} ${pastRu(input.dependentPerson, input.dependentGender, 'come')}, ${main}.`);
  }
  if (input.relation === 'as-soon-as') aliases.push(built.thoughtRu.replace(' сразу', ''));
  if (input.relation === 'because') aliases.push(input.order === 'dependent-first' ? built.thoughtRu.replace('Поскольку ', 'Так как ') : built.thoughtRu.replace('потому что', 'так как'));
  return [...new Set(aliases.flatMap(value => [value, value.replace(/ё/g, 'е')]))];
}

const normal = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('kk-KZ').replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
export function checkConstructorWave4EventsAnswer(input: ConstructorWave4EventsInput, answer: string, mode: 'part' | 'word' | 'full' = 'full') {
  const built = buildConstructorWave4Events(input);
  if (built.status !== 'ready' || !built.practice || !['part', 'word', 'full'].includes(mode)) return { passed: false, expected: null, messageRu: built.limits[0] || 'Этот способ ответа не подготовлен.' };
  const expected = mode === 'full' ? built.text! : built.practice[mode].text;
  const passed = Boolean(normal(answer)) && normal(answer) === normal(expected);
  return { passed, expected, messageRu: passed ? 'Верно.' : mode === 'full' ? 'Нужно всё сообщение с выбранными участниками, связью и двумя областями отрицания.' : built.practice.part.explanationRu };
}
