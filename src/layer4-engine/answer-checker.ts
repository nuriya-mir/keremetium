import {
  BoundaryMergerCapsule,
  BuiltFormResult,
  CoreBlockId,
  PersonId,
} from '../types';
import { ROOTS_BY_ID, PERSONS } from '../layer2-kazakh/roots';
import { buildForm } from '../layer2-kazakh/form-builder';

/**
 * Слой 4: 5-шаговый проверяльщик ответов без участия ИИ (К21, К30, К31, К33)
 * и трекер уверенности по 9 сквозным кубикам + расписание возвратов (К8, К22).
 */

export type AnswerCheckStatus =
  | 'correct'                 // Точное совпадение с основной формой (со скобками или без)
  | 'correct_synonym'         // Смысл передан верно соседней формулой (например, қажет вместо керек)
  | 'correct_with_root_typo'  // Грамматический кусочек верный, мелкая опечатка в 1 букву внутри корня (К21)
  | 'boundary_merger_error'   // Кусочки выбраны верно, но забыто слияние/озвончение на стыке (К30, КБ-9)
  | 'grammatical_error';      // Ошибка в самом кусочке формулы (ряд гласных, глухость/звонкость, лицо)

export interface AnswerCheckOutcome {
  isPassed: boolean;
  status: AnswerCheckStatus;
  normalizedUserAnswer: string;
  canonicalFormKz: string;
  feedbackTitleRu: string;
  feedbackDetailRu: string;
  diagnostic?: {
    kind: 'person' | 'suffix' | 'root' | 'unknown';
    expectedPerson?: PersonId;
    actualPerson?: PersonId;
    expectedText?: string;
    actualText?: string;
  };
  /** Если сработала ловушка стыка букв — возвращаем готовую овальную капсулу (К30) */
  mergerCapsule?: BoundaryMergerCapsule;
  /** Какой сквозной кубик стоит подсветить или мягко повторить (К31) */
  triggeredCoreBlockId?: CoreBlockId;
}

/** Таблица замены латинских букв-двойников на казахскую кириллицу (Шаг 1, К21) */
const LATIN_TO_CYRILLIC_HOMOGLYPHS: Record<string, string> = {
  a: 'а',
  e: 'е',
  i: 'і',
  o: 'о',
  c: 'с',
  p: 'р',
  x: 'х',
  y: 'у',
  h: 'һ',
  k: 'к',
  m: 'м',
  t: 'т',
  b: 'в',
};

/**
 * Шаг 1 проверяльщика: Нормализация ввода.
 * Убирает лишние пробелы, конечные знаки препинания (., !, ?), переводит в нижний регистр
 * и заменяет случайно введённые латинские буквы-двойники (i → і, a → а, o → о, e → е, c → с, p → р, h → һ).
 */
export function normalizeKazakhInput(raw: string): string {
  const lower = raw
    .trim()
    .toLowerCase()
    .replace(/[?.!,;:«»"()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let out = '';
  for (const ch of lower) {
    out += LATIN_TO_CYRILLIC_HOMOGLYPHS[ch] ?? ch;
  }
  return out;
}

/** Расстояние Левенштейна для проверки 1-буквенной опечатки внутри корня (Шаг 5, К21) */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[a.length][b.length];
}

/** Набор казахских специфических пар, которые в корне могут быть случайной опечаткой при верном суффиксе */
const KAZAKH_ROOT_TYPO_PAIRS = new Set([
  'ұ:у',
  'у:ұ',
  'ү:у',
  'у:ү',
  'ө:о',
  'о:ө',
  'ә:а',
  'а:ә',
]);

/**
 * 5-шаговый проверяльщик ответа (К21):
 * 1. Нормализация (латинские буквы-двойники, регистр, пробелы, знаки препинания)
 * 2. Снятие необязательных скобок ((менің), (мен), (егер), (мүмкін))
 * 3. Сверка с синонимичными конструкциями (К33 п. 3)
 * 4. Проверка слияния на стыке (овальная капсула К30, КБ-9)
 * 5. Отделение 1-буквенной опечатки в длинном корне от ошибки в грамматическом кусочке
 */
export function checkUserAnswer(
  userRawInput: string,
  builtForm: BuiltFormResult
): AnswerCheckOutcome {
  const normalizedUser = normalizeKazakhInput(userRawInput);
  const canonical = normalizeKazakhInput(builtForm.afterCheck.canonicalFormKz);
  const fullBracket = builtForm.afterCheck.fullFormWithBracketsKz
    ? normalizeKazakhInput(builtForm.afterCheck.fullFormWithBracketsKz)
    : null;

  // --- ШАГ 1 и ШАГ 2: Точное совпадение с основной формой или формой со скобками ---
  if (normalizedUser === canonical || (fullBracket && normalizedUser === fullBracket)) {
    return {
      isPassed: true,
      status: 'correct',
      normalizedUserAnswer: normalizedUser,
      canonicalFormKz: builtForm.afterCheck.canonicalFormKz,
      feedbackTitleRu: 'Верно!',
      feedbackDetailRu: builtForm.afterCheck.selectionRuleSummaryRu,
      mergerCapsule: builtForm.afterCheck.mergerCapsule,
    };
  }

  // --- ШАГ 3: Проверка равнозначных синонимичных форм (К33 п. 3) ---
  const normalizedAccepted = builtForm.afterCheck.acceptedFormsKz.map((f) =>
    normalizeKazakhInput(f)
  );
  if (normalizedAccepted.includes(normalizedUser)) {
    return {
      isPassed: true,
      status: 'correct_synonym',
      normalizedUserAnswer: normalizedUser,
      canonicalFormKz: builtForm.afterCheck.canonicalFormKz,
      feedbackTitleRu: 'Верно! Смысл передан точно.',
      feedbackDetailRu: `Твой вариант «${normalizedUser}» абсолютно правильный и живой. А в текущей тренируемой формуле эта же мысль собирается так: «${builtForm.afterCheck.canonicalFormKz}».`,
      mergerCapsule: builtForm.afterCheck.mergerCapsule,
    };
  }

  // --- ШАГ 4: Проверка ошибки слияния / озвончения на стыке (К30, КБ-9) ---
  // Если в форме есть капсула слияния (например, тап + а = таба, оқы + й = оқи, кітап + ым = кітабым),
  // проверим, не написал ли пользователь «сырую» неслитую склейку (тапамын, оқыймын, кітапым, оқыуым керек)
  if (builtForm.afterCheck.mergerCapsule) {
    const cap = builtForm.afterCheck.mergerCapsule;
    const rawUnmergedPiece = cap.beforePieces.replace(/\s*\+\s*/g, '');
    const unmergedCanonical = canonical.replace(
      cap.mergedResult,
      rawUnmergedPiece
    );
    const unmergedFull = fullBracket
      ? fullBracket.replace(cap.mergedResult, rawUnmergedPiece)
      : null;

    if (
      normalizedUser === unmergedCanonical ||
      (unmergedFull && normalizedUser === unmergedFull)
    ) {
      return {
        isPassed: false,
        status: 'boundary_merger_error',
        normalizedUserAnswer: normalizedUser,
        canonicalFormKz: builtForm.afterCheck.canonicalFormKz,
        feedbackTitleRu: 'Проверь изменение звука на границе',
        feedbackDetailRu: cap.explanationRu,
        mergerCapsule: cap,
        triggeredCoreBlockId: 'KB-9',
      };
    }
  }

  // A valid form for another person is a person error, never a vowel error.
  for (const actualPerson of Object.keys(PERSONS) as PersonId[]) {
    if (actualPerson === builtForm.person) continue;
    const other = buildForm(builtForm.formulaId, builtForm.rootId, actualPerson);
    if (other.afterCheck.acceptedFormsKz.some(form => normalizeKazakhInput(form) === normalizedUser)) {
      const personBlock = builtForm.afterCheck.coloredSegments.find(segment =>
        segment.coreBlockId === 'KB-2' || segment.coreBlockId === 'KB-3'
      )?.coreBlockId;
      return {
        isPassed: false,
        status: 'grammatical_error',
        normalizedUserAnswer: normalizedUser,
        canonicalFormKz: builtForm.afterCheck.canonicalFormKz,
        feedbackTitleRu: 'Проверь лицо',
        feedbackDetailRu: `Ответ относится к «${PERSONS[actualPerson].labelRu}». В задании выбрано «${PERSONS[builtForm.person].labelRu}».`,
        diagnostic: { kind: 'person', expectedPerson: builtForm.person, actualPerson,
          expectedText: builtForm.afterCheck.canonicalFormKz, actualText: normalizedUser },
        triggeredCoreBlockId: personBlock,
      };
    }
  }

  // Only a changed root with the COMPLETE, exact grammatical tail can be a typo.
  // Keep the boundary letter intact: changing it can change the required suffix.
  const rootObj = ROOTS_BY_ID[builtForm.rootId];
  if (rootObj && rootObj.kz.length >= 3 && !builtForm.afterCheck.mergerCapsule) {
    for (const expected of normalizedAccepted) {
      const rootStart = expected.indexOf(rootObj.kz);
      if (rootStart < 0 || (rootStart > 0 && expected[rootStart - 1] !== ' ')) continue;
      const prefix = expected.slice(0, rootStart);
      const tail = expected.slice(rootStart + rootObj.kz.length);
      if (!tail || !normalizedUser.startsWith(prefix) || !normalizedUser.endsWith(tail)) continue;
      const userRoot = normalizedUser.slice(prefix.length, normalizedUser.length - tail.length);
      if (userRoot.length < 2 || /\s/.test(userRoot) || userRoot.slice(-1) !== rootObj.kz.slice(-1)) continue;
      // A different dictionary root is a different action, not a typing accident.
      if (Object.values(ROOTS_BY_ID).some(root => root.kz === userRoot)) continue;
      if (editDistance(userRoot, rootObj.kz) === 1) {
        return {
          isPassed: true,
          status: 'correct_with_root_typo',
          normalizedUserAnswer: normalizedUser,
          canonicalFormKz: builtForm.afterCheck.canonicalFormKz,
          feedbackTitleRu: 'Засчитано: окончание верное',
          feedbackDetailRu: `В корне есть описка. Правильный корень: «${rootObj.kz}». Полная форма: «${builtForm.afterCheck.canonicalFormKz}».`,
          diagnostic: { kind: 'root', expectedText: rootObj.kz, actualText: userRoot },
        };
      }
    }
  }

  const rootUnchanged = !!rootObj && canonical.startsWith(rootObj.kz) && normalizedUser.startsWith(rootObj.kz);
  return {
    isPassed: false,
    status: 'grammatical_error',
    normalizedUserAnswer: normalizedUser,
    canonicalFormKz: builtForm.afterCheck.canonicalFormKz,
    feedbackTitleRu: rootUnchanged ? 'Проверь суффикс и окончание' : 'Сравни ответ с формой',
    feedbackDetailRu: rootUnchanged
      ? `Корень написан верно. Проверь часть после корня: «${canonical.slice(rootObj!.kz.length)}».`
      : `Для выбранного действия и лица нужна форма «${builtForm.afterCheck.canonicalFormKz}».`,
    triggeredCoreBlockId: canonical.includes('уым') && normalizedUser === canonical.replace('уым', 'ум')
      ? 'KB-2' : undefined,
    diagnostic: { kind: rootUnchanged ? 'suffix' : 'unknown',
      expectedText: rootUnchanged ? canonical.slice(rootObj!.kz.length) : canonical,
      actualText: rootUnchanged ? normalizedUser.slice(rootObj!.kz.length) : normalizedUser },
    mergerCapsule: builtForm.afterCheck.mergerCapsule,
  };
}

// ============================================================================
// Трекер уверенности по 9 сквозным кубикам и интервалов возврата (К8, К22, К31)
// ============================================================================

export interface UserProgressState {
  /** Счётчик уверенности (0..100) по каждому из 9 сквозных базовых кубиков (К31) */
  coreBlockConfidence: Record<CoreBlockId, number>;
  /** Пройденная ступень (0..8) и дата следующего возврата по каждой формуле */
  formulaProgress: Record<
    string,
    {
      currentStage: number; // 0..8
      consecutiveSuccesses: number;
      nextReviewIsoDate: string;
    }
  >;
  /** Отмеченные галочкой «знаю» корни (для скрытия тихой подсказки перевода, К32) */
  knownRootIds: string[];
}

export function createInitialProgressState(): UserProgressState {
  return {
    coreBlockConfidence: {
      'KB-1': 50,
      'KB-2': 50,
      'KB-3': 50,
      'KB-4': 50,
      'KB-5': 50,
      'KB-6': 50,
      'KB-7': 50,
      'KB-8': 50,
      'KB-9': 50,
    },
    formulaProgress: {},
    knownRootIds: [],
  };
}

const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21];

export function updateProgressAfterAnswer(
  state: UserProgressState,
  formulaId: string,
  outcome: AnswerCheckOutcome,
  now = new Date()
): UserProgressState {
  const nextState: UserProgressState = {
    coreBlockConfidence: { ...state.coreBlockConfidence },
    formulaProgress: { ...state.formulaProgress },
    knownRootIds: [...state.knownRootIds],
  };

  if (outcome.triggeredCoreBlockId) {
    const prev = nextState.coreBlockConfidence[outcome.triggeredCoreBlockId] ?? 50;
    nextState.coreBlockConfidence[outcome.triggeredCoreBlockId] = outcome.isPassed
      ? Math.min(100, prev + 8)
      : Math.max(0, prev - 15);
  }

  const prevFormula = nextState.formulaProgress[formulaId] ?? {
    currentStage: 1,
    consecutiveSuccesses: 0,
    nextReviewIsoDate: now.toISOString(),
  };

  const consecutiveSuccesses = outcome.isPassed
    ? prevFormula.consecutiveSuccesses + 1
    : 0;
  const intervalDays = outcome.isPassed
    ? REVIEW_INTERVAL_DAYS[
        Math.min(consecutiveSuccesses - 1, REVIEW_INTERVAL_DAYS.length - 1)
      ]
    : 1;

  const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  nextState.formulaProgress[formulaId] = {
    currentStage: outcome.isPassed
      ? Math.min(8, prevFormula.currentStage + 1)
      : Math.max(2, prevFormula.currentStage),
    consecutiveSuccesses,
    nextReviewIsoDate: nextDate.toISOString(),
  };

  return nextState;
}
