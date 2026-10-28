import type { BuiltFormResult, ChoiceOption, ColoredSegment, PersonId } from '../types';
import { NOMINAL_WORDS_BY_ID, nominalRootIds, isNegativeNominalTopic, isQuestionNominalTopic } from './nominal-lexicon';
import { PERSONS } from './roots';
import { pickFullPersonalEnding, pickPluralSuffix, pickQuestionParticle } from './phonetics';

function endingOptions(person: PersonId, correct: string, reason: string): ChoiceOption[] {
  const hard = 'Твёрдые гласные';
  const soft = 'Мягкие гласные';
  let rows: [string, string][];
  if (person === 'men' || person === 'biz') {
    const plural = person === 'biz';
    const m = plural ? ['мыз', 'міз'] : ['мын', 'мін'];
    const b = plural ? ['быз', 'біз'] : ['бын', 'бін'];
    const p = plural ? ['пыз', 'піз'] : ['пын', 'пін'];
    const mCondition = plural ? 'после гласного или сонорного согласного, кроме носового; «мы»' : 'после гласного или сонорного согласного; «я»';
    const bCondition = plural ? 'после ж или з, а также носового согласного; «мы»' : 'после ж или з; «я»';
    rows = [[m[0], hard + '; ' + mCondition], [m[1], soft + '; ' + mCondition], [b[0], hard + '; ' + bCondition], [b[1], soft + '; ' + bCondition], [p[0], hard + '; после глухого согласного'], [p[1], soft + '; после глухого согласного']];
  } else {
    const second: Partial<Record<PersonId, [string, string]>> = { sen: ['сың', 'сің'], siz: ['сыз', 'сіз'], sender: ['сыңдар', 'сіңдер'], sizder: ['сыздар', 'сіздер'] };
    const pair = second[person];
    rows = pair ? [[pair[0], hard + '; ' + PERSONS[person].labelRu], [pair[1], soft + '; ' + PERSONS[person].labelRu]] : [[correct, reason]];
  }
  return rows.map(([value, reasonRu]) => ({ value, reasonRu, isCorrect: value === correct }));
}

export function nominalPrompt(topic: string, rootId: string, person: PersonId): string {
  const word = NOMINAL_WORDS_BY_ID[rootId];
  if (!word || !nominalRootIds(topic).includes(rootId)) throw new RangeError('Неподходящее слово для именного сказуемого');
  const subjects: Partial<Record<PersonId, string>> = { men: 'Я', sen: 'Ты', siz: 'Вы', ol: 'Он или она', biz: 'Мы', sender: 'Вы', sizder: 'Вы', olar: 'Они' };
  const plural = ['biz', 'sender', 'sizder', 'olar', 'ol_kisiler'].includes(person);
  return `${subjects[person] || PERSONS[person].labelRu} ${isNegativeNominalTopic(topic) ? 'не ' : ''}${word.predicateRu[plural ? 1 : 0]}${isQuestionNominalTopic(topic) ? '?' : ''}`;
}

/** General questions retain the whole predicate; the particle is a separate word. */
function buildNominalQuestion(topic: string, rootId: string, person: PersonId): BuiltFormResult {
  const baseTopic = topic.replace(/_NEG_Q$/, '_NEG').replace(/_Q$/, '_AFF');
  const base = buildNominalForm(baseTopic, rootId, person);
  const predicate = base.afterCheck.canonicalFormKz;
  const lastWord = predicate.split(' ').at(-1)!;
  const particle = pickQuestionParticle(lastWord).particle;
  const groups: [string, string, string][] = [
    ['ма', 'ме', 'после гласного или «л», «р», «у», «й»'],
    ['ба', 'бе', 'после «ж», «з», «м», «н», «ң»'],
    ['па', 'пе', 'после глухого согласного или «б», «в», «г», «д»'],
  ];
  const options = groups.flatMap(([hard, soft, condition]) => [
    { value: hard, reasonRu: 'Твёрдые гласные; ' + condition, isCorrect: particle === hard },
    { value: soft, reasonRu: 'Мягкие гласные; ' + condition, isCorrect: particle === soft },
  ]);
  const selectedReason = options.find(option => option.isCorrect)!.reasonRu;
  const reason = `Смотри на последнее готовое слово «${lastWord}», вместе с личным окончанием. ${selectedReason}. Частица пишется отдельно и превращает сообщение в вопрос с ответом «да» или «нет».`;
  const display = `${predicate} [ ___ ]`;
  const canonical = `${predicate} ${particle}`;
  const accepted = base.afterCheck.acceptedFormsKz.map(form => `${form} ${pickQuestionParticle(form.split(' ').at(-1)!).particle}`);
  return {
    ...base, formulaId: topic, sentenceType: 'question',
    beforeCheck: { ...base.beforeCheck, promptRu: nominalPrompt(topic, rootId, person), monochromeStemDisplay: display, stage1Options: options,
      multiStepBlanks: [{ stepIndex: 0, stepTitleRu: 'Вопросительная частица', stemDisplay: display, correctPiece: particle, options }] },
    afterCheck: { ...base.afterCheck, canonicalFormKz: canonical, fullFormWithBracketsKz: `${PERSONS[person].pronounKz} ${canonical}`,
      acceptedFormsKz: accepted, coloredSegments: [...base.afterCheck.coloredSegments, { text: particle, color: 'ink', role: 'particle', glossRu: 'вопрос с ответом «да» или «нет»' }],
      formulaChainText: `${base.afterCheck.formulaChainText.split(' → ')[0]} ${particle} → ${canonical}`,
      literalMeaningRu: nominalPrompt(topic, rootId, person), selectionRuleSummaryRu: reason },
  };
}

export function buildNominalForm(topic: string, rootId: string, person: PersonId): BuiltFormResult {
  if (isQuestionNominalTopic(topic)) return buildNominalQuestion(topic, rootId, person);
  const promptRu = nominalPrompt(topic, rootId, person);
  const word = NOMINAL_WORDS_BY_ID[rootId];
  const negative = isNegativeNominalTopic(topic);
  const stem = negative ? 'емес' : word.kz;
  const picked = pickFullPersonalEnding(stem, person);
  const canonical = `${negative ? word.kz + ' ' : ''}${stem}${picked.suffix}`;
  const pronoun = PERSONS[person].pronounKz;
  // Third person has no ending: recall the final word instead of entering a fake suffix.
  const piece = picked.suffix || stem;
  const endingReason = picked.suffix ? endingOptions(person, piece, picked.ruleRu).find(option => option.isCorrect)!.reasonRu : '';
  const reason = picked.suffix ? `${endingReason} ${negative ? topic === 'KZ_QUALITY_NEG' ? 'Окончание относится к слову отрицания; слово с признаком не меняется.' : 'Окончание относится к слову отрицания; название профессии не меняется.' : 'Окончание присоединяется к названному слову.'}` : 'В третьем лице личного окончания нет. Впиши последнее слово целиком.';
  const options = endingOptions(person, piece, reason);
  const display = `${negative ? word.kz + ' ' : ''}${picked.suffix ? stem + ' + ' : ''}[ ___ ]`;
  const segments: ColoredSegment[] = [{ text: pronoun, color: 'ink', role: 'pronoun', glossRu: PERSONS[person].labelRu, isOptionalBracket: true }, { text: word.kz, color: 'ink', role: 'root', glossRu: word.ru }];
  if (negative) segments.push({ text: 'емес', color: 'ink', role: 'auxiliary', glossRu: topic === 'KZ_QUALITY_NEG' ? 'отрицает признак' : 'не является', coreBlockId: 'KB-7' });
  if (picked.suffix) segments.push({ text: picked.suffix, color: 'ink', role: 'core_block', glossRu: 'личное окончание', coreBlockId: 'KB-3' });
  const accepted = [canonical, `${pronoun} ${canonical}`];
  if (word.pos === 'noun' && ['biz', 'sender', 'sizder', 'olar', 'ol_kisiler'].includes(person)) {
    const pluralStem = word.kz + pickPluralSuffix(word.kz).suffix;
    const variant = negative ? `${pluralStem} емес${picked.suffix}` : pluralStem + pickFullPersonalEnding(pluralStem, person).suffix;
    accepted.push(variant, `${pronoun} ${variant}`);
  }
  return {
    formulaId: topic, topicNumber: 0, rootId, person, sentenceType: negative ? 'negative' : 'affirmative',
    beforeCheck: { promptRu, personHint: `${pronoun} — ${PERSONS[person].labelRu}`, rootTranslationHint: `${word.kz} — ${word.ru}`, monochromeStemDisplay: display, stage1Options: options, multiStepBlanks: [{ stepIndex: 0, stepTitleRu: picked.suffix ? 'Личное окончание' : 'Слово без личного окончания', stemDisplay: display, correctPiece: piece, options }] },
    afterCheck: { canonicalFormKz: canonical, fullFormWithBracketsKz: `${pronoun} ${canonical}`, acceptedFormsKz: accepted, coloredSegments: segments, formulaChainText: `${negative ? word.kz + ' ' : ''}${stem}${picked.suffix ? ' + ' + picked.suffix : ''} → ${canonical}`, literalMeaningRu: promptRu, selectionRuleSummaryRu: reason, sourceBadge: '' },
  };
}
