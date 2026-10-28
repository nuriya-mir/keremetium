import { buildForm } from './form-builder';
import { pickFullPersonalEnding } from './phonetics';
import { PERSONS } from './roots';
import { CONSTRUCTOR_STAGE4_PERSON_IDS, type ConstructorStage4Person, type ConstructorStage4Result, type ConstructorStage4Step } from './constructor-stage4';
import type { ConstructorWave4QuestionsSourceId } from './constructor-wave4-questions-evidence';

export const CONSTRUCTOR_WAVE4_QUESTION_SCENARIOS = [
  { id: 'who-one', labelRu: 'Кто это сделал', unknownRole: 'actor', personRole: 'answer-actor', sourceElementIds: ['grammar-question:36.12'], choices: [] },
  { id: 'who-many', labelRu: 'Кто это сделал: несколько людей', unknownRole: 'actor', personRole: 'answer-actor', sourceElementIds: ['grammar-question:36.12'], choices: [] },
  { id: 'what-general', labelRu: 'Что читает человек', unknownRole: 'object', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.13'], choices: ['Книгу', 'Письмо'] },
  { id: 'what-specific', labelRu: 'Какой известный предмет читает человек', unknownRole: 'object', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.13'], choices: ['Книгу, о которой говорим', 'Письмо, о котором говорим'] },
  { id: 'whose-predicate', labelRu: 'Чья эта книга', unknownRole: 'owner', personRole: 'answer-owner', sourceElementIds: ['grammar-question:36.14'], choices: [] },
  { id: 'whose-before', labelRu: 'Книга какого человека', unknownRole: 'owner', personRole: 'none', sourceElementIds: ['grammar-question:36.14'], choices: ['Учителя', 'Ребёнка'] },
  { id: 'quality', labelRu: 'Какая книга по качеству', unknownRole: 'quality', personRole: 'none', sourceElementIds: ['grammar-question:36.15'], choices: ['Хорошая', 'Интересная'] },
  { id: 'selection', labelRu: 'Какую книгу из известных выбрать', unknownRole: 'selection', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.15'], choices: ['Эту книгу', 'Ту книгу'] },
  { id: 'count', labelRu: 'Сколько книг', unknownRole: 'count', personRole: 'known-holder', sourceElementIds: ['grammar-question:36.16'], choices: ['Две книги', 'Три книги'] },
  { id: 'measure', labelRu: 'Сколько литров воды', unknownRole: 'measure', personRole: 'known-holder', sourceElementIds: ['grammar-question:36.16'], choices: ['Два литра воды', 'Три литра воды'] },
  { id: 'where', labelRu: 'Где человек находится', unknownRole: 'place', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.17'], choices: ['Дома', 'В школе'] },
  { id: 'to-where', labelRu: 'Куда человек пойдёт', unknownRole: 'destination', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.17'], choices: ['Домой', 'В школу'] },
  { id: 'from-where', labelRu: 'Откуда человек пришёл', unknownRole: 'origin', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.17'], choices: ['Из дома', 'Из школы'] },
  { id: 'when', labelRu: 'Когда человек придёт', unknownRole: 'time', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.18'], choices: ['Сегодня', 'Завтра'] },
  { id: 'duration', labelRu: 'Как долго человек читал', unknownRole: 'duration', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.18'], choices: ['Два часа', 'Три часа'] },
  { id: 'how', labelRu: 'Как человек пишет', unknownRole: 'manner', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.21'], choices: ['Красиво', 'Медленно'] },
  { id: 'instrument', labelRu: 'Чем человек пишет', unknownRole: 'instrument', personRole: 'known-actor', sourceElementIds: ['grammar-question:36.21'], choices: ['Ручкой', 'Карандашом'] },
  { id: 'placement', labelRu: 'Где стоит вопрос об исполнителе', unknownRole: 'actor', personRole: 'answer-actor', sourceElementIds: ['grammar-question:36.22'], choices: [] },
  { id: 'recipient', labelRu: 'Кому учитель отдал книгу', unknownRole: 'recipient', personRole: 'answer-recipient', sourceElementIds: ['grammar-question:36.25', 'grammar-question:36.26'], choices: [] },
] as const;

export type ConstructorWave4QuestionScenario = typeof CONSTRUCTOR_WAVE4_QUESTION_SCENARIOS[number]['id'];
export type ConstructorWave4QuestionForm = 'question' | 'short' | 'full';
export interface ConstructorWave4QuestionsInput {
  caseId: 'questions';
  scenario: ConstructorWave4QuestionScenario;
  form: ConstructorWave4QuestionForm;
  person?: ConstructorStage4Person;
  choice?: 'first' | 'second';
}
export interface ConstructorWave4QuestionsResult extends Omit<ConstructorStage4Result, 'sourceIds' | 'steps'> {
  sourceIds: ConstructorWave4QuestionsSourceId[];
  sourceElementIds: string[];
  outputKind: 'sentence' | 'answer-fragment';
  answerScopeRu: string;
  steps: (ConstructorStage4Step & { kazakh: string; meaningRu: string })[];
  question: { text: string; thoughtRu: string } | null;
  shortAnswer: { text: string; thoughtRu: string } | null;
  fullAnswer: { text: string; thoughtRu: string } | null;
  visual: {
    kind: 'question-answer'; unknownRole: string; unknownLabelRu: string; knownRu: string;
    questionText: string; answerText: string | null; answerRu: string | null; form: ConstructorWave4QuestionForm;
  } | null;
  controls: {
    personRole: string; personIds: readonly ConstructorStage4Person[];
    choiceLabelRu: string; choices: readonly { id: 'first' | 'second'; labelRu: string }[];
  } | null;
}

const upper = (value: string) => value.charAt(0).toLocaleUpperCase('kk') + value.slice(1);
const sentence = (value: string, question = false) => upper(value.trim()) + (question ? '?' : '.');
const normal = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('kk').replace(/[.!?]+$/u, '').trim().replace(/\s+/gu, ' ');
const actorRu = ['я', 'ты', 'Вы', 'он', 'мы', 'вы', 'Вы', 'они'] as const;
const holderRu = ['меня', 'тебя', 'Вас', 'него', 'нас', 'вас', 'Вас', 'них'] as const;
const recipientRu = ['мне', 'тебе', 'Вам', 'ему', 'нам', 'вам', 'Вам', 'им'] as const;
const ownerRu = ['моя', 'твоя', 'Ваша', 'его', 'наша', 'ваша', 'Ваша', 'их'] as const;
// Irregular independent possessives are a closed lexical paradigm, not a generic suffix rule.
const independentOwner = ['менікі', 'сенікі', 'сіздікі', 'оныкі', 'біздікі', 'сендердікі', 'сіздердікі', 'олардікі'] as const;
const readRu = ['читаю', 'читаешь', 'читаете', 'читает', 'читаем', 'читаете', 'читаете', 'читают'] as const;
const writeRu = ['пишу', 'пишешь', 'пишете', 'пишет', 'пишем', 'пишете', 'пишете', 'пишут'] as const;
const goRu = ['пойду', 'пойдёшь', 'пойдёте', 'пойдёт', 'пойдём', 'пойдёте', 'пойдёте', 'пойдут'] as const;
const comeRu = ['приду', 'придёшь', 'придёте', 'придёт', 'придём', 'придёте', 'придёте', 'придут'] as const;
const personsFor = (scenario: ConstructorWave4QuestionScenario): readonly ConstructorStage4Person[] => scenario === 'who-many'
  ? ['biz', 'sender', 'sizder', 'olar'] : scenario === 'who-one' || scenario === 'placement'
    ? ['men', 'sen', 'siz', 'ol'] : CONSTRUCTOR_STAGE4_PERSON_IDS;
const scenarioOf = (input: ConstructorWave4QuestionsInput) => CONSTRUCTOR_WAVE4_QUESTION_SCENARIOS.find(item => item.id === input.scenario)!;
const answerPerson = (role: string) => role.startsWith('answer-');
const knownPerson = (role: string) => role.startsWith('known-');

/** Exact decoding rejects controls that are meaningless for the chosen unknown role. */
export function decodeConstructorWave4QuestionsInput(raw: unknown): ConstructorWave4QuestionsInput | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const input = raw as ConstructorWave4QuestionsInput;
  if (Object.keys(input).some(key => !['caseId', 'scenario', 'form', 'person', 'choice'].includes(key))) return null;
  if (input.caseId !== 'questions' || !['question', 'short', 'full'].includes(input.form)) return null;
  const scenario = CONSTRUCTOR_WAVE4_QUESTION_SCENARIOS.find(item => item.id === input.scenario);
  if (!scenario) return null;
  const needsPerson = knownPerson(scenario.personRole) || input.form !== 'question' && answerPerson(scenario.personRole);
  if (needsPerson ? !personsFor(input.scenario).includes(input.person!) : Object.prototype.hasOwnProperty.call(input, 'person')) return null;
  const needsChoice = input.form !== 'question' && scenario.choices.length > 0;
  if (needsChoice ? !['first', 'second'].includes(input.choice!) : Object.prototype.hasOwnProperty.call(input, 'choice')) return null;
  return { caseId: 'questions', scenario: input.scenario, form: input.form, ...(needsPerson ? { person: input.person } : {}), ...(needsChoice ? { choice: input.choice } : {}) };
}

export function constructorWave4QuestionsPreparedContexts(): ConstructorWave4QuestionsInput[] {
  return CONSTRUCTOR_WAVE4_QUESTION_SCENARIOS.flatMap(scenario => (['question', 'short', 'full'] as const).flatMap(form => {
    const people = knownPerson(scenario.personRole) || form !== 'question' && answerPerson(scenario.personRole) ? personsFor(scenario.id) : [undefined];
    const choices = form !== 'question' && scenario.choices.length ? ['first', 'second'] as const : [undefined];
    return people.flatMap(person => choices.map(choice => ({ caseId: 'questions' as const, scenario: scenario.id, form, ...(person ? { person } : {}), ...(choice ? { choice } : {}) })));
  }));
}

interface Recipe {
  question: string; questionRu: string; questionWord: string; questionPart?: string;
  short: string; shortRu: string; full: string; fullRu: string;
  answerWord: string; answerPart?: string; knownRu: string; ruleRu: string;
}

function recipe(input: ConstructorWave4QuestionsInput): Recipe {
  const person = input.person ?? 'ol';
  const i = CONSTRUCTOR_STAGE4_PERSON_IDS.indexOf(person);
  const pronoun = PERSONS[person].pronounKz;
  const subject = actorRu[i];
  const second = input.choice === 'second';
  const pastRu = (singular: string, plural: string) => ['men', 'sen', 'ol'].includes(person) ? singular : plural;
  const verb = (wordId: string, past = false) => buildForm(past ? 'T31_PAST_DY' : 'T26_PRES_FUT_AFF', wordId, person).afterCheck.canonicalFormKz;
  const common = { questionPart: undefined, answerPart: undefined };
  if (['who-one', 'who-many', 'placement'].includes(input.scenario)) {
    const questionWord = input.scenario === 'who-many' ? 'кімдер' : 'кім';
    const action = buildForm('T31_PAST_DY', 'oqy', 'ol').afterCheck.canonicalFormKz;
    const question = input.scenario === 'placement' ? `кітапты ${questionWord} ${action}` : `${questionWord} кітапты ${action}`;
    return { ...common, question, questionRu: input.scenario === 'who-many' ? 'Какие люди читали эту книгу' : 'Кто читал эту книгу', questionWord,
      short: pronoun, shortRu: subject, full: `${pronoun} кітапты ${verb('oqy', true)}`, fullRu: `${subject} ${pastRu('читал', 'читали')} эту книгу`, answerWord: pronoun,
      knownRu: 'Речь об этой книге и чтении в прошлом. Неизвестен исполнитель.',
      ruleRu: input.scenario === 'placement' ? 'Вопрос об исполнителе стоит после названия книги, перед действием. Книга сохраняет винительное окончание; мы не спрашиваем, какую книгу читали.' : input.scenario === 'who-many' ? 'Вопрос прямо указывает на нескольких людей. Ответ называет группу; действие получает её личное окончание.' : 'Имя исполнителя ещё неизвестно. В вопросе не выбираем его лицо. В ответе местоимение и действие согласуются с названным человеком.' };
  }
  if (input.scenario === 'whose-predicate') return { ...common, question: 'бұл кітап кімдікі', questionRu: 'Чья эта книга', questionWord: 'кімдікі', short: independentOwner[i], shortRu: ownerRu[i], full: `бұл кітап ${independentOwner[i]}`, fullRu: `эта книга ${ownerRu[i]}`, answerWord: independentOwner[i], knownRu: 'Книга уже названа. Неизвестен её владелец.', ruleRu: 'Самостоятельное слово отвечает «чья». Название книги не получает притяжательное окончание. Выбираем владельца только в ответе.' };
  if (input.scenario === 'whose-before') {
    const owner = second ? 'баланың' : 'мұғалімнің'; const ownerMeaning = second ? 'ребёнка' : 'учителя';
    return { ...common, question: 'бұл кімнің кітабы', questionRu: 'Чья это книга', questionWord: 'кімнің', questionPart: 'нің', short: owner, shortRu: ownerMeaning, full: `бұл ${owner} кітабы`, fullRu: `это книга ${ownerMeaning}`, answerWord: owner, answerPart: second ? 'ның' : 'нің', knownRu: 'Названа одна книга. Нужно выяснить, с каким человеком она связана.', ruleRu: 'Слово владельца стоит перед названием вещи. Оно получает родительное окончание, а книга — притяжательное окончание третьего лица. В коротком ответе родительное окончание остаётся.' };
  }
  if (input.scenario === 'quality') {
    const adjective = second ? 'қызық' : 'жақсы'; const meaning = second ? 'интересная' : 'хорошая';
    return { ...common, question: 'бұл кітап қандай', questionRu: 'Какая эта книга', questionWord: 'қандай', short: adjective, shortRu: meaning, full: `бұл кітап ${adjective}`, fullRu: `эта книга ${meaning}`, answerWord: adjective, knownRu: 'Речь об одной уже выбранной книге. Неизвестно её качество.', ruleRu: 'Вопрос просит назвать качество. Он не предлагает выбрать одну книгу из нескольких. Ответ заполняет место признака.' };
  }
  if (input.scenario === 'recipient') {
    const to = PERSONS[person].dativeKz;
    return { ...common, question: 'мұғалім кітапты кімге берді', questionRu: 'Кому учитель отдал книгу', questionWord: 'кімге', questionPart: 'ге', short: to, shortRu: recipientRu[i], full: `мұғалім кітапты ${to} берді`, fullRu: `учитель отдал ${recipientRu[i]} книгу`, answerWord: to, knownRu: 'Учитель отдал эту книгу. Неизвестен получатель; учитель остаётся исполнителем.', ruleRu: 'Получатель отвечает на «кому». Короткий ответ сохраняет дательный падеж. Полная фраза называет учителя, книгу, получателя и действие; лицо получателя не меняет действие учителя.' };
  }
  if (input.scenario === 'count' || input.scenario === 'measure') {
    const count = input.scenario === 'count'; const number = second ? 'үш' : 'екі';
    const noun = count ? 'кітап' : 'литр су'; const amount = `${number} ${noun}`;
    const numberRu = count ? second ? 'три книги' : 'две книги' : second ? 'три литра воды' : 'два литра воды';
    const questionWord = count ? 'неше' : 'қанша';
    return { ...common, question: `${PERSONS[person].locativeKz} ${questionWord} ${noun} бар`, questionRu: `сколько ${count ? 'книг' : 'литров воды'} у ${holderRu[i]}`, questionWord, short: amount, shortRu: numberRu, full: `${PERSONS[person].locativeKz} ${amount} бар`, fullRu: `у ${holderRu[i]} ${numberRu}`, answerWord: number,
      knownRu: count ? 'Известен человек. Нужно узнать число книг у него.' : 'Известны человек и вода. Измеряем объём в литрах, а не считаем предметы «вода».', ruleRu: count ? 'После вопроса о количестве и после числа название книг стоит без множественного окончания.' : 'Число относится к литрам. Название меры и вода сохраняются вместе; после числа они не получают множественное окончание.' };
  }
  if (input.scenario === 'where') {
    const place = second ? 'мектепте' : 'үйде'; const placeRu = second ? 'в школе' : 'дома';
    const questionWord = 'қайда' + pickFullPersonalEnding('қайда', person).suffix;
    const location = place + pickFullPersonalEnding(place, person).suffix;
    return { ...common, question: `${pronoun} ${questionWord}`, questionRu: `где ${subject}`, questionWord, short: location, shortRu: `${subject} ${placeRu}`, full: `${pronoun} ${location}`, fullRu: `${subject} ${placeRu}`, answerWord: location,
      knownRu: 'Известен человек. Спрашиваем о его нынешнем месте, без движения.', ruleRu: 'Здесь вопросительное слово и ответ о месте получают личное окончание. В коротком ответе местоимение можно убрать, но окончание лица сохраняется.' };
  }
  let questionWord = ''; let questionGroup = ''; let answerGroup = ''; let answerWord = ''; let answerPart: string | undefined;
  let predicate = ''; let questionRu = ''; let shortRu = ''; let fullRu = ''; let knownRu = ''; let ruleRu = '';
  switch (input.scenario) {
    case 'what-general': case 'what-specific': {
      const specific = input.scenario === 'what-specific'; questionWord = specific ? 'нені' : 'не'; questionGroup = questionWord;
      answerGroup = (second ? 'хат' : 'кітап') + (specific ? 'ты' : ''); answerWord = answerGroup; answerPart = specific ? 'ты' : undefined;
      predicate = verb('oqy'); shortRu = second ? 'письмо' : 'книгу'; questionRu = `что ${subject} ${readRu[i]}`; fullRu = `${subject} ${readRu[i]} ${shortRu}`;
      knownRu = specific ? 'Известен читатель. Выясняем, какой из уже обсуждаемых предметов он читает.' : 'Известен читатель. Выясняем вид чтения без выделения конкретной вещи.';
      ruleRu = specific ? 'Вопрос и выбранный предмет получают винительное окончание. Короткий ответ сохраняет его; это конкретная книга или письмо из разговора.' : 'Неизвестный предмет не выделен как конкретный. В этой схеме название чтения стоит перед действием без винительного окончания.'; break;
    }
    case 'selection':
      questionWord = 'қай'; questionGroup = 'қай кітапты'; answerGroup = second ? 'ана кітапты' : 'осы кітапты'; answerWord = 'кітапты'; answerPart = 'ты'; predicate = verb('oqy'); shortRu = second ? 'ту книгу' : 'эту книгу'; questionRu = `какую книгу ${subject} ${readRu[i]}`; fullRu = `${subject} ${readRu[i]} ${shortRu}`; knownRu = 'Книги уже известны. Нужно выбрать одну из них; читатель задан.'; ruleRu = 'Вопросительное слово стоит перед названием книги. Вся группа занимает место предмета перед действием. Винительное окончание остаётся на книге.'; break;
    case 'to-where':
      questionWord = 'қайда'; questionGroup = questionWord; answerGroup = second ? 'мектепке' : 'үйге'; answerWord = answerGroup; answerPart = second ? 'ке' : 'ге'; predicate = verb('bar'); shortRu = second ? 'в школу' : 'домой'; questionRu = `куда ${subject} ${goRu[i]}`; fullRu = `${subject} ${goRu[i]} ${shortRu}`; knownRu = 'Человек пойдёт в какое-то место. Неизвестно назначение движения.'; ruleRu = 'Слово вопроса такое же, как в вопросе о месте. Направление задаёт действие. Название места назначения в ответе получает дательное окончание.'; break;
    case 'from-where':
      questionWord = 'қайдан'; questionGroup = questionWord; answerGroup = second ? 'мектептен' : 'үйден'; answerWord = answerGroup; answerPart = second ? 'тен' : 'ден'; predicate = verb('kel', true); shortRu = second ? 'из школы' : 'из дома'; questionRu = `откуда ${subject} ${pastRu('пришёл', 'пришли')}`; fullRu = `${subject} ${pastRu('пришёл', 'пришли')} ${shortRu}`; knownRu = 'Человек уже пришёл. Нужно узнать исходное место.'; ruleRu = 'Вопрос и ответ обозначают исходную точку. Короткое название места сохраняет исходное окончание. Это не вопрос о том, куда человек пойдёт.'; break;
    case 'when':
      questionWord = 'қашан'; questionGroup = questionWord; answerGroup = second ? 'ертең' : 'бүгін'; answerWord = answerGroup; predicate = verb('kel'); shortRu = second ? 'завтра' : 'сегодня'; questionRu = `когда ${subject} ${comeRu[i]}`; fullRu = `${subject} ${comeRu[i]} ${shortRu}`; knownRu = 'Ожидаем приход человека. Неизвестен день прихода.'; ruleRu = 'Вопрос просит назвать время события. Ответ называет день; он не сообщает длительность действия.'; break;
    case 'duration':
      questionWord = 'қанша'; questionGroup = 'қанша уақыт'; answerGroup = second ? 'үш сағат' : 'екі сағат'; answerWord = 'сағат'; predicate = verb('oqy', true); shortRu = second ? 'три часа' : 'два часа'; questionRu = `как долго ${subject} ${pastRu('читал', 'читали')}`; fullRu = `${subject} ${pastRu('читал', 'читали')} ${shortRu}`; knownRu = 'Речь о чтении в прошлом. Неизвестно, сколько времени оно длилось.'; ruleRu = 'Число перед словом «час» обозначает длительность. Эта фраза не утверждает, что человек дочитал книгу, и не называет срок завершения.'; break;
    case 'how':
      questionWord = 'қалай'; questionGroup = questionWord; answerGroup = second ? 'баяу' : 'әдемі'; answerWord = answerGroup; predicate = verb('jaz'); shortRu = second ? 'медленно' : 'красиво'; questionRu = `как ${subject} ${writeRu[i]}`; fullRu = `${subject} ${writeRu[i]} ${shortRu}`; knownRu = 'Человек пишет. Выясняем способ выполнения действия.'; ruleRu = 'Ответ описывает, как человек пишет. Он не называет ручку или другой инструмент.'; break;
    case 'instrument':
      questionWord = 'немен'; questionGroup = questionWord; answerGroup = second ? 'қарындашпен' : 'қаламмен'; answerWord = answerGroup; answerPart = second ? 'пен' : 'мен'; predicate = verb('jaz'); shortRu = second ? 'карандашом' : 'ручкой'; questionRu = `чем ${subject} ${writeRu[i]}`; fullRu = `${subject} ${writeRu[i]} ${shortRu}`; knownRu = 'Человек пишет. Неизвестен инструмент.'; ruleRu = 'Название инструмента получает творительное окончание. В коротком ответе оно сохраняется. Скорость или красота письма здесь не названы.'; break;
  }
  return { ...common, question: `${pronoun} ${questionGroup} ${predicate}`, questionRu, questionWord, short: answerGroup, shortRu, full: `${pronoun} ${answerGroup} ${predicate}`, fullRu, answerWord, answerPart, knownRu, ruleRu };
}

function limited(): ConstructorWave4QuestionsResult {
  return { status: 'limited', text: null, thoughtRu: '', steps: [], sourceIds: [], sourceElementIds: [], acceptedAnswers: [], limits: ['Выбери подготовленный вопрос и подходящий к нему ответ.'], outputKind: 'sentence', answerScopeRu: '', question: null, shortAnswer: null, fullAnswer: null, visual: null, controls: null };
}

export function buildConstructorWave4Questions(raw: ConstructorWave4QuestionsInput): ConstructorWave4QuestionsResult {
  const input = decodeConstructorWave4QuestionsInput(raw); if (!input) return limited();
  const data = recipe(input); const scenario = scenarioOf(input); const isQuestion = input.form === 'question';
  const question = { text: sentence(data.question, true), thoughtRu: sentence(data.questionRu, true) };
  const shortAnswer = isQuestion ? null : { text: sentence(data.short), thoughtRu: sentence(data.shortRu) };
  const fullAnswer = isQuestion ? null : { text: sentence(data.full), thoughtRu: sentence(data.fullRu) };
  const output = isQuestion ? question : input.form === 'short' ? shortAnswer! : fullAnswer!;
  const word = isQuestion ? data.questionWord : data.answerWord;
  const part = (isQuestion ? data.questionPart : data.answerPart) || word;
  const wordIndex = normal(output.text).indexOf(normal(word));
  const partOffset = word.lastIndexOf(part);
  const partIndex = wordIndex + partOffset;
  const sourceElementIds = [...scenario.sourceElementIds, ...(isQuestion ? [] : [input.form === 'short' ? 'grammar-question:36.25' : 'grammar-question:36.26'])];
  const sourceIds: ConstructorWave4QuestionsSourceId[] = ['wave4-question-words', 'wave4-question-syntax', 'wave4-question-reference', 'wave4-question-cases'];
  if (input.scenario.startsWith('whose')) sourceIds.push('wave4-question-ownership');
  if (input.scenario === 'duration') sourceIds.push('wave4-question-time');
  if (input.scenario === 'how') sourceIds.push('wave4-question-lexicon');
  const step = (id: string, labelRu: string, text: string, meaningRu: string, explanationRu: string) => ({ id, labelRu, text, kazakh: text, meaningRu, explanationRu });
  const steps = [step('question-role', 'Что нужно узнать', data.questionWord, scenario.labelRu, data.ruleRu)];
  if (!isQuestion) steps.push(step('answer-role', 'Ответ на вопрос', data.short, data.shortRu, 'Короткий ответ заполняет именно выбранную неизвестную часть. Остальная ситуация берётся из вопроса.'));
  steps.push(step('complete-phrase', isQuestion ? 'Вопрос целиком' : input.form === 'short' ? 'Короткий ответ' : 'Полный ответ', output.text, output.thoughtRu, data.knownRu));
  return {
    status: 'ready', text: output.text, thoughtRu: output.thoughtRu, steps, acceptedAnswers: [output.text],
    limits: [data.ruleRu, 'Показаны подготовленные вопросы и ответы об одной ситуации. Лица называются с одной точки отсчёта; смена собеседника не выполняется автоматически.', 'Другие слова, времена, отрицания, интонационные варианты и свободная перестановка не входят в этот набор.'],
    sourceIds, sourceElementIds: [...new Set(sourceElementIds)], outputKind: input.form === 'short' ? 'answer-fragment' : 'sentence',
    answerScopeRu: isQuestion ? 'Целый вопрос' : input.form === 'short' ? 'Короткий ответ на данный вопрос' : 'Полная фраза ответа на данный вопрос',
    question, shortAnswer, fullAnswer,
    visual: { kind: 'question-answer', unknownRole: scenario.unknownRole, unknownLabelRu: scenario.labelRu, knownRu: data.knownRu, questionText: question.text, answerText: isQuestion ? null : output.text, answerRu: isQuestion ? null : output.thoughtRu, form: input.form },
    controls: { personRole: isQuestion && answerPerson(scenario.personRole) ? 'none' : scenario.personRole, personIds: knownPerson(scenario.personRole) || !isQuestion && answerPerson(scenario.personRole) ? personsFor(input.scenario) : [], choiceLabelRu: 'Что сообщить в ответе', choices: isQuestion ? [] : scenario.choices.map((labelRu, index) => ({ id: index ? 'second' as const : 'first' as const, labelRu })) },
    practice: { part: { id: 'practice-part', text: output.text.slice(partIndex, partIndex + part.length), before: output.text.slice(0, partIndex), after: output.text.slice(partIndex + part.length), explanationRu: data.ruleRu }, word: { id: 'practice-word', text: word, labelRu: isQuestion ? 'Напиши слово вопроса целиком' : 'Напиши нужное слово ответа целиком' } },
  };
}

export function checkConstructorWave4QuestionsAnswer(input: ConstructorWave4QuestionsInput, answer: string, scope: 'part' | 'word' | 'full' = 'full'): { passed: boolean; expected: string | null; messageRu: string } {
  const result = buildConstructorWave4Questions(input);
  if (result.status !== 'ready' || !['part', 'word', 'full'].includes(scope)) return { passed: false, expected: null, messageRu: 'Для этого сочетания нет подготовленного ответа.' };
  const expected = scope === 'part' ? result.practice!.part.text : scope === 'word' ? result.practice!.word.text : result.text!;
  const passed = normal(answer) === normal(expected);
  return { passed, expected, messageRu: passed ? 'Верно.' : scope === 'full' ? `Нужен ${result.answerScopeRu.toLocaleLowerCase('ru')}. Сохрани лицо и роль неизвестной части.` : 'Проверь слово и его окончание в этом вопросе.' };
}

export function constructorWave4QuestionsRussianAliases(input: ConstructorWave4QuestionsInput): string[] {
  const result = buildConstructorWave4Questions(input); if (!result.text) return [];
  const aliases = [result.thoughtRu];
  if (input.form === 'question') aliases.push(scenarioOf(input).labelRu + ': ' + result.thoughtRu);
  if (input.person === 'ol') aliases.push(result.thoughtRu.replace(/^Он(?= |\.)/u, 'Она').replace(/ он /gu, ' она ').replace('у него', 'у неё').replace('ему', 'ей').replace('пришёл', 'пришла').replace('читал', 'читала'));
  if (['men', 'sen'].includes(input.person ?? '')) aliases.push(result.thoughtRu.replace('пришёл', 'пришла').replace('читал', 'читала'));
  return [...new Set(aliases)];
}

export function constructorWave4QuestionsNearbyInputs(raw: ConstructorWave4QuestionsInput): { labelRu: string; explanationRu: string; input: ConstructorWave4QuestionsInput }[] {
  const input = decodeConstructorWave4QuestionsInput(raw); if (!input) return [];
  const scenario = scenarioOf(input);
  const contexts = constructorWave4QuestionsPreparedContexts();
  const links: { labelRu: string; explanationRu: string; input: ConstructorWave4QuestionsInput }[] = [];
  if (input.form === 'question') {
    const answers = contexts.filter(candidate => candidate.scenario === input.scenario && candidate.form === 'short' && (!knownPerson(scenario.personRole) || candidate.person === input.person));
    for (const candidate of answers) links.push({ labelRu: 'Ответ: ' + buildConstructorWave4Questions(candidate).thoughtRu.replace(/\.$/u, ''), explanationRu: 'Выбранное содержание заполнит неизвестную часть вопроса.', input: candidate });
  } else {
    const other = { ...input, form: input.form === 'short' ? 'full' as const : 'short' as const };
    links.push({ labelRu: input.form === 'short' ? 'Ответить полной фразой' : 'Ответить коротко', explanationRu: 'Содержание ответа и его падеж сохраняются. Меняется только повторение известной части.', input: other });
    const question = contexts.find(candidate => candidate.scenario === input.scenario && candidate.form === 'question' && (!knownPerson(scenario.personRole) || candidate.person === input.person))!;
    links.push({ labelRu: 'Вернуться к вопросу', explanationRu: 'Ответ снова становится неизвестным; известная часть ситуации сохраняется.', input: question });
  }
  const neighbours: Partial<Record<ConstructorWave4QuestionScenario, ConstructorWave4QuestionScenario>> = { 'who-one': 'who-many', 'who-many': 'who-one', 'what-general': 'what-specific', 'what-specific': 'what-general', 'whose-predicate': 'whose-before', 'whose-before': 'whose-predicate', quality: 'selection', selection: 'quality', count: 'measure', measure: 'count', where: 'to-where', 'to-where': 'from-where', 'from-where': 'where', when: 'duration', duration: 'when', how: 'instrument', instrument: 'how', placement: 'who-one' };
  const neighbourId = neighbours[input.scenario];
  if (neighbourId && input.form === 'question') {
    const neighbour = CONSTRUCTOR_WAVE4_QUESTION_SCENARIOS.find(item => item.id === neighbourId)!;
    // A new required actor is named in the link; never attach a fake actor to an unknown subject.
    const candidate = contexts.find(item => item.scenario === neighbourId && item.form === 'question' && (!knownPerson(neighbour.personRole) || item.person === (input.person ?? 'ol')))!;
    const built = buildConstructorWave4Questions(candidate);
    const changes: Partial<Record<ConstructorWave4QuestionScenario, string>> = {
      'who-one': 'Теперь вопрос прямо указывает на нескольких исполнителей.', 'who-many': 'Теперь вопрос не задаёт несколько исполнителей; ответ выбирается для одного человека.',
      'what-general': 'Теперь выделяем конкретный предмет из разговора. Вопрос и ответ получают винительное окончание.', 'what-specific': 'Теперь спрашиваем о виде чтения без выделения конкретной вещи. В этой схеме винительное окончание убирается.',
      'whose-predicate': 'Владелец займёт место перед названием книги. Книга получит притяжательное окончание.', 'whose-before': 'Вопрос о владельце станет самостоятельным словом после названия книги.',
      quality: 'Новый пример добавляет читателя: он выбирает одну книгу. Вместо качества спрашиваем, какую книгу он читает.', selection: 'Теперь обсуждаем качество уже выбранной книги. Читатель и действие чтения в новом примере не названы.',
      count: 'Теперь измеряем воду в литрах. Меняются предмет вопроса и единица счёта.', measure: 'Теперь считаем книги. Вода и литры заменяются отдельными предметами.',
      where: 'Нахождение сейчас заменяется планируемым движением к месту. Вопросительное слово остаётся тем же.',
      'to-where': 'Планируемое движение к месту заменяется уже совершившимся приходом из места. Меняются направление и время.',
      'from-where': 'Приход из места в прошлом заменяется нахождением сейчас. Движение больше не утверждается.',
      when: 'Это другой пример: вместо дня будущего прихода спрашиваем о длительности чтения в прошлом. Меняются действие и время.',
      duration: 'Это другой пример: вместо длительности чтения в прошлом спрашиваем о дне будущего прихода. Меняются действие и время.',
      how: 'Вместо способа письма спрашиваем об инструменте. Человек и действие сохраняются.', instrument: 'Вместо инструмента спрашиваем о способе письма. Человек и действие сохраняются.',
      placement: 'Вопрос об исполнителе переходит в начало. Книга, действие и неизвестный человек сохраняют свои роли.',
    };
    links.push({ labelRu: built.thoughtRu, explanationRu: changes[input.scenario] ?? built.visual!.knownRu, input: candidate });
  }
  return links;
}
