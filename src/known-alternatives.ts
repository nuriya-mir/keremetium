import { isPresenceTopic } from '../layer2-kazakh/presence';
import { isNominalTopic, nominalRootIds } from '../layer2-kazakh/nominal-lexicon';
import { buildForm } from '../layer2-kazakh/form-builder';
import { PERSONS } from '../layer2-kazakh/roots';
import { checkUserAnswer, normalizeKazakhInput } from './answer-checker';
import type { BuiltFormResult, PersonId } from '../types';

/** Only exact, core-accepted forms. Keep every interpretation of an ambiguous form. */
export function findKnownAlternatives(answer: string, expected: BuiltFormResult, formulaIds: readonly string[]): BuiltFormResult[] {
  const normalized = normalizeKazakhInput(answer);
  if (!normalized || checkUserAnswer(answer, expected).isPassed) return [];
  const matches: BuiltFormResult[] = [];
  for (const formula of new Set([expected.formulaId, ...formulaIds])) {
    if (isPresenceTopic(expected.formulaId) !== isPresenceTopic(formula)) continue;
    if (isNominalTopic(formula) && !nominalRootIds(formula).includes(expected.rootId)) continue;
    if (isNominalTopic(expected.formulaId) && !isNominalTopic(formula)) continue;
    for (const person of Object.keys(PERSONS) as PersonId[]) {
      if (!PERSONS[person].isCoreEight || (formula === expected.formulaId && person === expected.person)) continue;
      const candidate = buildForm(formula, expected.rootId, person);
      const exact = [candidate.afterCheck.canonicalFormKz, candidate.afterCheck.fullFormWithBracketsKz, ...candidate.afterCheck.acceptedFormsKz]
        .some(form => form !== undefined && normalizeKazakhInput(form) === normalized);
      if (exact && checkUserAnswer(answer, candidate).isPassed) matches.push(candidate);
    }
  }
  return matches;
}
