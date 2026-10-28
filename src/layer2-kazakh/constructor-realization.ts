import type { BuiltFormResult, PersonId } from '../types';
import { ROOTS_BY_ID, STARTER_ROOTS, PERSONS } from './roots';
import { NOMINAL_WORDS } from './nominal-lexicon';
import { buildForm, pickParticipleGanSuffix, pickHabitualAtynSuffix, pickGerundYpSuffix, pickConditionalSaSuffix } from './form-builder';
import { getVowelRow, getEndingClass, joinWithBoundaryMerger, pickPluralSuffix, pickPossessiveSuffix, pickCaseSuffix, pickFullPersonalEnding, pickShortPersonalEnding, pickVerbNegationSuffix, pickQuestionParticle } from './phonetics';
import type { CaseType } from './phonetics';

export interface ConstructorStep { id: string; value: number }
export interface ConstructorWord { base: string; variant: string; meaning: string; steps: ConstructorStep[] }
export interface ConstructorOptions { translateBuilt?: (built: BuiltFormResult) => string | undefined; resolveWord?: (word: ConstructorWord) => ConstructorResult }
type Gender = 'm' | 'f' | 'n';
export interface ConstructorResult {
  status: 'ready' | 'stem' | 'incomplete' | 'unsupported'; kz?: string; ru?: string; message?: string;
  rootId?: string; kind?: string; caseIndex?: number; person?: number; possPerson?: number; plural?: boolean;
  gender?: Gender; predicate?: boolean; question?: boolean; conditional?: boolean; verb?: boolean; location?: boolean; animate?: boolean;
  ruCases?: string[]; ruSubject?: string; ruPredicate?: string;
  ruAdjectives?: string[];
  subjectCaseIndex?: number;
  parts?: string[];
}
const PEOPLE: PersonId[] = ['men', 'sen', 'siz', 'ol', 'biz', 'sender', 'sizder', 'olar'];
const SUBJECTS = ['Я', 'Ты', 'Вы', 'Он или она', 'Мы', 'Вы', 'Вы', 'Они'];
const CASES: (CaseType | null)[] = [null, 'genitive', 'dative', 'accusative', 'locative', 'ablative', 'instrumental'];
const join = (a: string, b: string) => joinWithBoundaryMerger(a, b).mergedWord;
const fail = (message: string, status: ConstructorResult['status'] = 'unsupported'): ConstructorResult => ({ status, message });
const clean = (s: string) => s.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/\s+/g, ' ');
const caseData = (s: string) => s.split('|');
interface NounData { gender: Gender; animate?: boolean; location?: boolean; singular: string[]; plural: string[] }
const noun = (gender: Gender, singular: string, plural: string, extra: Partial<NounData> = {}): NounData => ({ gender, singular: caseData(singular), plural: caseData(plural), ...extra });
// Russian cases only. Kazakh stems and all Kazakh endings come from the existing core.
const NOUNS: Record<string, NounData> = {
  kitap: noun('f', 'книга|книги|книге|книгу|книге|книги|книгой', 'книги|книг|книгам|книги|книгах|книг|книгами'),
  hat: noun('n', 'письмо|письма|письму|письмо|письме|письма|письмом', 'письма|писем|письмам|письма|письмах|писем|письмами'),
  ui: noun('m', 'дом|дома|дому|дом|доме|дома|домом', 'дома|домов|домам|дома|домах|домов|домами', { location: true }),
  qala: noun('m', 'город|города|городу|город|городе|города|городом', 'города|городов|городам|города|городах|городов|городами', { location: true }),
  mektep: noun('f', 'школа|школы|школе|школу|школе|школы|школой', 'школы|школ|школам|школы|школах|школ|школами', { location: true }),
  jumys: noun('f', 'работа|работы|работе|работу|работе|работы|работой', 'работы|работ|работам|работы|работах|работ|работами', { location: true }),
  dos: noun('m', 'друг|друга|другу|друга|друге|друга|другом', 'друзья|друзей|друзьям|друзей|друзьях|друзей|друзьями', { animate: true }),
  bala: noun('m', 'ребёнок|ребёнка|ребёнку|ребёнка|ребёнке|ребёнка|ребёнком', 'дети|детей|детям|детей|детях|детей|детьми', { animate: true }),
  ana: noun('f', 'мама|мамы|маме|маму|маме|мамы|мамой', 'мамы|мам|мамам|мам|мамах|мам|мамами', { animate: true }),
  ake: noun('m', 'папа|папы|папе|папу|папе|папы|папой', 'папы|пап|папам|пап|папах|пап|папами', { animate: true }),
  adam: noun('m', 'человек|человека|человеку|человека|человеке|человека|человеком', 'люди|людей|людям|людей|людях|людей|людьми', { animate: true }),
  dariger: noun('m', 'врач|врача|врачу|врача|враче|врача|врачом', 'врачи|врачей|врачам|врачей|врачах|врачей|врачами', { animate: true }),
  mugalim: noun('m', 'учитель|учителя|учителю|учителя|учителе|учителя|учителем', 'учителя|учителей|учителям|учителей|учителях|учителей|учителями', { animate: true }),
  oqyushy: noun('m', 'ученик|ученика|ученику|ученика|ученике|ученика|учеником', 'ученики|учеников|ученикам|учеников|учениках|учеников|учениками', { animate: true }),
  su: noun('f', 'вода|воды|воде|воду|воде|воды|водой', 'воды|вод|водам|воды|водах|вод|водами'),
  shai: noun('m', 'чай|чая|чаю|чай|чае|чая|чаем', 'чаи|чаёв|чаям|чаи|чаях|чаёв|чаями'),
  nan: noun('m', 'хлеб|хлеба|хлебу|хлеб|хлебе|хлеба|хлебом', 'хлебы|хлебов|хлебам|хлебы|хлебах|хлебов|хлебами'),
  soz: noun('n', 'слово|слова|слову|слово|слове|слова|словом', 'слова|слов|словам|слова|словах|слов|словами'),
  suraq: noun('m', 'вопрос|вопроса|вопросу|вопрос|вопросе|вопроса|вопросом', 'вопросы|вопросов|вопросам|вопросы|вопросах|вопросов|вопросами'),
  esik: noun('f', 'дверь|двери|двери|дверь|двери|двери|дверью', 'двери|дверей|дверям|двери|дверях|дверей|дверями'),
  tereze: noun('n', 'окно|окна|окну|окно|окне|окна|окном', 'окна|окон|окнам|окна|окнах|окон|окнами'),
  jurek: noun('n', 'сердце|сердца|сердцу|сердце|сердце|сердца|сердцем', 'сердца|сердец|сердцам|сердца|сердцах|сердец|сердцами'),
  uaqyt: noun('n', 'время|времени|времени|время|времени|времени|временем', 'времена|времён|временам|времена|временах|времён|временами'),
  qyz: noun('f', 'девушка|девушки|девушке|девушку|девушке|девушки|девушкой', 'девушки|девушек|девушкам|девушек|девушках|девушек|девушками', { animate: true }),
  jol: noun('f', 'дорога|дороги|дороге|дорогу|дороге|дороги|дорогой', 'дороги|дорог|дорогам|дороги|дорогах|дорог|дорогами', { location: true }),
  el: noun('f', 'страна|страны|стране|страну|стране|страны|страной', 'страны|стран|странам|страны|странах|стран|странами', { location: true }),
};
const EXTRA = [
  { id: 'ulken', kz: 'үлкен', ru: 'большой', base: 'adjective', comparison: 'больше', predicate: ['большой / большая', 'большие'] },
  { id: 'jaqsy', kz: 'жақсы', ru: 'хороший', base: 'adjective', comparison: 'лучше', predicate: ['хороший / хорошая', 'хорошие'] },
  { id: 'tez', kz: 'тез', ru: 'быстро', base: 'adverb' },
  { id: 'bugyn', kz: 'бүгін', ru: 'сегодня', base: 'adverb' },
  { id: 'keshe', kz: 'кеше', ru: 'вчера', base: 'adverb' },
  { id: 'erten', kz: 'ертең', ru: 'завтра', base: 'adverb' },
  { id: 'qazir', kz: 'қазір', ru: 'сейчас', base: 'adverb' },
  { id: 'osynda', kz: 'осында', ru: 'здесь', base: 'adverb' },
  { id: 'bunda', kz: 'мұнда', ru: 'тут', base: 'adverb' },
];
const NUMBERS = ['бір', 'екі', 'үш', 'төрт', 'бес', 'алты', 'жеті', 'сегіз', 'тоғыз', 'он'];
const NUMBER_RU = ['один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];
export const CONSTRUCTOR_LEXEMES = [
  ...STARTER_ROOTS.filter(r => r.pos === 'verb').map(r => ({ id: r.id, base: 'verb', kz: r.kz, ru: r.id === 'oqy' ? 'читать' : r.ru.split(' / ')[0].replace(/ \(.+\)/, ''), aliases: [r.ru, r.ruGloss || ''] })),
  ...STARTER_ROOTS.filter(r => r.pos !== 'verb').map(r => ({ id: r.id, base: 'noun', kz: r.kz, ru: NOUNS[r.id]?.singular[0] || r.ru, aliases: [r.ru] })),
  ...NOMINAL_WORDS.filter(r => !STARTER_ROOTS.some(s => s.id === r.id)).map(r => ({ id: r.id, base: r.pos === 'adjective' ? 'adjective' : 'noun', kz: r.kz, ru: r.ru, aliases: [] as string[] })),
  ...EXTRA.map(r => ({ ...r, aliases: [] as string[] })),
  ...NUMBERS.map((kz, i) => ({ id: 'number' + (i + 1), base: 'numeral', kz, ru: NUMBER_RU[i], aliases: [String(i + 1)] })),
];
function findLexeme(word: ConstructorWord) {
  return CONSTRUCTOR_LEXEMES.find(r => r.base === word.base && [r.ru, ...r.aliases, ...r.aliases.flatMap(a => a.split(' / '))].map(clean).includes(clean(word.meaning)));
}
function possessedRu(person: number, gender: Gender, plural: boolean, ci: number, animate = false): string {
  if (person === 3) return 'его / её';
  if (person === 7) return 'их';
  const stems = ['мо', 'тво', 'ваш', '', 'наш', 'ваш', 'ваш'];
  const own = stems[person];
  const k = ci === 5 ? 1 : ci;
  const soft = person === 0 || person === 1;
  const endings = plural
    ? (soft ? ['и', 'их', 'им', animate ? 'их' : 'и', 'их', 'их', 'ими'] : ['и', 'их', 'им', animate ? 'их' : 'и', 'их', 'их', 'ими'])
    : gender === 'f' ? (soft ? ['я', 'ей', 'ей', 'ю', 'ей', 'ей', 'ей'] : ['а', 'ей', 'ей', 'у', 'ей', 'ей', 'ей'])
      : gender === 'n' ? (soft ? ['ё', 'его', 'ему', 'ё', 'ём', 'его', 'им'] : ['е', 'его', 'ему', 'е', 'ем', 'его', 'им'])
        : (soft ? ['й', 'его', 'ему', animate ? 'его' : 'й', 'ём', 'его', 'им'] : ['', 'его', 'ему', animate ? 'его' : '', 'ем', 'его', 'им']);
  return own + endings[k];
}
function addQuestion(kz: string, ru: string, yes: boolean) {
  return yes ? { kz: kz + ' ' + pickQuestionParticle(kz.split(' ').at(-1)!).particle, ru: ru.replace(/[?.]$/, '') + '?' } : { kz, ru };
}
function negatedRu(ru: string, person: number) {
  const subject = SUBJECTS[person];
  if (ru.startsWith(subject + ' раньше обычно ')) return ru.replace('раньше обычно ', 'раньше обычно не ');
  if (ru.startsWith(subject + ' ')) return subject + ' не ' + ru.slice(subject.length + 1);
  const lower = subject.toLowerCase();
  return ru.replace(lower + ' ', lower + ' не ');
}
function translated(b: BuiltFormResult, options: ConstructorOptions) { return options.translateBuilt?.(b); }

export function realizeConstructorWord(word: ConstructorWord, options: ConstructorOptions = {}): ConstructorResult {
  if (!word || !Array.isArray(word.steps)) return fail('Выбери основу и группы.');
  const steps = word.steps, ids = steps.map(s => s.id);
  const last = (id: string) => [...steps].reverse().find(s => s.id === id);
  const question = ids.includes('question');
  const suffixExtras = steps.filter(s => s.id !== 'question');
  if (ids.includes('emphasis') || ids.includes('questionInside') || ids.includes('innerParticle') || ids.includes('quoted')) return fail('Для этой частицы или особого употребления ещё нет проверенного результата. Остальные ячейки сохранены.');
  if (word.base === 'pronoun' && word.variant === 'personal') {
    if (!ids.every(id => ['pronounPerson', 'case', 'owner', 'question'].includes(id))) return fail('Для этого изменения местоимения ещё нет проверенного результата.');
    const p = last('pronounPerson')?.value;
    if (p === undefined) return fail('Выбери участника разговора.', 'incomplete');
    const ci = last('case')?.value || 0, meta = PERSONS[PEOPLE[p]];
    const fields = ['pronounKz', 'genitiveKz', 'dativeKz', 'accusativeKz', 'locativeKz', 'ablativeKz', 'instrumentalKz'] as const;
    const ru = [
      ['я', 'мой / моя / моё / мои', 'мне', 'меня', 'у меня', 'от меня', 'со мной'], ['ты', 'твой / твоя / твоё / твои', 'тебе', 'тебя', 'у тебя', 'от тебя', 'с тобой'],
      ['Вы', 'Ваш / Ваша / Ваше / Ваши', 'Вам', 'Вас', 'у Вас', 'от Вас', 'с Вами'], ['он / она', 'его / её', 'ему / ей', 'его / её', 'у него / неё', 'от него / неё', 'с ним / ней'],
      ['мы', 'наш / наша / наше / наши', 'нам', 'нас', 'у нас', 'от нас', 'с нами'], ['вы', 'ваш / ваша / ваше / ваши', 'вам', 'вас', 'у вас', 'от вас', 'с вами'],
      ['Вы', 'Ваш / Ваша / Ваше / Ваши', 'Вам', 'Вас', 'у Вас', 'от Вас', 'с Вами'], ['они', 'их', 'им', 'их', 'у них', 'от них', 'с ними'],
    ][p];
    if (ids.includes('owner')) return fail('Для этой формы владельца нужен отдельный проверенный разбор.');
    return { status: 'ready', kz: meta[fields[ci]], ru: ru[ci], ruCases: ru, person: p, caseIndex: ci, kind: 'noun', rootId: PEOPLE[p], plural: p >= 4, animate: true };
  }
  const lex = findLexeme(word);
  if (!lex) return fail('Для этого слова нет проверенной формы. Выбери слово из подсказок поля.');
  let kz = lex.kz, kind = lex.base, nounData = NOUNS[lex.id], rootId = lex.id;
  let remaining = [...suffixExtras], prefix = '';
  if (word.base === 'verb') {
    const root = ROOTS_BY_ID[lex.id], neg = ids.includes('vneg');
    const p = last('person')?.value;
    const negativeStem = neg ? root.kz + pickVerbNegationSuffix(root.kz).suffix : root.kz;
    if (!steps.length) return { status: 'stem', kz, ru: 'основа «' + lex.ru + '»', kind: 'verb', rootId, parts: [kz] };
    const nounPrefix = ids.indexOf('actionNoun') >= 0 ? 'actionNoun' : ids.indexOf('need') >= 0 ? 'need' : '';
    if (nounPrefix && ids.slice(0, ids.indexOf(nounPrefix)).every(id => id === 'vneg')) {
      kz = join(negativeStem, 'у'); kind = 'noun';
      remaining = remaining.slice(remaining.findIndex(s => s.id === nounPrefix) + 1);
      nounData = noun('n', `${neg ? 'невыполнение действия' : 'действие'} «${lex.ru}»|действия «${lex.ru}»|действию «${lex.ru}»|действие «${lex.ru}»|действии «${lex.ru}»|действия «${lex.ru}»|действием «${lex.ru}»`, `действия «${lex.ru}»|действий «${lex.ru}»|действиям «${lex.ru}»|действия «${lex.ru}»|действиях «${lex.ru}»|действий «${lex.ru}»|действиями «${lex.ru}»`);
      if (remaining.some(s => s.id === 'modal')) {
        const owner = last('poss')?.value ?? 0, modal = last('modal')!.value;
        if (neg || modal !== 0 || !remaining.every(s => ['poss', 'modal'].includes(s.id))) return fail('Для такого сочетания необходимости и отрицания ещё нет проверенного результата.');
        const b = buildForm('T93_NEED_KEREK', root.id, PEOPLE[owner]);
        const ru = translated(b, options); if (!ru) return fail('Для этой формы пока нет полного перевода.');
        return { status: 'ready', kz: b.afterCheck.canonicalFormKz, ru, person: owner, predicate: true, verb: true, rootId, kind: 'predicate' };
      }
    } else if (p !== undefined) {
      const allowed = ['vneg', 'vtime', 'conditional', 'command', 'person', 'question', 'wish', 'wishOwner', 'wishAux', 'auxNeg', 'auxTime', 'link', 'aux', 'auxPresent'];
      if (!ids.every(id => allowed.includes(id))) return fail('Для выбранного залога, оттенка или перехода ещё нет проверенной формы. Схема сохранена.');
      let formula = '', custom: string | undefined, person = p, extraNegative = false;
      if (ids.includes('wish')) {
        person = last('wishOwner')?.value ?? -1;
        if (person < 0 || !ids.includes('wishAux') || neg || p !== 3) return fail('Нужно выбрать, кто хочет, и завершить слово желания в третьем лице.');
        const time = last('auxTime')?.value ?? 0;
        if (time === 2) return fail('Для будущего времени желания ещё нет проверенного результата.');
        if (ids.includes('auxNeg') && time !== 0) return fail('Для такого времени отрицательного желания нет проверенного результата.');
        formula = ids.includes('auxNeg') ? 'T84_WANT_NEG' : time === 1 ? 'T86_WANT_PAST' : time === 3 ? 'T88_WANT_COND' : 'T83_WANT_PRESENT';
      } else if (ids.includes('aux')) {
        const aux = last('aux')!.value, link = last('link')?.value, t = last('auxTime')?.value ?? 0;
        if (neg || t !== 0) return fail('Для этого времени или области отрицания во вспомогательной цепочке ещё нет проверенного результата.');
        if (aux === 1 && link === 1) formula = ids.includes('auxNeg') ? 'T73_CAN_NEG' : 'T72_CAN_PRESENT';
        else if (aux === 0 && link === 0 && !ids.includes('auxNeg')) formula = 'T80_STD_PROG';
        else if (aux === 8 && link === 1 && root.isMotionFour && !ids.includes('auxNeg')) formula = 'T78_MOTION_FOUR_PROG';
        else return fail('Для этого вспомогательного значения ещё нет проверенной готовой формы.');
      } else if (ids.includes('conditional')) {
        formula = 'T46_COND_SA';
        if (neg) { custom = negativeStem + pickConditionalSaSuffix(negativeStem).suffix + pickShortPersonalEnding(getVowelRow(negativeStem), PEOPLE[p]).suffix; extraNegative = true; }
      } else if (ids.includes('command')) {
        if (neg || ![0, 4].includes(p)) return fail('Для этого варианта побуждения ещё нет проверенного результата. Доступны «давай я» и «давайте мы».');
        formula = p === 0 ? 'T22_IMP_1SG' : 'T24_IMP_1PL';
      } else if (ids.includes('vtime')) {
        const time = last('vtime')!.value;
        if (time === 0) formula = question && !neg ? 'T28_PRES_FUT_Q' : neg ? 'T27_PRES_FUT_NEG' : 'T26_PRES_FUT_AFF';
        if (time === 1) formula = neg ? 'T32_PAST_MADY' : 'T31_PAST_DY';
        if (time === 2) { formula = neg ? 'T32_PAST_MADY' : 'T31_PAST_DY'; const stem = negativeStem + pickParticipleGanSuffix(negativeStem).suffix; custom = stem + pickFullPersonalEnding(stem, PEOPLE[p]).suffix; }
        if (time === 3) { formula = neg ? 'T32_PAST_MADY' : 'T31_PAST_DY'; const stem = pickGerundYpSuffix(negativeStem).mergedStem; custom = stem + ([3, 7].includes(p) ? (getVowelRow(stem) === 'hard' ? 'ты' : 'ті') : pickFullPersonalEnding(stem, PEOPLE[p]).suffix); prefix = 'Оказывается, '; }
        if (time === 4) { formula = 'T36_HABITUAL_ATYN'; if (neg) { const stem = join(negativeStem, pickHabitualAtynSuffix(negativeStem).suffix); custom = stem + pickFullPersonalEnding(stem, PEOPLE[p], { forceBizByz: true }).suffix; extraNegative = true; } }
        if (time === 5) { formula = 'T105_SUPPOSE_ARMYN'; if (neg) { const stem = negativeStem + 'с'; custom = stem + pickFullPersonalEnding(stem, PEOPLE[p]).suffix; extraNegative = true; } }
        if (time === 6 && !neg) {
          formula = 'T89_INTEND_PRESENT';
          const stem = root.kz + pickVerbNegationSuffix(root.kz).suffix + (getVowelRow(root.kz) === 'hard' ? 'қ' : 'к');
          custom = stem + pickFullPersonalEnding(stem, PEOPLE[p]).suffix;
        }
      }
      if (!formula) return fail('Для этого сочетания времени и отрицания ещё нет проверенного результата.');
      if (question && ['T84_WANT_NEG', 'T73_CAN_NEG'].includes(formula)) return fail('Вопрос с отрицанием желания или возможности в этой пробе ещё не проверен. Выбранные части сохранены; можно отдельно разобрать отрицание или вопрос без него.');
      try {
        const b = buildForm(formula, root.id, PEOPLE[person]);
        let ru = translated(b, options); if (!ru) return fail('Для этой формы пока нет полного перевода.');
        kz = custom || b.afterCheck.canonicalFormKz;
        if (extraNegative) ru = negatedRu(ru, person);
        if (prefix) ru = prefix + ru[0].toLowerCase() + ru.slice(1);
        let parts = !custom ? b.afterCheck.coloredSegments.map(s => s.text).filter(s => s.trim()) : undefined;
        if (question && (formula === 'T83_WANT_PRESENT' || formula === 'T72_CAN_PRESENT')) {
          // The auxiliary has its own person: desire always uses third-person келу.
          // T28 supplies the checked question form without affirmative third-person -ды/-ді.
          const auxiliary = buildForm('T28_PRES_FUT_Q', formula === 'T83_WANT_PRESENT' ? 'kel' : 'al', formula === 'T83_WANT_PRESENT' ? 'ol' : PEOPLE[person]);
          kz = kz.split(' ')[0] + ' ' + auxiliary.afterCheck.canonicalFormKz;
          ru = ru.replace(/[?.]$/, '') + '?';
          const boundary = b.afterCheck.coloredSegments.findIndex(s => s.role === 'auxiliary');
          parts = [...b.afterCheck.coloredSegments.slice(0, boundary), ...auxiliary.afterCheck.coloredSegments.filter(s => !s.isOptionalBracket)].map(s => s.text).filter(s => s.trim());
        } else if (question && formula !== 'T28_PRES_FUT_Q') {
          if (formula === 'T27_PRES_FUT_NEG' && [3, 7].includes(person)) kz = kz.slice(0, -2);
          ({ kz, ru } = addQuestion(kz, ru, true));
          if (parts) {
            if (formula === 'T27_PRES_FUT_NEG' && [3, 7].includes(person) && parts.at(-1) === b.afterCheck.canonicalFormKz.slice(-2)) parts.pop();
            parts.push(kz.split(' ').at(-1)!);
          }
        }
        const ruPredicate = ru.startsWith(SUBJECTS[person] + ' ') ? ru.slice(SUBJECTS[person].length + 1) : undefined;
        return { status: 'ready', kz, ru, parts, predicate: !ids.includes('conditional') && formula !== 'T88_WANT_COND', conditional: ids.includes('conditional') || formula === 'T88_WANT_COND', person, verb: true, rootId, question, kind: 'predicate', ruSubject: SUBJECTS[person], ruPredicate, subjectCaseIndex: ids.includes('wish') ? 1 : 0 };
      } catch { return fail('Эта основа не поддерживается в выбранной форме. Выбери другую основу или форму.'); }
    } else {
      if (ids.every(id => id === 'vneg')) return { status: 'stem', kz: negativeStem, ru: 'основа «не ' + lex.ru + '»', kind: 'verb', rootId, parts: [root.kz, pickVerbNegationSuffix(root.kz).suffix] };
      return fail('Закончи глагольную форму: выбери время или связь и участника.', 'incomplete');
    }
  }
  if (word.base === 'adverb') {
    if (steps.length) return fail('Для этого изменения наречия ещё нет проверенной формы.');
    return { status: 'ready', kz, ru: lex.ru, kind: 'adverb', rootId, location: ['osynda', 'bunda'].includes(rootId) };
  }
  if (word.base === 'numeral') {
    if (!ids.every(id => ['ordinal', 'counted', 'numberName', 'collective', 'distribute'].includes(id))) return fail('Для этой формы числительного ещё нет проверенного результата.');
    const i = Number(rootId.replace('number', '')) - 1;
    let ru = NUMBER_RU[i];
    if (ids.includes('ordinal')) { const row = getVowelRow(kz), vowel = getEndingClass(kz) === 'V'; kz += row === 'hard' ? (vowel ? 'ншы' : 'ыншы') : (vowel ? 'нші' : 'інші'); ru = ['первый', 'второй', 'третий', 'четвёртый', 'пятый', 'шестой', 'седьмой', 'восьмой', 'девятый', 'десятый'][i]; }
    if (ids.includes('collective')) { if (i > 6) return fail('Собирательная модель здесь применяется только к одному–семи.'); kz = ['біреу', 'екеу', 'үшеу', 'төртеу', 'бесеу', 'алтау', 'жетеу'][i]; ru = ['один', 'двое', 'трое', 'четверо', 'пятеро', 'шестеро', 'семеро'][i]; }
    if (ids.includes('distribute')) { kz += pickCaseSuffix(kz, 'ablative').suffix; ru = ['по одному', 'по два', 'по три', 'по четыре', 'по пять', 'по шесть', 'по семь', 'по восемь', 'по девять', 'по десять'][i]; }
    return { status: 'ready', kz, ru, kind: ids.includes('distribute') ? 'adverb' : 'quantity', rootId, caseIndex: 0 };
  }
  if (kind === 'adjective') {
    const degree = last('degree');
    const extra = EXTRA.find(r => r.id === rootId), original = NOMINAL_WORDS.find(r => r.id === rootId);
    let ru = lex.ru;
    if (degree) {
      const comparative = extra?.comparison || ({ jas: 'моложе', bos: 'свободнее', kushti: 'сильнее' } as Record<string, string>)[rootId];
      if (!comparative || degree.value > 1) return fail('Для этой степени данного признака ещё нет проверенного результата.');
      const row = getVowelRow(kz), vowel = getEndingClass(kz) === 'V';
      kz = degree.value === 0 ? join(kz, row === 'hard' ? (vowel ? 'рақ' : 'ырақ') : (vowel ? 'рек' : 'ірек')) : kz + pickPluralSuffix(kz).suffix.replace(/р$/, 'у');
      ru = (degree.value === 1 ? 'немного ' : '') + comparative;
    }
    if (ids.some(id => !['degree', 'nominalPredicate', 'nominalNeg', 'person', 'question', 'adverbRole'].includes(id))) return fail('Для этого перехода от признака ещё нет проверенной формы.');
    const adjectiveRu = ({ ulken: ['большой', 'большая', 'большое', 'большие'], jaqsy: ['хороший', 'хорошая', 'хорошее', 'хорошие'], jas: ['молодой', 'молодая', 'молодое', 'молодые'], bos: ['свободный', 'свободная', 'свободное', 'свободные'], azir: ['готовый', 'готовая', 'готовое', 'готовые'], kushti: ['сильный', 'сильная', 'сильное', 'сильные'] } as Record<string, string[]>)[rootId];
    if (ids.includes('adverbRole')) {
      if (rootId !== 'jaqsy' || degree) return fail('Для наречной роли этого признака ещё нет проверенного перевода.');
      return { status: 'ready', kz, ru: 'хорошо', kind: 'adverb', rootId };
    }
    if (ids.includes('nominalPredicate') || ids.includes('nominalNeg')) {
      const p = last('person')?.value; if (p === undefined) return fail('Выбери, о ком говорится.', 'incomplete');
      const negative = ids.includes('nominalNeg'), stem = negative ? 'емес' : kz;
      kz = (negative ? kz + ' ' : '') + stem + pickFullPersonalEnding(stem, PEOPLE[p]).suffix;
      const pr = degree ? ru : (original?.predicateRu || extra?.predicate || [ru, ru])[p >= 4 ? 1 : 0];
      ru = SUBJECTS[p] + ' ' + (negative ? 'не ' : '') + pr;
      const q = addQuestion(kz, ru, question);
      return { status: 'ready', ...q, predicate: true, person: p, kind: 'predicate', rootId, ruSubject: SUBJECTS[p], ruPredicate: (negative ? 'не ' : '') + pr, question, ruAdjectives: degree ? undefined : adjectiveRu?.map(r => (negative ? 'не ' : '') + r) };
    }
    return { status: 'ready', kz, ru, parts: degree && kz.startsWith(lex.kz) ? [lex.kz, kz.slice(lex.kz.length)] : [kz], kind: 'adjective', rootId, ruAdjectives: degree ? undefined : adjectiveRu };
  }
  if (kind === 'noun') {
    if (!nounData) return fail('Для этого названия нет подготовленного перевода форм.');
    if (remaining.some(s => !['plural', 'poss', 'case', 'owner', 'nominalPredicate', 'nominalNeg', 'person', 'question', 'postposition'].includes(s.id))) return fail('Для выбранного словообразования или особого порядка ещё нет проверенной формы.');
    const own = remaining.find(s => s.id === 'poss')?.value;
    const plural = remaining.some(s => s.id === 'plural') || own === 5 || own === 6;
    const ci = remaining.find(s => s.id === 'case')?.value || 0;
    let parts = [kz];
    if (plural) { const suffix = pickPluralSuffix(kz).suffix; kz += suffix; parts.push(suffix); }
    if (own !== undefined) {
      const suffix = pickPossessiveSuffix(kz, PEOPLE[own === 5 ? 1 : own === 6 ? 2 : own]).suffix;
      kz = join(kz, suffix);
      const prefix = kz.slice(0, -suffix.length); let offset = 0;
      parts = parts.map(part => { const p = prefix.slice(offset, offset + part.length); offset += part.length; return p; }).filter(Boolean);
      parts.push(suffix);
    }
    if (remaining.some(s => s.id === 'owner')) return fail('Для этого обозначения владельца ещё нет проверенного перевода.');
    if (ci) {
      const afterPossessive = own === undefined ? null : [3, 7].includes(own) ? '3' : [0, 1, 5].includes(own) ? '1_2' : null;
      const suffix = pickCaseSuffix(kz, CASES[ci]!, { afterPossessive }).suffix; kz += suffix; parts.push(suffix);
    }
    const rawCases = plural ? nounData.plural : nounData.singular;
    const ruCases = rawCases.map((r, k) => (own === undefined ? '' : possessedRu(own, nounData.gender, plural, k, !!nounData.animate) + ' ') + r);
    const surface = ['jumys', 'jol'].includes(rootId);
    let ru = ci === 4 ? (nounData.animate ? 'у ' + ruCases[1] : (surface ? 'на ' : rootId === 'uaqyt' && own === undefined && !plural ? 'во ' : 'в ') + ruCases[4]) : ci === 5 ? (nounData.animate ? 'от ' : surface ? 'с ' : 'из ') + ruCases[5] : ci === 6 ? 'с ' + ruCases[6] : ruCases[ci];
    const post = remaining.find(s => s.id === 'postposition');
    if (post) {
      if ([5, 2, 0, 6][post.value] !== ci) return fail('Этот послелог требует другого падежа.');
      const postKz = ['кейін', 'дейін', 'туралы', 'бірге'][post.value];
      kz += ' ' + postKz;
      ru = ['после ' + ruCases[1], 'до ' + ruCases[1], 'о ' + ruCases[4], 'вместе с ' + ruCases[6]][post.value];
      return { status: 'ready', kz, ru, kind: 'adverb', rootId };
    }
    const nominal = ids.includes('nominalPredicate') || ids.includes('nominalNeg');
    if (nominal) {
      const p = last('person')?.value; if (p === undefined) return fail('Выбери, о ком говорится.', 'incomplete');
      if (![0, 4, 5].includes(ci)) return fail('Эта падежная форма не используется здесь как готовое сказуемое.');
      const negative = ids.includes('nominalNeg'), stem = negative ? 'емес' : kz;
      kz = (negative ? kz + ' ' : '') + stem + pickFullPersonalEnding(stem, PEOPLE[p]).suffix;
      const predicate = (negative ? 'не ' : '') + (ci === 0 && own === undefined && p >= 4 ? nounData.plural[0] : ru);
      const q = addQuestion(kz, SUBJECTS[p] + ' ' + predicate, question);
      return { status: 'ready', ...q, predicate: true, person: p, kind: 'predicate', rootId, ruSubject: SUBJECTS[p], ruPredicate: predicate, question };
    }
    return { status: 'ready', kz, ru, parts, ruCases, rootId, kind: 'noun', caseIndex: ci, plural, possPerson: own, gender: nounData.gender, location: nounData.location, animate: nounData.animate };
  }
  return fail('Для этой сборки ещё нет проверенного результата.');
}

export function realizeConstructorSentence(board: Record<string, ConstructorWord | { presence: string }>, type: string, order: string[], options: ConstructorOptions = {}): ConstructorResult {
  const present = order.filter(id => board[id]);
  if (!present.length) return fail('Поставь собранные слова в ячейки предложения.', 'incomplete');
  const words: Record<string, ConstructorResult> = {};
  for (const id of present) {
    const w = board[id];
    if ('presence' in w) { words[id] = { status: 'ready', kz: w.presence === 'есть' ? 'бар' : 'жоқ', ru: w.presence }; continue; }
    words[id] = options.resolveWord ? options.resolveWord(w) : realizeConstructorWord(w, options);
    if (words[id].status !== 'ready') return fail('Слово «' + w.meaning + '»: ' + (words[id].message || 'закончи его форму.'), words[id].status === 'unsupported' ? 'unsupported' : 'incomplete');
  }
  const subject = words.subject, predicate = words.predicate;
  if (subject && (subject.kind !== 'noun' || subject.caseIndex !== 0)) return fail('В ячейке «Кто / что» нужна форма без выраженного падежа.');
  let subjectRu = subject?.ru || '';
  if (words.attribute) {
    if (!subject || !words.attribute.ruAdjectives) return fail('Для сочетания этого определения и предмета ещё нет проверенного перевода.');
    const index = subject.plural ? 3 : subject.gender === 'f' ? 1 : subject.gender === 'n' ? 2 : 0;
    subjectRu = words.attribute.ruAdjectives[index] + ' ' + subjectRu;
  }
  if (words.owner) {
    if (!subject || words.owner.caseIndex !== 1 || subject.possPerson === undefined) return fail('У владельца нужен родительный падеж, у предмета — принадлежность.');
    if (words.owner.person !== undefined && subject.possPerson !== words.owner.person || words.owner.person === undefined && ![3, 7].includes(subject.possPerson)) return fail('Владелец и принадлежность предмета не совпали.');
    if (words.owner.person === undefined) subjectRu = subjectRu.replace(/(его \/ её|их) /, '') + ' ' + words.owner.ru;
    const ownerPosition = present.indexOf('owner'), subjectPosition = present.indexOf('subject');
    if (ownerPosition > subjectPosition || words.attribute && present.indexOf('attribute') > subjectPosition) return fail('В этом сочетании поставь владельца и определение перед предметом.');
  }
  if (type === 'presence') {
    if (!subject || !words.presence) return fail('Для наличия выбери, что есть, и «есть» или «нет».', 'incomplete');
    if (subject.person !== undefined) return fail('Для этой схемы наличия выбери название предмета или человека. Сочетание с личным местоимением пока не проверено.');
    if (words.place && words.place.caseIndex !== 4) return fail('Для «где / у кого» нужна местная форма.');
  } else if (type === 'possession' && !predicate) {
    if (!subject || !words.owner) return fail('Для сочетания «чей предмет» добавь владельца и предмет.', 'incomplete');
    return { status: 'ready', kz: present.map(id => words[id].kz).join(' '), ru: subjectRu, kind: 'phrase' };
  } else if (!predicate?.predicate) return fail('Добавь законченное сказуемое.', 'incomplete');
  if (predicate && subject) {
    if (predicate.subjectCaseIndex || !predicate.ruPredicate) return fail('Для этой формы нужен другой способ обозначить участника. Готовое выражение можно посмотреть под его собственными ячейками.');
    if (subject.person !== undefined && predicate.person !== subject.person) return fail('Лицо местоимения и сказуемого не совпало.');
    if (subject.person === undefined && ![3, 7].includes(predicate.person ?? -1)) return fail('Существительное в роли подлежащего требует третьего лица.');
  }
  if (words.object && (words.object.kind !== 'noun' || ![0, 3].includes(words.object.caseIndex ?? -1))) return fail('Предмету действия нужна форма без выраженного падежа или винительный падеж.');
  if (words.direction && words.direction.caseIndex !== 2) return fail('Для направления или адресата нужен дательный падеж.');
  if (words.object && !predicate?.verb || words.direction && !predicate?.verb) return fail('Для предмета действия и направления нужно сказуемое с действием.');
  if (words.direction && !words.direction.location && !words.direction.animate) return fail('Для этого сочетания действия и адресата ещё нет проверенного результата.');
  if (words.direction?.animate && predicate?.rootId && !['ber', 'ait', 'jaz', 'oqy', 'apar', 'akel'].includes(predicate.rootId)) return fail('Сочетание этого действия с адресатом пока не проверено.');
  if (words.object && words.object.caseIndex === 0 && present.indexOf('predicate') !== present.indexOf('object') + 1) return fail('Предмет без винительного окончания поставь непосредственно перед действием.');
  if (predicate?.rootId && ['bar', 'kel', 'shyq', 'jur', 'jat', 'otyr', 'tur'].includes(predicate.rootId) && words.object) return fail('У этого действия здесь нет прямого предмета. Убери его или выбери другое действие.');
  if (words.direction?.location && predicate?.rootId && !['bar', 'kel', 'shyq', 'jur', 'apar', 'akel'].includes(predicate.rootId)) return fail('Это сочетание действия и направления пока не проверено.');
  if (words.condition && !words.condition.conditional) return fail('Для «если» нужна законченная условная форма.');
  if (words.condition && present[0] !== 'condition') return fail('В проверенном условном предложении поставь часть с «если» первой.');
  if (predicate && !predicate.ruPredicate && present.some(id => id !== 'predicate')) return fail('Для расширения этого выражения пока нет проверенного перевода целого предложения.');
  let kz = present.map(id => words[id].kz).join(' ');
  const ruFor = (id: string) => words[id]?.ru || '';
  let ru = '';
  if (type === 'presence') ru = [ruFor('place'), ruFor('presence'), words.presence.ru === 'нет' ? subject!.ruCases?.[1] || subject!.ru : subject!.ru].filter(Boolean).join(' ');
  else {
    let predRu = (predicate!.ruPredicate || predicate!.ru!).replace(/[?.]$/, '');
    subjectRu = subjectRu || predicate!.ruSubject || '';
    if (subject && (subject.gender || subject.plural) && predicate!.ruAdjectives) predRu = predicate!.ruAdjectives[subject.plural ? 3 : subject.gender === 'f' ? 1 : subject.gender === 'n' ? 2 : 0];
    if (subject?.gender && !subject.plural) predRu = predRu.replace(/л\(а\)/g, subject.gender === 'f' ? 'ла' : subject.gender === 'n' ? 'ло' : 'л');
    if (subject?.plural) predRu = predRu.replace(/л\(а\)/g, 'ли');
    const directionRu = words.direction ? words.direction.location ? (['jumys', 'jol'].includes(words.direction.rootId!) ? 'на ' : 'в ') + words.direction.ruCases![3] : words.direction.ru : '';
    ru = predicate!.ruPredicate ? [subjectRu, ruFor('time'), ruFor('manner'), predRu, ruFor('object'), directionRu].filter(Boolean).join(' ') : predicate!.ru!;
    if (words.condition) ru = ruFor('condition') + ', ' + ru[0].toLowerCase() + ru.slice(1);
  }
  if (words.condition) { const i = present.indexOf('condition'); if (i >= 0 && i < present.length - 1) kz = present.map((id, j) => words[id].kz + (j === i ? ',' : '')).join(' '); }
  const punct = predicate?.question ? '?' : '.';
  return { status: 'ready', kz: kz[0].toLocaleUpperCase('kk') + kz.slice(1).replace(/[?.]$/, '') + punct, ru: ru[0].toLocaleUpperCase('ru') + ru.slice(1).replace(/[?.]$/, '') + punct, parts: present.map(id => words[id].kz!), kind: 'sentence' };
}
