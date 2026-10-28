import { CONSTRUCTOR_LEXEMES, realizeConstructorWord, type ConstructorWord } from './constructor-realization';
import { buildForm, pickPresentAEYSuffix, pickPastDySuffix } from './form-builder';
import { STARTER_ROOTS } from './roots';
import { getSuffixVariantConditions } from './suffix-reference';
import { getCaseVariants } from './case-reference';
import { pickPluralSuffix, pickPossessiveSuffix, pickCaseSuffix, pickVerbNegationSuffix, pickQuestionParticle } from './phonetics';
import type { CaseType } from './phonetics';
import type { PersonId } from '../types';

export interface ConstructorGroupReference { variants: { value: string; condition: string; selected: boolean }[]; rule?: string }
const persons: PersonId[] = ['men', 'sen', 'siz', 'ol', 'biz', 'sender', 'sizder', 'olar'];
const cases: (CaseType | null)[] = [null, 'genitive', 'dative', 'accusative', 'locative', 'ablative', 'instrumental'];
const blank = (): ConstructorGroupReference => ({ variants: [] });
const norm = (s: string) => s.toLowerCase().trim().replace(/ё/g, 'е');
export function getConstructorGroupReference(word: ConstructorWord, group: string): ConstructorGroupReference {
  const lex = CONSTRUCTOR_LEXEMES.find(l => l.base === word.base && [l.ru, ...l.aliases].some(s => norm(s) === norm(word.meaning)));
  if (!lex) return blank();
  const value = (id: string) => word.steps.find(s => s.id === id)?.value;
  const rows = (values: string[], selected: string, rule: string): ConstructorGroupReference => {
    const conditions = getSuffixVariantConditions(values);
    return { rule, variants: values.map((v, i) => ({ value: v || 'Без отдельного окончания', condition: v === selected ? rule : conditions?.[i] || 'Условие зависит от выбранной формы и лица.', selected: v === selected })) };
  };
  try {
    if (group === 'n-number') {
      const chosen = pickPluralSuffix(lex.kz);
      return rows(['лар', 'лер', 'дар', 'дер', 'тар', 'тер'], chosen.suffix, chosen.ruleRu);
    }
    if (group === 'n-owner') {
      const p = value('poss') ?? 0;
      let stem = lex.kz;
      if (value('plural') !== undefined || [5, 6].includes(p)) stem += pickPluralSuffix(stem).suffix;
      const chosen = pickPossessiveSuffix(stem, persons[p === 5 ? 1 : p === 6 ? 2 : p]);
      const person = persons[p === 5 ? 1 : p === 6 ? 2 : p];
      const alternatives = STARTER_ROOTS.filter(r => r.pos !== 'verb').map(r => pickPossessiveSuffix(r.kz, person));
      const variants = [...new Map([...alternatives, chosen].map(v => [v.suffix, { value: v.suffix, condition: v.ruleRu, selected: v.suffix === chosen.suffix }])).values()];
      return { variants, rule: chosen.ruleRu };
    }
    if (group === 'n-case') {
      const ci = value('case') ?? 2;
      if (!ci) return { variants: [{ value: 'Без отдельного окончания', condition: 'В этом значении падеж не выражен отдельным окончанием.', selected: true }] };
      const stemWord = { ...word, steps: word.steps.filter(s => s.id !== 'case') };
      const stem = realizeConstructorWord(stemWord).kz;
      if (!stem) return blank();
      const p = value('poss'), afterPossessive = p === undefined ? null : [3, 7].includes(p) ? '3' : [0, 1, 5].includes(p) ? '1_2' : null;
      const chosen = pickCaseSuffix(stem, cases[ci]!, { afterPossessive });
      return { rule: chosen.ruleRu, variants: getCaseVariants(cases[ci]!).map(v => ({ value: v.suffix, condition: v.suffix === chosen.suffix ? chosen.ruleRu : v.conditionRu, selected: v.suffix === chosen.suffix })) };
    }
    if (group === 'v-negative') {
      const chosen = pickVerbNegationSuffix(lex.kz);
      const rules = [
        'После гласной, й, у, р, л; твёрдый ряд', 'После гласной, й, у, р, л; мягкий ряд',
        'После з, ж, м, н, ң; твёрдый ряд', 'После з, ж, м, н, ң; мягкий ряд',
        'После глухой согласной; твёрдый ряд', 'После глухой согласной; мягкий ряд',
      ];
      return { rule: chosen.ruleRu, variants: ['ма', 'ме', 'ба', 'бе', 'па', 'пе'].map((v, i) => ({ value: v, condition: v === chosen.suffix ? chosen.ruleRu : rules[i], selected: v === chosen.suffix })) };
    }
    if (group === 'v-time') {
      const stem = lex.kz + (value('vneg') !== undefined ? pickVerbNegationSuffix(lex.kz).suffix : '');
      const past = value('vtime') === 1;
      const chosen = past ? pickPastDySuffix(stem) : pickPresentAEYSuffix(stem);
      return rows(past ? ['ды', 'ді', 'ты', 'ті'] : ['а', 'е', 'й'], chosen.suffix, chosen.ruleRu);
    }
    if (group === 'v-person' || group === 's-action') {
      const past = value('vtime') === 1, negative = value('vneg') !== undefined;
      const formula = past ? negative ? 'T32_PAST_MADY' : 'T31_PAST_DY' : negative ? 'T27_PRES_FUT_NEG' : 'T26_PRES_FUT_AFF';
      const built = buildForm(formula, lex.id, persons[value('person') ?? 0]);
      const steps = built.beforeCheck.multiStepBlanks;
      const options = group === 'v-person' ? steps?.at(-1)?.options || built.beforeCheck.stage1Options : steps?.[0]?.options || built.beforeCheck.stage1Options;
      const chosen = options.find(x => x.isCorrect);
      if (!chosen) return blank();
      return rows(options.map(x => x.value), chosen.value, chosen.reasonRu);
    }
    if (group === 's-question') {
      const result = realizeConstructorWord(word), stem = result.kz?.split(' ').at(-1);
      if (!stem) return blank();
      const chosen = pickQuestionParticle(stem);
      return rows([chosen.particle], chosen.particle, chosen.ruleRu);
    }
  } catch { return blank(); }
  return blank();
}
