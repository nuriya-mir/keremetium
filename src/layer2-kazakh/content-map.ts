import { isPresenceTopic, PRESENCE_ROOT_IDS } from './presence';
import { isNominalTopic, nominalRootIds } from './nominal-lexicon';
import { MEANING_PATHS } from '../layer1-meanings/thought-passport';
import type { MeaningPath } from '../layer1-meanings/thought-passport';
import { FORMULAS_BY_ID } from '../layer1-meanings/formulas';
import { ROOTS_BY_ID } from './roots';
import { buildForm } from './form-builder';
import type { PersonId } from '../types';

export type FoundationId = MeaningPath['foundations'][number];
export const FOUNDATION_LABELS: Record<FoundationId, string> = { persons: 'Лица', pronouns: 'Местоимения', plural: 'Множественное число', cases: 'Падежи', negation: 'Отрицание', sounds: 'Звуки' };

/** Content links attach existing material to the independent semantic skeleton. */
export const PATH_FORMULAS: Record<string, readonly string[]> = {
  presence: ['T56_LOC_BAR', 'KZ_PRESENCE_NEG', 'KZ_PRESENCE_Q', 'KZ_PRESENCE_NEG_Q'], identity: ['KZ_IDENTITY_AFF', 'KZ_IDENTITY_NEG', 'KZ_IDENTITY_Q', 'KZ_IDENTITY_NEG_Q'], ownership: ['T64_GEN_POSS_BAR'],
  want: ['T83_WANT_PRESENT', 'T84_WANT_NEG', 'T86_WANT_PAST', 'T88_WANT_COND'],
  intend: ['T89_INTEND_PRESENT'], volunteer: ['T22_IMP_1SG'], wish: [],
  can: ['T72_CAN_PRESENT', 'T73_CAN_NEG'], need: ['T93_NEED_KEREK', 'T94_NEED_NEG_MAU_KEREK'],
  may: ['T99_MAY_PERSONAL', 'T101_MAY_IMPERSONAL'],
  action: ['T26_PRES_FUT_AFF', 'T27_PRES_FUT_NEG', 'T28_PRES_FUT_Q', 'T78_MOTION_FOUR_PROG', 'T80_STD_PROG', 'T31_PAST_DY', 'T32_PAST_MADY', 'T34_PAST_GAN_JOK', 'T36_HABITUAL_ATYN', 'T40_COND_AR_EDI', 'T43_COND_USHY_EDI'],
  location: ['T18_LOCATIVE'], destination: ['T17_DATIVE'], origin: ['T19_ABLATIVE'], route: [],
  possessive: ['T13_POSSESSIVE'], together: ['T20_INSTRUMENTAL'], relationship: ['T121_PART_OBJECT_POSS'],
  'physical-state': [], like: [], miss: [], emotion: [], know: [], opinion: [], memory: [],
  guess: ['T105_SUPPOSE_ARMYN'], evidence: [], quality: ['KZ_QUALITY_AFF', 'KZ_QUALITY_NEG', 'KZ_QUALITY_Q', 'KZ_QUALITY_NEG_Q'], degree: [], comparison: [], value: [],
  greet: [], thank: [], apologize: [], invite: ['T24_IMP_1PL'], request: [], blessing: [],
};

export const SHARED_MATERIALS = [
  { id: 'condition', title: 'Если… Даже если…', formulaIds: ['T46_COND_SA', 'T48_CONCESSIVE_SA_DA'], remaining: 'Подготовленные условные пары уже имеют конструктор, отдельные лица, применимое отрицание и задания. Остаются новые пары, времена, уступка и полный охват условий.' },
  { id: 'time-link', title: 'Когда происходит другое действие', formulaIds: ['T49_WHEN_GANDA', 'T50_WHEN_PERSONAL_GANDA'], remaining: 'В конструкторе есть ограниченные пары «пока», «до», «как только» и «когда». Остаются другие действия, времена и собственные условия каждого способа связи.' },
  { id: 'cause', title: 'Причина — почему', formulaIds: [], remaining: 'Подготовленная причинная пара уже связана с двумя участниками, отдельным отрицанием, порядком частей и упражнениями. Остаются новые причины, времена и вопрос–ответ «почему».' },
  { id: 'purpose', title: 'Цель — зачем', formulaIds: [], remaining: 'Есть смысловые модели и подготовленные примеры атласа. Самостоятельный интерактивный пакет цели, допустимые построения и задания ещё нужно подготовить.' },
] as const;

export const FOUNDATION_MATERIALS: Record<FoundationId, readonly string[]> = {
  persons: [], pronouns: [], plural: ['T10_PLURAL'],
  cases: ['T17_DATIVE', 'T18_LOCATIVE', 'T19_ABLATIVE', 'T20_INSTRUMENTAL', 'T21_ACCUSATIVE'],
  negation: ['T27_PRES_FUT_NEG', 'T84_WANT_NEG'], sounds: [],
};

export const MATERIAL_PERSON_IDS: readonly PersonId[] = ['men', 'sen', 'siz', 'ol', 'biz', 'sender', 'sizder', 'olar'];
const NOUN_ROOTS: Record<string, string> = {
  T10_PLURAL: 'kitap', T13_POSSESSIVE: 'kitap', T56_LOC_BAR: 'kitap', T64_GEN_POSS_BAR: 'kitap',
  T17_DATIVE: 'qala', T18_LOCATIVE: 'qala', T19_ABLATIVE: 'qala', T20_INSTRUMENTAL: 'dos', T21_ACCUSATIVE: 'kitap',
};
const WITHOUT_PERSON = new Set(['T10_PLURAL', 'T17_DATIVE', 'T18_LOCATIVE', 'T19_ABLATIVE', 'T20_INSTRUMENTAL', 'T21_ACCUSATIVE', 'T101_MAY_IMPERSONAL', 'T49_WHEN_GANDA']);

export function formulasForCore(coreId: string): string[] {
  return [...new Set(MEANING_PATHS.filter(path => path.coreId === coreId).flatMap(path => PATH_FORMULAS[path.id] || []))];
}

export function allPlacedFormulas(): string[] {
  return [...new Set([...Object.values(PATH_FORMULAS).flat(), ...SHARED_MATERIALS.flatMap(group => [...group.formulaIds]), ...Object.values(FOUNDATION_MATERIALS).flat()])];
}

/** A read-only example; substitutions are explicit, never a translation of a free thought. */
export function materialContext(formulaId: string, currentRootId: string, requestedPerson: PersonId) {
  if (!Object.prototype.hasOwnProperty.call(FORMULAS_BY_ID, formulaId) || !Object.prototype.hasOwnProperty.call(ROOTS_BY_ID, currentRootId) || !MATERIAL_PERSON_IDS.includes(requestedPerson)) return null;
  let rootId = currentRootId;
  let contextNote = 'Слово из твоего задания:';
  if (isPresenceTopic(formulaId)) { rootId = PRESENCE_ROOT_IDS.includes(currentRootId) ? currentRootId : PRESENCE_ROOT_IDS[0]; contextNote = 'Пример:'; }
  else if (isNominalTopic(formulaId)) { rootId = nominalRootIds(formulaId).includes(currentRootId) ? currentRootId : nominalRootIds(formulaId)[0]; contextNote = 'Пример:'; }
  else if (NOUN_ROOTS[formulaId]) { rootId = ['noun', 'place'].includes(ROOTS_BY_ID[currentRootId].pos) ? currentRootId : NOUN_ROOTS[formulaId]; contextNote = 'Пример:'; }
  else if (formulaId === 'T121_PART_OBJECT_POSS') { rootId = 'oqy'; contextNote = 'Пример с чтением:'; }
  else if (formulaId === 'T78_MOTION_FOUR_PROG' && !ROOTS_BY_ID[currentRootId].isMotionFour) { rootId = 'bar'; contextNote = 'Пример:'; }
  else if (ROOTS_BY_ID[currentRootId].pos !== 'verb') { rootId = 'bar'; contextNote = 'Пример:'; }
  if (formulaId === 'T80_STD_PROG' && ROOTS_BY_ID[rootId].isMotionFour) { rootId = 'ish'; contextNote = 'Пример:'; }
  const people: readonly PersonId[] = formulaId === 'T22_IMP_1SG' ? ['men'] as const : formulaId === 'T24_IMP_1PL' ? ['biz'] as const : WITHOUT_PERSON.has(formulaId) ? [] : MATERIAL_PERSON_IDS;
  const person = people.length && people.includes(requestedPerson) ? requestedPerson : people[0] || 'men';
  const personNote = !people.length ? 'Лицо не меняет эту форму.' : formulaId === 'T22_IMP_1SG' ? 'Это предложение сделать самому: форма первого лица единственного числа.' : formulaId === 'T24_IMP_1PL' ? 'Это предложение сделать вместе: форма первого лица множественного числа.' : 'Выбери, о ком сказать.';
  return { built: buildForm(formulaId, rootId, person), rootId, person, people, contextNote, personNote };
}
