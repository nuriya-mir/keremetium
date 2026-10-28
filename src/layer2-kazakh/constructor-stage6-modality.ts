import { buildForm } from './form-builder';
import { getFormulaSegments, type FormulaSegment } from './formula-segments';
import { joinWithBoundaryMerger, pickCaseSuffix, pickQuestionParticle, pickVerbNegationSuffix, pickFullPersonalEnding, pickPossessiveSuffix } from './phonetics';
import { PERSONS, ROOTS_BY_ID } from './roots';
import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Gender, type ConstructorStage4Person, type ConstructorStage4Result, type ConstructorStage4Step } from './constructor-stage4';
import type { ExplanationSegment } from './explanation-segments';
import type { ConstructorStage6ModalitySourceId } from './constructor-stage6-modality-evidence';

/** Separate prepared package: no explorer registration or claim of app readiness. */
export const CONSTRUCTOR_STAGE6_MODALITY_WORD_IDS = ['ish', 'bar', 'kel', 'jaz', 'ait', 'kor', 'oqy', 'tap', 'al', 'ber', 'soile', 'jur'] as const;
export type ConstructorStage6ModalityWord = typeof CONSTRUCTOR_STAGE6_MODALITY_WORD_IDS[number];
export type ConstructorStage6ModalityKind = 'desire' | 'ability' | 'necessity' | 'prohibition';
export type ConstructorStage6ModalityTime = 'present' | 'past' | 'future';
export type ConstructorStage6ModalityNegation = 'none' | 'modal' | 'action';
export interface ConstructorStage6ModalityInput {
  kind: ConstructorStage6ModalityKind;
  wordId: ConstructorStage6ModalityWord;
  person: ConstructorStage4Person;
  gender?: ConstructorStage4Gender;
  /** Time of wanting / being able / needing; it does not set the action's date. */
  time: ConstructorStage6ModalityTime;
  /** Modal: do not want / cannot / do not need; action: want / can / need NOT to act. */
  negation: ConstructorStage6ModalityNegation;
  question: boolean;
}
export interface ConstructorStage6ModalityResult extends Omit<ConstructorStage4Result, 'sourceIds'> {
  translationRu: string;
  topicId: string | null;
  wordId: ConstructorStage6ModalityWord | null;
  sourceIds: ConstructorStage6ModalitySourceId[];
  formulaChainText: string;
  morphologySegments: ExplanationSegment[];
}

const INPUT_KEYS = ['kind', 'wordId', 'person', 'gender', 'time', 'negation', 'question'];
const normalized = (text: string) => text.normalize('NFC').toLocaleLowerCase('kk-KZ').trim().replace(/[.!?]+$/u, '').replace(/\s+/gu, ' ');
const sentence = (text: string, question: boolean) => text.charAt(0).toLocaleUpperCase('kk-KZ') + text.slice(1) + (question ? '?' : '.');

/** Strict selection: unsupported scope/time never silently becomes a different meaning. */
export function constructorStage6ModalityEligibility(input: ConstructorStage6ModalityInput): { supported: boolean; reasonRu: string | null; topicId: string | null } {
  let reasonRu: string | null = null;
  if (!input || typeof input !== 'object') reasonRu = 'Выбери подготовленный пример.';
  else if (Object.keys(input).some(key => !INPUT_KEYS.includes(key))) reasonRu = 'В этом примере меняются человек, действие, время отношения, область отрицания и общий вопрос. Другие участники и уточнения требуют отдельной фразы.';
  else if (!['desire', 'ability', 'necessity', 'prohibition'].includes(input.kind)) reasonRu = 'Выбери желание, возможность, необходимость или запрет.';
  else if (!CONSTRUCTOR_STAGE6_MODALITY_WORD_IDS.includes(input.wordId)) reasonRu = 'Выбери действие из подготовленного списка.';
  else if (!CONSTRUCTOR_STAGE4_PERSON_IDS.includes(input.person)) reasonRu = 'Выбери одно из восьми лиц.';
  else if (input.gender !== undefined && !['male', 'female'].includes(input.gender)) reasonRu = 'Выбери подготовленный русский вариант.';
  else if (!['present', 'past', 'future'].includes(input.time)) reasonRu = 'Выбери время желания, возможности или необходимости.';
  else if (!['none', 'modal', 'action'].includes(input.negation) || typeof input.question !== 'boolean') reasonRu = 'Укажи область отрицания и выбери сообщение или общий вопрос.';
  else if (input.kind === 'prohibition' && (input.negation !== 'modal' || input.time !== 'present')) reasonRu = 'Здесь подготовлен только нынешний запрет действия. Разрешение и запрет не делать требуют отдельного примера.';
  else if (input.negation === 'action' && input.kind === 'desire' && input.time !== 'present') reasonRu = 'Желание не делать подготовлено только сейчас. Прошлое и будущее этой фразы требуют отдельной проверки.';
  else if (input.negation === 'action' && input.kind === 'ability' && !['bar', 'kel'].includes(input.wordId)) reasonRu = 'Возможность не делать проверена здесь только для действий «идти» и «приходить». Она не означает разрешение.';
  else if (input.time === 'future') reasonRu = 'Будущее желание, возможность и необходимость здесь не собраны. Время действия не заменяет время этого отношения.';
  else if (input.time === 'past' && input.kind !== 'desire') reasonRu = 'В прошлом здесь разбирается только собственное желание. Прошлая возможность и необходимость требуют отдельных примеров.';
  if (reasonRu) return { supported: false, reasonRu, topicId: null };
  const topicId = input.kind === 'prohibition' ? 'KZ_PROHIBITION' : input.kind === 'desire' && input.negation === 'action' ? 'KZ_WANT_REFRAIN' : input.kind === 'ability' && input.negation === 'action' ? 'KZ_CAN_REFRAIN' : input.kind === 'desire' ? input.time === 'past' ? 'T86_WANT_PAST' : input.negation === 'modal' ? 'T84_WANT_NEG' : 'T83_WANT_PRESENT'
    : input.kind === 'ability' ? input.negation === 'modal' ? 'T73_CAN_NEG' : 'T72_CAN_PRESENT'
      : input.negation === 'action' ? 'T94_NEED_NEG_MAU_KEREK' : input.negation === 'modal' ? 'KZ_NEED_ABSENCE' : 'T93_NEED_KEREK';
  return { supported: true, reasonRu: null, topicId };
}

const NECESSITY_NEGATIVE_ACTION_RU: Record<ConstructorStage6ModalityWord, string> = {
  ish: 'пить', bar: 'идти', kel: 'приходить', jaz: 'писать', ait: 'говорить', kor: 'видеть',
  oqy: 'читать', tap: 'находить', al: 'брать', ber: 'давать', soile: 'разговаривать', jur: 'ходить',
};

export function constructorStage6ModalityThoughtRu(input: ConstructorStage6ModalityInput): string {
  if (!constructorStage6ModalityEligibility(input).supported) return '';
  const i = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person);
  const subject = input.person === 'ol' ? input.gender === 'female' ? 'Она' : 'Он' : ['Я', 'Ты', 'Вы', 'Он', 'Мы', 'Вы', 'Вы', 'Они'][i];
  const dative = input.person === 'ol' ? input.gender === 'female' ? 'Ей' : 'Ему' : ['Мне', 'Тебе', 'Вам', 'Ему', 'Нам', 'Вам', 'Вам', 'Им'][i];
  const action = (input.kind === 'necessity' && input.negation !== 'none') || input.negation === 'action' || input.kind === 'prohibition' ? NECESSITY_NEGATIVE_ACTION_RU[input.wordId] : ROOTS_BY_ID[input.wordId].ruGloss!;
  const past = ['men', 'sen', 'ol'].includes(input.person) ? input.gender === 'female' ? 'хотела' : 'хотел' : 'хотели';
  const modal = input.kind === 'desire' ? input.time === 'past' ? past : ['хочу', 'хочешь', 'хотите', 'хочет', 'хотим', 'хотите', 'хотите', 'хотят'][i]
    : ['могу', 'можешь', 'можете', 'может', 'можем', 'можете', 'можете', 'могут'][i];
  const possessive = input.person === 'ol' ? input.gender === 'female' ? 'У неё' : 'У него' : ['У меня', 'У тебя', 'У Вас', 'У него', 'У нас', 'У вас', 'У Вас', 'У них'][i];
  if (input.kind === 'prohibition') return `${dative} нельзя ${action}${input.question ? '?' : '.'}`;
  if (input.kind === 'ability' && input.negation === 'action') return `${possessive} есть возможность не ${action}${input.question ? '?' : '.'}`;
  const phrase = input.kind === 'necessity' ? `${dative} ${input.negation === 'modal' ? 'не нужно' : 'нужно'} ${input.negation === 'action' ? 'не ' : ''}${action}` : `${subject} ${input.negation === 'modal' ? 'не ' : ''}${modal} ${input.negation === 'action' ? 'не ' : ''}${action}`;
  return phrase + (input.question ? '?' : '.');
}

export function constructorStage6ModalityThoughtAliases(input: ConstructorStage6ModalityInput): string[] {
  const thought = constructorStage6ModalityThoughtRu(input);
  if (!thought) return [];
  if (input.kind === 'ability' && input.negation === 'action') {
    const i = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(input.person);
    const subject = input.person === 'ol' ? input.gender === 'female' ? 'Она' : 'Он' : ['Я', 'Ты', 'Вы', 'Он', 'Мы', 'Вы', 'Вы', 'Они'][i];
    const can = ['могу', 'можешь', 'можете', 'может', 'можем', 'можете', 'можете', 'могут'][i];
    const direct = `${subject} ${can} не ${NECESSITY_NEGATIVE_ACTION_RU[input.wordId]}${input.question ? '?' : '.'}`;
    return [...new Set([thought, direct, thought.replace(NECESSITY_NEGATIVE_ACTION_RU[input.wordId], ROOTS_BY_ID[input.wordId].ruGloss!), direct.replace(NECESSITY_NEGATIVE_ACTION_RU[input.wordId], ROOTS_BY_ID[input.wordId].ruGloss!)])];
  }
  if (input.kind === 'prohibition' || input.negation === 'action' && input.kind === 'desire') {
    return [...new Set([thought, thought.replace(NECESSITY_NEGATIVE_ACTION_RU[input.wordId], ROOTS_BY_ID[input.wordId].ruGloss!)])];
  }
  // Keep every old alias. New necessity examples also recognise the ordinary "надо".
  // Do not treat "можно не", "нельзя", "умею" or "смог" as interchangeable.
  if (input.kind === 'necessity' && input.negation !== 'none') {
    const originalAction = ROOTS_BY_ID[input.wordId].ruGloss!;
    const perfective = thought.replace(NECESSITY_NEGATIVE_ACTION_RU[input.wordId], originalAction);
    return [...new Set([thought, thought.replace('нужно', 'надо'), perfective, perfective.replace('нужно', 'надо')])];
  }
  return [thought];
}

function describedParts(parts: FormulaSegment[], input: ConstructorStage6ModalityInput, firstWord: string): ExplanationSegment[] {
  let auxiliary = false;
  return parts.map((part, index) => {
    if (part.role === 'auxiliary' || (index > 0 && part.separatorBefore === 'space')) auxiliary = true;
    const label = part.role === 'particle' || part.coreBlockId === 'KB-6' ? 'Вопросительная частица'
      : part.coreBlockId === 'KB-2' ? 'Окончание принадлежности'
        : part.coreBlockId === 'KB-3' ? 'Личное окончание'
          : auxiliary ? 'Часть сказуемого' : part.role === 'suffix' ? 'Суффикс желания' : 'Основа с суффиксом';
    const meaning = label === 'Вопросительная частица' ? 'Общий вопрос о выбранном сообщении. Частица пишется отдельно.'
      : part.coreBlockId === 'KB-2' ? input.kind === 'desire' ? 'Окончание показывает, кто хочет сам выполнить действие.' : 'Окончание показывает, кому нужно выполнить действие.'
        : part.coreBlockId === 'KB-3' ? 'Личное окончание вспомогательного слова показывает, кто может выполнить действие.'
          : auxiliary ? input.kind === 'desire' ? input.negation === 'modal' ? 'Отсутствие желания. Само действие не отрицается отдельно.' : input.time === 'past' ? 'Желание было в прошлом. Действие не объявлено выполненным.' : 'Слово желания. Желающий назван окончанием первого слова.'
            : input.kind === 'ability' ? input.negation === 'modal' ? 'Невозможность выполнить действие. Это не возможность отказаться от него.' : 'Возможность выполнить действие. Его выполнение не утверждается.' : 'Необходимость выполнить действие. Его выполнение не утверждается.'
            : input.kind === 'desire' && part.role === 'suffix' ? 'Суффикс передаёт желание выполнить действие.'
              : `Часть слова «${firstWord}». Выбранное действие: ${ROOTS_BY_ID[input.wordId].ruGloss}.`;
    return { ...part, label, glossRu: meaning, reasonRu: meaning, separatorBefore: index === 0 ? 'none' : part.separatorBefore };
  });
}

/** Reuses checked form builders. Question auxiliaries are built afresh, never trimmed by UI. */
/** Two separate scopes: absent necessity versus necessary non-performance. */
function buildNecessityNegation(input: ConstructorStage6ModalityInput, topicId: string): ConstructorStage6ModalityResult {
  const absent = input.negation === 'modal';
  const root = ROOTS_BY_ID[input.wordId];
  const sourceIds: ConstructorStage6ModalitySourceId[] = [absent ? 'stage6-modality-need-absence' : 'stage6-modality-need-refrain'];
  let parts: FormulaSegment[];
  let firstWord: string;
  let ending: string;
  if (absent) {
    const actionName = joinWithBoundaryMerger(root.kz, 'у').mergedWord;
    const genitive = pickCaseSuffix(actionName, 'genitive', { rowOverride: root.vowelRow });
    firstWord = actionName + genitive.suffix;
    ending = genitive.suffix;
    parts = [
      { text: actionName, glossRu: 'Название действия', color: 'ink', role: 'root', optional: false, separatorBefore: 'none' },
      { text: ending, glossRu: 'Окончание родительного падежа', color: 'ink', role: 'core_block', coreBlockId: 'KB-8', optional: false, separatorBefore: 'none' },
      { text: 'қажеті', glossRu: 'Необходимость этого действия', color: 'ink', role: 'auxiliary', optional: false, separatorBefore: 'space' },
      { text: 'жоқ', glossRu: 'Необходимости нет', color: 'ink', role: 'auxiliary', optional: false, separatorBefore: 'space' },
    ];
  } else {
    const base = buildForm('T94_NEED_NEG_MAU_KEREK', input.wordId, input.person);
    firstWord = base.afterCheck.canonicalFormKz.split(' ')[0];
    ending = base.afterCheck.coloredSegments.find(part => part.coreBlockId === 'KB-2')!.text;
    parts = getFormulaSegments(base).filter(part => !part.optional && part.text.trim());
  }
  parts = parts.map((part, index) => ({ ...part, separatorBefore: index === 0 ? 'none' : part.separatorBefore }));
  const predicate = parts.reduce((text, part) => text + (part.separatorBefore === 'space' ? ' ' : '') + part.text, '');
  const pronoun = absent ? PERSONS[input.person].dativeKz : PERSONS[input.person].genitiveKz;
  const particle = input.question ? pickQuestionParticle(predicate.split(' ').at(-1)!).particle : '';
  if (particle) {
    parts.push({ text: particle, glossRu: 'Общий вопрос', color: 'ink', role: 'particle', coreBlockId: 'KB-6', optional: false, separatorBefore: 'space' });
    sourceIds.push('stage6-modality-need-question');
  }
  const completePredicate = predicate + (particle ? ' ' + particle : '');
  const text = sentence(pronoun + ' ' + completePredicate, input.question);
  const thoughtRu = constructorStage6ModalityThoughtRu(input);
  const scope = absent
    ? 'Необходимости выполнять действие нет. Это не требование отказаться от действия и не запрет.'
    : 'Необходимость сохраняется: нужно воздержаться от действия. Это не отсутствие необходимости.';
  const steps: ConstructorStage4Step[] = [
    { id: 'subject', labelRu: 'Кому нужно', text: pronoun, explanationRu: absent ? 'Дательный падеж показывает, кому не требуется выполнять действие. В этой фразе человек назван явно.' : 'Местоимение связано с окончанием принадлежности первого слова.' },
    { id: 'action', labelRu: absent ? 'Какое действие' : 'Чего не делать', text: firstWord, explanationRu: absent ? 'Название действия получает родительный падеж: речь идёт о необходимости этого действия.' : 'Отрицание находится внутри названного действия. Окончание показывает, кому нужно воздержаться.' },
    { id: 'modality', labelRu: absent ? 'Не нужно' : 'Нужно не делать', text: predicate.slice(firstWord.length + 1), explanationRu: scope },
  ];
  if (particle) steps.push({ id: 'question', labelRu: 'Спросить', text: particle, explanationRu: 'Вопрос сохраняет выбранную область отрицания. После жоқ пишется па, после керек — пе.' });
  const morphologySegments: ExplanationSegment[] = parts.map((part, index) => {
    const questionPart = part.coreBlockId === 'KB-6';
    const label = questionPart ? 'Вопросительная частица' : part.coreBlockId === 'KB-2' ? 'Окончание принадлежности'
      : part.coreBlockId === 'KB-8' ? 'Окончание родительного падежа' : part.role === 'auxiliary' ? 'Часть сказуемого' : absent ? 'Название действия' : 'Отрицательное действие';
    const meaning = questionPart ? steps.at(-1)!.explanationRu : part.role === 'auxiliary' ? scope
      : part.coreBlockId === 'KB-2' ? 'Окончание показывает, кому нужно воздержаться от действия.'
        : part.coreBlockId === 'KB-8' ? 'Окончание связывает название действия со словом необходимости.'
          : absent ? 'Названное действие: ' + root.ruGloss + '. Само действие здесь не отрицается.' : 'Названо невыполнение действия: не ' + root.ruGloss + '.';
    return { ...part, label, glossRu: meaning, reasonRu: meaning, separatorBefore: index === 0 ? 'none' : part.separatorBefore };
  });
  return {
    status: 'ready', text, thoughtRu, translationRu: thoughtRu, topicId, wordId: input.wordId, steps,
    limits: [
      'Выбрано действие без предмета, места и другого исполнителя. Эти слова не добавляются автоматически.',
      'Срок самого действия здесь не выбирается. Рассматривается необходимость сейчас.',
      scope,
      'Необходимость воздержаться не подменяет отдельную модель запрета или разрешения.',
    ],
    sourceIds,
    // Without the dative subject all eight people would have the same full answer.
    acceptedAnswers: absent ? [text] : [text, sentence(completePredicate, input.question)],
    practice: {
      part: { id: 'practice-part', text: particle || ending, before: particle ? predicate + ' ' : firstWord.slice(0, -ending.length), after: '', explanationRu: particle ? steps.at(-1)!.explanationRu : absent ? 'Напиши окончание родительного падежа названного действия.' : 'Напиши окончание, которое показывает, кому нужно воздержаться.' },
      word: { id: 'practice-word', text: firstWord, labelRu: 'Напиши изменяемое слово целиком' },
    },
    formulaChainText: parts.map(part => part.text).join(' + ') + ' → ' + completePredicate,
    morphologySegments,
  };
}

/** Closed present recipes. None of these is made by moving the old modal negation. */
function buildWillActionNegation(input: ConstructorStage6ModalityInput, topicId: string): ConstructorStage6ModalityResult {
  const root = ROOTS_BY_ID[input.wordId];
  const prohibition = input.kind === 'prohibition';
  const desire = input.kind === 'desire';
  const actionName = prohibition ? joinWithBoundaryMerger(root.kz, 'у').mergedWord : root.kz + pickVerbNegationSuffix(root.kz, 'mau', root.vowelRow).suffix;
  const caseEnding = pickCaseSuffix(actionName, desire ? 'accusative' : 'dative', { rowOverride: root.vowelRow });
  const firstWord = actionName + caseEnding.suffix;
  const pronoun = prohibition ? PERSONS[input.person].dativeKz : desire ? PERSONS[input.person].pronounKz : PERSONS[input.person].genitiveKz;
  const scope = prohibition ? 'Сообщается запрет: делать это не разрешено. Это не невозможность и не отсутствие необходимости.'
    : desire ? 'Желание есть: человек хочет не выполнять действие. Отрицание относится к действию, а не к желанию.'
      : 'Есть возможность обойтись без действия. Это не разрешение и не невозможность выполнить действие.';
  const parts: FormulaSegment[] = [
    { text: actionName, glossRu: prohibition ? 'Название действия' : 'Несовершение действия', color: 'ink', role: 'root', optional: false, separatorBefore: 'none' },
    { text: caseEnding.suffix, glossRu: desire ? 'Окончание винительного падежа' : 'Окончание дательного падежа', color: 'ink', role: 'core_block', coreBlockId: 'KB-8', optional: false, separatorBefore: 'none' },
  ];
  let targetWord: string;
  let answerPart: string;
  let partBefore: string;
  if (desire) {
    const stem = 'қалай';
    const ending = pickFullPersonalEnding(stem, input.person, { thirdPersonHasDyDi: true, isQuestion: input.question }).suffix;
    targetWord = stem + ending;
    parts.push({ text: stem, glossRu: 'Хочет', color: 'ink', role: 'auxiliary', optional: false, separatorBefore: 'space' });
    if (ending) parts.push({ text: ending, glossRu: 'Личное окончание', color: 'ink', role: 'core_block', coreBlockId: 'KB-3', optional: false, separatorBefore: 'none' });
    answerPart = ending || targetWord;
    partBefore = ending ? stem : '';
  } else if (prohibition) {
    targetWord = firstWord;
    answerPart = caseEnding.suffix;
    partBefore = actionName;
    parts.push({ text: input.question ? 'болмай' : 'болмайды', glossRu: 'Не разрешено', color: 'ink', role: 'auxiliary', optional: false, separatorBefore: 'space' });
  } else {
    // A single available opportunity belongs to the person/group; it is not a plural list of opportunities.
    const ending = pickPossessiveSuffix('мүмкіндік', input.person, 'soft').suffix;
    targetWord = joinWithBoundaryMerger('мүмкіндік', ending).mergedWord;
    answerPart = ending;
    partBefore = targetWord.slice(0, -ending.length);
    parts.push(
      { text: partBefore, glossRu: 'Возможность', color: 'ink', role: 'auxiliary', optional: false, separatorBefore: 'space' },
      { text: ending, glossRu: 'Чья возможность', color: 'ink', role: 'core_block', coreBlockId: 'KB-2', optional: false, separatorBefore: 'none' },
      { text: 'бар', glossRu: 'Есть', color: 'ink', role: 'auxiliary', optional: false, separatorBefore: 'space' },
    );
  }
  const predicate = parts.reduce((text, part) => text + (part.separatorBefore === 'space' ? ' ' : '') + part.text, '');
  const particle = input.question ? pickQuestionParticle(predicate.split(' ').at(-1)!).particle : '';
  if (particle) parts.push({ text: particle, glossRu: 'Общий вопрос', color: 'ink', role: 'particle', coreBlockId: 'KB-6', optional: false, separatorBefore: 'space' });
  const completePredicate = predicate + (particle ? ' ' + particle : '');
  const text = sentence(pronoun + ' ' + completePredicate, input.question);
  const thoughtRu = constructorStage6ModalityThoughtRu(input);
  const steps: ConstructorStage4Step[] = [
    { id: 'subject', labelRu: prohibition ? 'Кому нельзя' : desire ? 'Кто хочет' : 'У кого есть возможность', text: pronoun, explanationRu: prohibition ? 'Дательный падеж называет человека, для которого действует запрет.' : desire ? 'Человек сам хочет не выполнять действие.' : 'Человек связан с окончанием слова возможности.' },
    { id: 'action', labelRu: prohibition ? 'Какое действие' : 'Чего не делать', text: firstWord, explanationRu: prohibition ? 'Само название действия положительное. Запрет выражен следующим словом.' : desire ? 'Отрицательное название действия стоит в винительном падеже перед словом желания.' : 'Отрицательное название действия стоит в дательном падеже перед словом возможности.' },
    { id: 'modality', labelRu: prohibition ? 'Нельзя делать' : desire ? 'Хочу не делать' : 'Есть возможность не делать', text: predicate.slice(firstWord.length + 1), explanationRu: scope },
  ];
  if (particle) steps.push({ id: 'question', labelRu: 'Спросить', text: particle, explanationRu: prohibition || desire ? 'Вопрос сохраняет смысл сообщения. В третьем лице перед частицей нет окончания утверждения.' : 'После бар вопросительная частица ма стоит отдельно. Возможность не становится разрешением.' });
  const sourceIds: ConstructorStage6ModalitySourceId[] = [prohibition ? 'wave3-will-prohibition' : desire ? 'wave3-will-desire-action' : 'wave3-will-opportunity-action'];
  if (!desire && !prohibition) sourceIds.push('wave3-will-personal-opportunity');
  if (particle || desire) sourceIds.push('wave3-will-person-and-question');
  const morphologySegments: ExplanationSegment[] = parts.map((part, index) => {
    const label = part.coreBlockId === 'KB-6' ? 'Вопросительная частица' : part.coreBlockId === 'KB-8' ? 'Окончание падежа' : part.coreBlockId === 'KB-3' ? 'Личное окончание' : part.coreBlockId === 'KB-2' ? 'Окончание принадлежности' : index === 0 ? prohibition ? 'Название действия' : 'Отрицательное действие' : 'Часть сказуемого';
    const reasonRu = part.coreBlockId === 'KB-6' ? steps.at(-1)!.explanationRu : part.coreBlockId === 'KB-8' ? steps[1].explanationRu : part.coreBlockId === 'KB-2' ? 'Окончание связывает возможность с выбранным человеком или группой.' : part.coreBlockId === 'KB-3' ? 'Окончание показывает, кто хочет не выполнять действие.' : index === 0 ? steps[1].explanationRu : scope;
    return { ...part, label, reasonRu, glossRu: reasonRu };
  });
  return {
    status: 'ready', text, thoughtRu, translationRu: thoughtRu, topicId, wordId: input.wordId, steps, sourceIds,
    limits: [scope, 'Подготовлено настоящее отношение к действию. Время самого действия отдельно не задаётся.', 'Исполнитель один и тот же. Предмет, место, причина, условие и другой исполнитель не добавляются автоматически.', prohibition ? 'Это сообщение о запрете. Команда «не делай» и разрешение отказаться требуют других фраз.' : desire ? 'Это собственное желание несовершения. Пожелание, решимость и отсутствие желания не приравниваются к нему.' : 'Подготовлены только «идти» и «приходить». Конкретная причина возможности и физическое умение не утверждаются.'],
    // Retaining the subject prevents third-person singular/plural and prohibition from losing the selected person.
    acceptedAnswers: [text],
    practice: { part: { id: 'practice-part', text: particle || answerPart, before: particle ? predicate + ' ' : partBefore, after: '', explanationRu: particle ? steps.at(-1)!.explanationRu : desire ? 'Допиши личное окончание слова желания.' : prohibition ? 'Допиши окончание дательного падежа у названия действия.' : 'Допиши окончание принадлежности у слова возможности.' }, word: { id: 'practice-word', text: targetWord, labelRu: 'Напиши изменяемое слово целиком' } },
    formulaChainText: parts.map(part => part.text).join(' + ') + ' → ' + completePredicate,
    morphologySegments,
  };
}

export function buildConstructorStage6Modality(input: ConstructorStage6ModalityInput): ConstructorStage6ModalityResult {
  const eligibility = constructorStage6ModalityEligibility(input);
  if (!eligibility.supported || !eligibility.topicId) return { status: 'limited', text: null, thoughtRu: '', translationRu: '', topicId: null, wordId: null, steps: [], limits: [eligibility.reasonRu!], sourceIds: [], acceptedAnswers: [], formulaChainText: '', morphologySegments: [] };
  if (input.kind === 'prohibition' || (input.negation === 'action' && input.kind !== 'necessity')) return buildWillActionNegation(input, eligibility.topicId);
  if (input.kind === 'necessity' && input.negation !== 'none') return buildNecessityNegation(input, eligibility.topicId);
  const base = buildForm(eligibility.topicId, input.wordId, input.person);
  const firstWord = base.afterCheck.canonicalFormKz.split(' ')[0];
  let predicate = base.afterCheck.canonicalFormKz;
  let parts = getFormulaSegments(base).filter(part => !part.optional);
  let particle = '';
  if ((input.question && input.kind !== 'necessity') || (input.kind === 'desire' && input.time === 'past' && input.negation === 'modal')) {
    const auxiliaryPerson = input.kind === 'desire' ? 'ol' : input.person;
    const auxiliaryTopic = input.time === 'past' ? input.negation === 'modal' ? 'T32_PAST_MADY' : 'T31_PAST_DY'
      : input.negation === 'modal' ? 'T27_PRES_FUT_NEG' : 'T28_PRES_FUT_Q';
    const auxiliary = buildForm(auxiliaryTopic, input.kind === 'desire' ? 'kel' : 'al', auxiliaryPerson);
    let auxParts = getFormulaSegments(auxiliary).filter(part => !part.optional && part.text.trim());
    // Only present third-person questions omit -ды/-ді; past -ді is a tense suffix.
    if (input.question && input.time === 'present' && input.negation === 'modal' && ['ol', 'olar'].includes(auxiliaryPerson)) {
      auxParts = auxParts.filter(part => part.coreBlockId !== 'KB-3');
    }
    let auxiliaryText = auxParts.map(part => (part.separatorBefore === 'space' ? ' ' : '') + part.text).join('').trim();
    if (input.question && !auxParts.some(part => part.coreBlockId === 'KB-6')) {
      particle = pickQuestionParticle(auxiliaryText.split(' ').at(-1)!).particle;
      auxParts.push({ text: particle, glossRu: 'Общий вопрос', color: 'ink', role: 'particle', coreBlockId: 'KB-6', optional: false, separatorBefore: 'space' });
      auxiliaryText += ` ${particle}`;
    }
    predicate = `${firstWord} ${auxiliaryText}`;
    const firstAuxiliary = parts.findIndex(part => part.role === 'auxiliary');
    if (firstAuxiliary < 0) throw new Error('Modality recipe has no auxiliary boundary');
    parts = [...parts.slice(0, firstAuxiliary), ...auxParts.map((part, index): FormulaSegment => ({ ...part, separatorBefore: index === 0 ? 'space' : part.separatorBefore }))];
    particle = auxParts.find(part => part.coreBlockId === 'KB-6')?.text ?? '';
  } else if (input.question) {
    particle = pickQuestionParticle(predicate.split(' ').at(-1)!).particle;
    predicate += ` ${particle}`;
    parts.push({ text: particle, glossRu: 'Общий вопрос', color: 'ink', role: 'particle', coreBlockId: 'KB-6', optional: false, separatorBefore: 'space' });
  }
  const withoutParticle = particle ? predicate.slice(0, -(particle.length + 1)) : predicate;
  const pronoun = input.kind === 'ability' ? PERSONS[input.person].pronounKz : PERSONS[input.person].genitiveKz;
  const text = sentence(`${pronoun} ${predicate}`, input.question);
  const thoughtRu = constructorStage6ModalityThoughtRu(input);
  const targetWord = input.kind === 'ability' ? withoutParticle.split(' ').at(-1)! : firstWord;
  const ending = base.afterCheck.coloredSegments.find(part => part.coreBlockId === (input.kind === 'ability' ? 'KB-3' : 'KB-2'))!.text;
  const answerPart = particle || ending;
  const partExplanation = particle ? input.time === 'past' ? 'Напиши отдельную вопросительную частицу после вспомогательного слова. Показатель прошлого времени сохраняется.' : input.kind === 'necessity' ? 'Напиши отдельную вопросительную частицу после слова необходимости.' : 'Напиши отдельную вопросительную частицу. В третьем лице настоящего вспомогательного глагола перед ней нет окончания утверждения.'
    : input.kind === 'ability' ? 'Окончание вспомогательного слова показывает лицо. Основное действие сохраняется.' : 'Окончание первого слова показывает, чьё это желание или кому нужно выполнить действие.';
  const steps: ConstructorStage4Step[] = [
    { id: 'subject', labelRu: input.kind === 'desire' ? 'Кто хочет' : input.kind === 'ability' ? 'Кто может' : 'Кому нужно', text: pronoun, explanationRu: input.kind === 'ability' ? 'Местоимение называет того, кто может выполнить действие.' : 'Местоимение связано с окончанием принадлежности первого слова.' },
    { id: 'action', labelRu: 'Какое действие', text: firstWord, explanationRu: input.kind === 'desire' ? 'Желающий и исполнитель совпадают. Другой исполнитель требует отдельной фразы.' : input.kind === 'ability' ? 'Эта форма основного действия соединяется со вспомогательным словом.' : 'Название действия получает окончание принадлежности.' },
    { id: 'modality', labelRu: input.kind === 'desire' ? input.negation === 'modal' ? 'Не хочет' : 'Желание' : input.kind === 'ability' ? input.negation === 'modal' ? 'Не может' : 'Возможность' : 'Необходимость', text: withoutParticle.slice(firstWord.length + 1), explanationRu: input.time === 'past' ? input.negation === 'modal' ? 'В прошлом желания не было. Это не сообщает, произошло ли действие.' : 'Желание было в прошлом. Это не сообщает, произошло ли действие.' : input.negation === 'modal' ? 'Отрицается желание или возможность. Это не желание или возможность не делать.' : 'Фраза сообщает об отношении к действию. Само выполнение не утверждается.' },
  ];
  if (particle) steps.push({ id: 'question', labelRu: 'Спросить', text: particle, explanationRu: 'Вопрос относится ко всему сообщению. Частица стоит отдельным словом после подготовленного сказуемого.' });
  const limits = [
    'Выбрано действие без предмета, места и другого исполнителя. Эти слова не добавляются автоматически.',
    'Время относится к желанию, возможности или необходимости. Срок самого действия здесь не выбирается.',
    'Желание, возможность и необходимость не подтверждают выполнения действия.',
    input.kind === 'ability' ? 'Слово «могу» здесь не заменяет отдельную проверку умения, разрешения или успешного результата.' : input.kind === 'necessity' ? 'Показан один способ выразить необходимость. Отсутствие необходимости и необходимость воздержаться требуют отдельных фраз.' : 'В этом примере желающий и исполнитель — один человек. Желание предмета, состояния или действия другого человека сюда не подставляется.',
  ];
  const sourceIds: ConstructorStage6ModalitySourceId[] = [input.kind === 'desire' ? 'stage6-modality-desire' : input.kind === 'ability' ? 'stage6-modality-ability' : 'stage6-modality-necessity'];
  if (particle) sourceIds.push('stage6-modality-question');
  if (input.time === 'past' && (input.question || input.negation === 'modal')) sourceIds.push('stage6-modality-past-desire');
  if (input.question && input.negation === 'modal') sourceIds.push('stage6-modality-negative-question');
  return { status: 'ready', text, thoughtRu, translationRu: thoughtRu, topicId: eligibility.topicId, wordId: input.wordId, steps, limits, sourceIds,
    acceptedAnswers: [text, sentence(predicate, input.question)],
    practice: { part: { id: 'practice-part', text: answerPart, before: particle ? withoutParticle + ' ' : targetWord.slice(0, -ending.length), after: '', explanationRu: partExplanation }, word: { id: 'practice-word', text: targetWord, labelRu: 'Напиши изменяемое слово целиком' } },
    formulaChainText: `${parts.map(part => part.text).join(' + ')} → ${predicate}`,
    morphologySegments: describedParts(parts, input, firstWord),
  };
}

export function checkConstructorStage6ModalityAnswer(input: ConstructorStage6ModalityInput, answer: string, mode: 'part' | 'word' | 'full' = 'full'): { passed: boolean; messageRu: string; expected: string | null } {
  const built = buildConstructorStage6Modality(input);
  if (built.status !== 'ready') return { passed: false, messageRu: built.limits[0], expected: null };
  if (!['part', 'word', 'full'].includes(mode)) return { passed: false, messageRu: 'Выбери часть, слово или целую фразу.', expected: null };
  const expected = mode === 'full' ? built.text! : built.practice![mode].text;
  const answers = mode === 'full' ? built.acceptedAnswers : [expected];
  const passed = typeof answer === 'string' && answers.some(value => normalized(value) === normalized(answer));
  return { passed, expected, messageRu: passed ? 'Этот вариант совпадает с подготовленным ответом.' : 'Сравни с подготовленным вариантом. Другой ответ здесь ещё не проверен.' };
}
