/** Prepared examples and their explicit readings; language bindings come later. */
import type { MeaningGraph } from './thought-graph';
import { THOUGHT_CORPUS_DATA } from './thought-corpus-data';
export interface ThoughtReading { id: string; label: string; graph: MeaningGraph }
export interface ThoughtExample {
  id: string; sourceRef: { corpus: 'running-214'; id: string };
  groupId: string; groupTitle: string; text: string; selectedReadingId: string | null;
  readings: ThoughtReading[]; notes: string[]; mentionOrder: string[];
  ambiguity?: { field: string; options: string[]; selected: string | null };
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) freeze(child); }
  return value;
}
export const THOUGHT_EXAMPLES: readonly ThoughtExample[] = freeze(THOUGHT_CORPUS_DATA);
const examples = new Map(THOUGHT_EXAMPLES.map(e => [e.id, e]));
/** Return a detached context; exploration must not mutate the prepared catalogue. */
export function getThoughtExample(id: string): ThoughtExample | undefined {
  const found = examples.get(id.startsWith('running-214:') ? id : 'running-214:' + id);
  return found ? structuredClone(found) : undefined;
}

