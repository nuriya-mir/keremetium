import { buildForm } from './form-builder';
import { realizeConstructorWord } from './constructor-realization';
import { getConstructorGroupReference } from './constructor-group-reference';
import { ROOTS_BY_ID } from './roots';
import type { PersonId } from '../types';

// Closed examples for the separate K181 prototype. Every Kazakh spelling is
// returned by the existing core; the UI only selects and displays these results.
const PEOPLE: PersonId[] = ['men', 'sen', 'siz', 'ol', 'biz', 'sender', 'sizder', 'olar'];
const WHO = ['Я', 'Ты', 'Вы — один человек', 'Он / она', 'Мы', 'Вы — несколько человек', 'Вы — несколько человек, вежливо', 'Они'];
const SUBJECT = ['Я', 'Ты', 'Вы', 'Он / она', 'Мы', 'Вы', 'Вы', 'Они'];
const DATIVE = ['Мне', 'Тебе', 'Вам', 'Ему / ей', 'Нам', 'Вам', 'Вам', 'Им'];
const SAY = ['говорю', 'говоришь', 'говорите', 'говорит', 'говорим', 'говорите', 'говорите', 'говорят'];
const FUTURE = ['буду', 'будешь', 'будете', 'будет', 'будем', 'будете', 'будете', 'будут'];
const WANT = ['хочу', 'хочешь', 'хотите', 'хочет', 'хотим', 'хотите', 'хотите', 'хотят'];
const CAN = ['могу', 'можешь', 'можете', 'может', 'можем', 'можете', 'можете', 'могут'];
const INTEND = ['собираюсь', 'собираешься', 'собираетесь', 'собирается', 'собираемся', 'собираетесь', 'собираетесь', 'собираются'];
const TALK = ['поговорю', 'поговоришь', 'поговорите', 'поговорит', 'поговорим', 'поговорите', 'поговорите', 'поговорят'];
const WILL_WANT = ['захочу', 'захочешь', 'захотите', 'захочет', 'захотим', 'захотите', 'захотите', 'захотят'];
const past = (p: number, stem: string) => stem + ([2, 4, 5, 6, 7].includes(p) ? 'ли' : 'л(а)');
const lowerSubject = (p: number) => [2, 6].includes(p) ? SUBJECT[p] : SUBJECT[p].toLowerCase();

export interface MeaningPiece { text: string; group: string; label: string; word: number }
export interface MeaningExample { kz: string; ru: string; pieces: MeaningPiece[] }
interface Recipe { id: string; family: string; label: string; formula: string; note: string; ru: (p: number) => string }
const RECIPES: Recipe[] = [
  { id: 'ordinary', family: 'time', label: 'Обычно', formula: 'T26_PRES_FUT_AFF', note: 'Обычное действие. Та же казахская форма может относиться к будущему; время уточняется по ситуации.', ru: p => `${SUBJECT[p]} ${SAY[p]}` },
  { id: 'now', family: 'time', label: 'Сейчас', formula: 'T80_STD_PROG', note: 'Действие происходит прямо сейчас. В казахском результате появляется отдельное вспомогательное слово.', ru: p => `${SUBJECT[p]} сейчас ${SAY[p]}` },
  { id: 'future', family: 'time', label: 'В будущем', formula: 'T26_PRES_FUT_AFF', note: 'Здесь выбрано будущее значение. Казахская форма совпадает с обычным действием; будущее понимается из контекста. Отдельное окончание будущего здесь не добавляется.', ru: p => `${SUBJECT[p]} ${FUTURE[p]} говорить` },
  { id: 'past', family: 'time', label: 'В прошлом', formula: 'T31_PAST_DY', note: 'Сообщаем о действии в прошлом.', ru: p => `${SUBJECT[p]} ${past(p, 'говори')}` },
  { id: 'habitual', family: 'time', label: 'Раньше обычно', formula: 'T36_HABITUAL_ATYN', note: 'Речь о привычном или повторявшемся действии в прошлом.', ru: p => `${SUBJECT[p]} раньше обычно ${past(p, 'говори')}` },
  { id: 'negative', family: 'time', label: 'Не говорю', formula: 'T27_PRES_FUT_NEG', note: 'Отрицаем обычное действие. Форма также может иметь будущее значение в соответствующем контексте.', ru: p => `${SUBJECT[p]} не ${SAY[p]}` },
  { id: 'past-negative', family: 'time', label: 'Не говорил(а)', formula: 'T32_PAST_MADY', note: 'Отрицаем действие в прошлом.', ru: p => `${SUBJECT[p]} не ${past(p, 'говори')}` },
  { id: 'want', family: 'want', label: 'Хочу', formula: 'T83_WANT_PRESENT', note: 'Выражаем желание говорить. Этот смысл собирается из нескольких частей и отдельного слова.', ru: p => `${SUBJECT[p]} ${WANT[p]} говорить` },
  { id: 'want-negative', family: 'want', label: 'Не хочу', formula: 'T84_WANT_NEG', note: 'Отрицаем желание: не хочется говорить.', ru: p => `${SUBJECT[p]} не ${WANT[p]} говорить` },
  { id: 'want-past', family: 'want', label: 'Хотел(а)', formula: 'T86_WANT_PAST', note: 'Желание было в прошлом.', ru: p => `${SUBJECT[p]} ${past(p, 'хоте')} говорить` },
  { id: 'want-if', family: 'want', label: 'Если захочу', formula: 'T88_WANT_COND', note: 'Начало мысли с условием о желании. После него нужно продолжение.', ru: p => `Если ${lowerSubject(p)} ${WILL_WANT[p]} говорить…` },
  { id: 'can', family: 'can', label: 'Могу', formula: 'T72_CAN_PRESENT', note: 'Есть возможность или способность говорить.', ru: p => `${SUBJECT[p]} ${CAN[p]} говорить` },
  { id: 'can-negative', family: 'can', label: 'Не могу', formula: 'T73_CAN_NEG', note: 'Возможности или способности говорить нет.', ru: p => `${SUBJECT[p]} не ${CAN[p]} говорить` },
  { id: 'need', family: 'need', label: 'Нужно', formula: 'T93_NEED_KEREK', note: 'Говорить необходимо.', ru: p => `${DATIVE[p]} нужно говорить` },
  { id: 'need-negative', family: 'need', label: 'Нужно не говорить', formula: 'T94_NEED_NEG_MAU_KEREK', note: 'Нужно воздержаться от разговора. Отрицание относится к действию, а необходимость сохраняется.', ru: p => `${DATIVE[p]} нужно не говорить` },
  { id: 'permission', family: 'need', label: 'Можно', formula: 'T99_MAY_PERSONAL', note: 'Говорить разрешено. Это отличается от способности или возможности говорить.', ru: p => `${DATIVE[p]} можно говорить` },
  { id: 'intend', family: 'more', label: 'Собираюсь', formula: 'T89_INTEND_PRESENT', note: 'Есть намерение говорить; действие ещё предстоит.', ru: p => `${SUBJECT[p]} ${INTEND[p]} говорить` },
  { id: 'would', family: 'more', label: 'Говорил(а) бы', formula: 'T40_COND_AR_EDI', note: 'Предполагаемое действие при некотором условии.', ru: p => `${SUBJECT[p]} бы ${past(p, 'говори')}` },
  { id: 'suppose', family: 'more', label: 'Наверное', formula: 'T105_SUPPOSE_ARMYN', note: 'Предположение о предстоящем действии.', ru: p => `Наверное, ${lowerSubject(p)} ${TALK[p]}` },
  { id: 'if', family: 'more', label: 'Если', formula: 'T46_COND_SA', note: 'Начало мысли с условием. После него нужно продолжение.', ru: p => `Если ${lowerSubject(p)} ${TALK[p]}…` },
  { id: 'even-if', family: 'more', label: 'Даже если', formula: 'T48_CONCESSIVE_SA_DA', note: 'Действие допускается как условие, которое не меняет продолжение мысли.', ru: p => `Даже если ${lowerSubject(p)} ${TALK[p]}…` },
  { id: 'when', family: 'more', label: 'Когда', formula: 'T50_WHEN_PERSONAL_GANDA', note: 'Уточняем время для другой мысли. После этого начала нужно продолжение.', ru: p => `Когда ${lowerSubject(p)} ${past(p, 'говори')}…` },
  { id: 'question', family: 'more', label: 'Спросить', formula: 'T28_PRES_FUT_Q', note: 'Вопрос об обычном действии. Вопросительная частица пишется отдельно.', ru: p => `${SUBJECT[p]} ${SAY[p]}?` },
];

function verbExample(recipe: Recipe, p: number): MeaningExample {
  const built = buildForm(recipe.formula, 'soile', PEOPLE[p]);
  const kz = built.afterCheck.canonicalFormKz;
  const raw = built.afterCheck.coloredSegments.filter(s => !s.isOptionalBracket);
  const pieces: MeaningPiece[] = [];
  let cursor = 0, word = 0;
  for (const segment of raw) {
    for (const text of segment.text.trim().split(/\s+/)) {
      if (kz[cursor] === ' ') { while (kz[cursor] === ' ') cursor++; word++; }
      if (!kz.startsWith(text, cursor)) throw new Error(`Segment mismatch: ${recipe.id}/${p}: ${text}`);
      cursor += text.length;
      const personPart = segment.role === 'core_block' && ['KB-2', 'KB-3', 'KB-4'].includes(segment.coreBlockId || '');
      const group = personPart ? 'person' : recipe.family;
      const label = personPart ? WHO[p] : recipe.label;
      const base = ROOTS_BY_ID.soile.kz;
      if (segment.role === 'root' && text.startsWith(base)) {
        pieces.push({ text: base, group: 'root', label: 'Говорить', word });
        if (text.length > base.length) pieces.push({ text: text.slice(base.length), group: recipe.family, label: recipe.label, word });
      } else pieces.push({ text, group, label, word });
    }
  }
  if (cursor !== kz.length) throw new Error(`Incomplete segmentation: ${recipe.id}/${p}`);
  return { kz, ru: recipe.ru(p), pieces };
}

export function buildMeaningConstructorCorpus() {
  const nouns: Record<string, MeaningExample & { refs: Record<string, ReturnType<typeof getConstructorGroupReference>> }> = {};
  for (let plural = 0; plural < 2; plural++) for (let owner = -1; owner < 8; owner++) for (let caseId = 0; caseId < 7; caseId++) {
    // Plural addressees have plural owned nouns in the existing core.
    if (!plural && [5, 6].includes(owner)) continue;
    const steps = [...(plural ? [{ id: 'plural', value: 0 }] : []), ...(owner >= 0 ? [{ id: 'poss', value: owner }] : []), ...(caseId ? [{ id: 'case', value: caseId }] : [])];
    const input = { base: 'noun', variant: 'basic', meaning: 'книга', steps };
    const value = realizeConstructorWord(input);
    if (!value.kz || !value.ru || !value.parts) throw new Error(`Missing noun ${plural}/${owner}/${caseId}`);
    const groups = ['root', ...(plural ? ['number'] : []), ...(owner >= 0 ? ['owner'] : []), ...(caseId ? ['case'] : [])];
    const labels = ['Книга', ...(plural ? ['Несколько'] : []), ...(owner >= 0 ? ['Чей предмет'] : []), ...(caseId ? ['Роль в мысли'] : [])];
    nouns[`${plural}:${owner}:${caseId}`] = { kz: value.kz, ru: value.ru, pieces: value.parts.map((text, i) => ({ text, group: groups[i], label: labels[i], word: 0 })), refs: Object.fromEntries(['n-number', 'n-owner', 'n-case'].map(id => [id.slice(2), getConstructorGroupReference(input, id)])) };
  }
  return {
    people: WHO,
    roots: { noun: { kz: ROOTS_BY_ID.kitap.kz, ru: 'книга' }, verb: { kz: ROOTS_BY_ID.soile.kz, ru: 'говорить' } },
    nouns,
    recipes: RECIPES.map(r => ({ id: r.id, family: r.family, label: r.label, note: r.note, examples: PEOPLE.map((_, p) => verbExample(r, p)) })),
  };
}
