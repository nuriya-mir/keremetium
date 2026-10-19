import { PERSONS, ROOTS_BY_ID } from './roots';
import { getTenColorForRow, getVowelRow } from './phonetics';
import type { BuiltFormResult, PersonId } from '../types';

export const PRESENCE_ROOT_IDS = ['kitap', 'su', 'shai', 'nan', 'hat'];
export const isPresenceTopic = (id: string) => id === 'T56_LOC_BAR' || id === 'KZ_PRESENCE_NEG';
const absentNouns: Record<string, string> = { kitap: 'книги', su: 'воды', shai: 'чая', nan: 'хлеба', hat: 'письма' };
const who: Record<PersonId, string> = { men: 'У меня', sen: 'У тебя', siz: 'У Вас', ol: 'У него или у неё', biz: 'У нас', sender: 'У вас', sizder: 'У Вас', olar: 'У них', ol_kisi: 'У него или у неё', ol_kisiler: 'У них' };

export function presencePrompt(id: string, rootId: string, person: PersonId): string {
  const root = ROOTS_BY_ID[rootId];
  return id === 'KZ_PRESENCE_NEG'
    ? `${who[person]} с собой нет ${absentNouns[rootId] || `вот чего: ${root.ru}`}`
    : `${who[person]} с собой есть ${root.ru}`;
}

/** Checked locative presence model. Sources: docs/grammar-checks/2026-10-19-presence.md. */
export function buildPresenceForm(id: string, rootId: string, person: PersonId): BuiltFormResult {
  const input = ROOTS_BY_ID[rootId];
  const root = input.pos === 'noun' ? input : ROOTS_BY_ID.kitap;
  const negative = id === 'KZ_PRESENCE_NEG';
  const word = negative ? 'жоқ' : 'бар';
  const personForm = PERSONS[person].locativeKz;
  const canonical = `${personForm} ${root.kz} ${word}`;
  const locativeOptions = Object.values(PERSONS).filter(item => item.isCoreEight).map(item => ({
    value: item.locativeKz, isCorrect: item.id === person,
    reasonRu: `${who[item.id as PersonId]}. Эта форма отвечает на вопрос «у кого?».`,
  }));
  // Respectful third-person forms remain available to internal reference consumers.
  if (!locativeOptions.some(option => option.value === personForm)) locativeOptions.push({ value: personForm, isCorrect: true, reasonRu: `${who[person]}, уважительно.` });
  const wordOptions = [
    { value: 'бар', isCorrect: !negative, reasonRu: 'Есть: вещь сейчас у человека.' },
    { value: 'жоқ', isCorrect: negative, reasonRu: 'Нет: вещи сейчас у человека нет.' },
    { value: 'емес', isCorrect: false, reasonRu: 'Значит «не», когда называем человека или его признак. Для отсутствия вещи нужно другое слово.' },
  ];
  const rule = `Сначала скажи, у кого: «${personForm}». Затем назови вещь: «${root.kz}». Последнее слово «${word}» означает «${negative ? 'нет' : 'есть'}» и пишется отдельно. Название вещи не меняется. По этой фразе нельзя узнать, чья это вещь.`;
  return {
    formulaId: id, topicNumber: id === 'T56_LOC_BAR' ? 56 : 0, rootId: root.id, person,
    sentenceType: negative ? 'negative' : 'affirmative',
    beforeCheck: {
      promptRu: presencePrompt(id, root.id, person),
      personHint: `${personForm} — ${who[person].toLowerCase()}`,
      monochromeStemDisplay: `[ ___ ] ${root.kz} ${word}`,
      rootTranslationHint: `${root.kz} — ${root.ru}`,
      stage1Options: locativeOptions,
      multiStepBlanks: [
        { stepIndex: 1, stepTitleRu: 'Шаг 1 из 2: у кого?', stemDisplay: `[ ___ ] ${root.kz} ${word}`, correctPiece: personForm, options: locativeOptions },
        { stepIndex: 2, stepTitleRu: 'Шаг 2 из 2: есть или нет?', stemDisplay: `${personForm} ${root.kz} [ ___ ]`, correctPiece: word, options: wordOptions },
      ],
    },
    afterCheck: {
      canonicalFormKz: canonical, acceptedFormsKz: [canonical],
      coloredSegments: [
        { text: personForm, color: getTenColorForRow(getVowelRow(personForm)), glossRu: who[person].toLowerCase(), role: 'pronoun', coreBlockId: 'KB-8' },
        { text: root.kz, color: getTenColorForRow(root.vowelRow), glossRu: root.ru, role: 'root' },
        { text: word, color: 'ink', glossRu: negative ? 'нет' : 'есть', role: 'auxiliary' },
      ],
      formulaChainText: `${personForm} ${root.kz} ${word}`,
      literalMeaningRu: presencePrompt(id, root.id, person), selectionRuleSummaryRu: rule,
      sourceBadge: 'Проверенная модель наличия и отсутствия',
    },
  };
}
