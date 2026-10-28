import type { PersonId } from '../types';
import { CONSTRUCTOR_STAGE4_PERSON_IDS } from './constructor-stage4';
import { realizeConstructorWord, type ConstructorResult } from './constructor-realization';
import { FULL_LEXEMES, realizeFullConstructorWord } from './full-meaning-constructor';
import { ATLAS_THOUGHT_CORPUS, ATLAS_THOUGHT_SOURCES, buildAtlasThought } from './atlas-thought-corpus';
import type { ConstructorStage6CommunicationSourceId } from './constructor-stage6-communication-evidence';

export const CONSTRUCTOR_STAGE6_REFERENCE_CASES = ['nominative', 'genitive', 'dative', 'accusative', 'locative', 'ablative', 'instrumental'] as const;
export type ConstructorStage6ReferenceCase = typeof CONSTRUCTOR_STAGE6_REFERENCE_CASES[number];
export const CONSTRUCTOR_STAGE6_COMMUNICATION_PHRASES = [
  { id: 'greeting', thoughtRu: 'Здравствуйте.', functionRu: 'Приветствие', questionNumbers: ['16.10', '47.5'] },
  { id: 'thanks', thoughtRu: 'Спасибо.', functionRu: 'Благодарность', questionNumbers: ['16.10', '47.17'] },
  { id: 'apology', thoughtRu: 'Извините.', functionRu: 'Извинение', questionNumbers: ['16.10', '47.19'] },
  { id: 'guest', thoughtRu: 'Будьте гостем.', functionRu: 'Приглашение быть гостем', questionNumbers: ['16.10', '47.12'] },
  { id: 'concern', thoughtRu: 'Не беспокойтесь, пожалуйста.', functionRu: 'Просьба не беспокоиться', questionNumbers: ['16.10'] },
  { id: 'wish', thoughtRu: 'Да будет ваш путь светлым.', functionRu: 'Пожелание', questionNumbers: ['16.10'] },
  { id: 'opinion', thoughtRu: 'По-моему, он прав.', functionRu: 'Собственное мнение', questionNumbers: ['34.19', '38.26'] },
  { id: 'reported', thoughtRu: 'Говорят, это было давно: сам не видел.', functionRu: 'Чужие слова без собственного свидетельства', questionNumbers: ['34.19'] },
  { id: 'seems', thoughtRu: 'Кажется, так.', functionRu: 'Неуверенное предположение', questionNumbers: ['34.18'] },
] as const;
export type ConstructorStage6CommunicationPhraseId = typeof CONSTRUCTOR_STAGE6_COMMUNICATION_PHRASES[number]['id'];
export type ConstructorStage6CommunicationInput =
  | { kind: 'personal'; person: PersonId; case: ConstructorStage6ReferenceCase }
  | { kind: 'pointing'; wordId: 'bul' | 'sol'; case: ConstructorStage6ReferenceCase }
  | { kind: 'reflexive'; person: PersonId }
  | { kind: 'interjection'; wordId: 'alaqai' | 'oi' | 'masqara' }
  | { kind: 'atlas'; phraseId: ConstructorStage6CommunicationPhraseId };
export interface ConstructorStage6CommunicationResult {
  status: 'prepared' | 'needs-evidence';
  integrationStatus: 'prepared';
  outputKind: 'reference-form' | 'fixed-utterance' | null;
  text: string | null;
  thoughtRu: string;
  functionRu: string;
  sourceIds: ConstructorStage6CommunicationSourceId[];
  sourceUrls: string[];
  limits: string[];
  referentResolved: false;
  dialogueGenerated: false;
  audio: null;
  acceptedAnswers: string[];
}
const limits = ['Это закрытый пример или отдельная форма. Адресат, предыдущая реплика и неназванный участник автоматически не восстанавливаются.', 'Аудио, интонация и уместность произвольного ответа не проверяются.'];
const result = (text: string | null, thoughtRu: string, functionRu: string, outputKind: ConstructorStage6CommunicationResult['outputKind'], sourceIds: ConstructorStage6CommunicationSourceId[], boundary: string, sourceUrls: string[] = []): ConstructorStage6CommunicationResult => ({ status: text ? 'prepared' : 'needs-evidence', integrationStatus: 'prepared', outputKind, text, thoughtRu, functionRu, sourceIds, sourceUrls, limits: [...limits, boundary], referentResolved: false, dialogueGenerated: false, audio: null, acceptedAnswers: text ? [text] : [] });
const rejected = () => result(null, '', '', null, [], 'Для этих параметров нет закрытого проверенного примера.');
const exactKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key));
const caseIndex = (value: unknown) => (CONSTRUCTOR_STAGE6_REFERENCE_CASES as readonly unknown[]).indexOf(value);
const personIndex = (value: unknown) => (CONSTRUCTOR_STAGE4_PERSON_IDS as readonly unknown[]).indexOf(value);
const fromWord = (built: ConstructorResult, source: ConstructorStage6CommunicationSourceId, functionRu: string, boundary: string, outputKind: 'reference-form' | 'fixed-utterance' = 'reference-form') => built.status === 'ready' && built.kz && built.ru ? result(built.kz, built.ru, functionRu, outputKind, [source], boundary) : rejected();

export function buildConstructorStage6Communication(input: ConstructorStage6CommunicationInput): ConstructorStage6CommunicationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return rejected();
  const record = input as unknown as Record<string, unknown>;
  if (input.kind === 'personal') {
    const person = personIndex(input.person), ci = caseIndex(input.case);
    if (!exactKeys(record, ['kind', 'person', 'case']) || person < 0 || ci < 0) return rejected();
    const built = realizeConstructorWord({ base: 'pronoun', variant: 'personal', meaning: 'я', steps: [{ id: 'pronounPerson', value: person }, { id: 'case', value: ci }] });
    return fromWord(built, 'communication-personal', 'Форма участника разговора', 'Русские варианты рода и числа сохранены из таблицы. Пол, пропуск местоимения и ссылка внутри предложения здесь не выбираются.');
  }
  if (input.kind === 'pointing') {
    const ci = caseIndex(input.case);
    if (!exactKeys(record, ['kind', 'wordId', 'case']) || !['bul', 'sol'].includes(input.wordId) || ci < 0) return rejected();
    const lex = FULL_LEXEMES.find(word => word.id === input.wordId)!;
    return fromWord(realizeFullConstructorWord({ base: lex.base, variant: lex.variant, meaning: lex.ru, steps: [{ id: 'case', value: ci }] }), 'communication-pointing', 'Указательная форма', 'Две парадигмы показывают выбранные написания. Другие нормативные варианты не объявляются ошибочными; конкретный предмет и расстояние не заданы.');
  }
  if (input.kind === 'reflexive') {
    const person = personIndex(input.person);
    if (!exactKeys(record, ['kind', 'person']) || person < 0) return rejected();
    const lex = FULL_LEXEMES.find(word => word.id === 'oz')!;
    return fromWord(realizeFullConstructorWord({ base: lex.base, variant: lex.variant, meaning: lex.ru, steps: [{ id: 'reflexiveOwner', value: person }] }), 'communication-reflexive', 'Кто делает сам', 'Только именительный падеж. Отсылка к исполнителю, другие падежи и согласование в сложной фразе требуют отдельного контекста.');
  }
  if (input.kind === 'interjection') {
    if (!exactKeys(record, ['kind', 'wordId']) || !['alaqai', 'oi', 'masqara'].includes(input.wordId)) return rejected();
    const lex = FULL_LEXEMES.find(word => word.id === input.wordId)!;
    return fromWord(realizeFullConstructorWord({ base: lex.base, variant: lex.variant, meaning: lex.ru, steps: [] }), 'communication-interjection', 'Выражение чувства', 'Три самостоятельных примера. Место в предложении, обращение, интенсивность и интонация не выбираются.', 'fixed-utterance');
  }
  if (input.kind === 'atlas') {
    if (!exactKeys(record, ['kind', 'phraseId'])) return rejected();
    const phrase = CONSTRUCTOR_STAGE6_COMMUNICATION_PHRASES.find(item => item.id === input.phraseId);
    if (!phrase) return rejected();
    const text = buildAtlasThought(phrase.thoughtRu);
    if (!text) return rejected();
    return result(text, phrase.thoughtRu, phrase.functionRu, 'fixed-utterance', ['communication-atlas'], 'Фраза и её полный перевод закреплены. Нет смены лица, времени, вежливости, отрицания или свободного продолжения.', ATLAS_THOUGHT_CORPUS[phrase.thoughtRu].sources.map(source => ATLAS_THOUGHT_SOURCES[source]));
  }
  return rejected();
}

export function checkConstructorStage6CommunicationAnswer(input: ConstructorStage6CommunicationInput, answer: string) {
  const built = buildConstructorStage6Communication(input);
  if (!built.text || typeof answer !== 'string') return { passed: null, expected: built.text, messageRu: 'Для этой проверки нет подготовленного ответа.' };
  const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('kk').replace(/\s+/gu, ' ');
  const passed = normalize(answer) === normalize(built.text);
  return { passed, expected: built.text, messageRu: passed ? 'Ответ совпадает с подготовленным примером.' : 'Этот ответ отличается от подготовленного. Его правильность и уместность здесь не проверены.' };
}
