import { actionReferenceRows } from './action';
import { buildPresenceForm, isPresenceTopic } from './presence';
import { buildNominalForm } from './nominal-builder';
import { isNominalTopic } from './nominal-lexicon';
import {
  AfterCheckView,
  BeforeCheckView,
  BoundaryMergerCapsule,
  BuiltFormResult,
  ChoiceOption,
  ColoredSegment,
  KazakhRoot,
  PersonId,
  TenColor,
  VowelRow,
} from '../types';
import {
  CaseType,
  getEndingClass,
  getTenColorForRow,
  getVowelRow,
  isVoicedOrVowelEnd,
  joinWithBoundaryMerger,
  pickCaseSuffix,
  pickFullPersonalEnding,
  pickPluralSuffix,
  pickPossessiveSuffix,
  pickQuestionParticle,
  pickShortPersonalEnding,
  pickVerbNegationSuffix,
} from './phonetics';
import { PERSONS, ROOTS_BY_ID } from './roots';
import { FORMULAS_BY_ID } from '../layer1-meanings/formulas';

/**
 * Слой 2 (часть В): 7-шаговый детерминированный сборщик форм (К19, К28, К30, К33, К38).
 *
 * По паспорту любого корня, лица и идентификатора формулы строит:
 * - Фазу А («До ответа»): монохромную заготовку, варианты кнопок с объяснениями и многошаговые пропуски;
 * - Фазу Б («После проверки»): послоговую раскраску источников, овальную капсулу слияния на стыке (если есть),
 *   скобочные необязательные слова (менің / мен / егер / мүмкін) и все допустимые синонимичные ответы.
 */

// ============================================================================
// 1. Вспомогательные функции выбора видовых и модальных кусочков (Главы 3–25)
// ============================================================================

function ensureInPool(correctPiece: string, basePool: string[]): string[] {
  if (basePool.includes(correctPiece)) return basePool;
  return [correctPiece, ...basePool.slice(0, 5)];
}

/** Кусочек желания -ғы/-гі/-қы/-кі (Глава 14, темы 83–88) */
export function pickDesireGhySuffix(verbStem: string): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
  options: ChoiceOption[];
} {
  const row = getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  const voiced = isVoicedOrVowelEnd(cls);
  const suffix =
    row === 'hard' ? (voiced ? 'ғы' : 'қы') : voiced ? 'гі' : 'кі';
  const color = getTenColorForRow(row);

  const allFour: Array<{ val: string; r: VowelRow; v: boolean }> = [
    { val: 'ғы', r: 'hard', v: true },
    { val: 'гі', r: 'soft', v: true },
    { val: 'қы', r: 'hard', v: false },
    { val: 'кі', r: 'soft', v: false },
  ];

  const options: ChoiceOption[] = allFour.map((item) => {
    const isCorrect = item.val === suffix;
    let reasonRu: string;
    if (isCorrect) {
      reasonRu = `Верно: «${verbStem}» — ${row === 'hard' ? 'твёрдый' : 'мягкий'} ряд, на конце звук ${voiced ? 'с голосом (или гласная)' : 'без голоса'} → «-${suffix}».`;
    } else if (item.r !== row && item.v !== voiced) {
      reasonRu = `Не подходит ни по ряду гласных («${item.val}» — ${item.r === 'hard' ? 'твёрдый' : 'мягкий'}), ни по глухости/звонкости.`;
    } else if (item.r !== row) {
      reasonRu = `Не подходит по ряду гласных: основа «${verbStem}» ${row === 'hard' ? 'твёрдая' : 'мягкая'}, а «-${item.val}» — ${item.r === 'hard' ? 'твёрдый' : 'мягкий'} кусочек.`;
    } else {
      reasonRu = `Ряд верный (${row === 'hard' ? 'твёрдый' : 'мягкий'}), но на конце «${verbStem}» звук ${voiced ? 'с голосом → нужна звонкая буква (ғ/г)' : 'без голоса → нужна глухая буква (қ/к)'}.`;
    }
    return { value: item.val, isCorrect, reasonRu };
  });

  return {
    suffix,
    color,
    ruleRu: `Основа «${verbStem}» (${row === 'hard' ? 'твёрдая' : 'мягкая'}, на конце ${voiced ? 'звук с голосом' : 'глухая согласная'}) требует кусочка желания «-${suffix}».`,
    options,
  };
}

/** Кусочек настояще-будущего времени и деепричастия -а/-е/-й (Главы 4, 12, 13) */
export function pickPresentAEYSuffix(verbStem: string): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
  options: ChoiceOption[];
} {
  const row = getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  const afterVowel = cls === 'V';
  const suffix = afterVowel ? 'й' : row === 'hard' ? 'а' : 'е';
  const color: TenColor = afterVowel ? 'blue' : getTenColorForRow(row);

  const options: ChoiceOption[] = [
    {
      value: 'а',
      isCorrect: suffix === 'а',
      reasonRu:
        suffix === 'а'
          ? `Верно: после согласной в твёрдом слове «${verbStem}» ставится «-а».`
          : afterVowel
          ? `После гласной на конце «${verbStem}» ставится согласная «-й», а не «-а».`
          : `Слово «${verbStem}» мягкое, поэтому вместо твёрдой «-а» нужна «-е».`,
    },
    {
      value: 'е',
      isCorrect: suffix === 'е',
      reasonRu:
        suffix === 'е'
          ? `Верно: после согласной в мягком слове «${verbStem}» ставится «-е».`
          : afterVowel
          ? `После гласной на конце «${verbStem}» ставится согласная «-й», а не «-е».`
          : `Слово «${verbStem}» твёрдое, поэтому вместо мягкой «-е» нужна «-а».`,
    },
    {
      value: 'й',
      isCorrect: suffix === 'й',
      reasonRu:
        suffix === 'й'
          ? `Верно: основа «${verbStem}» заканчивается на гласную, поэтому ставится «-й».`
          : `Основа «${verbStem}» заканчивается на согласную, поэтому нужна гласная «-${suffix}», а не «-й».`,
    },
  ];

  return {
    suffix,
    color,
    ruleRu: afterVowel
      ? `После гласной на конце «${verbStem}» ставится «-й».`
      : `После согласной в ${row === 'hard' ? 'твёрдом' : 'мягком'} слове «${verbStem}» ставится «-${suffix}».`,
    options,
  };
}

/** Кусочек прошедшего времени -ды/-ді/-ты/-ті (Тема 31) */
export function pickPastDySuffix(verbStem: string): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
  options: ChoiceOption[];
} {
  const row = getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  const voiced = isVoicedOrVowelEnd(cls);
  const suffix =
    row === 'hard' ? (voiced ? 'ды' : 'ты') : voiced ? 'ді' : 'ті';
  const color = getTenColorForRow(row);

  const options: ChoiceOption[] = ['ды', 'ді', 'ты', 'ті'].map((val) => ({
    value: val,
    isCorrect: val === suffix,
    reasonRu:
      val === suffix
        ? `Верно: «${verbStem}» — ${row === 'hard' ? 'твёрдая' : 'мягкая'} основа, на конце звук ${voiced ? 'с голосом' : 'без голоса'} → «-${suffix}».`
        : `Для основы «${verbStem}» нужен кусочек «-${suffix}».`,
  }));

  return {
    suffix,
    color,
    ruleRu: `В прошедшем времени после «${verbStem}» берётся «-${suffix}».`,
    options,
  };
}

/** Кусочек причастия прошедшего времени -ған/-ген/-қан/-кен (Темы 34, 35, 49–51, 107, 113–128) */
export function pickParticipleGanSuffix(verbStem: string): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
  options: ChoiceOption[];
} {
  const row = getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  const voiced = isVoicedOrVowelEnd(cls);
  const suffix =
    row === 'hard' ? (voiced ? 'ған' : 'қан') : voiced ? 'ген' : 'кен';
  const color = getTenColorForRow(row);

  const options: ChoiceOption[] = ['ған', 'ген', 'қан', 'кен'].map((val) => ({
    value: val,
    isCorrect: val === suffix,
    reasonRu:
      val === suffix
        ? `Верно: «${verbStem}» — ${row === 'hard' ? 'твёрдая' : 'мягкая'} основа, на конце звук ${voiced ? 'с голосом' : 'без голоса'} → «-${suffix}».`
        : `Для основы «${verbStem}» нужен кусочек «-${suffix}».`,
  }));

  return {
    suffix,
    color,
    ruleRu: `После «${verbStem}» выбирается «-${suffix}».`,
    options,
  };
}

/** Кусочек привычного действия -атын/-етін/-йтын/-йтін (Темы 36, 51, 107, 114) */
export function pickHabitualAtynSuffix(verbStem: string): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
  options: ChoiceOption[];
} {
  const row = getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  const afterVowel = cls === 'V';
  const suffix = afterVowel
    ? row === 'hard'
      ? 'йтын'
      : 'йтін'
    : row === 'hard'
    ? 'атын'
    : 'етін';
  const color = getTenColorForRow(row);

  const options: ChoiceOption[] = ['атын', 'етін', 'йтын', 'йтін'].map(
    (val) => ({
      value: val,
      isCorrect: val === suffix,
      reasonRu:
        val === suffix
          ? `Верно: после «${verbStem}» берётся «-${suffix}».`
          : `Для «${verbStem}» нужен кусочек «-${suffix}».`,
    })
  );

  return {
    suffix,
    color,
    ruleRu: `После «${verbStem}» выбирается кусочек «-${suffix}».`,
    options,
  };
}

/** Кусочек предположения и мягкого условия -ар/-ер/-р (Темы 40, 105) */
export function pickAoristArSuffix(verbStem: string): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
  options: ChoiceOption[];
} {
  const row = getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  const afterVowel = cls === 'V';
  const suffix = afterVowel ? 'р' : row === 'hard' ? 'ар' : 'ер';
  const color: TenColor = afterVowel ? 'ink' : getTenColorForRow(row);

  const options: ChoiceOption[] = ['ар', 'ер', 'р'].map((val) => ({
    value: val,
    isCorrect: val === suffix,
    reasonRu:
      val === suffix
        ? `Верно: после «${verbStem}» ставится «-${suffix}».`
        : `Для «${verbStem}» нужен кусочек «-${suffix}».`,
  }));

  return {
    suffix,
    color,
    ruleRu: afterVowel
      ? `После гласной на конце «${verbStem}» ставится одна буква «-р».`
      : `После согласной в ${row === 'hard' ? 'твёрдом' : 'мягком'} слове «${verbStem}» ставится «-${suffix}».`,
    options,
  };
}

/** Кусочек условия -са/-се (Темы 46–48, 75, 88) */
export function pickConditionalSaSuffix(verbStem: string): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
  options: ChoiceOption[];
} {
  const row = getVowelRow(verbStem);
  const suffix = row === 'hard' ? 'са' : 'се';
  const color = getTenColorForRow(row);
  return {
    suffix,
    color,
    ruleRu: `В ${row === 'hard' ? 'твёрдом' : 'мягком'} слове «${verbStem}» условие — «-${suffix}».`,
    options: [
      {
        value: 'са',
        isCorrect: suffix === 'са',
        reasonRu:
          suffix === 'са'
            ? `Верно: «${verbStem}» — твёрдая основа → «-са».`
            : `Основа «${verbStem}» мягкая → нужно «-се».`,
      },
      {
        value: 'се',
        isCorrect: suffix === 'се',
        reasonRu:
          suffix === 'се'
            ? `Верно: «${verbStem}» — мягкая основа → «-се».`
            : `Основа «${verbStem}» твёрдая → нужно «-са».`,
      },
    ],
  };
}

/** Кусочек 1-го лица побуждения и намерения -айын/-ейін/-йын/-йін и -айық/-ейік/-йық/-йік (Темы 22, 24, 89–92) */
export function pickOptativeAiynSuffix(
  verbStem: string,
  plural = false
): {
  suffix: string;
  color: TenColor;
  ruleRu: string;
  options: ChoiceOption[];
} {
  const row = getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  const afterVowel = cls === 'V';
  const suffix = plural
    ? afterVowel
      ? row === 'hard'
        ? 'йық'
        : 'йік'
      : row === 'hard'
      ? 'айық'
      : 'ейік'
    : afterVowel
    ? row === 'hard'
      ? 'йын'
      : 'йін'
    : row === 'hard'
    ? 'айын'
    : 'ейін';
  const color = getTenColorForRow(row);
  const pool = plural
    ? ['айық', 'ейік', 'йық', 'йік']
    : ['айын', 'ейін', 'йын', 'йін'];

  return {
    suffix,
    color,
    ruleRu: `После «${verbStem}» выбирается «-${suffix}».`,
    options: pool.map((val) => ({
      value: val,
      isCorrect: val === suffix,
      reasonRu:
        val === suffix
          ? `Верно: для «${verbStem}» подходит «-${suffix}».`
          : `Для «${verbStem}» нужен вариант «-${suffix}».`,
    })),
  };
}

/** Кусочек деепричастия -ып/-іп/-п (Глава 13, темы 80–82) */
export function pickGerundYpSuffix(verbStem: string): {
  suffix: string;
  color: TenColor;
  mergedStem: string;
  capsule?: BoundaryMergerCapsule;
  ruleRu: string;
} {
  const row = getVowelRow(verbStem);
  const cls = getEndingClass(verbStem);
  // Особое исключение книги (Тема 80): жап → жауып, тап → тауып, шап → шауып, қап → қауып
  if (
    verbStem === 'тап' ||
    verbStem === 'жап' ||
    verbStem === 'шап' ||
    verbStem === 'қап'
  ) {
    const prefix = verbStem.slice(0, -1);
    const mergedStem = `${prefix}уып`;
    return {
      suffix: 'ып',
      color: 'red',
      mergedStem,
      capsule: {
        beforePieces: `${verbStem} + ып`,
        ovalFormula: 'п + ып = уып',
        mergedResult: mergedStem,
        explanationRu: `Особое чередование в четырёх коротких глаголах (тап, жап, шап, қап): перед «-ып» буква «п» переходит в «у» → ${mergedStem}.`,
      },
      ruleRu: `В глаголе «${verbStem}» перед «-ып» происходит особое чередование «п → у»: ${mergedStem}.`,
    };
  }

  // Также тебу → теуіп, себу → сеуіп
  if (verbStem === 'теп' || verbStem === 'сеп') {
    const prefix = verbStem.slice(0, -1);
    const mergedStem = `${prefix}уіп`;
    return {
      suffix: 'іп',
      color: 'green',
      mergedStem,
      capsule: {
        beforePieces: `${verbStem} + іп`,
        ovalFormula: 'п + іп = уіп',
        mergedResult: mergedStem,
        explanationRu: `В глаголе «${verbStem}» перед «-іп» буква «п» переходит в «у» → ${mergedStem}.`,
      },
      ruleRu: `В глаголе «${verbStem}» перед «-іп» буква «п» переходит в «у»: ${mergedStem}.`,
    };
  }

  if (cls === 'V') {
    return {
      suffix: 'п',
      color: 'ink',
      mergedStem: `${verbStem}п`,
      ruleRu: `После чистой гласной на конце «${verbStem}» ставится одна буква «-п».`,
    };
  }

  const suffix = row === 'hard' ? 'ып' : 'іп';
  const joined = joinWithBoundaryMerger(verbStem, suffix);
  return {
    suffix,
    color: getTenColorForRow(row),
    mergedStem: joined.mergedWord,
    capsule: joined.capsule,
    ruleRu: `После согласной (и «у, и, й») в ${row === 'hard' ? 'твёрдом' : 'мягком'} слове «${verbStem}» ставится «-${suffix}».`,
  };
}

// ============================================================================
// 2. Главный 7-шаговый сборщик формы по ID формулы, корню и лицу
// ============================================================================

export function buildForm(
  formulaId: string,
  rootId: string,
  person: PersonId = 'men'
): BuiltFormResult {
  if (formulaId !== 'T15_GENITIVE' && !Object.prototype.hasOwnProperty.call(FORMULAS_BY_ID, formulaId)) {
    throw new RangeError(`Unknown formulaId: ${formulaId}`);
  }
  if (!Object.prototype.hasOwnProperty.call(ROOTS_BY_ID, rootId)) {
    throw new RangeError(`Unknown rootId: ${rootId}`);
  }
  const root: KazakhRoot = ROOTS_BY_ID[rootId];
  if (!Object.prototype.hasOwnProperty.call(PERSONS, person)) {
    throw new RangeError(`Unknown person: ${person}`);
  }
  if (isNominalTopic(formulaId)) return buildNominalForm(formulaId, rootId, person);
  if (isPresenceTopic(formulaId)) return buildPresenceForm(formulaId, rootId, person);
  const personMeta = PERSONS[person];
  const personHint = `${personMeta.pronounKz} — ${personMeta.labelRu}`;
  const rootTranslationHint = `${root.kz} — ${root.ru}`;
  const sourceBadge =
    'Собрано по правилу темы из базового словаря тренажёра';

  // --------------------------------------------------------------------------
  // ГЛАВА 14: ЖЕЛАНИЕ «ХОЧУ СДЕЛАТЬ» (Темы 83, 84, 86, 88)
  // --------------------------------------------------------------------------
  if (
    formulaId === 'T83_WANT_PRESENT' ||
    formulaId === 'T84_WANT_NEG' ||
    formulaId === 'T86_WANT_PAST' ||
    formulaId === 'T88_WANT_COND'
  ) {
    const desire = pickDesireGhySuffix(root.kz);
    const stemWithGhy = root.kz + desire.suffix;
    const poss = pickPossessiveSuffix(stemWithGhy, person, root.vowelRow, true);
    const mainWord = stemWithGhy + poss.suffix;

    let auxWord = 'келеді';
    let auxGloss = 'приходит (сейчас)';
    let sentenceType: 'affirmative' | 'negative' | 'question' = 'affirmative';
    let topicNumber = 83;
    let promptVerbRu = 'хочу';

    if (formulaId === 'T84_WANT_NEG') {
      auxWord = 'келмейді';
      auxGloss = 'не приходит';
      sentenceType = 'negative';
      topicNumber = 84;
      promptVerbRu = 'не хочу';
    } else if (formulaId === 'T86_WANT_PAST') {
      auxWord = 'келді';
      auxGloss = 'пришло (тогда)';
      topicNumber = 86;
      promptVerbRu = 'хотел(а)';
    } else if (formulaId === 'T88_WANT_COND') {
      auxWord = 'келсе';
      auxGloss = 'если придёт';
      topicNumber = 88;
      promptVerbRu = 'если захочу';
    }

    const promptMap: Record<PersonId, string> = {
      men:
        formulaId === 'T83_WANT_PRESENT'
          ? `Я хочу ${root.ruGloss ?? root.ru}`
          : formulaId === 'T84_WANT_NEG'
          ? `Я не хочу ${root.ruGloss ?? root.ru}`
          : formulaId === 'T86_WANT_PAST'
          ? `Я хотел(а) ${root.ruGloss ?? root.ru}`
          : `Если я захочу ${root.ruGloss ?? root.ru}`,
      sen:
        formulaId === 'T83_WANT_PRESENT'
          ? `Ты хочешь ${root.ruGloss ?? root.ru}`
          : formulaId === 'T84_WANT_NEG'
          ? `Ты не хочешь ${root.ruGloss ?? root.ru}`
          : formulaId === 'T86_WANT_PAST'
          ? `Ты хотел(а) ${root.ruGloss ?? root.ru}`
          : `Если ты захочешь ${root.ruGloss ?? root.ru}`,
      siz:
        formulaId === 'T83_WANT_PRESENT'
          ? `Вы хотите ${root.ruGloss ?? root.ru}`
          : formulaId === 'T84_WANT_NEG'
          ? `Вы не хотите ${root.ruGloss ?? root.ru}`
          : formulaId === 'T86_WANT_PAST'
          ? `Вы хотели ${root.ruGloss ?? root.ru}`
          : `Если Вы захотите ${root.ruGloss ?? root.ru}`,
      biz:
        formulaId === 'T83_WANT_PRESENT'
          ? `Мы хотим ${root.ruGloss ?? root.ru}`
          : formulaId === 'T84_WANT_NEG'
          ? `Мы не хотим ${root.ruGloss ?? root.ru}`
          : formulaId === 'T86_WANT_PAST'
          ? `Мы хотели ${root.ruGloss ?? root.ru}`
          : `Если мы захотим ${root.ruGloss ?? root.ru}`,
      ol:
        formulaId === 'T83_WANT_PRESENT'
          ? `Он / она хочет ${root.ruGloss ?? root.ru}`
          : formulaId === 'T84_WANT_NEG'
          ? `Он / она не хочет ${root.ruGloss ?? root.ru}`
          : formulaId === 'T86_WANT_PAST'
          ? `Он / она хотел(а) ${root.ruGloss ?? root.ru}`
          : `Если он / она захочет ${root.ruGloss ?? root.ru}`,
      ol_kisi: `Он / она (уважительно) ${promptVerbRu} ${root.ruGloss ?? root.ru}`,
      sender:
        formulaId === 'T83_WANT_PRESENT'
          ? `Вы (все) хотите ${root.ruGloss ?? root.ru}`
          : `Вы (все) ${promptVerbRu} ${root.ruGloss ?? root.ru}`,
      sizder:
        formulaId === 'T83_WANT_PRESENT'
          ? `Вы (все, уважительно) хотите ${root.ruGloss ?? root.ru}`
          : `Вы (все, уважительно) ${promptVerbRu} ${root.ruGloss ?? root.ru}`,
      olar:
        formulaId === 'T83_WANT_PRESENT'
          ? `Они хотят ${root.ruGloss ?? root.ru}`
          : `Они ${promptVerbRu} ${root.ruGloss ?? root.ru}`,
      ol_kisiler: `Они (уважительно) ${promptVerbRu} ${root.ruGloss ?? root.ru}`,
    };

    const canonicalFormKz = `${mainWord} ${auxWord}`;
    const fullFormWithBracketsKz = `${personMeta.genitiveKz} ${canonicalFormKz}`;
    const acceptedFormsKz = [canonicalFormKz, fullFormWithBracketsKz];

    // В теме 83 также равнозначна форма с «келіп тұр» («прямо сейчас хочется»)
    if (formulaId === 'T83_WANT_PRESENT') {
      acceptedFormsKz.push(`${mainWord} келіп тұр`);
      acceptedFormsKz.push(`${personMeta.genitiveKz} ${mainWord} келіп тұр`);
    }

    const coloredSegments: ColoredSegment[] = [
      {
        text: `(${personMeta.genitiveKz})`,
        color: getTenColorForRow(getVowelRow(personMeta.genitiveKz)),
        glossRu: 'чьё желание (можно опустить)',
        role: 'pronoun',
        isOptionalBracket: true,
      },
      {
        text: root.kz,
        color: getTenColorForRow(root.vowelRow),
        glossRu: root.ru,
        role: 'root',
      },
      {
        text: desire.suffix,
        color: desire.color,
        glossRu: 'желание сделать',
        role: 'suffix',
        coreBlockId: 'KB-1',
      },
      {
        text: poss.suffix,
        color: poss.color,
        glossRu: `чей хвост (${personMeta.labelRu})`,
        role: 'core_block',
        coreBlockId: 'KB-2',
      },
      {
        text: auxWord,
        color: 'green',
        glossRu: auxGloss,
        role: 'auxiliary',
      },
    ];

    const beforeCheck: BeforeCheckView = {
      promptRu: promptMap[person],
      personHint,
      monochromeStemDisplay: `${root.kz} + [ ___ ] + ${poss.suffix} ${auxWord}`,
      rootTranslationHint,
      stage1Options: desire.options,
      multiStepBlanks: [
        {
          stepIndex: 1,
          stepTitleRu: 'Шаг 1 из 2: кусочек желания (-ғы / -гі / -қы / -кі)',
          stemDisplay: `${root.kz} + [ ___ ] + ${poss.suffix} ${auxWord}`,
          correctPiece: desire.suffix,
          options: desire.options,
        },
        {
          stepIndex: 2,
          stepTitleRu: 'Шаг 2 из 2: личный хвост принадлежности («чьё желание»)',
          stemDisplay: `${root.kz}${desire.suffix} + [ ___ ] ${auxWord}`,
          correctPiece: poss.suffix,
          options: ['м', 'ң', 'ңыз', 'ңіз', 'мыз', 'міз', 'сы', 'сі'].map(
            (val) => ({
              value: val,
              isCorrect: val === poss.suffix,
              reasonRu:
                val === poss.suffix
                  ? poss.ruleRu
                  : `Для лица «${personMeta.pronounKz}» после «-${desire.suffix}» нужен хвост «-${poss.suffix}».`,
            })
          ),
        },
      ],
    };

    const afterCheck: AfterCheckView = {
      canonicalFormKz,
      fullFormWithBracketsKz,
      acceptedFormsKz,
      coloredSegments,
      formulaChainText: `${root.kz} + ${desire.suffix} + ${poss.suffix} + ${auxWord} → ${canonicalFormKz}`,
      literalMeaningRu: `Буквально: «(${personMeta.genitiveKz}) моё/твоё желание-${root.ruGloss ?? root.ru} ${auxGloss}» (← обратный порядок: чьё желание ставится в начале).`,
      selectionRuleSummaryRu: `${desire.ruleRu} ${poss.ruleRu}`,
      sourceBadge,
    };

    return {
      formulaId,
      topicNumber,
      rootId: root.id,
      person,
      sentenceType,
      beforeCheck,
      afterCheck,
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 4: НАСТОЯЩЕ-БУДУЩЕЕ ВРЕМЯ (-а/-е/-й, -май/-мей, вопрос) (Темы 26–28)
  // --------------------------------------------------------------------------
  if (
    formulaId === 'T26_PRES_FUT_AFF' ||
    formulaId === 'T27_PRES_FUT_NEG' ||
    formulaId === 'T28_PRES_FUT_Q'
  ) {
    if (formulaId === 'T27_PRES_FUT_NEG') {
      const neg = pickVerbNegationSuffix(root.kz, 'mai');
      const stemAfterNeg = root.kz + neg.suffix;
      const pers = pickFullPersonalEnding(stemAfterNeg, person, {
        rowOverride: root.vowelRow,
        thirdPersonHasDyDi: true,
      });
      const canonicalFormKz = stemAfterNeg + pers.suffix;
      const fullFormWithBracketsKz = `${personMeta.pronounKz} ${canonicalFormKz}`;

      return {
        formulaId,
        topicNumber: 27,
        rootId: root.id,
        person,
        sentenceType: 'negative',
        beforeCheck: {
          promptRu: `${personMeta.pronounKz} (${personMeta.labelRu}) не ${root.ru} (обычно / завтра)`,
          personHint,
          monochromeStemDisplay: `${root.kz} + [ ___ ] + ${pers.suffix}`,
          rootTranslationHint,
          stage1Options: actionReferenceRows(formulaId).map(option => ({ value: option.value, isCorrect: option.value === neg.suffix, reasonRu: option.condition })),
          multiStepBlanks: [
            { stepIndex: 1, stepTitleRu: 'Шаг 1 из 2: отрицание действия', stemDisplay: `${root.kz} + [ ___ ] + ${pers.suffix}`, correctPiece: neg.suffix,
              options: actionReferenceRows(formulaId).map(option => ({ value: option.value, isCorrect: option.value === neg.suffix, reasonRu: option.condition })) },
            { stepIndex: 2, stepTitleRu: 'Шаг 2 из 2: личное окончание', stemDisplay: `${stemAfterNeg} + [ ___ ]`, correctPiece: pers.suffix,
              options: [{ value: pers.suffix, isCorrect: true, reasonRu: pers.ruleRu }] },
          ],
        },
        afterCheck: {
          canonicalFormKz,
          fullFormWithBracketsKz,
          acceptedFormsKz: [canonicalFormKz, fullFormWithBracketsKz],
          coloredSegments: [
            {
              text: `(${personMeta.pronounKz})`,
              color: getTenColorForRow(getVowelRow(personMeta.pronounKz)),
              glossRu: personMeta.labelRu,
              role: 'pronoun',
              isOptionalBracket: true,
            },
            {
              text: root.kz,
              color: getTenColorForRow(root.vowelRow),
              glossRu: root.ru,
              role: 'root',
            },
            {
              text: neg.suffix,
              color: neg.color,
              glossRu: 'не (в настояще-будущем)',
              role: 'core_block',
              coreBlockId: 'KB-7',
            },
            ...(pers.suffix
              ? [
                  {
                    text: pers.suffix,
                    color: pers.color,
                    glossRu: personMeta.labelRu,
                    role: 'core_block' as const,
                    coreBlockId: 'KB-3' as const,
                  },
                ]
              : []),
          ],
          formulaChainText: `${root.kz} + ${neg.suffix}${pers.suffix ? ' + ' + pers.suffix : ''} → ${canonicalFormKz}`,
          literalMeaningRu: `Отрицание в настояще-будущем времени: корень «${root.kz}» + отрицательный кусочек «-${neg.suffix}» + личный хвост «-${pers.suffix}».`,
          selectionRuleSummaryRu: `${neg.ruleRu} ${pers.ruleRu}`,
          sourceBadge,
        },
      };
    }

    // Утверждение (T26) и Вопрос (T28)
    const isQuestion = formulaId === 'T28_PRES_FUT_Q';
    const aey = pickPresentAEYSuffix(root.kz);
    const joinedStem = joinWithBoundaryMerger(root.kz, aey.suffix);
    const pers = pickFullPersonalEnding(joinedStem.mergedWord, person, {
      rowOverride: root.vowelRow,
      thirdPersonHasDyDi: true,
      isQuestion,
    });
    const wordWithPerson = joinedStem.mergedWord + pers.suffix;
    const qPart = isQuestion
      ? pickQuestionParticle(wordWithPerson, root.vowelRow)
      : null;

    const canonicalFormKz = isQuestion
      ? `${wordWithPerson} ${qPart!.particle}`
      : wordWithPerson;
    const fullFormWithBracketsKz = `${personMeta.pronounKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: isQuestion ? 28 : 26,
      rootId: root.id,
      person,
      sentenceType: isQuestion ? 'question' : 'affirmative',
      beforeCheck: {
        promptRu: isQuestion
          ? `${personMeta.pronounKz} (${personMeta.labelRu}) ${root.ru}?`
          : `${personMeta.pronounKz} (${personMeta.labelRu}) ${root.ru} (вообще / завтра)`,
        personHint,
        monochromeStemDisplay: isQuestion
          ? `${wordWithPerson} [ ___ ]?`
          : `${root.kz} + [ ___ ] + ${pers.suffix}`,
        rootTranslationHint,
        stage1Options: actionReferenceRows(formulaId).map(option => ({ value: option.value, isCorrect: option.value === (isQuestion ? qPart!.particle : aey.suffix), reasonRu: option.condition })),
        multiStepBlanks: isQuestion ? [
          { stepIndex: 1, stepTitleRu: 'Вопросительная частица', stemDisplay: `${wordWithPerson} [ ___ ]?`, correctPiece: qPart!.particle,
            options: actionReferenceRows(formulaId).map(option => ({ value: option.value, isCorrect: option.value === qPart!.particle, reasonRu: option.condition })) },
        ] : [
          { stepIndex: 1, stepTitleRu: 'Шаг 1 из 2: суффикс действия', stemDisplay: `${root.kz} + [ ___ ] + ${pers.suffix}`, correctPiece: aey.suffix,
            options: actionReferenceRows(formulaId).map(option => ({ value: option.value, isCorrect: option.value === aey.suffix, reasonRu: option.condition })) },
          { stepIndex: 2, stepTitleRu: 'Шаг 2 из 2: личное окончание', stemDisplay: `${joinedStem.mergedWord} + [ ___ ]`, correctPiece: pers.suffix,
            options: [{ value: pers.suffix, isCorrect: true, reasonRu: pers.ruleRu }] },
        ],
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [
          canonicalFormKz,
          fullFormWithBracketsKz,
          ...(isQuestion
            ? [`${canonicalFormKz}?`, `${fullFormWithBracketsKz}?`]
            : []),
        ],
        coloredSegments: [
          {
            text: `(${personMeta.pronounKz})`,
            color: getTenColorForRow(getVowelRow(personMeta.pronounKz)),
            glossRu: personMeta.labelRu,
            role: 'pronoun',
            isOptionalBracket: true,
          },
          {
            text: joinedStem.mergedWord,
            color: getTenColorForRow(root.vowelRow),
            glossRu: `${root.ru} + -${aey.suffix}`,
            role: 'root',
          },
          ...(pers.suffix
            ? [
                {
                  text: pers.suffix,
                  color: pers.color,
                  glossRu: personMeta.labelRu,
                  role: 'core_block' as const,
                  coreBlockId: 'KB-3' as const,
                },
              ]
            : []),
          ...(isQuestion && qPart
            ? [
                {
                  text: qPart.particle,
                  color: qPart.color,
                  glossRu: 'ли? (вопрос)',
                  role: 'particle' as const,
                  coreBlockId: 'KB-6' as const,
                },
              ]
            : []),
        ],
        formulaChainText: `${root.kz} + ${aey.suffix}${pers.suffix ? ' + ' + pers.suffix : ''}${isQuestion && qPart ? ' + ' + qPart.particle : ''} → ${canonicalFormKz}`,
        literalMeaningRu: `Настояще-будущее время («вообще или завтра»): основа «${root.kz}» + связка «-${aey.suffix}»${pers.suffix ? ' + личное окончание «-' + pers.suffix + '»' : ''}.`,
        mergerCapsule: joinedStem.capsule,
        selectionRuleSummaryRu: `${aey.ruleRu} ${pers.ruleRu}${isQuestion && qPart ? ' ' + qPart.ruleRu : ''}`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 5: ПРОШЕДШЕЕ ВРЕМЯ (-ды/-ді, -мады, -ған жоқ, -атын) (Темы 31, 32, 34, 36)
  // --------------------------------------------------------------------------
  if (formulaId === 'T31_PAST_DY') {
    const past = pickPastDySuffix(root.kz);
    const shortPers = pickShortPersonalEnding(root.vowelRow, person);
    const canonicalFormKz = root.kz + past.suffix + shortPers.suffix;
    const fullFormWithBracketsKz = `${personMeta.pronounKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: 31,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `${personMeta.pronounKz} (${personMeta.labelRu}) ${root.ruGloss ?? root.ru} (в прошлом)`,
        personHint,
        monochromeStemDisplay: `${root.kz} + [ ___ ] + ${shortPers.suffix}`,
        rootTranslationHint,
        stage1Options: past.options,
        multiStepBlanks: [
          { stepIndex: 1, stepTitleRu: 'Шаг 1 из 2: суффикс прошедшего времени',
            stemDisplay: `${root.kz} + [ ___ ]${shortPers.suffix ? ' + ' + shortPers.suffix : ''}`,
            correctPiece: past.suffix, options: past.options },
          { stepIndex: 2, stepTitleRu: shortPers.suffix ? 'Шаг 2 из 2: личное окончание' : 'Шаг 2 из 2: готовое слово без личного окончания',
            stemDisplay: shortPers.suffix ? `${root.kz}${past.suffix} + [ ___ ]` : '[ ___ ]',
            correctPiece: shortPers.suffix || canonicalFormKz,
            options: [{ value: shortPers.suffix || canonicalFormKz, isCorrect: true, reasonRu: shortPers.ruleRu }] },
        ],
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [canonicalFormKz, fullFormWithBracketsKz],
        coloredSegments: [
          {
            text: `(${personMeta.pronounKz})`,
            color: getTenColorForRow(getVowelRow(personMeta.pronounKz)),
            glossRu: personMeta.labelRu,
            role: 'pronoun',
            isOptionalBracket: true,
          },
          {
            text: root.kz,
            color: getTenColorForRow(root.vowelRow),
            glossRu: root.ru,
            role: 'root',
          },
          {
            text: past.suffix,
            color: past.color,
            glossRu: 'уже свершилось',
            role: 'suffix',
          },
          ...(shortPers.suffix
            ? [
                {
                  text: shortPers.suffix,
                  color: shortPers.color,
                  glossRu: personMeta.labelRu,
                  role: 'core_block' as const,
                  coreBlockId: 'KB-4' as const,
                },
              ]
            : []),
        ],
        formulaChainText: `${root.kz} + ${past.suffix}${shortPers.suffix ? ' + ' + shortPers.suffix : ''} → ${canonicalFormKz}`,
        literalMeaningRu: `Обычное прошедшее время: «${root.kz}» + «-${past.suffix}» + короткий личный хвост «-${shortPers.suffix}».`,
        selectionRuleSummaryRu: `${past.ruleRu} ${shortPers.ruleRu}`,
        sourceBadge,
      },
    };
  }

  if (formulaId === 'T32_PAST_MADY' || formulaId === 'T34_PAST_GAN_JOK') {
    const negMa = pickVerbNegationSuffix(root.kz, 'ma');
    const dyPart = root.vowelRow === 'hard' ? 'ды' : 'ді';
    const shortPers = pickShortPersonalEnding(root.vowelRow, person);
    const madyForm = `${root.kz}${negMa.suffix}${dyPart}${shortPers.suffix}`;

    const gan = pickParticipleGanSuffix(root.kz);
    const jokPers = pickFullPersonalEnding('жоқ', person, {
      rowOverride: 'hard',
      thirdPersonHasDyDi: false,
    });
    const ganJokForm = `${root.kz}${gan.suffix} жоқ${jokPers.suffix}`;

    const isGanJokPrimary = formulaId === 'T34_PAST_GAN_JOK';
    const canonicalFormKz = isGanJokPrimary ? ganJokForm : madyForm;
    const synonymFormKz = isGanJokPrimary ? madyForm : ganJokForm;
    const fullFormWithBracketsKz = `${personMeta.pronounKz} ${canonicalFormKz}`;

    // Ключевая проверка правила «последней ступеньки» (К33 п. 1):
    // В теме 34 слово «жоқ» всегда твёрдое и глухое, поэтому даже у мягкого корня (ішкен) хвост после «жоқ» — твёрдый (-пын/-сың/-сыз)!
    return {
      formulaId,
      topicNumber: isGanJokPrimary ? 34 : 32,
      rootId: root.id,
      person,
      sentenceType: 'negative',
      beforeCheck: {
        promptRu: `${personMeta.pronounKz} (${personMeta.labelRu}) не ${root.ruGloss ?? root.ru} (в прошлом)`,
        personHint,
        monochromeStemDisplay: isGanJokPrimary
          ? `${root.kz} + [ ___ ] жоқ${jokPers.suffix}`
          : `${root.kz} + [ ___ ] + ${dyPart}${shortPers.suffix}`,
        rootTranslationHint,
        stage1Options: isGanJokPrimary
          ? gan.options
          : ['ма', 'ме', 'ба', 'бе', 'па', 'пе'].map((val) => ({
              value: val,
              isCorrect: val === negMa.suffix,
              reasonRu:
                val === negMa.suffix
                  ? negMa.ruleRu
                  : `После «${root.kz}» нужен кусочек «-${negMa.suffix}».`,
            })),
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [
          canonicalFormKz,
          fullFormWithBracketsKz,
          synonymFormKz,
          `${personMeta.pronounKz} ${synonymFormKz}`,
        ],
        coloredSegments: isGanJokPrimary
          ? [
              {
                text: root.kz,
                color: getTenColorForRow(root.vowelRow),
                glossRu: root.ru,
                role: 'root',
              },
              {
                text: gan.suffix,
                color: gan.color,
                glossRu: 'сделавший',
                role: 'suffix',
              },
              {
                text: 'жоқ',
                color: 'red',
                glossRu: 'нет (всегда твёрдое!)',
                role: 'auxiliary',
              },
              ...(jokPers.suffix
                ? [
                    {
                      text: jokPers.suffix,
                      color: 'red' as const,
                      glossRu: `${personMeta.labelRu} (подстраивается под «жоқ»!)`,
                      role: 'core_block' as const,
                      coreBlockId: 'KB-3' as const,
                    },
                  ]
                : []),
            ]
          : [
              {
                text: root.kz,
                color: getTenColorForRow(root.vowelRow),
                glossRu: root.ru,
                role: 'root',
              },
              {
                text: negMa.suffix,
                color: negMa.color,
                glossRu: 'не',
                role: 'core_block',
                coreBlockId: 'KB-7',
              },
              {
                text: dyPart,
                color: getTenColorForRow(root.vowelRow),
                glossRu: 'прошедшее время',
                role: 'suffix',
              },
              ...(shortPers.suffix
                ? [
                    {
                      text: shortPers.suffix,
                      color: shortPers.color,
                      glossRu: personMeta.labelRu,
                      role: 'core_block' as const,
                      coreBlockId: 'KB-4' as const,
                    },
                  ]
                : []),
            ],
        formulaChainText: isGanJokPrimary
          ? `${root.kz} + ${gan.suffix} + жоқ${jokPers.suffix ? ' + ' + jokPers.suffix : ''} → ${canonicalFormKz}`
          : `${root.kz} + ${negMa.suffix} + ${dyPart}${shortPers.suffix ? ' + ' + shortPers.suffix : ''} → ${canonicalFormKz}`,
        literalMeaningRu: isGanJokPrimary
          ? `Обрати внимание на «правило последней ступеньки»: даже если корень мягкий («${root.kz}»), слово «жоқ» твёрдое и глухое, поэтому личный хвост после «жоқ» всегда твёрдый («${jokPers.suffix || '—'}»).`
          : `Отрицание в прошедшем времени: корень + «-${negMa.suffix}» + «-${dyPart}» + короткий личный хвост.`,
        selectionRuleSummaryRu: isGanJokPrimary
          ? `${gan.ruleRu} После слова «жоқ» всегда идёт твёрдое личное окончание (${jokPers.ruleRu}).`
          : `${negMa.ruleRu} После «-${negMa.suffix}» всегда гласная → берётся звонкое «-${dyPart}».`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 7: УСЛОВИЕ (-са/-се) И УСТУПКА (-са да / барсақ та) (Темы 46–48)
  // --------------------------------------------------------------------------
  if (formulaId === 'T46_COND_SA' || formulaId === 'T48_CONCESSIVE_SA_DA') {
    const cond = pickConditionalSaSuffix(root.kz);
    const shortPers = pickShortPersonalEnding(root.vowelRow, person);
    const wordWithPerson = root.kz + cond.suffix + shortPers.suffix;
    const isConcessive = formulaId === 'T48_CONCESSIVE_SA_DA';
    // В теме 48 у «біз» слово заканчивается на глухую «-қ/-к» (барсақ, келсек) → частица «та / те»!
    const daParticle =
      person === 'biz'
        ? root.vowelRow === 'hard'
          ? 'та'
          : 'те'
        : root.vowelRow === 'hard'
        ? 'да'
        : 'де';
    const canonicalFormKz = isConcessive
      ? `${wordWithPerson} ${daParticle}`
      : wordWithPerson;
    const fullFormWithBracketsKz = isConcessive
      ? `${personMeta.pronounKz} ${canonicalFormKz}`
      : `егер ${personMeta.pronounKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: isConcessive ? 48 : 46,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: isConcessive
          ? `Даже если ${personMeta.pronounKz} (${personMeta.labelRu}) ${root.ruGloss ?? root.ru}`
          : `Если ${personMeta.pronounKz} (${personMeta.labelRu}) ${root.ruGloss ?? root.ru}`,
        personHint,
        monochromeStemDisplay: isConcessive
          ? `${wordWithPerson} [ ___ ]`
          : `${root.kz} + [ ___ ] + ${shortPers.suffix}`,
        rootTranslationHint,
        stage1Options: isConcessive
          ? ['да', 'де', 'та', 'те'].map((val) => ({
              value: val,
              isCorrect: val === daParticle,
              reasonRu:
                val === daParticle
                  ? person === 'biz'
                    ? `Верно: у «біз» на конце стоит глухая буква «-${shortPers.suffix}» («${wordWithPerson}»), поэтому частица оглушается в «${daParticle}»!`
                    : `Верно: после гласной или звонкой согласной в ${root.vowelRow === 'hard' ? 'твёрдом' : 'мягком'} слове ставится «${daParticle}».`
                  : `После «${wordWithPerson}» нужна частица «${daParticle}».`,
            }))
          : cond.options,
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [
          canonicalFormKz,
          fullFormWithBracketsKz,
          `${personMeta.pronounKz} ${canonicalFormKz}`,
          ...(!isConcessive ? [`егер ${canonicalFormKz}`] : []),
        ],
        coloredSegments: [
          {
            text: isConcessive ? `(${personMeta.pronounKz})` : `(егер)`,
            color: 'green',
            glossRu: isConcessive ? personMeta.labelRu : 'если (можно опустить)',
            role: 'particle',
            isOptionalBracket: true,
          },
          {
            text: root.kz,
            color: getTenColorForRow(root.vowelRow),
            glossRu: root.ru,
            role: 'root',
          },
          {
            text: cond.suffix,
            color: cond.color,
            glossRu: 'если',
            role: 'suffix',
          },
          ...(shortPers.suffix
            ? [
                {
                  text: shortPers.suffix,
                  color: shortPers.color,
                  glossRu: personMeta.labelRu,
                  role: 'core_block' as const,
                  coreBlockId: 'KB-4' as const,
                },
              ]
            : []),
          ...(isConcessive
            ? [
                {
                  text: daParticle,
                  color: getTenColorForRow(root.vowelRow),
                  glossRu: 'даже (и)',
                  role: 'particle' as const,
                },
              ]
            : []),
        ],
        formulaChainText: `${root.kz} + ${cond.suffix}${shortPers.suffix ? ' + ' + shortPers.suffix : ''}${isConcessive ? ' + ' + daParticle : ''} → ${canonicalFormKz}`,
        literalMeaningRu: isConcessive
          ? `Уступка «даже если»: условие «${wordWithPerson}» + усилительная частица «${daParticle}» (у «біз» после глухой «-${shortPers.suffix}» она превращается в «${daParticle}»).`
          : `Условие «если»: слово «егер» в начале необязательно, потому что весь смысл «если» уже живёт внутри кусочка «-${cond.suffix}».`,
        selectionRuleSummaryRu: `${cond.ruleRu} ${shortPers.ruleRu}`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 12: ВОЗМОЖНОСТЬ «МОГУ / УМЕЮ» (Темы 72–75)
  // --------------------------------------------------------------------------
  if (formulaId === 'T72_CAN_PRESENT' || formulaId === 'T73_CAN_NEG') {
    const isNeg = formulaId === 'T73_CAN_NEG';
    const aey = pickPresentAEYSuffix(root.kz);
    const joinedMain = joinWithBoundaryMerger(root.kz, aey.suffix);
    // Вспомогательный глагол «ал-» всегда твёрдый! (правило последней ступеньки К33 п. 1)
    const auxStem = isNeg ? 'алмай' : 'ала';
    const pers = pickFullPersonalEnding(auxStem, person, {
      rowOverride: 'hard',
      thirdPersonHasDyDi: true,
    });
    const auxWord = auxStem + pers.suffix;
    const canonicalFormKz = `${joinedMain.mergedWord} ${auxWord}`;
    const fullFormWithBracketsKz = `${personMeta.pronounKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: isNeg ? 73 : 72,
      rootId: root.id,
      person,
      sentenceType: isNeg ? 'negative' : 'affirmative',
      beforeCheck: {
        promptRu: isNeg
          ? `${personMeta.pronounKz} (${personMeta.labelRu}) не могу ${root.ruGloss ?? root.ru}`
          : `${personMeta.pronounKz} (${personMeta.labelRu}) могу / умею ${root.ruGloss ?? root.ru}`,
        personHint,
        monochromeStemDisplay: `${root.kz} + [ ___ ] ${auxWord}`,
        rootTranslationHint,
        stage1Options: aey.options,
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [canonicalFormKz, fullFormWithBracketsKz],
        coloredSegments: [
          {
            text: joinedMain.mergedWord,
            color: getTenColorForRow(root.vowelRow),
            glossRu: `${root.ru} + -${aey.suffix}`,
            role: 'root',
          },
          {
            text: auxStem,
            color: 'red',
            glossRu: isNeg ? 'не брать / не мочь' : 'брать / мочь (всегда твёрдое!)',
            role: 'auxiliary',
          },
          ...(pers.suffix
            ? [
                {
                  text: pers.suffix,
                  color: 'red' as const,
                  glossRu: `${personMeta.labelRu} (всегда твёрдый хвост после «${auxStem}»!)`,
                  role: 'core_block' as const,
                  coreBlockId: 'KB-3' as const,
                },
              ]
            : []),
        ],
        formulaChainText: `${root.kz} + ${aey.suffix} + ${auxStem}${pers.suffix ? ' + ' + pers.suffix : ''} → ${canonicalFormKz}`,
        literalMeaningRu: `Могу сделать: смысловой глагол получает «-${aey.suffix}» по своему ряду, а личный хвост приклеивается к помощнику «ал-» («брать/ осилить»), поэтому окончание «-${pers.suffix || 'ды'}» всегда твёрдое!`,
        mergerCapsule: joinedMain.capsule,
        selectionRuleSummaryRu: `${aey.ruleRu} Личное окончание приклеивается к твёрдому глаголу «ал-» → всегда твёрдый ряд (${pers.ruleRu}).`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 13: ПРЯМО СЕЙЧАС (T78 глаголы движения, T80 остальные глаголы)
  // --------------------------------------------------------------------------
  if (formulaId === 'T78_MOTION_FOUR_PROG' || formulaId === 'T80_STD_PROG') {
    const isMotion = root.isMotionFour || formulaId === 'T78_MOTION_FOUR_PROG';
    const aey = isMotion ? pickPresentAEYSuffix(root.kz) : null;
    const yp = !isMotion ? pickGerundYpSuffix(root.kz) : null;
    const firstWord = isMotion
      ? joinWithBoundaryMerger(root.kz, aey!.suffix).mergedWord
      : yp!.mergedStem;

    // Вспомогательный глагол «жатыр» (твёрдый) или «отыр» (твёрдый)
    const auxBase = 'жатыр';
    const pers = pickFullPersonalEnding(auxBase, person, {
      rowOverride: 'hard',
      thirdPersonHasDyDi: false, // В 3-м лице просто «бара жатыр», без -ды!
    });
    const auxWord = auxBase + pers.suffix;
    const canonicalFormKz = `${firstWord} ${auxWord}`;
    const fullFormWithBracketsKz = `${personMeta.pronounKz} ${canonicalFormKz}`;

    // Для обычных глаголов (T80) также допустимы помощники отыр, тұр, жүр
    const acceptedFormsKz = [canonicalFormKz, fullFormWithBracketsKz];
    if (!isMotion) {
      for (const altAux of ['отыр', 'тұр', 'жүр'] as const) {
        const altRow: VowelRow = altAux === 'жүр' ? 'soft' : 'hard';
        const altPers = pickFullPersonalEnding(altAux, person, {
          rowOverride: altRow,
          thirdPersonHasDyDi: false,
        });
        acceptedFormsKz.push(`${firstWord} ${altAux}${altPers.suffix}`);
        acceptedFormsKz.push(
          `${personMeta.pronounKz} ${firstWord} ${altAux}${altPers.suffix}`
        );
      }
    }

    return {
      formulaId,
      topicNumber: isMotion ? 78 : 80,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `${personMeta.pronounKz} (${personMeta.labelRu}) прямо сейчас ${root.ru}`,
        personHint,
        monochromeStemDisplay: `${root.kz} + [ ___ ] ${auxWord}`,
        rootTranslationHint,
        multiStepBlanks: [
          { stepIndex: 1, stepTitleRu: 'Шаг 1 из 2: суффикс действия',
            stemDisplay: `${root.kz} + [ ___ ] ${auxWord}`,
            correctPiece: isMotion ? aey!.suffix : yp!.suffix,
            options: isMotion ? aey!.options : ['ып', 'іп', 'п'].map(value => ({
              value, isCorrect: value === yp!.suffix, reasonRu: yp!.ruleRu,
            })) },
          { stepIndex: 2, stepTitleRu: pers.suffix ? 'Шаг 2 из 2: личное окончание' : 'Шаг 2 из 2: слово без личного окончания',
            stemDisplay: pers.suffix ? `${firstWord} ${auxBase} + [ ___ ]` : `${firstWord} [ ___ ]`,
            correctPiece: pers.suffix || auxBase,
            options: [{ value: pers.suffix || auxBase, isCorrect: true, reasonRu: pers.ruleRu }] },
        ],
        stage1Options: isMotion
          ? aey!.options
          : ['ып', 'іп', 'п', 'а', 'е'].map((val) => ({
              value: val,
              isCorrect: val === yp!.suffix,
              reasonRu:
                val === yp!.suffix
                  ? yp!.ruleRu
                  : val === 'а' || val === 'е'
                  ? `Кусочек «-${val}» перед «жатыр» ставится только у четырёх глаголов движения (бар, кел, апар, әкел), а у остальных глаголов нужно «-ып / -іп / -п»!`
                  : `Для «${root.kz}» нужен кусочек «-${yp!.suffix}».`,
            })),
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz,
        coloredSegments: [
          {
            text: firstWord,
            color: getTenColorForRow(root.vowelRow),
            glossRu: `${root.ru} + -${isMotion ? aey!.suffix : yp!.suffix}`,
            role: 'root',
          },
          {
            text: auxBase,
            color: 'red',
            glossRu: 'Действие происходит сейчас',
            role: 'auxiliary',
          },
          ...(pers.suffix
            ? [
                {
                  text: pers.suffix,
                  color: 'red' as const,
                  glossRu: personMeta.labelRu,
                  role: 'core_block' as const,
                  coreBlockId: 'KB-3' as const,
                },
              ]
            : []),
        ],
        formulaChainText: `${root.kz} + ${isMotion ? aey!.suffix : yp!.suffix} + ${auxBase}${pers.suffix ? ' + ' + pers.suffix : ''} → ${canonicalFormKz}`,
        literalMeaningRu: isMotion
          ? `Один из 4 глаголов движения (бар, кел, апар, әкел): перед «жатыр» берёт гласную «-${aey!.suffix}», а не «-ып/-іп». В 3-м лице у «жатыр» окончания «-ды» не бывает!`
          : `Действие прямо сейчас: основной глагол с суффиксом «-${yp!.suffix}» + глагол состояния «${auxWord}».`,
        mergerCapsule: yp?.capsule,
        selectionRuleSummaryRu: isMotion
          ? `${aey!.ruleRu} Вспомогательное слово «жатыр» имеет твёрдые гласные. ${pers.ruleRu}`
          : `${yp!.ruleRu} Вспомогательное слово «жатыр» имеет твёрдые гласные. ${pers.ruleRu}`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 16–18: НЕОБХОДИМОСТЬ «НУЖНО / ДОЛЖЕН» (Темы 93, 94)
  // --------------------------------------------------------------------------
  if (formulaId === 'T93_NEED_KEREK' || formulaId === 'T94_NEED_NEG_MAU_KEREK') {
    const isNeg = formulaId === 'T94_NEED_NEG_MAU_KEREK';
    const joinedU = isNeg
      ? {
          mergedWord:
            root.kz + pickVerbNegationSuffix(root.kz, 'mau').suffix,
          capsule: undefined,
        }
      : joinWithBoundaryMerger(root.kz, 'у');
    // После «-у» слово всегда заканчивается на смешанную «у» (класс 'UI'), поэтому личный хвост принадлежности всегда с гласной ы/і: бару+ым, ішу+ім!
    const poss = pickPossessiveSuffix(
      joinedU.mergedWord,
      person,
      root.vowelRow,
      true
    );
    const wordWithPoss = joinedU.mergedWord + poss.suffix;
    const canonicalFormKz = `${wordWithPoss} керек`;
    const fullFormWithBracketsKz = `${personMeta.genitiveKz} ${canonicalFormKz}`;

    // Синонимичные способы выразить «мне нужно» из глав 17–18 (К33 п. 3):
    // 1. С «қажет» вместо «керек»
    // 2. Через дательный падеж «маған бару керек» (Тема 95)
    const dativeSynonym = `${personMeta.dativeKz} ${joinedU.mergedWord} керек`;
    const qajetSynonym = `${wordWithPoss} қажет`;

    return {
      formulaId,
      topicNumber: isNeg ? 94 : 93,
      rootId: root.id,
      person,
      sentenceType: isNeg ? 'negative' : 'affirmative',
      beforeCheck: {
        promptRu: isNeg
          ? `${({ men: 'Мне', sen: 'Тебе', siz: 'Вам', biz: 'Нам', ol: 'Ему или ей', ol_kisi: 'Ему или ей', sender: 'Вам', sizder: 'Вам', olar: 'Им', ol_kisiler: 'Им' } as Record<PersonId, string>)[person]} нужно не ${root.ruGloss ?? root.ru}`
          : `${({ men: 'Мне', sen: 'Тебе', siz: 'Вам', biz: 'Нам', ol: 'Ему или ей', ol_kisi: 'Ему или ей', sender: 'Вам', sizder: 'Вам', olar: 'Им', ol_kisiler: 'Им' } as Record<PersonId, string>)[person]} нужно ${root.ruGloss ?? root.ru}`,
        personHint: `${personMeta.genitiveKz} (${personMeta.labelRu})`,
        monochromeStemDisplay: `${joinedU.mergedWord} + [ ___ ] керек`,
        rootTranslationHint,
        stage1Options: ensureInPool(poss.suffix, [
          'ым',
          'ім',
          'м',
          'ың',
          'ің',
          'ы',
          'і',
          'сы',
        ]).map((val) => ({
          value: val,
          isCorrect: val === poss.suffix,
          reasonRu:
            val === poss.suffix
              ? `Верно: буква «-у» в «${joinedU.mergedWord}» ведёт себя как согласная, поэтому после неё всегда берётся вариант с гласной «-${poss.suffix}» (а не просто «-м/-ң/-сы»).`
              : val === 'м' || val === 'ң' || val === 'сы' || val === 'сі'
              ? `Ловушка! Хотя «у» похожа на гласную, в казахском после суффикса «-у» всегда ставится вариант с гласной «ы/і»: «-${poss.suffix}».`
              : `Для лица «${personMeta.genitiveKz}» в ${root.vowelRow === 'hard' ? 'твёрдом' : 'мягком'} слове нужен хвост «-${poss.suffix}».`,
        })),
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [
          canonicalFormKz,
          fullFormWithBracketsKz,
          qajetSynonym,
          `${personMeta.genitiveKz} ${qajetSynonym}`,
          dativeSynonym,
        ],
        coloredSegments: [
          {
            text: `(${personMeta.genitiveKz})`,
            color: getTenColorForRow(getVowelRow(personMeta.genitiveKz)),
            glossRu: 'чьё действие (можно опустить)',
            role: 'pronoun',
            isOptionalBracket: true,
          },
          {
            text: joinedU.mergedWord,
            color: 'amber',
            glossRu: isNeg
              ? `не-${root.ruGloss ?? root.ru}`
              : `само дело «${root.ruGloss ?? root.ru}» (-у)`,
            role: 'root',
          },
          {
            text: poss.suffix,
            color: poss.color,
            glossRu: `чьё (${personMeta.labelRu})`,
            role: 'core_block',
            coreBlockId: 'KB-2',
          },
          {
            text: 'керек',
            color: 'green',
            glossRu: 'нужно (необходимо)',
            role: 'auxiliary',
          },
        ],
        formulaChainText: `${root.kz} + ${isNeg ? pickVerbNegationSuffix(root.kz, 'mau').suffix : 'у'} + ${poss.suffix} + керек → ${canonicalFormKz}`,
        literalMeaningRu: isNeg
          ? `Нужно воздержаться от действия «${root.ruGloss ?? root.ru}». Отрицание относится к действию; это не отсутствие необходимости.`
          : `Необходимо выполнить действие «${root.ruGloss ?? root.ru}». Окончание принадлежности показывает, кто должен его выполнить.`, 
        mergerCapsule: joinedU.capsule,
        selectionRuleSummaryRu: `${poss.ruleRu}`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 19: РАЗРЕШЕНИЕ «МОЖНО / НЕЛЬЗЯ» (Темы 99, 101)
  // --------------------------------------------------------------------------
  if (
    formulaId === 'T99_MAY_PERSONAL' ||
    formulaId === 'T101_MAY_IMPERSONAL'
  ) {
    const joinedU = joinWithBoundaryMerger(root.kz, 'у');
    if (formulaId === 'T101_MAY_IMPERSONAL') {
      const dat = pickCaseSuffix(joinedU.mergedWord, 'dative', {
        rowOverride: root.vowelRow,
      });
      const canonicalFormKz = `${joinedU.mergedWord}${dat.suffix} болады`;
      return {
        formulaId,
        topicNumber: 101,
        rootId: root.id,
        person,
        sentenceType: 'affirmative',
        beforeCheck: {
          promptRu: `Можно ${root.ruGloss ?? root.ru} (вообще / любому)`,
          personHint: 'безлично (вообще)',
          monochromeStemDisplay: `${joinedU.mergedWord} + [ ___ ] болады`,
          rootTranslationHint,
          stage1Options: ['ға', 'ге', 'қа', 'ке'].map((val) => ({
            value: val,
            isCorrect: val === dat.suffix,
            reasonRu:
              val === dat.suffix
                ? `Верно: после «-у» всегда звонкий стык, а само слово «${root.kz}» ${root.vowelRow === 'hard' ? 'твёрдое → -ға' : 'мягкое → -ге'}.`
                : `После «${joinedU.mergedWord}» нужен падежный кусочек «-${dat.suffix}».`,
          })),
        },
        afterCheck: {
          canonicalFormKz,
          acceptedFormsKz: [canonicalFormKz],
          coloredSegments: [
            {
              text: joinedU.mergedWord,
              color: 'amber',
              glossRu: `${root.ruGloss ?? root.ru} (-у)`,
              role: 'root',
            },
            {
              text: dat.suffix,
              color: dat.color,
              glossRu: 'к / для (направление)',
              role: 'core_block',
              coreBlockId: 'KB-8',
            },
            {
              text: 'болады',
              color: 'red',
              glossRu: 'годится / можно',
              role: 'auxiliary',
            },
          ],
          formulaChainText: `${root.kz} + у + ${dat.suffix} + болады → ${canonicalFormKz}`,
          literalMeaningRu: `Буквально: «к деланию-${root.ruGloss ?? root.ru} годится (болады)».`,
          mergerCapsule: joinedU.capsule,
          selectionRuleSummaryRu: dat.ruleRu,
          sourceBadge,
        },
      };
    }

    // Тема 99: Личное разрешение (баруыма болады, баруыңа болады, баруына болады) — зелёные кружки ①②③!
    const poss = pickPossessiveSuffix(
      joinedU.mergedWord,
      person,
      root.vowelRow,
      true
    );
    const afterPossType: '1_2' | '3' | null =
      person === 'men' || person === 'sen' || person === 'sender'
        ? '1_2'
        : person === 'ol' ||
          person === 'ol_kisi' ||
          person === 'olar' ||
          person === 'ol_kisiler'
        ? '3'
        : null;
    const wordWithPoss = joinedU.mergedWord + poss.suffix;
    const dat = pickCaseSuffix(wordWithPoss, 'dative', {
      rowOverride: root.vowelRow,
      afterPossessive: afterPossType,
    });
    const canonicalFormKz = `${wordWithPoss}${dat.suffix} болады`;
    const fullFormWithBracketsKz = `${personMeta.genitiveKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: 99,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `Мне / тебе (${personMeta.genitiveKz}) можно ${root.ruGloss ?? root.ru}`,
        personHint: `${personMeta.genitiveKz} (${personMeta.labelRu})`,
        monochromeStemDisplay: `${wordWithPoss} + [ ___ ] болады`,
        rootTranslationHint,
        stage1Options: ensureInPool(dat.suffix, [
          'а',
          'е',
          'ға',
          'ге',
          'на',
          'не',
        ]).map((val) => ({
          value: val,
          isCorrect: val === dat.suffix,
          reasonRu:
            val === dat.suffix
              ? dat.ruleRu
              : `После притяжательного хвоста «-${poss.suffix}» в слове «${wordWithPoss}» нужен падежный кусочек «-${dat.suffix}» (зелёный кружок из темы 16!).`,
        })),
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [
          canonicalFormKz,
          fullFormWithBracketsKz,
          `${personMeta.dativeKz} ${joinedU.mergedWord}${root.vowelRow === 'hard' ? 'ға' : 'ге'} болады`,
        ],
        coloredSegments: [
          {
            text: `(${personMeta.genitiveKz})`,
            color: getTenColorForRow(getVowelRow(personMeta.genitiveKz)),
            glossRu: 'чьё разрешение',
            role: 'pronoun',
            isOptionalBracket: true,
          },
          {
            text: joinedU.mergedWord,
            color: 'amber',
            glossRu: `${root.ruGloss ?? root.ru} (-у)`,
            role: 'root',
          },
          {
            text: poss.suffix,
            color: poss.color,
            glossRu: `чьё (${personMeta.labelRu})`,
            role: 'core_block',
            coreBlockId: 'KB-2',
          },
          {
            text: dat.suffix,
            color: dat.color,
            glossRu: 'направительный падеж после принадлежности (①②③)',
            role: 'core_block',
            coreBlockId: 'KB-8',
          },
          {
            text: 'болады',
            color: 'red',
            glossRu: 'можно / годится',
            role: 'auxiliary',
          },
        ],
        formulaChainText: `${root.kz} + у + ${poss.suffix} + ${dat.suffix} + болады → ${canonicalFormKz}`,
        literalMeaningRu: `Личное разрешение: здесь встречаются сразу 3 кубика — отглагольное «-у», хвост принадлежности «-${poss.suffix}» и короткий направительный падеж «-${dat.suffix}» (зелёный значок ①②③ из главы 2).`,
        mergerCapsule: joinedU.capsule,
        selectionRuleSummaryRu: `${poss.ruleRu} ${dat.ruleRu}`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 2: ПРИНАДЛЕЖНОСТЬ (T13) И 6 ПАДЕЖЕЙ СУЩЕСТВИТЕЛЬНЫХ (T14, T15, T17–T21)
  // --------------------------------------------------------------------------
  if (formulaId === 'T13_POSSESSIVE') {
    const poss = pickPossessiveSuffix(root.kz, person, root.vowelRow, false);
    const joined = joinWithBoundaryMerger(root.kz, poss.suffix);
    const canonicalFormKz = joined.mergedWord;
    const fullFormWithBracketsKz = `${personMeta.genitiveKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: 13,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `Мой / твой / его (${personMeta.genitiveKz}) — ${root.ru}`,
        personHint: `${personMeta.genitiveKz} (${personMeta.labelRu})`,
        monochromeStemDisplay: `${root.kz} + [ ___ ]`,
        rootTranslationHint,
        stage1Options: ensureInPool(poss.suffix, [
          'м',
          'ым',
          'ім',
          'ң',
          'ың',
          'ің',
          'сы',
          'сі',
          'ы',
          'і',
        ]).map((val) => ({
          value: val,
          isCorrect: val === poss.suffix,
          reasonRu:
            val === poss.suffix
              ? poss.ruleRu
              : `Для «${root.kz}» и лица «${personMeta.genitiveKz}» нужен хвост «-${poss.suffix}».`,
        })),
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [canonicalFormKz, fullFormWithBracketsKz],
        coloredSegments: [
          {
            text: `(${personMeta.genitiveKz})`,
            color: getTenColorForRow(getVowelRow(personMeta.genitiveKz)),
            glossRu: 'чьё (можно опустить)',
            role: 'pronoun',
            isOptionalBracket: true,
          },
          {
            text: joined.mergedWord,
            color: getTenColorForRow(root.vowelRow),
            glossRu: `${root.ru} + -${poss.suffix}`,
            role: 'root',
            coreBlockId: 'KB-2',
          },
        ],
        formulaChainText: `${root.kz} + ${poss.suffix} → ${canonicalFormKz}`,
        literalMeaningRu: `Хвост принадлежности «-${poss.suffix}» прямо на предмете показывает хозяина («${personMeta.genitiveKz}»).`,
        mergerCapsule: joined.capsule,
        selectionRuleSummaryRu: poss.ruleRu,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ТЕМА 10: МНОЖЕСТВЕННОЕ ЧИСЛО (лар/лер, дар/дер, тар/тер)
  // --------------------------------------------------------------------------
  if (formulaId === 'T10_PLURAL') {
    const pl = pickPluralSuffix(root.kz, root.vowelRow);
    const canonicalFormKz = root.kz + pl.suffix;
    return {
      formulaId,
      topicNumber: 10,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `Много: ${root.ru} (во множественном числе)`,
        personHint: 'множественное число',
        monochromeStemDisplay: `${root.kz} + [ ___ ]`,
        rootTranslationHint,
        stage1Options: ['лар', 'лер', 'дар', 'дер', 'тар', 'тер'].map((val) => ({
          value: val,
          isCorrect: val === pl.suffix,
          reasonRu:
            val === pl.suffix
              ? pl.ruleRu
              : `После «${root.kz}» нужен кусочек «-${pl.suffix}».`,
        })),
      },
      afterCheck: {
        canonicalFormKz,
        acceptedFormsKz: [canonicalFormKz],
        coloredSegments: [
          {
            text: root.kz,
            color: getTenColorForRow(root.vowelRow),
            glossRu: root.ru,
            role: 'root',
          },
          {
            text: pl.suffix,
            color: pl.color,
            glossRu: 'много (мн. ч.)',
            role: 'core_block',
            coreBlockId: 'KB-5',
          },
        ],
        formulaChainText: `${root.kz} + ${pl.suffix} → ${canonicalFormKz}`,
        literalMeaningRu: `Множественное число: «${root.kz}» + «-${pl.suffix}».`,
        selectionRuleSummaryRu: pl.ruleRu,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 2: 6 ПАДЕЖЕЙ СУЩЕСТВИТЕЛЬНЫХ (Темы 15, 17, 18, 19, 20, 21)
  // --------------------------------------------------------------------------
  const caseFormulaMap: Record<
    string,
    { caseType: CaseType; topic: number; labelRu: string; pool: string[] }
  > = {
    T15_GENITIVE: {
      caseType: 'genitive',
      topic: 15,
      labelRu: 'Чей / кого (принадлежность)',
      pool: ['ның', 'нің', 'дың', 'дің', 'тың', 'тің'],
    },
    T17_DATIVE: {
      caseType: 'dative',
      topic: 17,
      labelRu: 'Кому / куда (направление)',
      pool: ['ға', 'ге', 'қа', 'ке'],
    },
    T18_LOCATIVE: {
      caseType: 'locative',
      topic: 18,
      labelRu: 'У кого / где (местонахождение)',
      pool: ['да', 'де', 'та', 'те'],
    },
    T19_ABLATIVE: {
      caseType: 'ablative',
      topic: 19,
      labelRu: 'От кого / откуда (исходная точка)',
      pool: ['дан', 'ден', 'тан', 'тен', 'нан', 'нен'],
    },
    T20_INSTRUMENTAL: {
      caseType: 'instrumental',
      topic: 20,
      labelRu: 'С кем / чем (инструмент, компания)',
      pool: ['мен', 'бен', 'пен'],
    },
    T21_ACCUSATIVE: {
      caseType: 'accusative',
      topic: 21,
      labelRu: 'Кого / что (конкретный предмет)',
      pool: ['ны', 'ні', 'ды', 'ді', 'ты', 'ті'],
    },
  };

  if (caseFormulaMap[formulaId]) {
    const cfg = caseFormulaMap[formulaId];
    const c = pickCaseSuffix(root.kz, cfg.caseType, {
      rowOverride: root.vowelRow,
    });
    const canonicalFormKz = root.kz + c.suffix;
    return {
      formulaId,
      topicNumber: cfg.topic,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `${cfg.labelRu}: ${root.ru}`,
        personHint: cfg.labelRu,
        monochromeStemDisplay: `${root.kz} + [ ___ ]`,
        rootTranslationHint,
        stage1Options: cfg.pool.map((val) => ({
          value: val,
          isCorrect: val === c.suffix,
          reasonRu:
            val === c.suffix
              ? c.ruleRu
              : `Для слова «${root.kz}» нужен падежный хвост «-${c.suffix}».`,
        })),
      },
      afterCheck: {
        canonicalFormKz,
        acceptedFormsKz: [canonicalFormKz],
        coloredSegments: [
          {
            text: root.kz,
            color: getTenColorForRow(root.vowelRow),
            glossRu: root.ru,
            role: 'root',
          },
          {
            text: c.suffix,
            color: c.color,
            glossRu: cfg.labelRu,
            role: 'core_block',
            coreBlockId: 'KB-8',
          },
        ],
        formulaChainText: `${root.kz} + ${c.suffix} → ${canonicalFormKz}`,
        literalMeaningRu: `${cfg.labelRu}: «${root.kz}» + «-${c.suffix}».`,
        selectionRuleSummaryRu: c.ruleRu,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 3 И 15: ПОБУЖДЕНИЕ 1-ГО ЛИЦА (-айын/-ейін, -айық/-ейік) И НАМЕРЕНИЕ (Темы 22, 24, 89)
  // --------------------------------------------------------------------------
  if (
    formulaId === 'T22_IMP_1SG' ||
    formulaId === 'T24_IMP_1PL' ||
    formulaId === 'T89_INTEND_PRESENT'
  ) {
    const isPlural = formulaId === 'T24_IMP_1PL' || (formulaId === 'T89_INTEND_PRESENT' && person === 'biz');
    const opt = pickOptativeAiynSuffix(root.kz, isPlural);
    const joined = joinWithBoundaryMerger(root.kz, opt.suffix);

    if (formulaId === 'T89_INTEND_PRESENT') {
      const auxPers = pickFullPersonalEnding('жатыр', person, {
        rowOverride: 'hard',
        thirdPersonHasDyDi: false,
      });
      const auxWord = `жатыр${auxPers.suffix}`;
      const canonicalFormKz = `${joined.mergedWord} деп ${auxWord}`;
      const fullFormWithBracketsKz = `${personMeta.pronounKz} ${canonicalFormKz}`;

      return {
        formulaId,
        topicNumber: 89,
        rootId: root.id,
        person,
        sentenceType: 'affirmative',
        beforeCheck: {
          promptRu: `${personMeta.pronounKz} (${personMeta.labelRu}) собираюсь ${root.ruGloss ?? root.ru}`,
          personHint,
          monochromeStemDisplay: `${root.kz} + [ ___ ] деп ${auxWord}`,
          rootTranslationHint,
          stage1Options: opt.options,
        },
        afterCheck: {
          canonicalFormKz,
          fullFormWithBracketsKz,
          acceptedFormsKz: [
            canonicalFormKz,
            fullFormWithBracketsKz,
            `${joined.mergedWord} деп отыр${auxPers.suffix}`,
            `${joined.mergedWord} деп жүр${pickFullPersonalEnding('жүр', person, { rowOverride: 'soft', thirdPersonHasDyDi: false }).suffix}`,
          ],
          coloredSegments: [
            {
              text: joined.mergedWord,
              color: getTenColorForRow(root.vowelRow),
              glossRu: `давай-ка я ${root.ruGloss ?? root.ru}`,
              role: 'root',
            },
            {
              text: 'деп',
              color: 'green',
              glossRu: 'сказав / думая так',
              role: 'auxiliary',
            },
            {
              text: auxWord,
              color: 'red',
              glossRu: 'нахожусь сейчас',
              role: 'auxiliary',
            },
          ],
          formulaChainText: `${root.kz} + ${opt.suffix} + деп + ${auxWord} → ${canonicalFormKz}`,
          literalMeaningRu: `Буквально: «думая (деп): „давай-ка я сделаю (${joined.mergedWord})“, сейчас нахожусь (${auxWord})».`,
          mergerCapsule: joined.capsule,
          selectionRuleSummaryRu: opt.ruleRu,
          sourceBadge,
        },
      };
    }

    const canonicalFormKz = joined.mergedWord;
    return {
      formulaId,
      topicNumber: isPlural ? 24 : 22,
      rootId: root.id,
      person: isPlural ? 'biz' : 'men',
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: isPlural
          ? `Давай(те) мы вместе ${root.ruGloss ?? root.ru}`
          : `Давай-ка я ${root.ruGloss ?? root.ru} (сейчас сам сделаю)`,
        personHint: isPlural ? 'біз (мы)' : 'мен (я)',
        monochromeStemDisplay: `${root.kz} + [ ___ ]`,
        rootTranslationHint,
        stage1Options: opt.options,
      },
      afterCheck: {
        canonicalFormKz,
        acceptedFormsKz: [
          canonicalFormKz,
          `${canonicalFormKz}${root.vowelRow === 'hard' ? 'шы' : 'ші'}`,
        ],
        coloredSegments: [
          {
            text: joined.mergedWord,
            color: getTenColorForRow(root.vowelRow),
            glossRu: `${root.ru} + -${opt.suffix}`,
            role: 'root',
          },
        ],
        formulaChainText: `${root.kz} + ${opt.suffix} → ${canonicalFormKz}`,
        literalMeaningRu: isPlural
          ? `Призыв к совместному действию («давайте сделаем»): «${canonicalFormKz}».`
          : `Решимость сделать самому прямо сейчас («давай-ка я сделаю»): «${canonicalFormKz}».`,
        mergerCapsule: joined.capsule,
        selectionRuleSummaryRu: opt.ruleRu,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 5, 6 И 22: ПРИВЫЧНОЕ ПРОШЕДШЕЕ (-атын), БЫ (-ар еді / -ушы еді), НАВЕРНОЕ (-армын)
  // --------------------------------------------------------------------------
  if (formulaId === 'T36_HABITUAL_ATYN') {
    const hab = pickHabitualAtynSuffix(root.kz);
    const joined = joinWithBoundaryMerger(root.kz, hab.suffix);
    const pers = pickFullPersonalEnding(joined.mergedWord, person, {
      rowOverride: root.vowelRow,
      forceBizByz: true,
    });
    const canonicalFormKz = joined.mergedWord + pers.suffix;
    const shortEdi = pickShortPersonalEnding('soft', person);
    const ediSynonym = `${joined.mergedWord} еді${shortEdi.suffix}`;

    return {
      formulaId,
      topicNumber: 36,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `${personMeta.pronounKz} (${personMeta.labelRu}) раньше обычно ${root.ru} (или собирался)`,
        personHint,
        monochromeStemDisplay: `${root.kz} + [ ___ ] + ${pers.suffix}`,
        rootTranslationHint,
        stage1Options: hab.options,
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz: `${personMeta.pronounKz} ${canonicalFormKz}`,
        acceptedFormsKz: [
          canonicalFormKz,
          `${personMeta.pronounKz} ${canonicalFormKz}`,
          ediSynonym,
          `${personMeta.pronounKz} ${ediSynonym}`,
        ],
        coloredSegments: [
          {
            text: joined.mergedWord,
            color: getTenColorForRow(root.vowelRow),
            glossRu: `обычно делающий (${root.ru})`,
            role: 'root',
          },
          ...(pers.suffix
            ? [
                {
                  text: pers.suffix,
                  color: pers.color,
                  glossRu: personMeta.labelRu,
                  role: 'core_block' as const,
                  coreBlockId: 'KB-3' as const,
                },
              ]
            : []),
        ],
        formulaChainText: `${root.kz} + ${hab.suffix}${pers.suffix ? ' + ' + pers.suffix : ''} → ${canonicalFormKz}`,
        literalMeaningRu: `Привычное действие в прошлом («раньше бывало делал»): «${canonicalFormKz}» (равнозначно «${ediSynonym}»).`,
        mergerCapsule: joined.capsule,
        selectionRuleSummaryRu: `${hab.ruleRu} ${pers.ruleRu}`,
        sourceBadge,
      },
    };
  }

  if (
    formulaId === 'T40_COND_AR_EDI' ||
    formulaId === 'T43_COND_USHY_EDI' ||
    formulaId === 'T105_SUPPOSE_ARMYN'
  ) {
    if (formulaId === 'T43_COND_USHY_EDI') {
      const ushySuffix = root.vowelRow === 'hard' ? 'ушы' : 'уші';
      const joinedUshy = joinWithBoundaryMerger(root.kz, ushySuffix);
      const shortEdi = pickShortPersonalEnding('soft', person);
      const ediWord = `еді${shortEdi.suffix}`;
      const canonicalFormKz = `${joinedUshy.mergedWord} ${ediWord}`;
      return {
        formulaId,
        topicNumber: 43,
        rootId: root.id,
        person,
        sentenceType: 'affirmative',
        beforeCheck: {
          promptRu: `${personMeta.pronounKz} (${personMeta.labelRu}) обязательно ${root.ruGloss ?? root.ru} бы (при условии)`,
          personHint,
          monochromeStemDisplay: `${root.kz} + [ ___ ] ${ediWord}`,
          rootTranslationHint,
          stage1Options: ['ушы', 'уші', 'ар', 'ер'].map((val) => ({
            value: val,
            isCorrect: val === ushySuffix,
            reasonRu:
              val === ushySuffix
                ? `Верно: для ${root.vowelRow === 'hard' ? 'твёрдой' : 'мягкой'} основы «${root.kz}» берётся «-${ushySuffix}».`
                : `Для «${root.kz}» нужен кусочек «-${ushySuffix}».`,
          })),
        },
        afterCheck: {
          canonicalFormKz,
          fullFormWithBracketsKz: `${personMeta.pronounKz} ${canonicalFormKz}`,
          acceptedFormsKz: [
            canonicalFormKz,
            `${personMeta.pronounKz} ${canonicalFormKz}`,
          ],
          coloredSegments: [
            {
              text: joinedUshy.mergedWord,
              color: getTenColorForRow(root.vowelRow),
              glossRu: `${root.ru} + -${ushySuffix}`,
              role: 'root',
            },
            {
              text: ediWord,
              color: 'green',
              glossRu: 'бы (был)',
              role: 'auxiliary',
            },
          ],
          formulaChainText: `${root.kz} + ${ushySuffix} + ${ediWord} → ${canonicalFormKz}`,
          literalMeaningRu: `Твёрдая уверенность («обязательно бы сделал» или «раньше бывало делал»): «${canonicalFormKz}».`,
          mergerCapsule: joinedUshy.capsule,
          selectionRuleSummaryRu: `Кусочек «-${ushySuffix}» начинается с «у», поэтому на стыке срабатывает то же слияние, что и в инфинитиве на «-у».`,
          sourceBadge,
        },
      };
    }

    const aor = pickAoristArSuffix(root.kz);
    const joinedAr = joinWithBoundaryMerger(root.kz, aor.suffix);
    if (formulaId === 'T105_SUPPOSE_ARMYN') {
      const pers = pickFullPersonalEnding(joinedAr.mergedWord, person, {
        rowOverride: root.vowelRow,
        thirdPersonHasDyDi: false,
      });
      const canonicalFormKz = joinedAr.mergedWord + pers.suffix;
      const fullFormWithBracketsKz = `мүмкін ${personMeta.pronounKz} ${canonicalFormKz}`;
      return {
        formulaId,
        topicNumber: 105,
        rootId: root.id,
        person,
        sentenceType: 'affirmative',
        beforeCheck: {
          promptRu: `Наверное (возможно), ${personMeta.pronounKz} (${personMeta.labelRu}) ${root.ruGloss ?? root.ru}`,
          personHint,
          monochromeStemDisplay: `${root.kz} + [ ___ ] + ${pers.suffix}`,
          rootTranslationHint,
          stage1Options: aor.options,
        },
        afterCheck: {
          canonicalFormKz,
          fullFormWithBracketsKz,
          acceptedFormsKz: [
            canonicalFormKz,
            fullFormWithBracketsKz,
            `${personMeta.pronounKz} ${canonicalFormKz}`,
            `мүмкін ${canonicalFormKz}`,
          ],
          coloredSegments: [
            {
              text: '(мүмкін)',
              color: 'green',
              glossRu: 'возможно (необязательно)',
              role: 'particle',
              isOptionalBracket: true,
            },
            {
              text: joinedAr.mergedWord,
              color: getTenColorForRow(root.vowelRow),
              glossRu: `наверное ${root.ru}`,
              role: 'root',
            },
            ...(pers.suffix
              ? [
                  {
                    text: pers.suffix,
                    color: pers.color,
                    glossRu: personMeta.labelRu,
                    role: 'core_block' as const,
                    coreBlockId: 'KB-3' as const,
                  },
                ]
              : []),
          ],
          formulaChainText: `${root.kz} + ${aor.suffix}${pers.suffix ? ' + ' + pers.suffix : ''} → ${canonicalFormKz}`,
          literalMeaningRu: `Предположение о будущем («наверное, сделаю / пожалуй, пойду»): «${canonicalFormKz}».`,
          mergerCapsule: joinedAr.capsule,
          selectionRuleSummaryRu: `${aor.ruleRu} ${pers.ruleRu}`,
          sourceBadge,
        },
      };
    }

    // T40_COND_AR_EDI
    const shortEdi = pickShortPersonalEnding('soft', person);
    const ediWord = `еді${shortEdi.suffix}`;
    const canonicalFormKz = `${joinedAr.mergedWord} ${ediWord}`;
    return {
      formulaId,
      topicNumber: 40,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `${personMeta.pronounKz} (${personMeta.labelRu}), возможно, ${root.ruGloss ?? root.ru} бы`,
        personHint,
        monochromeStemDisplay: `${root.kz} + [ ___ ] ${ediWord}`,
        rootTranslationHint,
        stage1Options: aor.options,
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz: `${personMeta.pronounKz} ${canonicalFormKz}`,
        acceptedFormsKz: [
          canonicalFormKz,
          `${personMeta.pronounKz} ${canonicalFormKz}`,
        ],
        coloredSegments: [
          {
            text: joinedAr.mergedWord,
            color: getTenColorForRow(root.vowelRow),
            glossRu: `${root.ru} + -${aor.suffix}`,
            role: 'root',
          },
          {
            text: ediWord,
            color: 'green',
            glossRu: 'бы (был)',
            role: 'auxiliary',
          },
        ],
        formulaChainText: `${root.kz} + ${aor.suffix} + ${ediWord} → ${canonicalFormKz}`,
        literalMeaningRu: `Мягкое предположительное «сделал бы»: «${canonicalFormKz}».`,
        mergerCapsule: joinedAr.capsule,
        selectionRuleSummaryRu: `${aor.ruleRu} Слово «еді» всегда мягкое → короткий личный хвост после него тоже мягкий.`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 8: ОДНОВРЕМЕННОСТЬ «КОГДА СДЕЛАЛ» (-ғанда / -ғанымда) (Темы 49, 50)
  // --------------------------------------------------------------------------
  if (formulaId === 'T49_WHEN_GANDA' || formulaId === 'T50_WHEN_PERSONAL_GANDA') {
    const gan = pickParticipleGanSuffix(root.kz);
    const stemGan = root.kz + gan.suffix;
    if (formulaId === 'T49_WHEN_GANDA') {
      const da = root.vowelRow === 'hard' ? 'да' : 'де';
      const canonicalFormKz = `${stemGan}${da}`;
      return {
        formulaId,
        topicNumber: 49,
        rootId: root.id,
        person,
        sentenceType: 'affirmative',
        beforeCheck: {
          promptRu: `Когда ${personMeta.pronounKz} (${personMeta.labelRu}) ${root.ruGloss ?? root.ru}`,
          personHint,
          monochromeStemDisplay: `${root.kz} + [ ___ ]`,
          rootTranslationHint,
          stage1Options: ['ғанда', 'генде', 'қанда', 'кенде'].map((val) => ({
            value: val,
            isCorrect: val === `${gan.suffix}${da}`,
            reasonRu:
              val === `${gan.suffix}${da}`
                ? `${gan.ruleRu} Плюс местный падеж «-${da}» («в момент делания»).`
                : `Для «${root.kz}» нужен кусочек «-${gan.suffix}${da}».`,
          })),
        },
        afterCheck: {
          canonicalFormKz,
          fullFormWithBracketsKz: `${personMeta.pronounKz} ${canonicalFormKz}`,
          acceptedFormsKz: [
            canonicalFormKz,
            `${personMeta.pronounKz} ${canonicalFormKz}`,
            `${stemGan} кезде`,
            `${personMeta.pronounKz} ${stemGan} кезде`,
          ],
          coloredSegments: [
            {
              text: root.kz,
              color: getTenColorForRow(root.vowelRow),
              glossRu: root.ru,
              role: 'root',
            },
            {
              text: gan.suffix,
              color: gan.color,
              glossRu: 'свершившееся',
              role: 'suffix',
            },
            {
              text: da,
              color: getTenColorForRow(root.vowelRow),
              glossRu: 'в (в тот момент, когда)',
              role: 'core_block',
              coreBlockId: 'KB-8',
            },
          ],
          formulaChainText: `${root.kz} + ${gan.suffix} + ${da} → ${canonicalFormKz}`,
          literalMeaningRu: `Буквально: «в момент сделанного-${root.ru}» (равнозначно «${stemGan} кезде»).`,
          selectionRuleSummaryRu: gan.ruleRu,
          sourceBadge,
        },
      };
    }

    // T50_WHEN_PERSONAL_GANDA (барғанымда, барғаныңда, барғанында)
    const poss = pickPossessiveSuffix(stemGan, person, root.vowelRow, true);
    const isThird =
      person === 'ol' ||
      person === 'ol_kisi' ||
      person === 'olar' ||
      person === 'ol_kisiler';
    const loc = pickCaseSuffix(stemGan + poss.suffix, 'locative', {
      rowOverride: root.vowelRow,
      afterPossessive: isThird ? '3' : '1_2',
    });
    const canonicalFormKz = `${stemGan}${poss.suffix}${loc.suffix}`;
    const fullFormWithBracketsKz = `${personMeta.genitiveKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: 50,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `Когда (${personMeta.genitiveKz}) ${root.ruGloss ?? root.ru} (с личным хвостом внутри слова)`,
        personHint: `${personMeta.genitiveKz} (${personMeta.labelRu})`,
        monochromeStemDisplay: `${stemGan} + [ ___ ] + ${loc.suffix}`,
        rootTranslationHint,
        stage1Options: ensureInPool(poss.suffix, [
          'ым',
          'ім',
          'ың',
          'ің',
          'ыңыз',
          'іңіз',
          'ы',
          'і',
        ]).map((val) => ({
          value: val,
          isCorrect: val === poss.suffix,
          reasonRu:
            val === poss.suffix
              ? poss.ruleRu
              : `После «${stemGan}» для лица «${personMeta.genitiveKz}» нужен хвост «-${poss.suffix}».`,
        })),
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [
          canonicalFormKz,
          fullFormWithBracketsKz,
          `${personMeta.pronounKz} ${stemGan}${root.vowelRow === 'hard' ? 'да' : 'де'}`,
        ],
        coloredSegments: [
          {
            text: root.kz,
            color: getTenColorForRow(root.vowelRow),
            glossRu: root.ru,
            role: 'root',
          },
          {
            text: gan.suffix,
            color: gan.color,
            glossRu: 'сделанное',
            role: 'suffix',
          },
          {
            text: poss.suffix,
            color: poss.color,
            glossRu: `чьё (${personMeta.labelRu})`,
            role: 'core_block',
            coreBlockId: 'KB-2',
          },
          {
            text: loc.suffix,
            color: loc.color,
            glossRu: 'в момент (местный падеж)',
            role: 'core_block',
            coreBlockId: 'KB-8',
          },
        ],
        formulaChainText: `${root.kz} + ${gan.suffix} + ${poss.suffix} + ${loc.suffix} → ${canonicalFormKz}`,
        literalMeaningRu: `Буквально: «в моём/твоём/его сделанном (${canonicalFormKz})». В 3-м лице перед «-да/-де» появляется вставная «н» (зелёный значок ③): «-ында/-інде».`,
        selectionRuleSummaryRu: `${gan.ruleRu} ${poss.ruleRu} ${loc.ruleRu}`,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 10–11: ОБЛАДАНИЕ «У МЕНЯ ЕСТЬ / НЕТ» (Темы 56, 64)
  // --------------------------------------------------------------------------
  if (formulaId === 'T64_GEN_POSS_BAR') {
    const nounRoot = root.pos === 'noun' ? root : ROOTS_BY_ID['kitap'];
    // T64_GEN_POSS_BAR: (менің) кітабым бар
    const poss = pickPossessiveSuffix(
      nounRoot.kz,
      person,
      nounRoot.vowelRow,
      false
    );
    const joinedNoun = joinWithBoundaryMerger(nounRoot.kz, poss.suffix);
    const canonicalFormKz = `${joinedNoun.mergedWord} бар`;
    const fullFormWithBracketsKz = `${personMeta.genitiveKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: 64,
      rootId: nounRoot.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `У (${personMeta.labelRu}) вообще есть ${nounRoot.ru} (моё/твоё имущество, родные, время)`,
        personHint: `${personMeta.genitiveKz} (${personMeta.labelRu})`,
        monochromeStemDisplay: `${nounRoot.kz} + [ ___ ] бар`,
        rootTranslationHint: `${nounRoot.kz} — ${nounRoot.ru}`,
        stage1Options: ensureInPool(poss.suffix, [
          'м',
          'ым',
          'ім',
          'ң',
          'ың',
          'ің',
          'сы',
          'сі',
          'ы',
          'і',
        ]).map((val) => ({
          value: val,
          isCorrect: val === poss.suffix,
          reasonRu:
            val === poss.suffix
              ? poss.ruleRu
              : `Для слова «${nounRoot.kz}» и лица «${personMeta.genitiveKz}» нужен хвост «-${poss.suffix}».`,
        })),
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [
          canonicalFormKz,
          fullFormWithBracketsKz,
          `${personMeta.locativeKz} ${nounRoot.kz} бар`,
        ],
        coloredSegments: [
          {
            text: `(${personMeta.genitiveKz})`,
            color: getTenColorForRow(getVowelRow(personMeta.genitiveKz)),
            glossRu: 'чьё (можно опустить)',
            role: 'pronoun',
            isOptionalBracket: true,
          },
          {
            text: joinedNoun.mergedWord,
            color: getTenColorForRow(nounRoot.vowelRow),
            glossRu: `${nounRoot.ru} + -${poss.suffix}`,
            role: 'root',
            coreBlockId: 'KB-2',
          },
          {
            text: 'бар',
            color: 'red',
            glossRu: 'есть / существует',
            role: 'auxiliary',
          },
        ],
        formulaChainText: `${nounRoot.kz} + ${poss.suffix} + бар → ${canonicalFormKz}`,
        literalMeaningRu: `Буквально: «(${personMeta.genitiveKz}) моя/твоя ${nounRoot.ru} есть».`,
        mergerCapsule: joinedNoun.capsule,
        selectionRuleSummaryRu: poss.ruleRu,
        sourceBadge,
      },
    };
  }

  // --------------------------------------------------------------------------
  // ГЛАВА 25: ПРИЧАСТИЕ С ОБРАТНЫМ ПОРЯДКОМ СЛОВ ← (Тема 121: оқыған кітабым)
  // --------------------------------------------------------------------------
  if (formulaId === 'T121_PART_OBJECT_POSS') {
    const objId = root.compatibleObjects?.[0] ?? 'kitap';
    const objRoot = ROOTS_BY_ID[objId] ?? ROOTS_BY_ID['kitap'];
    const gan = pickParticipleGanSuffix(root.kz);
    const partWord = root.kz + gan.suffix;
    const poss = pickPossessiveSuffix(
      objRoot.kz,
      person,
      objRoot.vowelRow,
      false
    );
    const joinedObj = joinWithBoundaryMerger(objRoot.kz, poss.suffix);
    const canonicalFormKz = `${partWord} ${joinedObj.mergedWord}`;
    const fullFormWithBracketsKz = `${personMeta.genitiveKz} ${canonicalFormKz}`;

    return {
      formulaId,
      topicNumber: 121,
      rootId: root.id,
      person,
      sentenceType: 'affirmative',
      beforeCheck: {
        promptRu: `${objRoot.ru}, которую/которого ${personMeta.pronounKz} (${personMeta.labelRu}) ${root.ruGloss ?? root.ru} (← обратный порядок!)`,
        personHint: `${personMeta.genitiveKz} (${personMeta.labelRu})`,
        monochromeStemDisplay: `${partWord} ${objRoot.kz} + [ ___ ]`,
        rootTranslationHint: `${root.kz} — ${root.ru}, ${objRoot.kz} — ${objRoot.ru}`,
        stage1Options: ensureInPool(poss.suffix, [
          'м',
          'ым',
          'ім',
          'ң',
          'ың',
          'ің',
          'сы',
          'сі',
          'ы',
          'і',
        ]).map((val) => ({
          value: val,
          isCorrect: val === poss.suffix,
          reasonRu:
            val === poss.suffix
              ? `Верно! В казахском хвост «кто сделал» («-${poss.suffix}») вешается не на глагол, а на сам предмет «${objRoot.kz}» в конце!`
              : `Хвост принадлежности вешается на слово «${objRoot.kz}» для лица «${personMeta.genitiveKz}» → «-${poss.suffix}».`,
        })),
      },
      afterCheck: {
        canonicalFormKz,
        fullFormWithBracketsKz,
        acceptedFormsKz: [canonicalFormKz, fullFormWithBracketsKz],
        coloredSegments: [
          {
            text: `(${personMeta.genitiveKz})`,
            color: getTenColorForRow(getVowelRow(personMeta.genitiveKz)),
            glossRu: 'кто сделал (можно опустить)',
            role: 'pronoun',
            isOptionalBracket: true,
          },
          {
            text: partWord,
            color: getTenColorForRow(root.vowelRow),
            glossRu: `прочитанный / сделанный (${root.ru})`,
            role: 'suffix',
          },
          {
            text: joinedObj.mergedWord,
            color: getTenColorForRow(objRoot.vowelRow),
            glossRu: `${objRoot.ru} + мой/твой (-${poss.suffix})`,
            role: 'root',
            coreBlockId: 'KB-2',
          },
        ],
        formulaChainText: `(${personMeta.genitiveKz}) + ${root.kz}+${gan.suffix} + ${objRoot.kz}+${poss.suffix} → ${canonicalFormKz}`,
        literalMeaningRu: `← Обратный порядок слов: по-русски «${objRoot.ru}, которую я ${root.ruGloss ?? root.ru}», а по-казахски буквально «(моя) прочитанная ${objRoot.ru}-моя (${canonicalFormKz})»!`,
        mergerCapsule: joinedObj.capsule,
        selectionRuleSummaryRu: `${gan.ruleRu} На определяемый предмет «${objRoot.kz}» ставится хвост принадлежности деятеля: ${poss.ruleRu}`,
        sourceBadge,
      },
    };
  }

  throw new RangeError(`Unknown or unsupported formulaId: ${formulaId}`);
}

