import { buildAtlasThought } from './atlas-thought-corpus';

/** Only the prepared, source-backed Atlas corpus can receive a translation. */
export function thoughtExampleTranslation(thought: string): string | null {
  return buildAtlasThought(thought);
}
