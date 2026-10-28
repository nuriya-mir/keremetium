import { ROOTS_BY_ID } from './roots';
import { CaseType, pickCaseSuffix } from './phonetics';
import { buildForm } from './form-builder';

export interface CaseVariant {
  suffix: string;
  conditionRu: string;
  examples: Array<{ stem: string; form: string; afterPossessive: '1_2' | '3' | null }>;
}

// Conditions are data, not extracted from a display formula. Each suffix is a row.
const CONDITIONS: Record<CaseType, Array<[string, string]>> = {
  genitive: [
    ['ның', 'После гласной (кроме у, и, ю) или м, н, ң; твёрдый ряд'],
    ['нің', 'После гласной (кроме у, и, ю) или м, н, ң; мягкий ряд'],
    ['дың', 'После р, л, з, ж, й, у, и, ю; твёрдый ряд'],
    ['дің', 'После р, л, з, ж, й, у, и, ю; мягкий ряд'],
    ['тың', 'После глухой согласной; твёрдый ряд'],
    ['тің', 'После глухой согласной; мягкий ряд'],
  ],
  dative: [
    ['ға', 'После гласной или согласной с голосом; твёрдый ряд'],
    ['ге', 'После гласной или согласной с голосом; мягкий ряд'],
    ['қа', 'После глухой согласной; твёрдый ряд'],
    ['ке', 'После глухой согласной; мягкий ряд'],
    ['а', 'После окончания принадлежности «мой» или «твой»; твёрдый ряд'],
    ['е', 'После окончания принадлежности «мой» или «твой»; мягкий ряд'],
    ['на', 'После окончания принадлежности третьего лица; твёрдый ряд'],
    ['не', 'После окончания принадлежности третьего лица; мягкий ряд'],
  ],
  locative: [
    ['да', 'После гласной или согласной с голосом; твёрдый ряд'],
    ['де', 'После гласной или согласной с голосом; мягкий ряд'],
    ['та', 'После глухой согласной; твёрдый ряд'],
    ['те', 'После глухой согласной; мягкий ряд'],
    ['нда', 'После окончания принадлежности третьего лица; твёрдый ряд'],
    ['нде', 'После окончания принадлежности третьего лица; мягкий ряд'],
  ],
  ablative: [
    ['дан', 'После гласной или р, л, з, ж, й, у; твёрдый ряд'],
    ['ден', 'После гласной или р, л, з, ж, й, у; мягкий ряд'],
    ['тан', 'После глухой согласной; твёрдый ряд'],
    ['тен', 'После глухой согласной; мягкий ряд'],
    ['нан', 'После м, н, ң или окончания принадлежности третьего лица; твёрдый ряд'],
    ['нен', 'После м, н, ң или окончания принадлежности третьего лица; мягкий ряд'],
  ],
  instrumental: [
    ['мен', 'После гласной или р, л, м, н, ң, й, у; не зависит от ряда гласных'],
    ['бен', 'После з или ж; не зависит от ряда гласных'],
    ['пен', 'После глухой согласной; не зависит от ряда гласных'],
  ],
  accusative: [
    ['ны', 'После гласной, кроме у, и, ю; твёрдый ряд'],
    ['ні', 'После гласной, кроме у, и, ю; мягкий ряд'],
    ['ды', 'После согласной с голосом; твёрдый ряд'],
    ['ді', 'После согласной с голосом; мягкий ряд'],
    ['ты', 'После глухой согласной; твёрдый ряд'],
    ['ті', 'После глухой согласной; мягкий ряд'],
    ['н', 'После окончания принадлежности третьего лица; не зависит от ряда гласных'],
  ],
  niki: [
    ['нікі', 'После гласной, кроме у, и, ю; не зависит от ряда гласных'],
    ['дікі', 'После согласной с голосом; не зависит от ряда гласных'],
    ['тікі', 'После глухой согласной; не зависит от ряда гласных'],
  ],
};

export function getCaseVariants(caseType: CaseType): CaseVariant[] {
  const variants = CONDITIONS[caseType].map(([suffix, conditionRu]) => ({ suffix, conditionRu, examples: [] } as CaseVariant));
  for (const root of Object.values(ROOTS_BY_ID).filter(root => root.pos === 'noun')) {
    const stems: Array<{ stem: string; afterPossessive: '1_2' | '3' | null }> = [{ stem: root.kz, afterPossessive: null }];
    if (caseType !== 'niki') {
      for (const person of ['men', 'sen', 'ol'] as const) {
        const stem = buildForm('T13_POSSESSIVE', root.id, person).afterCheck.canonicalFormKz;
        stems.push({ stem, afterPossessive: person === 'ol' ? '3' : '1_2' });
      }
    }
    for (const example of stems) {
      const selected = pickCaseSuffix(example.stem, caseType, { rowOverride: root.vowelRow, afterPossessive: example.afterPossessive });
      const variant = variants.find(row => row.suffix === selected.suffix);
      if (variant && !variant.examples.some(item => item.afterPossessive === example.afterPossessive)) {
        variant.examples.push({ ...example, form: example.stem + selected.suffix });
      }
    }
  }
  return variants;
}
