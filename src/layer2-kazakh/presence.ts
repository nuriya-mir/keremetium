import { PERSONS, ROOTS_BY_ID } from './roots';
import { getTenColorForRow, getVowelRow, pickQuestionParticle } from './phonetics';
import type { BuiltFormResult, PersonId } from '../types';

export const PRESENCE_ROOT_IDS = ['kitap', 'su', 'shai', 'nan', 'hat'];
export const PRESENCE_TOPIC_IDS = ['T56_LOC_BAR', 'KZ_PRESENCE_NEG', 'KZ_PRESENCE_Q', 'KZ_PRESENCE_NEG_Q'];
export const isPresenceTopic = (id: string) => PRESENCE_TOPIC_IDS.includes(id);
export const isPresenceQuestion = (id: string) => id === 'KZ_PRESENCE_Q' || id === 'KZ_PRESENCE_NEG_Q';
const absentNouns: Record<string, string> = { kitap: 'книги', su: 'воды', shai: 'чая', nan: 'хлеба', hat: 'письма' };
const who: Record<PersonId, string> = { men: 'У меня', sen: 'У тебя', siz: 'У Вас', ol: 'У него или у неё', biz: 'У нас', sender: 'У вас', sizder: 'У Вас', olar: 'У них', ol_kisi: 'У него или у неё', ol_kisiler: 'У них' };

export function presencePrompt(id: string, rootId: string, person: PersonId): string {
  const root = ROOTS_BY_ID[rootId];
  const question = isPresenceQuestion(id), negative = id === 'KZ_PRESENCE_NEG' || id === 'KZ_PRESENCE_NEG_Q';
  const thought = negative ? `${who[person]}${question ? '' : ' с собой'} нет ${absentNouns[rootId] || `вот чего: ${root.ru}`}` : `${who[person]}${question ? '' : ' с собой'} есть ${root.ru}`;
  return thought + (question ? '?' : '');
}

/** Checked locative presence model. Sources: docs/grammar-checks/2026-10-19-presence.md. */
export function buildPresenceForm(id: string, rootId: string, person: PersonId): BuiltFormResult {
  const input = ROOTS_BY_ID[rootId];
  const root = input.pos === 'noun' ? input : ROOTS_BY_ID.kitap;
  if (isPresenceQuestion(id)) {
    const base = buildPresenceForm(id === 'KZ_PRESENCE_NEG_Q' ? 'KZ_PRESENCE_NEG' : 'T56_LOC_BAR', rootId, person);
    const word = base.afterCheck.canonicalFormKz.split(' ').at(-1)!;
    const picked = pickQuestionParticle(word);
    const canonical = `${base.afterCheck.canonicalFormKz} ${picked.particle}`;
    const options = [
      ['ма', 'ме', 'после гласной или «й», «у», «р», «л»'],
      ['ба', 'бе', 'после «ж», «з», «м», «н», «ң»'],
      ['па', 'пе', 'после согласного без голоса'],
    ].flatMap(([hard, soft, condition]) => [
      { value: hard, isCorrect: picked.particle === hard, reasonRu: `Твёрдые гласные; ${condition}.` },
      { value: soft, isCorrect: picked.particle === soft, reasonRu: `Мягкие гласные; ${condition}.` },
    ]);
    const rule = `Слово «${word}» означает «${id === 'KZ_PRESENCE_NEG_Q' ? 'нет' : 'есть'}». Чтобы спросить, добавь после него отдельную частицу «${picked.particle}». Название вещи остаётся прежним. При смене человека меняется первое слово, а эта частица остаётся.`;
    const display = `${base.afterCheck.canonicalFormKz} [ ___ ]`;
    return {
      ...base, formulaId: id, topicNumber: 0, sentenceType: 'question',
      beforeCheck: { ...base.beforeCheck, promptRu: presencePrompt(id, base.rootId, person), monochromeStemDisplay: display,
        stage1Options: options, multiStepBlanks: [{ stepIndex: 0, stepTitleRu: 'Вопросительная частица', stemDisplay: display, correctPiece: picked.particle, options }] },
      afterCheck: { ...base.afterCheck, canonicalFormKz: canonical, acceptedFormsKz: [canonical],
        coloredSegments: [...base.afterCheck.coloredSegments, { text: picked.particle, color: 'ink', glossRu: 'превращает фразу в вопрос', role: 'particle' }],
        formulaChainText: canonical, literalMeaningRu: presencePrompt(id, base.rootId, person), selectionRuleSummaryRu: rule },
    };
  }
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
