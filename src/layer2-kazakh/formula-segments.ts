import { BuiltFormResult, ColoredSegment } from '../types';

export interface FormulaSegment extends Omit<ColoredSegment, 'isOptionalBracket'> {
  optional: boolean;
  separatorBefore: 'space' | 'join' | 'none';
}

/** Word boundaries come from the canonical form; labels never determine spelling. */
export function getFormulaSegments(built: BuiltFormResult): FormulaSegment[] {
  const canonical = built.afterCheck.canonicalFormKz;
  const result: FormulaSegment[] = [];
  let cursor = 0;
  let hasRequired = false;
  for (const segment of built.afterCheck.coloredSegments) {
    const text = segment.text.trim();
    if (!text) continue;
    const { isOptionalBracket, ...data } = segment;
    if (isOptionalBracket) {
      result.push({ ...data, text, optional: true, separatorBefore: result.length ? 'space' : 'none' });
      continue;
    }
    const remaining = canonical.slice(cursor);
    const whitespace = remaining.match(/^\s*/)?.[0] ?? '';
    if (!remaining.slice(whitespace.length).startsWith(text)) {
      // Some older formulas store an already merged word alongside its source
      // suffixes. Preserve the accurate canonical spelling until those formulas
      // expose non-overlapping segments, instead of inventing a word boundary.
      const optional = result.filter(item => item.optional);
      return [...optional, {
        text: canonical, glossRu: 'Полная форма', color: 'ink', role: 'root', optional: false,
        separatorBefore: optional.length ? 'space' : 'none',
      }];
    }
    result.push({ ...data, text, optional: false,
      separatorBefore: !hasRequired ? (result.length ? 'space' : 'none') : whitespace ? 'space' : 'join',
    });
    cursor += whitespace.length + text.length;
    hasRequired = true;
  }
  if (canonical.slice(cursor).trim()) {
    return [{ text: canonical, glossRu: 'Полная форма', color: 'ink', role: 'root', optional: false, separatorBefore: 'none' }];
  }
  return result;
}
