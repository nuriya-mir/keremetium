import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person } from './constructor-stage4';
import { CONSTRUCTOR_LEXEMES, realizeConstructorWord, type ConstructorWord } from './constructor-realization';
import { buildForm, pickPastDySuffix } from './form-builder';
import { getVowelRow, pickCaseSuffix, pickFullPersonalEnding, pickPossessiveSuffix, pickShortPersonalEnding } from './phonetics';
import { PERSONS } from './roots';
import type { ConstructorStage6CaseOwner, ConstructorStage6CasesResult } from './constructor-stage6-cases';

/** A separate closed branch. No legacy relation/target fields are added or reinterpreted. */
export interface ConstructorWave3SpaceInput {
  caseId: 'case-links';
  usage: 'relative-space';
  wordId: 'ui' | 'mektep';
  area: 'inside' | 'outside' | 'front' | 'behind' | 'whole';
  event: 'located' | 'moving' | 'reached';
  person: ConstructorStage4Person;
  owner: ConstructorStage6CaseOwner;
  gender?: ConstructorStage4Gender;
  ownerGender?: ConstructorStage4Gender;
}

export const CONSTRUCTOR_WAVE3_SPACE_AREAS = [
  { id: 'inside', labelRu: 'Внутри', stem: 'іш' },
  { id: 'outside', labelRu: 'Снаружи', stem: 'сырт' },
  { id: 'front', labelRu: 'Перед', stem: 'алд' },
  { id: 'behind', labelRu: 'За', stem: 'арт' },
] as const;
export const CONSTRUCTOR_WAVE3_SPACE_EVENTS = [
  { id: 'located', labelRu: 'Находится сейчас' },
  { id: 'moving', labelRu: 'Идёт сейчас к месту' },
  { id: 'reached', labelRu: 'Уже добрался до ориентира' },
] as const;
export const CONSTRUCTOR_WAVE3_SPACE_WORDS = [
  { id: 'ui', labelRu: 'Дом' }, { id: 'mektep', labelRu: 'Школа' },
] as const;
export const CONSTRUCTOR_WAVE3_SPACE_SOURCE_IDS = ['11.7', '17.4', '17.6', '17.16', '17.17'] as const;

const OWNERS = ['none', 'men', 'sen', 'ol'] as const;
const allowedKeys = ['caseId', 'usage', 'wordId', 'area', 'event', 'person', 'owner', 'gender', 'ownerGender'];
const upper = (value: string) => value[0].toLocaleUpperCase('kk') + value.slice(1);

/** Exact discriminator, enum values and allowed fields; never repairs an unsupported combination. */
export function decodeConstructorWave3SpaceInput(value: unknown): ConstructorWave3SpaceInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const x = value as Record<string, unknown>;
  if (Reflect.ownKeys(x).some(key => typeof key !== 'string' || !allowedKeys.includes(key))) return null;
  if (x.caseId !== 'case-links' || x.usage !== 'relative-space') return null;
  if (!CONSTRUCTOR_WAVE3_SPACE_WORDS.some(word => word.id === x.wordId)) return null;
  if (!CONSTRUCTOR_WAVE3_SPACE_EVENTS.some(event => event.id === x.event)) return null;
  if (x.event === 'reached' ? x.area !== 'whole' : !CONSTRUCTOR_WAVE3_SPACE_AREAS.some(area => area.id === x.area)) return null;
  if (!(CONSTRUCTOR_STAGE4_PERSON_IDS as readonly unknown[]).includes(x.person) || !(OWNERS as readonly unknown[]).includes(x.owner)) return null;
  if (x.gender !== undefined && x.gender !== 'male' && x.gender !== 'female') return null;
  if (x.ownerGender !== undefined && x.ownerGender !== 'male' && x.ownerGender !== 'female') return null;
  if (x.owner !== 'ol' && x.ownerGender === 'female') return null;
  return { caseId: 'case-links', usage: 'relative-space', wordId: x.wordId as ConstructorWave3SpaceInput['wordId'], area: x.area as ConstructorWave3SpaceInput['area'], event: x.event as ConstructorWave3SpaceInput['event'], person: x.person as ConstructorStage4Person, owner: x.owner as ConstructorStage6CaseOwner, gender: x.gender as ConstructorStage4Gender | undefined, ownerGender: x.ownerGender as ConstructorStage4Gender | undefined };
}

function limited(): ConstructorStage6CasesResult {
  return { status: 'limited', text: null, thoughtRu: 'Выбери подготовленное место и событие.', steps: [], limits: ['Для нахождения и движения выбери часть дома или школы. Для достижения выбери сам дом или школу. Вопрос, отрицание, исходная точка и другие времена здесь не добавляются.'], sourceIds: [], acceptedAnswers: [], outputKind: 'sentence', answerScopeRu: 'Целое сообщение', relation: null, caseNameRu: '', partKind: null };
}

function landmark(input: ConstructorWave3SpaceInput, caseIndex: number) {
  const meaning = CONSTRUCTOR_LEXEMES.find(word => word.id === input.wordId && word.base === 'noun')!.ru;
  const steps: ConstructorWord['steps'] = input.owner === 'none' ? [] : [{ id: 'poss', value: CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.owner) }];
  const built = realizeConstructorWord({ base: 'noun', variant: 'basic', meaning, steps: [...steps, { id: 'case', value: caseIndex }] });
  return { ...built, ruCases: built.ruCases?.map(value => value.replace(/его \/ её/g, input.ownerGender === 'female' ? 'её' : 'его')) };
}

function subjectRu(input: ConstructorWave3SpaceInput): string {
  if (input.person === 'ol') return input.gender === 'female' ? 'Она' : 'Он';
  return ['Я', 'Ты', 'Вы', '', 'Мы', 'Вы', 'Вы', 'Они'][CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person)];
}

function placeRu(input: ConstructorWave3SpaceInput, genitive: string, instrumental: string): string {
  if (input.area === 'inside') return 'внутри ' + genitive;
  if (input.area === 'outside') return 'снаружи ' + genitive;
  if (input.area === 'front') return 'перед ' + instrumental;
  return 'за ' + instrumental;
}

export function buildConstructorWave3Space(raw: ConstructorWave3SpaceInput): ConstructorStage6CasesResult {
  const input = decodeConstructorWave3SpaceInput(raw);
  if (!input) return limited();
  const noun = landmark(input, input.event === 'reached' ? 2 : 1);
  if (noun.status !== 'ready' || !noun.kz || !noun.ruCases) return limited();
  const subject = upper(PERSONS[input.person].pronounKz);
  const subjectTranslation = subjectRu(input);
  const personIndex = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person);
  const ownerPrefix = input.owner === 'none' ? '' : PERSONS[input.owner].genitiveKz + ' ';
  const locationRu = input.area === 'whole' ? 'до ' + noun.ruCases[1] : placeRu(input, noun.ruCases[1], noun.ruCases[6]);
  let content: string;
  let thoughtRu: string;
  let finalWord: string;
  let partText: string;
  let before: string;
  let after: string;
  let explanationRu: string;
  let eventText: string;
  let areaText: string;
  const sourceIds: ConstructorStage6CasesResult['sourceIds'] = ['stage6-space-relational-nouns', 'stage6-cases-possession', 'stage6-cases-personal'];
  if (input.event === 'reached') {
    // The lexical item is deliberately local to this closed spatial recipe.
    const stem = 'жет';
    const past = stem + pickPastDySuffix(stem).suffix;
    eventText = past + pickShortPersonalEnding(getVowelRow(stem), input.person).suffix;
    areaText = noun.kz + ' дейін';
    content = areaText + ' ' + eventText;
    const arrivedRu = ['men', 'sen', 'ol'].includes(input.person) ? input.gender === 'female' ? 'добралась' : 'добрался' : 'добрались';
    thoughtRu = `${subjectTranslation} ${arrivedRu} ${locationRu}.`;
    const base = landmark(input, 0);
    if (!base.kz || !noun.kz.startsWith(base.kz)) return limited();
    partText = noun.kz.slice(base.kz.length);
    before = subject + ' ' + base.kz;
    after = ' дейін ' + eventText + '.';
    finalWord = noun.kz;
    explanationRu = 'После названия в дательном падеже отдельное слово «дейін» обозначает предел. Достижение сообщает действие «добрался» в прошлом. Эта фраза не утверждает вход внутрь и не сообщает, где человек сейчас.';
    sourceIds.push('stage6-space-reached', 'stage6-space-reach-lexicon', 'stage6-cases-dative');
  } else {
    const area = CONSTRUCTOR_WAVE3_SPACE_AREAS.find(item => item.id === input.area)!;
    const partBase = area.stem + pickPossessiveSuffix(area.stem, 'ol').suffix;
    const caseType = input.event === 'located' ? 'locative' : 'dative';
    partText = pickCaseSuffix(partBase, caseType, { afterPossessive: '3' }).suffix;
    areaText = partBase + partText;
    const suffix = input.event === 'located' ? pickFullPersonalEnding(areaText, input.person).suffix : '';
    eventText = input.event === 'located' ? areaText + suffix : buildForm('T78_MOTION_FOUR_PROG', 'bar', input.person).afterCheck.canonicalFormKz;
    content = noun.kz + ' ' + (input.event === 'located' ? eventText : areaText + ' ' + eventText);
    const goingRu = ['иду', 'идёшь', 'идёте', 'идёт', 'идём', 'идёте', 'идёте', 'идут'][personIndex];
    thoughtRu = input.event === 'located' ? `${subjectTranslation} ${locationRu}.` : `${subjectTranslation} сейчас ${goingRu} к месту ${locationRu}.`;
    before = subject + ' ' + noun.kz + ' ' + partBase;
    after = input.event === 'located' ? suffix + '.' : ' ' + eventText + '.';
    finalWord = input.event === 'located' ? eventText : areaText;
    explanationRu = input.event === 'located'
      ? 'Часть пространства связана с названным ориентиром. После этой части идёт местное окончание, затем личное. Сообщаем, где человек сейчас; движения и прибытия эта фраза не утверждает.'
      : 'Часть пространства связана с названным ориентиром. Дательное окончание выбирает место назначения, а отдельное действие сообщает движение сейчас. Человек ещё не назван прибывшим.';
    sourceIds.push(input.event === 'located' ? 'stage6-cases-spatial-predicate' : 'stage6-cases-spatial-motion');
  }
  const text = subject + ' ' + content + '.';
  const acceptedAnswers = [text, upper(content) + '.'];
  if (ownerPrefix) acceptedAnswers.push(subject + ' ' + ownerPrefix + content + '.', upper(ownerPrefix + content) + '.');
  return {
    status: 'ready', text, thoughtRu, acceptedAnswers, sourceIds,
    outputKind: 'sentence', answerScopeRu: 'Целое сообщение', relation: input.event === 'located' ? 'place' : 'direction', caseNameRu: input.event === 'located' ? 'Местный падеж' : 'Дательный падеж', partKind: 'suffix',
    steps: [
      { id: 'space-person', labelRu: 'О ком говорим', text: subject, explanationRu: 'Лицо человека и связь ориентира с владельцем выбираются отдельно.' },
      { id: 'space-landmark', labelRu: 'Ориентир', text: noun.kz, explanationRu: input.owner === 'none' ? 'Назван дом или школа. Относительно этого места выбираем положение.' : 'Дом или школа связаны с выбранным человеком. Эта связь не доказывает право собственности.' },
      { id: 'space-area', labelRu: input.event === 'reached' ? 'До какого места' : input.event === 'moving' ? 'К какому месту' : 'Где', text: areaText, explanationRu },
      { id: 'space-event', labelRu: CONSTRUCTOR_WAVE3_SPACE_EVENTS.find(event => event.id === input.event)!.labelRu, text: eventText, explanationRu },
    ],
    limits: [explanationRu, 'Здесь дом и школа. Для нахождения и движения выбираются внутри, снаружи, перед или за ориентиром; для достижения — сам ориентир.', 'Вопрос, отрицание, расстояние, выход из места, верх и низ, несколько ориентиров и свободная смена времени этим набором не подтверждены.'],
    practice: { part: { id: 'practice-part', text: partText, before, after, explanationRu }, word: { id: 'practice-word', text: finalWord, labelRu: input.event === 'located' ? 'Напиши слово о месте целиком, вместе с личным окончанием' : 'Напиши слово о месте назначения целиком' } },
  };
}

export function constructorWave3SpacePreparedContexts(): ConstructorWave3SpaceInput[] {
  const contexts: ConstructorWave3SpaceInput[] = [];
  for (const word of CONSTRUCTOR_WAVE3_SPACE_WORDS) for (const event of CONSTRUCTOR_WAVE3_SPACE_EVENTS) {
    const areas: ConstructorWave3SpaceInput['area'][] = event.id === 'reached' ? ['whole'] : CONSTRUCTOR_WAVE3_SPACE_AREAS.map(area => area.id);
    for (const area of areas) for (const owner of OWNERS) for (const person of CONSTRUCTOR_STAGE4_PERSON_IDS) {
      const genders: ConstructorStage4Gender[] = person === 'ol' || event.id === 'reached' && ['men', 'sen'].includes(person) ? ['male', 'female'] : ['male'];
      for (const gender of genders) for (const ownerGender of owner === 'ol' ? ['male', 'female'] as const : ['male'] as const) {
        contexts.push({ caseId: 'case-links', usage: 'relative-space', wordId: word.id, area, event: event.id, person, owner, gender, ownerGender });
      }
    }
  }
  return contexts;
}

export function constructorWave3SpaceThoughtAliases(input: ConstructorWave3SpaceInput): string[] {
  const built = buildConstructorWave3Space(input);
  if (built.status !== 'ready') return [];
  const aliases = [built.thoughtRu];
  if (input.event === 'located') {
    const verb = ({ men: 'нахожусь', sen: 'находишься', siz: 'находитесь', ol: 'находится', biz: 'находимся', sender: 'находитесь', sizder: 'находитесь', olar: 'находятся' } as const)[input.person];
    aliases.push(built.thoughtRu.replace(' ', ' сейчас '), built.thoughtRu.replace(' ', ' ' + verb + ' '));
  } else if (input.event === 'moving') {
    aliases.push(built.thoughtRu.replace('сейчас ', ''), built.thoughtRu.replace('сейчас ', 'прямо сейчас '));
    if (input.area === 'inside') aliases.push(built.thoughtRu.replace('к месту внутри ', 'внутрь '));
    if (input.area === 'outside') aliases.push(built.thoughtRu.replace('к месту снаружи ', 'к внешней стороне '));
  } else {
    aliases.push(built.thoughtRu.replace('добрался', 'уже добрался').replace('добралась', 'уже добралась').replace('добрались', 'уже добрались'));
  }
  return [...new Set(aliases.flatMap(value => [value, value.replace(/ё/g, 'е')]))];
}
