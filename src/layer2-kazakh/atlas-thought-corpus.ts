import type { PersonId } from '../types';
import { PERSONS, ROOTS_BY_ID } from './roots';
import {
  getEndingClass, getVowelRow, joinWithBoundaryMerger, pickCaseSuffix,
  pickFullPersonalEnding, pickPluralSuffix, pickPossessiveSuffix,
  pickShortPersonalEnding, pickVerbNegationSuffix,
} from './phonetics';
import type { CaseType } from './phonetics';

/** Evidence is internal; these links must never become learner-facing labels. */
export const ATLAS_THOUGHT_SOURCES = {
  words: 'https://kaz-tili.kz/slovar02.htm',
  verbs: 'https://kaz-tili.kz/slovar01.htm',
  adjectives: 'https://kaz-tili.kz/slovar03.htm',
  comparison: 'https://kaz-tili.kz/prilag2.htm',
  adverbs: 'https://kaz-tili.kz/slovar04.htm',
  phrases: 'https://kaz-tili.kz/razgov/razrau02_12ya.htm',
  right: 'https://kaz-tili.kz/razgov/razrau02_04ik.htm',
  present: 'https://kaz-tili.kz/glag2.htm',
  progressive: 'https://kaz-tili.kz/glag1.htm',
  past: 'https://kaz-tili.kz/glag3.htm',
  conditional: 'https://kaz-tili.kz/glag4.htm',
  wish: 'https://kaz-tili.kz/glag5.htm',
  greetings: 'https://skype.soyle.kz/post/view?id=19',
  spelling: 'https://old.emle.kz/faq',
  guest: 'https://tildertemirtau.kz/wp-content/uploads/2023/12/%D0%96%D2%B1%D0%BC%D1%8B%D1%81-%D0%B4%D3%99%D0%BF%D1%82%D0%B5%D1%80-%D0%901-pdf.io_.pdf',
  pronoun: 'https://umckrg.gov.kz/files/loader/1726650922213.pdf',
  wishes: 'https://www.kaz-tili.kz/statmarafon12.htm',
  concern: 'https://kaz-tili.kz/statkaizen11.htm',
  advance: 'https://kaz-tili.kz/statkaizen13.htm',
  conscience: 'https://qazaqadebieti.kz/20715/a-ynan-zharyl-an-zhyrlar',
  cold: 'https://t.me/s/kalkastop/2343',
  light: 'https://htu.edu.kz/images/gylym/27-28-kazan-2022.pdf',
} as const;
type SourceId = keyof typeof ATLAS_THOUGHT_SOURCES;
interface PreparedThought { build: () => string; sources: readonly SourceId[] }
const example = (build: () => string, ...sources: SourceId[]): PreparedThought => ({ build, sources });

// These recipes serve the exact reviewed examples below, never arbitrary input.
const join = (stem: string, suffix: string) => joinWithBoundaryMerger(stem, suffix).mergedWord;
const possess = (stem: string, person: PersonId) => join(stem, pickPossessiveSuffix(stem, person).suffix);
const plural = (stem: string) => join(stem, pickPluralSuffix(stem).suffix);
const nounCase = (stem: string, kind: CaseType, afterPossessive?: '1_2' | '3') =>
  join(stem, pickCaseSuffix(stem, kind, { afterPossessive }).suffix);
const predicate = (stem: string, person: PersonId) => join(stem, pickFullPersonalEnding(stem, person).suffix);
const vowel = (stem: string, hard: string, soft: string) => getVowelRow(stem) === 'hard' ? hard : soft;
const connectA = (stem: string) => join(stem, getEndingClass(stem) === 'V' ? 'й' : vowel(stem, 'а', 'е'));
const present = (stem: string, person: PersonId = 'ol') => {
  const base = connectA(stem);
  return join(base, pickFullPersonalEnding(base, person, { thirdPersonHasDyDi: true }).suffix);
};
const negative = (stem: string) => join(stem, pickVerbNegationSuffix(stem).suffix);
const past = (stem: string, person: PersonId = 'men') => {
  const base = join(stem, (getEndingClass(stem) === 'VOICELESS' ? 'т' : 'д') + vowel(stem, 'ы', 'і'));
  return join(base, pickShortPersonalEnding(getVowelRow(base), person).suffix);
};
const converbP = (stem: string) => join(stem, getEndingClass(stem) === 'V' ? 'п' : vowel(stem, 'ып', 'іп'));
const participle = (stem: string) => join(stem,
  getEndingClass(stem) === 'VOICELESS' ? vowel(stem, 'қан', 'кен') : vowel(stem, 'ған', 'ген'));
const infinitive = (stem: string) => join(stem, 'у');
const want = (stem: string, not = false) => {
  const desire = join(stem, getEndingClass(stem) === 'VOICELESS' ? vowel(stem, 'қы', 'кі') : vowel(stem, 'ғы', 'гі'));
  return `${possess(desire, 'men')} ${present(not ? negative('кел') : 'кел')}`;
};
const wish = (stem: string) => join(stem, vowel(stem, 'сын', 'сін'));
const conditional = (stem: string) => {
  const base = join(stem, vowel(stem, 'са', 'се'));
  return join(base, pickShortPersonalEnding(getVowelRow(base), 'men').suffix);
};
const comparative = (stem: string) => join(stem,
  getEndingClass(stem) === 'V' ? vowel(stem, 'рақ', 'рек') : vowel(stem, 'ырақ', 'ірек'));
const motion = () => `${connectA(ROOTS_BY_ID.bar.kz)} ${predicate('жатыр', 'men')}`;

/** Complete phrases, not a free translator. Source/pattern notes: docs/grammar-checks/2026-10-19-atlas-thought-corpus.md. */
export const ATLAS_THOUGHT_CORPUS: Readonly<Record<string, PreparedThought>> = {
  'Вода есть.': example(() => `${ROOTS_BY_ID.su.kz} бар`, 'words'),
  'Времени нет.': example(() => `${ROOTS_BY_ID.uaqyt.kz} жоқ`, 'words'),
  'У меня есть дом, но сегодня нет сил.': example(() =>
    `${PERSONS.men.genitiveKz} ${possess(ROOTS_BY_ID.ui.kz, 'men')} бар, бірақ бүгін ${possess('күш', 'men')} жоқ`, 'words', 'present'),
  'Главное, что мы живы и вместе.': example(() =>
    `Ең бастысы — біз ${predicate('тірі', 'biz')} және ${predicate('бірге', 'biz')}`, 'adjectives', 'present'),

  'Хочу спать.': example(() => want('ұйықта'), 'phrases', 'wish'),
  'Не хочу идти.': example(() => want(ROOTS_BY_ID.bar.kz, true), 'wish'),
  'Мне нужно закончить дело.': example(() =>
    `${PERSONS.men.dativeKz} ${nounCase('іс', 'accusative')} ${infinitive('аяқта')} керек`, 'wish', 'words'),
  'Могу помочь.': example(() => `${connectA('көмектес')} ${present('ал', 'men')}`, 'present', 'words'),
  'Пусть у детей всё будет хорошо.': example(() =>
    `${nounCase(plural('бала'), 'genitive')} ${nounCase(possess('өмір', 'ol'), 'locative', '3')} бәрі жақсы ${wish('бол')}`, 'wishes', 'words'),
  'Если бы знать заранее…': example(() => `Алдын ала ${conditional('біл')} ғой…`, 'conditional', 'advance'),

  'Иду домой.': example(() => `${nounCase(ROOTS_BY_ID.ui.kz, 'dative')} ${motion()}`, 'progressive'),
  'Вышел из дома.': example(() => `${nounCase(ROOTS_BY_ID.ui.kz, 'ablative')} ${past('шық')}`, 'past'),
  'Еду к другу поговорить о деле.': example(() =>
    `Іс туралы ${nounCase(infinitive('сөйлес'), 'dative')} ${nounCase(possess('дос', 'men'), 'dative', '1_2')} ${motion()}`, 'progressive', 'words'),
  'Всё возвращается к своему истоку.': example(() =>
    `Бәрі өз ${nounCase(possess('бастау', 'ol'), 'dative', '3')} ${present('қайт')}`, 'present', 'words'),

  'Моя мама.': example(() => `${PERSONS.men.genitiveKz} ${possess('ана', 'men')}`, 'words'),
  'Твой телефон.': example(() => `${PERSONS.sen.genitiveKz} ${possess('телефон', 'sen')}`, 'words'),
  'Наш общий замысел.': example(() => `${PERSONS.biz.genitiveKz} ортақ ${possess('ой', 'biz')}`, 'words'),
  'Иду вместе с тобой.': example(() => `${PERSONS.sen.instrumentalKz} бірге ${motion()}`, 'progressive'),
  'Слово предков.': example(() => `${nounCase(plural('ата-баба'), 'genitive')} ${possess('сөз', 'ol')}`, 'words'),
  'Человек своего времени.': example(() => `Өз ${nounCase(possess('заман', 'ol'), 'genitive')} ${possess('адам', 'ol')}`, 'words'),

  'Мне холодно.': example(() => `${converbP('тоң')} ${predicate('тұр', 'men')}`, 'cold', 'progressive'),
  'Мне нравится.': example(() => `${PERSONS.men.dativeKz} ${present('ұна')}`, 'present', 'words'),
  'Я скучаю по дому.': example(() =>
    `${nounCase(possess(ROOTS_BY_ID.ui.kz, 'men'), 'accusative', '1_2')} ${converbP('сағын')} ${predicate('жүр', 'men')}`, 'phrases', 'progressive'),
  'Меня это тревожит.': example(() => `Бұл ${PERSONS.men.accusativeKz} ${present('алаңдат')}`, 'concern'),
  'На душе светло и спокойно.': example(() => `${possess('көңіл', 'men')} жарқын, ${possess('жан', 'men')} тыныш`, 'adjectives', 'words'),

  'Я знаю.': example(() => `Мен ${present('біл', 'men')}`, 'phrases', 'present'),
  'Я не понял.': example(() => `Мен ${past(negative('түсін'))}`, 'phrases', 'past'),
  'По-моему, он прав.': example(() => 'Меніңше, оныкі дұрыс', 'adverbs', 'right', 'pronoun'),
  'Я помню тот день.': example(() => `Сол күн ${nounCase(possess('ес', 'men'), 'locative', '1_2')}`, 'phrases'),
  'Говорят, это было давно: сам не видел.': example(() =>
    `Бұл баяғыда ${participle('бол')} дейді, ${possess('өз', 'men')} ${participle('көр')} ${predicate('жоқ', 'men')}`, 'phrases', 'past'),
  'Кажется, так.': example(() => 'Солай сияқты', 'adverbs', 'adjectives'),

  'Хороший чай.': example(() => 'Жақсы шай', 'adjectives'),
  'Очень далеко.': example(() => 'Өте алыс', 'adverbs'),
  'Сегодня теплее, чем вчера.': example(() => `Бүгін ${nounCase('кешегі', 'ablative')} ${comparative('жылы')}`, 'comparison', 'adjectives'),
  'Это важнее.': example(() => `Бұл ${comparative('маңызды')}`, 'comparison', 'adjectives'),
  'Нет ничего дороже чистой совести.': example(() => `Таза ${nounCase('ар', 'ablative')} қымбат ештеңе жоқ`, 'conscience', 'adjectives'),

  'Здравствуйте.': example(() => 'Сәлеметсіз бе', 'greetings'),
  'Спасибо.': example(() => 'Рақмет', 'greetings', 'spelling'),
  'Извините.': example(() => 'Кешіріңіз', 'greetings'),
  'Будьте гостем.': example(() => 'Қонақ болыңыз', 'guest'),
  'Не беспокойтесь, пожалуйста.': example(() =>
    `Өтінемін, ${join(negative('уайымда'), pickShortPersonalEnding('hard', 'siz').suffix)}`, 'concern', 'phrases'),
  'Да будет ваш путь светлым.': example(() => `${possess('жол', 'siz')} жарық ${wish('бол')}`, 'light', 'wishes'),
};

export function buildAtlasThought(thought: string): string | null {
  if (!Object.prototype.hasOwnProperty.call(ATLAS_THOUGHT_CORPUS, thought)) return null;
  const value = ATLAS_THOUGHT_CORPUS[thought].build();
  return value[0].toLocaleUpperCase('kk') + value.slice(1) + (/[.!?…]$/u.test(value) ? '' : '.');
}
