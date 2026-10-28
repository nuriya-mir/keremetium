import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person, type ConstructorStage4Result } from './constructor-stage4';
import { CONSTRUCTOR_LEXEMES, realizeConstructorWord, type ConstructorWord } from './constructor-realization';
import { getCaseVariants } from './case-reference';
import { buildForm } from './form-builder';
import { pickCaseSuffix, type CaseType } from './phonetics';
import { PERSONS } from './roots';
import type { ConstructorStage6CasesSourceId } from './constructor-stage6-cases-evidence';

import { buildConstructorWave3Space, constructorWave3SpaceThoughtAliases, type ConstructorWave3SpaceInput } from './constructor-wave3-space';

export type ConstructorStage6CasesInput = ConstructorStage6LegacyCasesInput | ConstructorWave3SpaceInput;
export const CONSTRUCTOR_STAGE6_CASE_OWNERS = ['none', 'men', 'sen', 'ol'] as const;
export type ConstructorStage6CaseOwner = typeof CONSTRUCTOR_STAGE6_CASE_OWNERS[number];
export type ConstructorStage6CaseWord = 'dos' | 'ui' | 'kitap';
export const CONSTRUCTOR_STAGE6_CASE_RELATIONS = [
  { id: 'subject', labelRu: 'Кто или что', caseNameRu: 'Именительный падеж', caseIndex: 0, caseType: null, nounWords: ['dos', 'kitap'], pronouns: true, meaningRu: 'Назван человек или предмет без падежного окончания. Его роль станет ясна в целом сообщении.' },
  { id: 'object', labelRu: 'Кого или что', caseNameRu: 'Винительный падеж', caseIndex: 3, caseType: 'accusative', nounWords: ['dos', 'kitap'], pronouns: true, meaningRu: 'Здесь выбран известный человек или конкретный предмет действия. По одному русскому слову без контекста эту форму не выбирают.' },
  { id: 'recipient', labelRu: 'Кому', caseNameRu: 'Дательный падеж', caseIndex: 2, caseType: 'dative', nounWords: ['dos'], pronouns: true, meaningRu: 'Выбран человек, которому адресовано действие. Это не направление движения и не утверждение, что он уже что-то получил.' },
  { id: 'place', labelRu: 'Где', caseNameRu: 'Местный падеж', caseIndex: 4, caseType: 'locative', nounWords: ['ui'], pronouns: false, meaningRu: 'Дом назван как место. Форма не сообщает, кто там находится или что там происходит.' },
  { id: 'source', labelRu: 'Откуда или от кого', caseNameRu: 'Исходный падеж', caseIndex: 5, caseType: 'ablative', nounWords: ['dos', 'ui'], pronouns: true, meaningRu: 'Выбрана исходная точка или человек, от которого что-то исходит. Действие и его результат пока не названы.' },
  { id: 'companion', labelRu: 'С кем', caseNameRu: 'Творительный падеж', caseIndex: 6, caseType: 'instrumental', nounWords: ['dos'], pronouns: true, meaningRu: 'Выбран человек для совместного действия. Это спутник, а не инструмент; само действие пока не названо.' },
  { id: 'direction', labelRu: 'Куда', caseNameRu: 'Дательный падеж', caseIndex: 2, caseType: 'dative', nounWords: ['ui'], pronouns: false, meaningRu: 'Выбрано направление к дому. Эта часть не утверждает движение и не говорит, вошёл ли человек внутрь.' },
  { id: 'holder', labelRu: 'У кого', caseNameRu: 'Местный падеж', caseIndex: 4, caseType: 'locative', nounWords: [], pronouns: true, meaningRu: 'Выбран человек в ситуации «у кого». Это не физическое место и не доказательство собственности; наличие или отсутствие вещи ещё не названо.' },
] as const;
export type ConstructorStage6CaseRelation = typeof CONSTRUCTOR_STAGE6_CASE_RELATIONS[number]['id'];

export interface ConstructorStage6LegacyCasesInput {
  caseId: 'case-links';
  /** Omitted in all legacy phrase snapshots. */
  usage?: 'message';
  ownerGender?: ConstructorStage4Gender;
  relation: ConstructorStage6CaseRelation;
  target: 'noun' | 'pronoun';
  wordId: ConstructorStage6CaseWord | 'personal';
  person: ConstructorStage4Person;
  owner: ConstructorStage6CaseOwner;
  gender?: ConstructorStage4Gender;
}
export interface ConstructorStage6CasesResult extends Omit<ConstructorStage4Result, 'sourceIds'> {
  outputKind: 'phrase' | 'sentence';
  answerScopeRu: 'Часть фразы' | 'Целое сообщение';
  relation: ConstructorStage6CaseRelation | null;
  caseNameRu: string;
  partKind: 'suffix' | 'word' | null;
  sourceIds: ConstructorStage6CasesSourceId[];
}

const normalized = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').replace(/[.]+$/, '').toLocaleLowerCase('kk');
const limited = (reason: string): ConstructorStage6CasesResult => ({ status: 'limited', text: null, thoughtRu: '', steps: [], limits: [reason], acceptedAnswers: [], sourceIds: [], outputKind: 'phrase', answerScopeRu: 'Часть фразы', relation: null, caseNameRu: '', partKind: null });
const caseConditions = new Map<CaseType, ReturnType<typeof getCaseVariants>>();

function conditionFor(caseType: CaseType, suffix: string): string {
  if (!caseConditions.has(caseType)) caseConditions.set(caseType, getCaseVariants(caseType));
  return caseConditions.get(caseType)!.find(variant => variant.suffix === suffix)!.conditionRu;
}

function invalidReason(input: ConstructorStage6LegacyCasesInput): string | null {
  if (!input || typeof input !== 'object' || input.caseId !== 'case-links') return 'Выбери подготовленную связь слов.';
  const relation = CONSTRUCTOR_STAGE6_CASE_RELATIONS.find(item => item.id === input.relation);
  if (!relation) return 'Выбери одну из подготовленных связей.';
  if (input.usage !== undefined && input.usage !== 'message') return 'Выбери часть фразы или подготовленное сообщение.';
  if (input.usage === 'message' && (input.target !== 'noun' || input.wordId !== 'ui' || !['place', 'direction', 'source'].includes(input.relation))) return 'Для сообщения выбери дом и связь «где», «куда» или «откуда».';
  if (!CONSTRUCTOR_STAGE4_PERSON_IDS.includes(input.person)) return 'Выбери одно из восьми лиц.';
  if (input.gender !== undefined && !['male', 'female'].includes(input.gender)) return 'Выбери подготовленный русский вариант.';
  if (input.ownerGender !== undefined && (input.usage !== 'message' || !['male', 'female'].includes(input.ownerGender) || (input.owner !== 'ol' && input.ownerGender !== 'male'))) return 'Род владельца выбирается отдельно только для его или её дома в сообщении.';
  if (input.target === 'pronoun') {
    if (input.wordId !== 'personal' || input.owner !== 'none') return 'У личного местоимения здесь меняется лицо, а отдельная принадлежность не добавляется.';
    if (!relation.pronouns) return 'Для этого пространственного примера выбери дом. Местоимение человека не заменяет место.';
  } else if (input.target === 'noun') {
    if (!(relation.nounWords as readonly string[]).includes(input.wordId)) return 'Для этой связи выбери слово из подготовленного списка.';
    if (!CONSTRUCTOR_STAGE6_CASE_OWNERS.includes(input.owner)) return 'Здесь подготовлены отсутствие принадлежности, мой, твой и его или её.';
    if (input.usage !== 'message' && input.person !== 'men') return 'В примере с названием отдельное лицо действия не задано. Меняется только связь названия с человеком.';
  } else return 'Выбери название или личное местоимение.';
  const extra = input as unknown as Record<string, unknown>;
  if (['number', 'quantity', 'negative', 'question', 'time', 'case', 'location', 'verbId'].some(key => key in extra)) return 'В этой части фразы не добавлены число предметов, время, действие, вопрос или отрицание.';
  return null;
}

function wordInput(input: ConstructorStage6LegacyCasesInput, caseIndex: number): ConstructorWord {
  if (input.target === 'pronoun') return { base: 'pronoun', variant: 'personal', meaning: '', steps: [{ id: 'pronounPerson', value: CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person) }, { id: 'case', value: caseIndex }] };
  const meaning = CONSTRUCTOR_LEXEMES.find(item => item.id === input.wordId && item.base === 'noun')!.ru;
  return { base: 'noun', variant: 'basic', meaning, steps: [...(input.owner === 'none' ? [] : [{ id: 'poss', value: CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.owner) }]), { id: 'case', value: caseIndex }] };
}

function phraseRu(input: ConstructorStage6LegacyCasesInput, ru: string, ruCases: string[]): string {
  if (input.target === 'pronoun' && input.person === 'ol') {
    const third = {
      subject: ['он', 'она'], object: ['его', 'её'], recipient: ['ему', 'ей'],
      source: ['от него', 'от неё'], companion: ['с ним', 'с ней'], holder: ['у него', 'у неё'],
    } as const;
    return third[input.relation as keyof typeof third][input.gender === 'female' ? 1 : 0];
  }
  const selected = input.relation === 'direction' ? 'к ' + ruCases[2] : ru;
  return selected.replace(/его \/ её/g, input.gender === 'female' ? 'её' : 'его');
}

/** This package builds and checks a complete phrase part, never an unprovided event. */
/**
 * Closed spatial messages. The event is fixed for each relation; switching
 * relations changes the event and its time, not just a noun ending.
 */
function buildSpatialMessage(input: ConstructorStage6LegacyCasesInput): ConstructorStage6CasesResult {
  const { usage: _usage, ownerGender, ...legacyInput } = input;
  const fragment = buildConstructorStage6Cases({ ...legacyInput, person: 'men', gender: ownerGender ?? 'male' });
  if (fragment.status !== 'ready' || !fragment.text || !fragment.practice) return limited('Для места нет подготовленной формы.');
  const personIndex = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person);
  const subjectKz = PERSONS[input.person].pronounKz;
  const subjectRu = input.person === 'ol' ? input.gender === 'female' ? 'Она' : 'Он' : ['Я', 'Ты', 'Вы', '', 'Мы', 'Вы', 'Вы', 'Они'][personIndex];
  const relation = CONSTRUCTOR_STAGE6_CASE_RELATIONS.find(item => item.id === input.relation)!;
  let predicateKz: string;
  let thoughtRu: string;
  let timeExplanationRu: string;
  let finalAfter: string;
  if (input.relation === 'place') {
    const word = wordInput(input, 4);
    const predicate = realizeConstructorWord({ ...word, steps: [...word.steps, { id: 'nominalPredicate', value: 0 }, { id: 'person', value: personIndex }] });
    if (predicate.status !== 'ready' || !predicate.kz || !predicate.kz.startsWith(fragment.text)) return limited('Для сообщения о месте нет проверенной формы.');
    predicateKz = predicate.kz;
    thoughtRu = subjectRu + ' ' + fragment.thoughtRu + '.';
    timeExplanationRu = 'Сообщаем, где человек находится сейчас. Личное окончание присоединяется после формы места; отдельного слова «есть» здесь нет.';
    finalAfter = predicateKz.slice(fragment.text.length);
  } else {
    const going = input.relation === 'direction';
    const built = buildForm(going ? 'T78_MOTION_FOUR_PROG' : 'T31_PAST_DY', going ? 'bar' : 'shyq', input.person);
    predicateKz = built.afterCheck.canonicalFormKz;
    const actionRu = going ? ['иду', 'идёшь', 'идёте', 'идёт', 'идём', 'идёте', 'идёте', 'идут'][personIndex]
      : ['men', 'sen', 'ol'].includes(input.person) ? input.gender === 'female' ? 'вышла' : 'вышел' : 'вышли';
    thoughtRu = subjectRu + ' ' + (going ? 'сейчас ' : '') + actionRu + ' ' + fragment.thoughtRu + '.';
    timeExplanationRu = going
      ? 'Движение идёт сейчас. Дом — направление, а прибытие и вход внутрь не утверждаются.'
      : 'Выход уже произошёл. Дом — исходная точка; куда человек направился и где находится теперь, не сказано.';
    finalAfter = ' ' + predicateKz;
  }
  const content = input.relation === 'place' ? predicateKz : fragment.text + ' ' + predicateKz;
  const text = subjectKz[0].toLocaleUpperCase('kk') + subjectKz.slice(1) + ' ' + content + '.';
  const acceptedAnswers = [text, content[0].toLocaleUpperCase('kk') + content.slice(1) + '.'];
  if (input.owner !== 'none') {
    const withOwner = PERSONS[input.owner].genitiveKz + ' ' + content;
    acceptedAnswers.push(subjectKz + ' ' + withOwner + '.', withOwner + '.');
  }
  const explanationRu = fragment.practice.part.explanationRu + ' ' + timeExplanationRu;
  const steps = [
    { id: 'spatial-actor', labelRu: 'О ком говорим', text: subjectKz, explanationRu: 'Этот человек находится в доме, идёт к дому или вышел из него. Связь дома с человеком выбирается отдельно.' },
    { id: 'spatial-place', labelRu: input.relation === 'source' ? 'Откуда' : relation.labelRu, text: fragment.text, explanationRu: fragment.steps[0].explanationRu.replace(relation.meaningRu + ' ', '') },
    { id: 'spatial-event', labelRu: input.relation === 'place' ? 'Где сейчас' : input.relation === 'direction' ? 'Идёт сейчас' : 'Уже вышел', text: predicateKz, explanationRu: timeExplanationRu },
  ];
  return {
    status: 'ready', text, thoughtRu, steps, acceptedAnswers, outputKind: 'sentence', answerScopeRu: 'Целое сообщение',
    relation: input.relation, caseNameRu: fragment.caseNameRu, partKind: 'suffix',
    sourceIds: [...fragment.sourceIds, 'stage6-cases-spatial-predicate', ...(input.relation === 'place' ? [] : ['stage6-cases-spatial-motion' as const])],
    limits: [
      timeExplanationRu,
      'В этой пробе три сообщения: нахождение сейчас, движение сейчас и выход в прошлом. Смена связи меняет также событие и его время.',
      'Дом может быть связан со мной, с тобой, с ним или с ней. Такая связь не доказывает право собственности.',
      'Внутри, перед, над, путь, расстояние, вопросы и отрицание здесь не выбираются.',
    ],
    practice: {
      part: { id: 'practice-part', text: fragment.practice.part.text, before: subjectKz[0].toLocaleUpperCase('kk') + subjectKz.slice(1) + ' ' + fragment.practice.part.before, after: finalAfter + '.', explanationRu },
      word: { id: 'practice-word', text: input.relation === 'place' ? predicateKz : fragment.text, labelRu: input.relation === 'place' ? 'Напиши целиком слово о месте, вместе с личным окончанием' : 'Напиши слово, которое называет направление или исходную точку' },
    },
  };
}

export function buildConstructorStage6Cases(input: ConstructorStage6CasesInput): ConstructorStage6CasesResult {
  if (input?.usage === 'relative-space') return buildConstructorWave3Space(input);
  const reason = invalidReason(input);
  if (reason) return limited(reason);
  if (input.usage === 'message') return buildSpatialMessage(input);
  const relation = CONSTRUCTOR_STAGE6_CASE_RELATIONS.find(item => item.id === input.relation)!;
  const built = realizeConstructorWord(wordInput(input, relation.caseIndex));
  if (built.status !== 'ready' || !built.kz || !built.ru || !built.ruCases) return limited('Для этой части фразы нет подготовленного результата.');
  const text = built.kz;
  const thoughtRu = phraseRu(input, built.ru, built.ruCases);
  const limits = ['Это часть фразы. Она называет участника или связь; целое сообщение и действие здесь не заданы.', relation.meaningRu];
  const sourceIds: ConstructorStage6CasesSourceId[] = ['stage6-cases-meaning'];
  if (input.target === 'pronoun') sourceIds.push('stage6-cases-personal');
  else sourceIds.push('stage6-cases-lexicon');
  if (relation.caseType) sourceIds.push(`stage6-cases-${relation.caseType}` as ConstructorStage6CasesSourceId);
  const acceptedAnswers = [text];
  let partKind: 'suffix' | 'word' = 'word';
  let partText = text;
  let before = '';
  let explanationRu = input.target === 'pronoun'
    ? 'Это готовая форма личного местоимения. Напиши всё слово: его нельзя во всех лицах получить прибавлением одного окончания к исходному местоимению.'
    : 'Здесь нет падежного окончания. Напиши название целиком; отсутствие окончания само по себе не делает слово подлежащим.';
  if (input.target === 'noun') {
    if (input.owner !== 'none') {
      acceptedAnswers.push(`${PERSONS[input.owner].genitiveKz} ${text}`);
      sourceIds.push('stage6-cases-possession');
      limits.push('Связь названия с человеком сохраняется. Она не обязательно означает собственность; при известном человеке местоимение перед названием можно не повторять.');
    }
    if (relation.caseType) {
      const stem = realizeConstructorWord(wordInput(input, 0));
      const afterPossessive = input.owner === 'none' ? null : input.owner === 'ol' ? '3' : '1_2';
      const selected = pickCaseSuffix(stem.kz!, relation.caseType, { afterPossessive });
      if (stem.kz! + selected.suffix !== text) return limited('Сборка этой части не совпала с проверенным построителем.');
      partKind = 'suffix'; before = stem.kz!; partText = selected.suffix;
      const junction = input.owner === 'none' ? undefined : buildForm('T13_POSSESSIVE', input.wordId, input.owner).afterCheck.mergerCapsule;
      explanationRu = `${conditionFor(relation.caseType, selected.suffix)}. Окончание выбираем после уже собранного слова.${junction ? ' ' + junction.explanationRu : ''}`;
      if (input.owner === 'ol') limits.push('После принадлежности третьего лица дательный, местный, исходный и винительный выбирают свои варианты. В творительном лишнюю «н» не добавляем.');
    }
  }
  return {
    status: 'ready', text, thoughtRu, steps: [{ id: 'case-word', labelRu: relation.labelRu, text, explanationRu: `${relation.meaningRu} ${explanationRu}` }],
    limits, sourceIds, acceptedAnswers, outputKind: 'phrase', answerScopeRu: 'Часть фразы', relation: input.relation, caseNameRu: relation.caseNameRu, partKind,
    practice: { part: { id: 'practice-part', text: partText, before, after: '', explanationRu }, word: { id: 'practice-word', text, labelRu: 'Напиши слово целиком. Это часть фразы' } },
  };
}

export function constructorStage6CasesThoughtAliases(input: ConstructorStage6CasesInput): string[] {
  if (input?.usage === 'relative-space') return constructorWave3SpaceThoughtAliases(input);
  const built = buildConstructorStage6Cases(input);
  if (built.status !== 'ready') return [];
  const aliases = [built.thoughtRu, built.thoughtRu.replace(/ё/g, 'е')];
  if (input.usage === 'message') {
    if (input.relation === 'direction') aliases.push(built.thoughtRu.replace('сейчас ', ''), built.thoughtRu.replace('сейчас ', 'прямо сейчас '));
    if (input.relation === 'place') {
      const verb = ({ men: 'нахожусь', sen: 'находишься', siz: 'находитесь', ol: 'находится', biz: 'находимся', sender: 'находитесь', sizder: 'находитесь', olar: 'находятся' } as const)[input.person];
      aliases.push(built.thoughtRu.replace(' ', ' сейчас '), built.thoughtRu.replace(' ', ' ' + verb + ' '));
      if (input.owner === 'none') aliases.push(built.thoughtRu.replace('в доме', 'дома'), built.thoughtRu.replace('в доме', 'сейчас дома'));
    }
  }
  return [...new Set(aliases.flatMap(value => [value, value.replace(/ё/g, 'е')]))];
}

export function checkConstructorStage6CasesAnswer(input: ConstructorStage6CasesInput, answer: string, mode: 'part' | 'word' | 'full' = 'full'): { passed: boolean; messageRu: string; expected: string | null } {
  const built = buildConstructorStage6Cases(input);
  if (built.status !== 'ready' || !built.text) return { passed: false, expected: null, messageRu: built.limits[0] };
  if (!['part', 'word', 'full'].includes(mode)) return { passed: false, expected: null, messageRu: 'Выбери окончание, слово или всю подготовленную часть фразы.' };
  const expected = mode === 'full' ? built.text : built.practice![mode].text;
  const answers = mode === 'full' ? built.acceptedAnswers : [expected];
  const passed = typeof answer === 'string' && answers.some(value => normalized(value) === normalized(answer));
  if (input.usage === 'message') return { passed, expected, messageRu: passed ? 'Ответ совпадает с выбранным сообщением.' : 'Сравни ответ с выбранным сообщением: место, направление и исходная точка выражают разные мысли.' };
  return { passed, expected, messageRu: passed ? 'Эта часть фразы совпадает с подготовленным ответом.' : 'Сравни с подготовленной частью фразы. Другое значение или целое предложение здесь не проверено.' };
}
