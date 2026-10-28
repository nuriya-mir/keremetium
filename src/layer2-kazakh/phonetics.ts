import {
  BoundaryMergerCapsule,
  PersonId,
  StemEndingClass,
  TenColor,
  VowelRow,
} from '../types';

/**
 * Слой 2 (часть Б): 7 математических правил казахской фонетики,
 * выбора кусочков (КБ-1 … КБ-9), «последней ступеньки» (К33) и
 * звуковых слияний на стыке в овальных капсулах (К30).
 */

export const HARD_VOWELS = new Set(['а', 'о', 'ұ', 'ы', 'я', 'ё']);
export const SOFT_VOWELS = new Set(['ә', 'е', 'ө', 'ү', 'і', 'э']);
const MIXED_VOWELS = new Set(['и', 'у', 'ю']);
const ALL_VOWELS = new Set([...HARD_VOWELS, ...SOFT_VOWELS, ...MIXED_VOWELS]);

const ZMN_CONSONANTS = new Set(['з', 'ж', 'м', 'н', 'ң']);

/** Слова, у которых ряд гласных фиксирован особо */
const WORD_ROW_OVERRIDES: Record<string, VowelRow> = {
  кітап: 'hard',
  ки: 'soft',
  жи: 'hard',
  су: 'hard',
  ту: 'hard',
  жу: 'hard',
  бу: 'hard',
  қу: 'hard',
};

/**
 * Правило 1 (КБ-1, К33 п. 1 «правило последней ступеньки»):
 * Определяет ряд гласных слова или последнего приклеенного кусочка.
 * Идёт справа налево: ищет последнюю чистую гласную (твёрдую или мягкую).
 * Если видит смешанную (и, у, ю), смотрит на гласную перед ней.
 */
export function getVowelRow(word: string): VowelRow {
  const clean = word.trim().toLowerCase();
  if (WORD_ROW_OVERRIDES[clean]) {
    return WORD_ROW_OVERRIDES[clean];
  }
  const chars = Array.from(clean);
  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i];
    if (HARD_VOWELS.has(ch)) return 'hard';
    if (SOFT_VOWELS.has(ch)) return 'soft';
  }
  // Если в коротком корне только смешанная «и» (например, ки, би) — мягкий, если «у» — твёрдый
  if (clean.includes('и')) return 'soft';
  return 'hard';
}

/**
 * Правило 2: Определяет класс последней буквы слова/основы
 * ('V' — чистая гласная; 'UI' — у, ю, и, й; 'R' — р; 'L' — л; 'ZMN' — з, ж, м, н, ң; 'VOICELESS' — остальные согласные).
 */
export function getEndingClass(word: string): StemEndingClass {
  const clean = word.trim().toLowerCase();
  const last = clean[clean.length - 1] ?? '';
  if (last === 'у' || last === 'ю' || last === 'и' || last === 'й') {
    return 'UI';
  }
  if (HARD_VOWELS.has(last) || SOFT_VOWELS.has(last)) {
    return 'V';
  }
  if (last === 'р') return 'R';
  if (last === 'л') return 'L';
  if (ZMN_CONSONANTS.has(last)) return 'ZMN';
  return 'VOICELESS';
}

/** Проверяет, заканчивается ли основа на любой звук с голосом (гласная, у/и/й, р, л, з, ж, м, н, ң) */
export function isVoicedOrVowelEnd(cls: StemEndingClass): boolean {
  return cls !== 'VOICELESS';
}

/**
 * Цвет кусочка по системе источников (К14, К28):
 * - red   — твёрдый ряд
 * - green — мягкий ряд
 * - amber — смешанные суффиксы (-у, -нікі/-дікі/-тікі, -мен/-бен/-пен)
 * - blue  — одиночные согласные кусочки (й, н)
 * - ink   — общие для обоих рядов (-м, -ң, -р, -п, ғой/қой)
 */
export function getTenColorForRow(row: VowelRow): TenColor {
  return row === 'hard' ? 'red' : 'green';
}

/**
 * Правило 4 (КБ-9, К30): Слияние и чередование букв на стыке основы и кусочка.
 * Возвращает итоговое слитное слово и, если произошло слияние, овальную капсулу!
 */
export function joinWithBoundaryMerger(
  leftWord: string,
  rightSuffix: string
): { mergedWord: string; capsule?: BoundaryMergerCapsule } {
  if (!rightSuffix) return { mergedWord: leftWord };

  const lastChar = leftWord[leftWord.length - 1];
  const firstRight = rightSuffix[0];
  const leftWithoutLast = leftWord.slice(0, -1);

  // 1. Слияние ы + й = и, і + й = и (оқы + й → оқи, оқы + йын → оқиын, тері + й → тери)
  if ((lastChar === 'ы' || lastChar === 'і') && firstRight === 'й') {
    const restRight = rightSuffix.slice(1);
    const mergedWord = leftWithoutLast + 'и' + restRight;
    return {
      mergedWord,
      capsule: {
        beforePieces: `${leftWord} + ${rightSuffix}`,
        ovalFormula: `${lastChar} + ${rightSuffix} = и${restRight}`,
        mergedResult: mergedWord,
        explanationRu: `Гласная «${lastChar}» на конце основы и «й» сливаются в одну долгую «и»: ${leftWord} + ${rightSuffix} → ${mergedWord}.`,
      },
    };
  }

  // 2. Слияние й + а = я, й + ар = яр, й + айын = яйын (қой + а → қоя)
  if (lastChar === 'й' && firstRight === 'а') {
    const restRight = rightSuffix.slice(1);
    const mergedWord = leftWithoutLast + 'я' + restRight;
    return {
      mergedWord,
      capsule: {
        beforePieces: `${leftWord} + ${rightSuffix}`,
        ovalFormula: `й + ${rightSuffix} = я${restRight}`,
        mergedResult: mergedWord,
        explanationRu: `Буква «й» на конце основы и гласная «а» записываются одной буквой «я»: ${leftWord} + ${rightSuffix} → ${mergedWord}.`,
      },
    };
  }

  // 3. Слияние с суффиксом «-у» (имя действия и темы -ушы/-уші, главы 9, 20, 21):
  // ы + у = у, і + у = у, и + у = ю, й + у = ю, қ + у = ғу, к + у = гу, п + у = бу
  if (firstRight === 'у') {
    if (lastChar === 'ы' || lastChar === 'і') {
      const mergedWord = leftWithoutLast + rightSuffix;
      return {
        mergedWord,
        capsule: {
          beforePieces: `${leftWord} + ${rightSuffix}`,
          ovalFormula: `${lastChar} + у = у`,
          mergedResult: mergedWord,
          explanationRu: `Гласная «${lastChar}» перед «у» поглощается: ${leftWord} + ${rightSuffix} → ${mergedWord}.`,
        },
      };
    }
    if (lastChar === 'й' || lastChar === 'и') {
      const restRight = rightSuffix.slice(1);
      const mergedWord = leftWithoutLast + 'ю' + restRight;
      return {
        mergedWord,
        capsule: {
          beforePieces: `${leftWord} + ${rightSuffix}`,
          ovalFormula: `${lastChar} + у = ю`,
          mergedResult: mergedWord,
          explanationRu: `Сочетание «${lastChar} + у» пишется через «ю»: ${leftWord} + ${rightSuffix} → ${mergedWord}.`,
        },
      };
    }
  }

  // 4. Озвончение п → б, қ → ғ, к → г перед любой гласной (а, ә, е, ы, і, у)
  if (ALL_VOWELS.has(firstRight)) {
    if (lastChar === 'п') {
      const mergedWord = leftWithoutLast + 'б' + rightSuffix;
      return {
        mergedWord,
        capsule: {
          beforePieces: `${leftWord} + ${rightSuffix}`,
          ovalFormula: `п + ${firstRight} = б${firstRight}`,
          mergedResult: mergedWord,
          explanationRu: `Перед гласной «${firstRight}» буква «п» на конце основы включает голос и переходит в «б»: ${leftWord} + ${rightSuffix} → ${mergedWord}.`,
        },
      };
    }
    if (lastChar === 'қ') {
      const mergedWord = leftWithoutLast + 'ғ' + rightSuffix;
      return {
        mergedWord,
        capsule: {
          beforePieces: `${leftWord} + ${rightSuffix}`,
          ovalFormula: `қ + ${firstRight} = ғ${firstRight}`,
          mergedResult: mergedWord,
          explanationRu: `Перед гласной «${firstRight}» твёрдая «қ» включает голос и переходит в «ғ»: ${leftWord} + ${rightSuffix} → ${mergedWord}.`,
        },
      };
    }
    if (lastChar === 'к') {
      const mergedWord = leftWithoutLast + 'г' + rightSuffix;
      return {
        mergedWord,
        capsule: {
          beforePieces: `${leftWord} + ${rightSuffix}`,
          ovalFormula: `к + ${firstRight} = г${firstRight}`,
          mergedResult: mergedWord,
          explanationRu: `Перед гласной «${firstRight}» мягкая «к» включает голос и переходит в «г»: ${leftWord} + ${rightSuffix} → ${mergedWord}.`,
        },
      };
    }
  }

  return { mergedWord: leftWord + rightSuffix };
}

/**
 * КБ-5 (Тема 10): Кусочек множественного числа (лар/лер, дар/дер, тар/тер)
 */
export function pickPluralSuffix(stem: string, rowOverride?: VowelRow): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
} {
  const row = rowOverride ?? getVowelRow(stem);
  const cls = getEndingClass(stem);
  const color = getTenColorForRow(row);

  // Plural selection has its own sound groups; UI is not a voiced-obstruent group.
  // Abai Institute: үй + лер; Soyle grammar: vowels and й, р, у take лар/лер.
  const last = stem.trim().toLowerCase().slice(-1);
  if (ALL_VOWELS.has(last) || last === 'й' || last === 'р') {
    const suffix = row === 'hard' ? 'лар' : 'лер';
    return {
      suffix,
      color,
      ruleRu: `После гласной или «й», «р», «у» берётся «${suffix}» (${row === 'hard' ? 'твёрдый' : 'мягкий'} ряд).`,
    };
  }
  if (cls === 'L' || cls === 'ZMN') {
    const suffix = row === 'hard' ? 'дар' : 'дер';
    return {
      suffix,
      color,
      ruleRu: `После «л, з, ж, м, н, ң» берётся «${suffix}» (${row === 'hard' ? 'твёрдый' : 'мягкий'} ряд).`,
    };
  }
  const suffix = row === 'hard' ? 'тар' : 'тер';
  return {
    suffix,
    color,
    ruleRu: `После согласной без голоса берётся «${suffix}» (${row === 'hard' ? 'твёрдый' : 'мягкий'} ряд).`,
  };
}

/**
 * КБ-2 (Тема 13): Окончания принадлежности («чьё») для всех 10 лиц.
 * Учитывает разницу между «после чистой гласной (кроме у, и)» и «после согласной или у, и».
 */
export function pickPossessiveSuffix(
  stem: string,
  person: PersonId,
  rowOverride?: VowelRow,
  /** В желании, необходимости и личной временной форме добавляет множественность также у олар; вариант выбирается по последнему звуку основы. */
  afterDesireOrInfinitive = false
): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
} {
  const row = rowOverride ?? getVowelRow(stem);
  const cls = getEndingClass(stem);
  const afterPureVowel = cls === 'V';

  if (person === 'men') {
    if (afterPureVowel) {
      return {
        suffix: 'м',
        color: 'ink',
        ruleRu: 'После чистой гласной для «я (моё)» ставится одна общая буква «-м».',
      };
    }
    const suffix = row === 'hard' ? 'ым' : 'ім';
    return {
      suffix,
      color: getTenColorForRow(row),
      ruleRu: `После согласной (а также «у, и, й») для «я (моё)» ставится «-${suffix}».`,
    };
  }

  if (person === 'sen') {
    if (afterPureVowel) {
      return {
        suffix: 'ң',
        color: 'ink',
        ruleRu: 'После чистой гласной для «ты (твоё)» ставится одна общая буква «-ң».',
      };
    }
    const suffix = row === 'hard' ? 'ың' : 'ің';
    return {
      suffix,
      color: getTenColorForRow(row),
      ruleRu: `После согласной (а также «у, и, й») для «ты (твоё)» ставится «-${suffix}».`,
    };
  }

  if (person === 'siz') {
    const suffix = afterPureVowel
      ? row === 'hard'
        ? 'ңыз'
        : 'ңіз'
      : row === 'hard'
      ? 'ыңыз'
      : 'іңіз';
    return {
      suffix,
      color: getTenColorForRow(row),
      ruleRu: `Для «Вы (Ваше)» берётся «-${suffix}» (${row === 'hard' ? 'твёрдый' : 'мягкий'} ряд).`,
    };
  }

  if (person === 'biz') {
    const suffix = afterPureVowel
      ? row === 'hard'
        ? 'мыз'
        : 'міз'
      : row === 'hard'
      ? 'ымыз'
      : 'іміз';
    return {
      suffix,
      color: getTenColorForRow(row),
      ruleRu: `Для «мы (наше)» берётся «-${suffix}» (${row === 'hard' ? 'твёрдый' : 'мягкий'} ряд).`,
    };
  }

  if (person === 'sender') {
    const pluralPart = pickPluralSuffix(stem, row).suffix;
    const possPart = row === 'hard' ? 'ың' : 'ің';
    return {
      suffix: pluralPart + possPart,
      color: getTenColorForRow(row),
      ruleRu: `Для «вы (ваше)» складываются «-${pluralPart}» и «-${possPart}».`,
    };
  }

  if (person === 'sizder') {
    const pluralPart = pickPluralSuffix(stem, row).suffix;
    const possPart = row === 'hard' ? 'ыңыз' : 'іңіз';
    return {
      suffix: pluralPart + possPart,
      color: getTenColorForRow(row),
      ruleRu: `Для «Вы (Ваше, много людей)» складываются «-${pluralPart}» и «-${possPart}».`,
    };
  }

  if ((person === 'olar' || person === 'ol_kisiler') && afterDesireOrInfinitive) {
    const pluralPart = pickPluralSuffix(stem, row).suffix;
    const possPart = row === 'hard' ? 'ы' : 'і';
    return {
      suffix: pluralPart + possPart,
      color: getTenColorForRow(row),
      ruleRu: `Для «они (их)» складываются «-${pluralPart}» и «-${possPart}».`,
    };
  }

  // 3-е лицо (ол, ол кісі, а в теме 13 также олар, ол кісілер у одиночного предмета)
  const suffix = afterPureVowel
    ? row === 'hard'
      ? 'сы'
      : 'сі'
    : row === 'hard'
    ? 'ы'
    : 'і';
  return {
    suffix,
    color: getTenColorForRow(row),
    ruleRu: `Для 3-го лица («его / её») ${afterPureVowel ? 'после гласной берётся «-' + suffix + '»' : 'после согласной (и «у, и, й») берётся «-' + suffix + '»'}.`,
  };
}

/**
 * КБ-3 (Темы 26, 28, 29, 30, 34, 35, 36, 72, 76, 105–112):
 * Полные личные окончания (-мын/-мін, -бын/-бін, -пын/-пін, -сың/-сің, -сыз/-сіз, -мыз/-міз/-быз/-біз/-пыз/-піз, -(ды)/-(ді)).
 */
export function pickFullPersonalEnding(
  stemBeforeEnding: string,
  person: PersonId,
  options?: {
    rowOverride?: VowelRow;
    /** В настояще-будущем времени (темы 26–28, 72–73) у 3-го лица в утверждении есть ды/ді, а в вопросе и в неглаголах/моментном времени — пусто */
    thirdPersonHasDyDi?: boolean;
    isQuestion?: boolean;
    /** В теме 36 (-атын/-етін) у «біз» всегда -быз/-біз (после н) */
    forceBizByz?: boolean;
  }
): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
} {
  const row = options?.rowOverride ?? getVowelRow(stemBeforeEnding);
  const cls = getEndingClass(stemBeforeEnding);
  const lastChar = stemBeforeEnding[stemBeforeEnding.length - 1];
  const color = getTenColorForRow(row);

  if (person === 'men') {
    let suffix: string;
    if (cls === 'VOICELESS') {
      suffix = row === 'hard' ? 'пын' : 'пін';
    } else if (lastChar === 'з' || lastChar === 'ж') {
      suffix = row === 'hard' ? 'бын' : 'бін';
    } else {
      suffix = row === 'hard' ? 'мын' : 'мін';
    }
    return {
      suffix,
      color,
      ruleRu: `Для «мен (я)» после «${stemBeforeEnding}» ставится «-${suffix}».`,
    };
  }

  if (person === 'sen') {
    const suffix = row === 'hard' ? 'сың' : 'сің';
    return {
      suffix,
      color,
      ruleRu: `Для «сен (ты)» ставится «-${suffix}».`,
    };
  }

  if (person === 'siz') {
    const suffix = row === 'hard' ? 'сыз' : 'сіз';
    return {
      suffix,
      color,
      ruleRu: `Для «сіз (Вы)» ставится «-${suffix}».`,
    };
  }

  if (person === 'biz') {
    let suffix: string;
    if (cls === 'VOICELESS') {
      suffix = row === 'hard' ? 'пыз' : 'піз';
    } else if (
      options?.forceBizByz ||
      lastChar === 'з' ||
      lastChar === 'ж' ||
      lastChar === 'м' ||
      lastChar === 'н' ||
      lastChar === 'ң'
    ) {
      // В глаголах после гласной/й/р (барамыз, жатырмыз, шығармыз) — мыз/міз; после з, м, н (қызбыз, баратынбыз) — быз/біз
      suffix = row === 'hard' ? 'быз' : 'біз';
    } else {
      suffix = row === 'hard' ? 'мыз' : 'міз';
    }
    return {
      suffix,
      color,
      ruleRu: `Для «біз (мы)» после «${stemBeforeEnding}» ставится «-${suffix}».`,
    };
  }

  if (person === 'sender') {
    const suffix = row === 'hard' ? 'сыңдар' : 'сіңдер';
    return {
      suffix,
      color,
      ruleRu: `Для «сендер (вы)» ставится «-${suffix}».`,
    };
  }

  if (person === 'sizder') {
    const suffix = row === 'hard' ? 'сыздар' : 'сіздер';
    return {
      suffix,
      color,
      ruleRu: `Для «сіздер (Вы)» ставится «-${suffix}».`,
    };
  }

  // 3-е лицо (ol, ol_kisi, olar, ol_kisiler)
  if (options?.thirdPersonHasDyDi && !options?.isQuestion) {
    const suffix = row === 'hard' ? 'ды' : 'ді';
    return {
      suffix,
      color,
      ruleRu: `Для 3-го лица в утверждении добавляется «-${suffix}» (в вопросе оно опускается).`,
    };
  }

  return {
    suffix: '',
    color,
    ruleRu: 'В 3-м лице дополнительного личного окончания нет.',
  };
}

/**
 * КБ-4 (Темы 31–33, 38–48, 74–75):
 * Короткие личные окончания (-м, -ң, -ңыз/-ңіз, -қ/-к, пусто, -ңдар/-ңдер, -ңыздар/-ңіздер).
 */
export function pickShortPersonalEnding(
  row: VowelRow,
  person: PersonId
): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
} {
  const color = getTenColorForRow(row);
  switch (person) {
    case 'men':
      return {
        suffix: 'м',
        color: 'ink',
        ruleRu: 'Для «мен (я)» ставится короткое «-м».',
      };
    case 'sen':
      return {
        suffix: 'ң',
        color: 'ink',
        ruleRu: 'Для «сен (ты)» ставится короткое «-ң».',
      };
    case 'siz': {
      const suffix = row === 'hard' ? 'ңыз' : 'ңіз';
      return {
        suffix,
        color,
        ruleRu: `Для «сіз (Вы)» ставится «-${suffix}».`,
      };
    }
    case 'biz': {
      const suffix = row === 'hard' ? 'қ' : 'к';
      return {
        suffix,
        color,
        ruleRu: `Для «біз (мы)» ставится одна буква «-${suffix}».`,
      };
    }
    case 'sender': {
      const suffix = row === 'hard' ? 'ңдар' : 'ңдер';
      return {
        suffix,
        color,
        ruleRu: `Для «сендер (вы)» ставится «-${suffix}».`,
      };
    }
    case 'sizder': {
      const suffix = row === 'hard' ? 'ңыздар' : 'ңіздер';
      return {
        suffix,
        color,
        ruleRu: `Для «сіздер (Вы)» ставится «-${suffix}».`,
      };
    }
    default:
      return {
        suffix: '',
        color,
        ruleRu: 'Для 3-го лица личного хвоста нет.',
      };
  }
}

/**
 * КБ-6 (Тема 9 и вопросы во всех главах):
 * Вопросительная частица ма/ме, ба/бе, па/пе по последнему слову перед ней.
 */
export function pickQuestionParticle(
  wordBeforeParticle: string,
  rowOverride?: VowelRow
): {
  particle: string;
  color: TenColor;
  ruleRu: string;
} {
  const row = rowOverride ?? getVowelRow(wordBeforeParticle);
  const cls = getEndingClass(wordBeforeParticle);
  const color = getTenColorForRow(row);

  if (cls === 'V' || cls === 'UI' || cls === 'R' || cls === 'L') {
    const particle = row === 'hard' ? 'ма' : 'ме';
    return {
      particle,
      color,
      ruleRu: `После гласной, «й, у, р, л» ставится вопросительное слово «${particle}».`,
    };
  }
  if (cls === 'ZMN') {
    const particle = row === 'hard' ? 'ба' : 'бе';
    return {
      particle,
      color,
      ruleRu: `После «з, ж, м, н, ң» ставится вопросительное слово «${particle}».`,
    };
  }
  const particle = row === 'hard' ? 'па' : 'пе';
  return {
    particle,
    color,
    ruleRu: `После согласной без голоса (например, после «жоқ», «емес», «керек», «-қ/-к») ставится «${particle}».`,
  };
}

/**
 * КБ-7: Отрицательный кусочек глагола в разных временах:
 * - 'ma'    → ма/ме, ба/бе, па/пе (приказы, прошедшее -мады, условие -маса, причастие -маған)
 * - 'mai'   → май/мей, бай/бей, пай/пей (настояще-будущее, -майтын, деепричастие)
 * - 'mas'   → мас/мес, бас/бес, пас/пес (условное 1 и предположение тем 41, 106)
 * - 'mau'   → мау/меу, бау/беу, пау/пеу (отрицание необходимости тем 94, 96, 98, 100)
 * - 'maushy'→ маушы/меуші, баушы/беуші, паушы/пеуші (тема 44)
 */
export function pickVerbNegationSuffix(
  verbStem: string,
  mode: 'ma' | 'mai' | 'mas' | 'mau' | 'maushy' = 'ma',
  rowOverride?: VowelRow
): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
} {
  const row = rowOverride ?? getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  const color = getTenColorForRow(row);

  let lead: 'м' | 'б' | 'п';
  let leadReason: string;
  if (cls === 'V' || cls === 'UI' || cls === 'R' || cls === 'L') {
    lead = 'м';
    leadReason = 'после гласной, й, у, р, л';
  } else if (cls === 'ZMN') {
    lead = 'б';
    leadReason = 'после з, ж, м, н, ң';
  } else {
    lead = 'п';
    leadReason = 'после согласной без голоса';
  }

  const vowel = row === 'hard' ? 'а' : 'е';
  let tail = '';
  if (mode === 'mai') tail = 'й';
  else if (mode === 'mas') tail = 'с';
  else if (mode === 'mau') tail = 'у';
  else if (mode === 'maushy') tail = row === 'hard' ? 'ушы' : 'уші';

  const suffix = `${lead}${vowel}${tail}`;
  return {
    suffix,
    color,
    ruleRu: `Отрицательный кусочек «-${suffix}»: буква «${lead}» (${leadReason}) + «${vowel}» (${row === 'hard' ? 'твёрдый' : 'мягкий'} ряд).`,
  };
}

/**
 * КБ-8 (Глава 2, темы 14–21): Шесть падежных окончаний и окончание «чей без предмета» (-нікі/-дікі/-тікі).
 * Учитывает тему 16 книги (зелёные кружки ①②③ после окончаний принадлежности 1-го, 2-го и 3-го лица!).
 */
export type CaseType =
  | 'genitive'     // Т.15: ның/дің/тың (чей?)
  | 'dative'       // Т.17: ға/ге/қа/ке, после принадлежности 1/2 л. → а/е, после 3 л. → на/не (кому? куда?)
  | 'locative'     // Т.18: да/де/та/те, после принадлежности 3 л. → нда/нде (у кого? где?)
  | 'ablative'     // Т.19: дан/ден/тан/тен, после м/н/ң и принадлежности 3 л. → нан/нен (откуда? от кого?)
  | 'instrumental' // Т.20: мен/бен/пен (с кем? чем?)
  | 'accusative'   // Т.21: ны/ні/ды/ді/ты/ті, после принадлежности 3 л. → н (кого? что?)
  | 'niki';        // Т.14: нікі/дікі/тікі (мой/твой без предмета)

export function pickCaseSuffix(
  word: string,
  caseType: CaseType,
  options?: {
    rowOverride?: VowelRow;
    /** Если слово УЖЕ заканчивается на окончание принадлежности: '1_2' (зелёные ①②: -м, -ң) или '3' (зелёный ③: -сы/-сі/-ы/-і) */
    afterPossessive?: '1_2' | '3' | null;
  }
): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
} {
  const row = options?.rowOverride ?? getVowelRow(word);
  const cls = getEndingClass(word);
  const lastChar = word[word.length - 1];
  const color = getTenColorForRow(row);
  const poss = options?.afterPossessive ?? null;

  // Тема 14: нікі / дікі / тікі (одинаково для твёрдых и мягких, в книге оранжево-жёлтое)
  if (caseType === 'niki') {
    if (cls === 'V') {
      return {
        suffix: 'нікі',
        color: 'amber',
        ruleRu: 'После чистой гласной (кроме у, и) ставится неизменяемое «-нікі».',
      };
    }
    if (cls === 'R' || cls === 'L' || cls === 'ZMN' || cls === 'UI') {
      return {
        suffix: 'дікі',
        color: 'amber',
        ruleRu: 'После «р, л, з, ж, м, н, ң, у, и, й» ставится неизменяемое «-дікі».',
      };
    }
    return {
      suffix: 'тікі',
      color: 'amber',
      ruleRu: 'После согласной без голоса ставится неизменяемое «-тікі».',
    };
  }

  // Тема 15: Родительный падеж (ның/нің, дың/дің, тың/тің)
  if (caseType === 'genitive') {
    if (cls === 'V' || lastChar === 'м' || lastChar === 'н' || lastChar === 'ң') {
      const suffix = row === 'hard' ? 'ның' : 'нің';
      return {
        suffix,
        color,
        ruleRu: `После чистой гласной и носовых «м, н, ң» берётся «-${suffix}».`,
      };
    }
    if (cls === 'R' || cls === 'L' || cls === 'ZMN' || cls === 'UI') {
      const suffix = row === 'hard' ? 'дың' : 'дің';
      return {
        suffix,
        color,
        ruleRu: `После «р, л, з, ж, у, и, й» берётся «-${suffix}».`,
      };
    }
    const suffix = row === 'hard' ? 'тың' : 'тің';
    return {
      suffix,
      color,
      ruleRu: `После согласной без голоса берётся «-${suffix}».`,
    };
  }

  // Тема 17: Направительный падеж (кому? куда?): ға/ге, қа/ке, а/е (зелёные ①②), на/не (зелёный ③)
  if (caseType === 'dative') {
    if (poss === '1_2') {
      const suffix = row === 'hard' ? 'а' : 'е';
      return {
        suffix,
        color,
        ruleRu: `После кусочка принадлежности «мой (-м)» или «твой (-ң)» берётся короткое «-${suffix}» (зелёный значок ①②).`,
      };
    }
    if (poss === '3') {
      const suffix = row === 'hard' ? 'на' : 'не';
      return {
        suffix,
        color,
        ruleRu: `После кусочка принадлежности 3-го лица («его -сы/-сі/-ы/-і») берётся «-${suffix}» (зелёный значок ③).`,
      };
    }
    if (cls === 'VOICELESS') {
      const suffix = row === 'hard' ? 'қа' : 'ке';
      return {
        suffix,
        color,
        ruleRu: `После согласной без голоса берётся «-${suffix}».`,
      };
    }
    const suffix = row === 'hard' ? 'ға' : 'ге';
    return {
      suffix,
      color,
      ruleRu: `После гласной и звонких/сонорных берётся «-${suffix}».`,
    };
  }

  // Тема 18: Местный падеж (у кого? где?): да/де, та/те, нда/нде (зелёный ③)
  if (caseType === 'locative') {
    if (poss === '3') {
      const suffix = row === 'hard' ? 'нда' : 'нде';
      return {
        suffix,
        color,
        ruleRu: `После кусочка принадлежности 3-го лица («его -сы/-сі/-ы/-і») появляется буква «н»: «-${suffix}» (зелёный значок ③).`,
      };
    }
    if (cls === 'VOICELESS') {
      const suffix = row === 'hard' ? 'та' : 'те';
      return {
        suffix,
        color,
        ruleRu: `После согласной без голоса берётся «-${suffix}».`,
      };
    }
    const suffix = row === 'hard' ? 'да' : 'де';
    return {
      suffix,
      color,
      ruleRu: `После гласной и звонких/сонорных берётся «-${suffix}».`,
    };
  }

  // Тема 19: Исходный падеж (откуда? от кого?): дан/ден, тан/тен, нан/нен (после м, н, ң и зелёного ③)
  if (caseType === 'ablative') {
    if (poss === '3' || lastChar === 'м' || lastChar === 'н' || lastChar === 'ң') {
      const suffix = row === 'hard' ? 'нан' : 'нен';
      return {
        suffix,
        color,
        ruleRu: `После носовых «м, н, ң» и после принадлежности 3-го лица берётся «-${suffix}».`,
      };
    }
    if (cls === 'VOICELESS') {
      const suffix = row === 'hard' ? 'тан' : 'тен';
      return {
        suffix,
        color,
        ruleRu: `После согласной без голоса берётся «-${suffix}».`,
      };
    }
    const suffix = row === 'hard' ? 'дан' : 'ден';
    return {
      suffix,
      color,
      ruleRu: `После гласной и «р, л, з, ж, й, у» берётся «-${suffix}».`,
    };
  }

  // Тема 20: Совместно-инструментальный падеж (с кем? чем?): мен / бен / пен (один ряд, amber)
  if (caseType === 'instrumental') {
    if (cls === 'VOICELESS') {
      return {
        suffix: 'пен',
        color: 'amber',
        ruleRu: 'После согласной без голоса ставится неизменяемое «-пен».',
      };
    }
    if (lastChar === 'з' || lastChar === 'ж') {
      return {
        suffix: 'бен',
        color: 'amber',
        ruleRu: 'После «з, ж» ставится неизменяемое «-бен».',
      };
    }
    return {
      suffix: 'мен',
      color: 'amber',
      ruleRu: 'После гласной и «р, л, м, н, ң, й, у» ставится неизменяемое «-мен».',
    };
  }

  // Тема 21: Винительный падеж (кого? что?): ны/ні, ды/ді, ты/ті, н (зелёный ③)
  if (poss === '3') {
    return {
      suffix: 'н',
      color: 'blue',
      ruleRu: 'После кусочка принадлежности 3-го лица («его -сы/-сі/-ы/-і») винительный падеж — одна синяя буква «-н» (зелёный значок ③).',
    };
  }
  if (cls === 'V') {
    const suffix = row === 'hard' ? 'ны' : 'ні';
    return {
      suffix,
      color,
      ruleRu: `После чистой гласной (кроме у, и) берётся «-${suffix}».`,
    };
  }
  if (cls === 'R' || cls === 'L' || cls === 'ZMN' || cls === 'UI') {
    const suffix = row === 'hard' ? 'ды' : 'ді';
    return {
      suffix,
      color,
      ruleRu: `После «р, л, з, ж, м, н, ң, у, и, й» берётся «-${suffix}».`,
    };
  }
  const suffix = row === 'hard' ? 'ты' : 'ті';
  return {
    suffix,
    color,
    ruleRu: `После согласной без голоса берётся «-${suffix}».`,
  };
}
