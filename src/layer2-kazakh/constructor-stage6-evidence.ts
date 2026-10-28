import { nominalEvidence } from '../layer3-sources/nominal-evidence';
import { PRESENCE_CONSTRUCTIONS } from '../layer3-sources/presence-evidence';

/** Internal provenance for the closed stage 6 groups; not learner-facing content. */
export const CONSTRUCTOR_STAGE6_EVIDENCE = [
  {
    id: 'stage6-presence',
    evidence: PRESENCE_CONSTRUCTIONS[0].evidence,
    scope: 'Five prepared nouns; eight locative persons; present presence/absence and separate general questions. No claim about ownership, arbitrary locations or plural objects.',
    review: 'docs/grammar-checks/2026-10-19-presence.md',
    questionReview: 'docs/grammar-checks/2026-10-19-presence-questions.md',
  },
  {
    id: 'stage6-nominal',
    evidence: nominalEvidence(),
    scope: 'Three human roles and four qualities, eight persons, present affirmative/negative. Generalized role is canonical; documented plural-role alternatives are accepted, never transferred to qualities.',
    review: 'docs/grammar-checks/2026-10-19-nominal-predicates.md',
    disagreement: 'The nasal-final first-person plural follows the explicit kaz-tili example; Romanenko’s generalized table does not independently resolve that detail.',
  },
  {
    id: 'stage6-nominal-question',
    evidence: nominalEvidence(true),
    scope: 'Separate general-question particle after the complete predicate, including negative predicate. Fused alternatives and interrogative words are outside this prepared group.',
    review: 'docs/grammar-checks/2026-10-19-nominal-questions.md',
  },
] as const;

export type ConstructorStage6SourceId = typeof CONSTRUCTOR_STAGE6_EVIDENCE[number]['id'];
