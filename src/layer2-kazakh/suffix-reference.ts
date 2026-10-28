import { getCaseVariants } from './case-reference';
import { CaseType, getVowelRow } from './phonetics';

type VariantGroup = Record<string, string>;
const GROUPS: VariantGroup[] = [
  { 'ғы': 'Твёрдая основа, последний звук с голосом', 'гі': 'Мягкая основа, последний звук с голосом', 'қы': 'Твёрдая основа, глухой последний звук', 'кі': 'Мягкая основа, глухой последний звук' },
  { 'а': 'После согласной, твёрдая основа', 'е': 'После согласной, мягкая основа', 'й': 'После гласной; на границе букв возможно слияние' },
  { 'ған': 'Твёрдая основа, последний звук с голосом', 'ген': 'Мягкая основа, последний звук с голосом', 'қан': 'Твёрдая основа, глухой последний звук', 'кен': 'Мягкая основа, глухой последний звук' },
  { 'ды': 'После звука с голосом, твёрдая основа', 'ді': 'После звука с голосом, мягкая основа', 'ты': 'После глухого звука, твёрдая основа', 'ті': 'После глухого звука, мягкая основа' },
  { 'ып': 'После согласной, твёрдая основа', 'іп': 'После согласной, мягкая основа', 'п': 'После гласной' },
  { 'атын': 'После согласной, твёрдая основа', 'етін': 'После согласной, мягкая основа', 'йтын': 'После гласной, твёрдая основа', 'йтін': 'После гласной, мягкая основа' },
  { 'лар': 'После гласной или й, р, у; твёрдая основа', 'лер': 'После гласной или й, р, у; мягкая основа', 'дар': 'После л, з, ж, м, н, ң; твёрдая основа', 'дер': 'После л, з, ж, м, н, ң; мягкая основа', 'тар': 'После глухого звука; твёрдая основа', 'тер': 'После глухого звука; мягкая основа' },
  { 'м': 'Принадлежность «мой», после гласной', 'ым': 'Принадлежность «мой», после согласной, твёрдая основа', 'ім': 'Принадлежность «мой», после согласной, мягкая основа', 'ң': 'Принадлежность «твой», после гласной', 'ың': 'Принадлежность «твой», после согласной, твёрдая основа', 'ің': 'Принадлежность «твой», после согласной, мягкая основа', 'сы': 'Принадлежность третьего лица, после гласной, твёрдая основа', 'сі': 'Принадлежность третьего лица, после гласной, мягкая основа', 'ы': 'Принадлежность третьего лица, после согласной, твёрдая основа', 'і': 'Принадлежность третьего лица, после согласной, мягкая основа' },
];

// These endings already belong to the core selectors. They are labels for display,
// never a separate form builder.
const ADDITIONAL = new Set(['ма', 'ме', 'ба', 'бе', 'па', 'пе', 'мау', 'меу', 'бау', 'беу', 'пау', 'пеу', 'са', 'се', 'мын', 'мін', 'бын', 'бін', 'пын', 'пін', 'мыз', 'міз', 'быз', 'біз', 'пыз', 'піз', 'сың', 'сің', 'сыз', 'сіз', 'сыңдар', 'сіңдер', 'сыздар', 'сіздер', 'ар', 'ер', 'р', 'айын', 'ейін', 'йын', 'айық', 'ейік', 'йық', 'йік', 'ушы', 'уші']);
let cachedGroups: VariantGroup[] | undefined;
function groups(): VariantGroup[] {
  if (!cachedGroups) {
    const cases: CaseType[] = ['genitive', 'dative', 'locative', 'ablative', 'instrumental', 'accusative', 'niki'];
    cachedGroups = [...GROUPS, ...cases.map(type => Object.fromEntries(getCaseVariants(type).map(row => [row.suffix, row.conditionRu])))];
  }
  return cachedGroups;
}

export function isKnownSuffixVariant(value: string): boolean {
  const clean = value.replace(/^-/, '');
  return ADDITIONAL.has(clean) || groups().some(group => Object.prototype.hasOwnProperty.call(group, clean));
}

export function getSuffixVariantConditions(values: string[]): string[] | undefined {
  const clean = values.map(value => value.replace(/^-/, ''));
  if (!clean.every(isKnownSuffixVariant)) return undefined;
  const candidates = groups().filter(group => clean.every(value => Object.prototype.hasOwnProperty.call(group, value)));
  return clean.map(value => {
    const conditions = [...new Set(candidates.map(group => group[value]))];
    if (conditions.length === 1) return conditions[0];
    const vowel = /[аәеоөұүыі]/.test(value);
    const row = getVowelRow(value) === 'hard' ? 'Твёрдый ряд.' : 'Мягкий ряд.';
    return `${vowel ? row + ' ' : ''}Точное условие выбора зависит от конструкции; смотри объяснение выбранной формы.`;
  });
}
