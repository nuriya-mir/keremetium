import type { ConstructionEvidence } from './registry';

/** Internal provenance only; none of these fields are rendered in lessons. */
export function nominalEvidence(question = false): ConstructionEvidence[] {
  return [
    { sourceId: 'kaz-tili-grammar', locator: question ? 'https://www.kaz-tili.kz/su_mn3.htm; lichnie1.htm — general questions after nominal predicates; checked 2026-10-19' : 'https://www.kaz-tili.kz/lichnie1.htm — personal endings, nominal negation; checked 2026-10-19', status: 'checked' },
    { sourceId: 'romanenko-2013', locator: question ? 'https://corp.soyle.kz/file/download?id=38 — lessons 8 and 13, printed pp. 22 and 32; scope: docs/grammar-checks/2026-10-19-nominal-questions.md' : 'https://corp.soyle.kz/file/download?id=38 — lesson 13, printed p. 32; applicability and disagreements: docs/grammar-checks/2026-10-19-nominal-predicates.md', status: 'checked' },
  ];
}
