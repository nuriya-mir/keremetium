/** Sources supply evidence; none defines the curriculum or has automatic priority. */
export interface LearningSource {
  id: string;
  title: string;
  kind: 'book' | 'grammar' | 'dictionary' | 'corpus' | 'speaker';
}
export interface ConstructionEvidence {
  sourceId: string;
  locator: string;
  status: 'imported' | 'checked' | 'needs-review';
}
export interface LanguageConstruction {
  id: string;
  language: string;
  intentionIds: string[];
  evidence: ConstructionEvidence[];
}

export const LEARNING_SOURCES: LearningSource[] = [
  { id: 'kuzekova-masakova-2018', title: 'З. Күзекова, Г. Масақова, «Қазақ тілі: Базалық деңгей (А2)», 2018', kind: 'book' },
  { id: 'kaz-tili-grammar', title: 'Т. Валяева, kaz-tili.kz: личные окончания и именное сказуемое', kind: 'grammar' },
  { id: 'romanenko-2013', title: 'Е. Романенко, «Казахская грамматика для русскоязычных», 2013', kind: 'book' },
];

/** Multiple sources can support the same construction, without changing its identity. */
export function sourcesForConstruction(construction: LanguageConstruction, sources: readonly LearningSource[] = LEARNING_SOURCES): LearningSource[] {
  const ids = new Set(construction.evidence.map(item => item.sourceId));
  return sources.filter(source => ids.has(source.id));
}
