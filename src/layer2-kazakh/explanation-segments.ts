import { isActionTopic } from './action';
import { isPresenceTopic, isPresenceQuestion } from './presence';
import { isNegativeNominalTopic, isQuestionNominalTopic } from './nominal-lexicon';
import { getFormulaSegments } from './formula-segments';
import type { FormulaSegment } from './formula-segments';
import { buildForm, pickPresentAEYSuffix, pickDesireGhySuffix, pickConditionalSaSuffix } from './form-builder';
import { pickVerbNegationSuffix, pickPossessiveSuffix, pickFullPersonalEnding, pickShortPersonalEnding } from './phonetics';
import { ROOTS_BY_ID } from './roots';
import type { BuiltFormResult } from '../types';

export interface ExplanationSegment extends FormulaSegment { label: string; reasonRu?: string }
const LABELS = { root: 'Основа', suffix: 'Суффикс', core_block: 'Окончание', auxiliary: 'Вспомогательный глагол', particle: 'Частица', pronoun: 'Местоимение' };

/** Segment an already built expression; never construct a replacement form. */
export function getExplanationSegments(built: BuiltFormResult): ExplanationSegment[] {
  const parts: ExplanationSegment[] = getFormulaSegments(built).filter(part => !part.optional).flatMap(part => {
    const root = ROOTS_BY_ID[built.rootId];
    if (built.formulaId === 'T72_CAN_PRESENT' && part.role === 'root') {
      const suffix = pickPresentAEYSuffix(root.kz).suffix;
      if (part.text === root.kz + suffix) return [
        { ...part, text: root.kz, glossRu: root.ru, label: 'Основа' },
        { ...part, text: suffix, role: 'suffix', glossRu: 'Соединяет основной глагол со вспомогательным', label: 'Суффикс', separatorBefore: 'join' },
      ];
    }
    if (built.formulaId !== 'T84_WANT_NEG' || part.role !== 'auxiliary') return [{ ...part,
      label: isActionTopic(built.formulaId) && part.coreBlockId === 'KB-6' ? 'Вопросительная частица' : isActionTopic(built.formulaId) && part.coreBlockId === 'KB-7' ? 'Отрицание действия' : isPresenceTopic(built.formulaId) ? part.role === 'particle' ? 'Вопросительная частица' : part.role === 'pronoun' ? 'У кого' : part.role === 'auxiliary' ? 'Есть или нет' : 'Название вещи' : part.role === 'auxiliary' && isNegativeNominalTopic(built.formulaId) ? 'Слово отрицания' : part.role === 'root' && part.text !== root.kz ? 'Основа с суффиксом' : part.coreBlockId === 'KB-2' ? 'Окончание принадлежности' : part.coreBlockId === 'KB-3' || part.coreBlockId === 'KB-4' ? 'Личное окончание' : LABELS[part.role] }];
    const stem = ROOTS_BY_ID.kel.kz;
    const negation = pickVerbNegationSuffix(stem).suffix;
    const tense = pickPresentAEYSuffix(stem + negation).suffix;
    const pieces = [stem, negation, tense, part.text.slice(stem.length + negation.length + tense.length)];
    if (pieces.join('') !== part.text || pieces.some(piece => !piece)) throw new Error('Неизвестный состав отрицательного вспомогательного глагола');
    const positive = buildForm('T83_WANT_PRESENT', built.rootId, built.person).afterCheck.coloredSegments.find(segment => segment.role === 'auxiliary');
    if (!positive) throw new Error('Нет положительной формы для объяснения');
    const labels = ['Основа вспомогательного глагола', 'Отрицание', 'Суффикс времени', 'Окончание третьего лица'];
    const glosses = ['Вспомогательный глагол конструкции желания', 'Передаёт значение «не»', 'Настоящее время', 'Третье лицо вспомогательного глагола'];
    const reasons = [
      'Это основа вспомогательного глагола конструкции желания. К ней присоединяется отрицание.',
      `${stem}: ${pickVerbNegationSuffix(stem).ruleRu}`,
      `${stem + negation}: ${pickPresentAEYSuffix(stem + negation).ruleRu}`,
      pickFullPersonalEnding(stem + negation + tense, 'ol', { thirdPersonHasDyDi: true }).ruleRu + ' Здесь вспомогательный глагол стоит в третьем лице. Лицо действующего человека показывает окончание первого слова.',
    ];
    return pieces.map((text, index): ExplanationSegment => ({ ...part, text, label: labels[index], glossRu: glosses[index], reasonRu: reasons[index],
      role: index === 0 ? 'auxiliary' : index === 3 ? 'core_block' : 'suffix',
      coreBlockId: index === 3 ? 'KB-3' : undefined, separatorBefore: index === 0 ? part.separatorBefore : 'join' }));
  });
  return parts.map((part, index): ExplanationSegment => {
    const root = ROOTS_BY_ID[built.rootId];
    let reasonRu = part.reasonRu;
    let prefix = '';
    for (const previous of parts.slice(0, index)) prefix = previous.separatorBefore === 'space' ? previous.text : prefix + previous.text;
    if (!reasonRu && part.role === 'root') reasonRu = part.text === root.kz ? root.pos === 'verb' ? `Основа «${root.kz}» обозначает действие: ${root.ru}.` : root.pos === 'adjective' ? `Слово «${root.kz}» называет признак человека: ${root.ru}. Здесь оно сообщает о человеке в настоящем времени.` : `Слово «${root.kz}» называет человека или предмет: ${root.ru}.` : built.afterCheck.mergerCapsule?.explanationRu ?? `В этом звене показана основа вместе с присоединённым суффиксом. Значение: ${part.glossRu}.`;
    if (!reasonRu && part.role === 'suffix') reasonRu = built.formulaId === 'T72_CAN_PRESENT' ? pickPresentAEYSuffix(root.kz).ruleRu : built.formulaId === 'T46_COND_SA' ? pickConditionalSaSuffix(root.kz).ruleRu : built.formulaId === 'T83_WANT_PRESENT' || built.formulaId === 'T84_WANT_NEG' ? pickDesireGhySuffix(root.kz).ruleRu : part.glossRu;
    if (!reasonRu && built.formulaId === 'T28_PRES_FUT_Q' && part.coreBlockId === 'KB-6') reasonRu = built.afterCheck.selectionRuleSummaryRu;
    if (!reasonRu && part.coreBlockId === 'KB-7' && isActionTopic(built.formulaId)) reasonRu = pickVerbNegationSuffix(root.kz, 'mai').ruleRu;
    if (!reasonRu && part.coreBlockId === 'KB-2') reasonRu = pickPossessiveSuffix(prefix, built.person, root.vowelRow, true).ruleRu;
    if (!reasonRu && part.coreBlockId === 'KB-4') reasonRu = pickShortPersonalEnding(root.vowelRow, built.person).ruleRu;
    if (!reasonRu && part.coreBlockId === 'KB-3') reasonRu = pickFullPersonalEnding(prefix, built.person, { rowOverride: built.formulaId === 'T72_CAN_PRESENT' ? 'hard' : undefined, thirdPersonHasDyDi: built.formulaId !== 'T78_MOTION_FOUR_PROG' && built.formulaId !== 'T80_STD_PROG' }).ruleRu;
    if (!reasonRu && isNegativeNominalTopic(built.formulaId) && part.role === 'auxiliary') reasonRu = built.formulaId.startsWith('KZ_QUALITY_') ? 'Это слово отрицания. Оно отрицает признак или состояние человека. Личное окончание присоединяется к отрицанию, а слово с признаком остаётся без личного окончания.' : 'Это слово отрицания. Оно отрицает, кем человек является; личное окончание присоединяется к нему, а название человека остаётся без личного окончания.';
    if (!reasonRu && isQuestionNominalTopic(built.formulaId) && part.role === 'particle') reasonRu = built.afterCheck.selectionRuleSummaryRu;
    if (!reasonRu && isPresenceQuestion(built.formulaId) && part.role === 'particle') reasonRu = built.afterCheck.selectionRuleSummaryRu;
    if (!reasonRu && isPresenceTopic(built.formulaId) && part.role === 'pronoun') reasonRu = 'Это слово отвечает на вопрос «у кого?». При смене человека меняется именно оно.';
    if (!reasonRu && isPresenceTopic(built.formulaId) && part.role === 'auxiliary') reasonRu = `Это отдельное слово со значением «${part.glossRu}». ${isPresenceQuestion(built.formulaId) ? 'После него стоит отдельная вопросительная частица.' : 'Оно стоит в конце.'} Название вещи и слово «${part.text}» при смене человека не меняются.`;
    if (!reasonRu && (built.formulaId === 'T78_MOTION_FOUR_PROG' || built.formulaId === 'T80_STD_PROG') && part.role === 'auxiliary') reasonRu = 'Это вспомогательное слово показывает, что действие происходит сейчас. Личное окончание пишется вместе с ним; в третьем лице окончания нет.';
    if (!reasonRu && part.role === 'auxiliary') reasonRu = built.formulaId === 'T72_CAN_PRESENT' ? 'Вспомогательный глагол передаёт возможность. Личное окончание присоединяется к нему.' : `Эта часть входит в конструкцию желания. Её значение: ${part.glossRu}.`;
    return { ...part, reasonRu: reasonRu ?? part.glossRu, separatorBefore: index === 0 ? 'none' : part.separatorBefore };
  });
}
