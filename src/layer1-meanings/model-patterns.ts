/** Structural model registry. It does not interpret Russian or build Kazakh forms. */
import { THOUGHT_EXAMPLES } from './thought-corpus';
import { meaningTemporalConstraints, validateMeaningGraph, type MeaningGraph, type MeaningNode, type PredicateNode, type SemanticValue } from './thought-graph';

export interface ModelSlot { id: string; kind: 'predicate' | 'entity'; nodeId: string; value: string }
export interface ModelDescription { signature: string; slots: ModelSlot[] }
export interface ModelPattern {
  modelId: string; version: 1;
  /** Complete structural constraints, independent of source IDs and concrete words. */
  signature: string;
  examples: { exampleId: string; readingId: string }[];
}
export interface ModelMatch { modelId: string; version: 1; slots: ModelSlot[] }
const stable = (v: unknown): string => {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.entries(v).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([k, x]) => JSON.stringify(k) + ':' + stable(x)).join(',') + '}';
  return JSON.stringify(v);
};
function permutations<T>(items: T[]): T[][] {
  if (!items.length) return [[]];
  return items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [item, ...rest]));
}
const structuralKeys = new Set(['kind', 'scope', 'act', 'role', 'recurring', 'conditional', 'paired', 'exact', 'approximate', 'partUnknown', 'trend', 'comparison', 'continuous', 'interrupted', 'finishFocus', 'motion', 'figurative', 'resultState', 'progress', 'branch', 'expected', 'manner']);
function valueShape(value: SemanticValue, key = ''): unknown {
  if (value === null) return { status: 'unknown' };
  if (structuralKeys.has(key)) return value;
  if (Array.isArray(value)) return { slot: 'list', itemType: value.length ? typeof value[0] : 'unknown' };
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([k]) => !['label', 'accepted', 'rejected'].includes(k)).map(([k, v]) => [k, valueShape(v, k)]));
  if (key === 'unit') return { slot: 'unit', dimension: ['км','метр','метров'].includes(String(value)) ? 'distance' : 'time' };
  return { slot: typeof value };
}

/** Canonical graph form: up to four predicates, explicit scope, roles and frame identity.
 * Full permutations are small for this catalogue and remove reliance on ID/array order.
 * Larger graphs require a separate matching strategy; never truncate them into a smaller model.
 */
export function describeModelStructure(graph: MeaningGraph): ModelDescription {
  const errors = validateMeaningGraph(graph);
  if (errors.length) throw new Error('Invalid meaning graph: ' + errors.map(e => e.code).join(', '));
  const predicates = graph.nodes.filter((n): n is PredicateNode => n.kind === 'predicate');
  const usedEntities = new Set([...graph.roles.map(r => r.entityId), ...graph.nodes.flatMap(n => n.kind === 'operator' ? [...(n.agentId ? [n.agentId] : []), ...[n.correction?.accepted, n.correction?.rejected].flatMap(v => v?.kind === 'entity' ? [v.id] : [])] : [])]);
  const entities = graph.nodes.filter(n => n.kind === 'entity' && usedEntities.has(n.id));
  if (predicates.length > 4 || entities.length > 5) throw new Error('Graph exceeds the prepared model matching limits.');
  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  const roles = new Map(graph.roles.map(r => [r.id, r]));
  const relations = new Map(graph.relations.map(r => [r.id, r]));
  const anchors = new Map(graph.anchors.map(a => [a.id, a]));
  const frames = new Map(graph.frames.map(f => [f.id, f]));
  let best = '', slots: ModelSlot[] = [];
  for (const ordered of permutations(predicates)) for (const people of permutations(entities)) {
    const p = new Map(ordered.map((n, i) => [n.id, i])), e = new Map(people.map((n, i) => [n.id, i]));
    const frameIds = new Map<string, number>(), frameShapes: unknown[] = [];
    function frame(id: string): number {
      if (frameIds.has(id)) return frameIds.get(id)!;
      const f = frames.get(id)!;
      const parent = f.parentId ? frame(f.parentId) : null;
      const index = frameShapes.length; frameIds.set(id, index); frameShapes.push({ kind: f.kind, parent }); return index;
    }
    const role = (id: string) => { const r = roles.get(id)!; return { predicate: p.get(r.predicateId), kind: r.kind, entity: e.get(r.entityId) }; };
    const relation = (id: string) => { const r = relations.get(id)!; return { from: p.get(r.from), kind: r.kind, to: p.get(r.to) }; };
    const anchor = (id: string) => { const a = anchors.get(id)!; return { kind: a.kind, status: a.value.status, ...(a.value.status === 'known' ? { precision: a.value.precision } : {}), event: a.eventId ? p.get(a.eventId) : null }; };
    const predicateShapes = ordered.map(n => ({ type: n.predicateType, extent: n.extent, frame: frame(n.frameId), time: { relation: n.time.relation, anchor: n.time.anchorId ? anchor(n.time.anchorId) : null }, features: valueShape(n.features) }));
    const cache = new Map<string, unknown>();
    const node = (id: string): unknown => {
      if (cache.has(id)) return cache.get(id);
      const n = nodes.get(id)!;
      if (n.kind === 'predicate') return { predicate: p.get(id) };
      if (n.kind === 'entity') return { entity: e.get(id) };
      const shape = { operator: n.operator, frame: frame(n.frameId), agent: n.agentId ? e.get(n.agentId) : null,
        parameters: valueShape(n.parameters),
        correction: n.correction ? Object.fromEntries(Object.entries(n.correction).map(([key, v]) => [key, v.kind === 'entity' ? { kind: 'entity', entity: e.get(v.id) } : { kind: v.kind, value: valueShape(v.value), ...(v.kind === 'quantity' ? { unit: valueShape(v.unit, 'unit') } : {}) }])) : null,
        targets: n.targets.map(t => t.kind === 'node' ? node(t.id) : t.kind === 'role' ? { role: role(t.id) } : t.kind === 'relation' ? { relation: relation(t.id) } : { anchor: anchor(t.id) }).sort((a, b) => stable(a).localeCompare(stable(b), 'en')) };
      cache.set(id, shape); return shape;
    };
    const operators = graph.nodes.filter(n => n.kind === 'operator').map(n => node(n.id)).sort((a, b) => stable(a).localeCompare(stable(b), 'en'));
    const roots = graph.roots.map(node).sort((a, b) => stable(a).localeCompare(stable(b), 'en'));
    const signature = stable({
      predicates: predicateShapes, entities: people.map(n => n.kind === 'entity' ? n.entityType : 'unknown'),
      roles: graph.roles.map(r => role(r.id)).sort((a, b) => stable(a).localeCompare(stable(b), 'en')),
      operators, roots, frames: frameShapes,
      relations: graph.relations.map(r => relation(r.id)).sort((a, b) => stable(a).localeCompare(stable(b), 'en')),
      anchors: graph.anchors.map(a => anchor(a.id)).sort((a, b) => stable(a).localeCompare(stable(b), 'en')),
      temporal: meaningTemporalConstraints(graph).map(t => ({ left: [p.get(t.left.nodeId), t.left.boundary], relation: t.relation, right: [p.get(t.right.nodeId), t.right.boundary] })).sort((a, b) => stable(a).localeCompare(stable(b), 'en')),
    });
    if (!best || signature < best) {
      best = signature;
      slots = [...ordered.map((n, i) => ({ id: 'predicate:' + i, kind: 'predicate' as const, nodeId: n.id, value: n.lexical.label })),
        ...people.map((n, i) => ({ id: 'entity:' + i, kind: 'entity' as const, nodeId: n.id, value: n.kind === 'entity' ? n.label : '' }))];
    }
  }
  return { signature: best, slots };
}
function modelId(signature: string): string {
  // Deterministic browser-safe ID; the registry also checks for collisions.
  let a = 2166136261, b = 2246822507;
  for (let i = 0; i < signature.length; i++) { a = Math.imul(a ^ signature.charCodeAt(i), 16777619); b = Math.imul(b ^ signature.charCodeAt(i), 3266489909); }
  return 'meaning-' + (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
const bySignature = new Map<string, ModelPattern>(), byId = new Map<string, ModelPattern>();
for (const example of THOUGHT_EXAMPLES) for (const reading of example.readings) {
  const { signature } = describeModelStructure(reading.graph);
  let pattern = bySignature.get(signature);
  if (!pattern) {
    const id = modelId(signature);
    if (byId.has(id)) throw new Error('Model ID collision; explicit migration required.');
    pattern = { modelId: id, version: 1, signature, examples: [] };
    bySignature.set(signature, pattern); byId.set(id, pattern);
  }
  pattern.examples.push({ exampleId: example.id, readingId: reading.id });
}
export const MODEL_PATTERNS: readonly ModelPattern[] = Object.freeze([...bySignature.values()].map(pattern => {
  pattern.examples.forEach(Object.freeze); Object.freeze(pattern.examples); return Object.freeze(pattern);
}));
export function findMatchingModels(graph: MeaningGraph): ModelMatch[] {
  if (validateMeaningGraph(graph).length || graph.nodes.filter(n => n.kind === 'predicate').length > 4 || graph.nodes.filter(n => n.kind === 'entity').length > 5) return [];
  const description = describeModelStructure(graph);
  const pattern = bySignature.get(description.signature);
  return pattern ? [{ modelId: pattern.modelId, version: pattern.version, slots: description.slots }] : [];
}
export function getModelPattern(id: string): ModelPattern | undefined {
  const found = byId.get(id); return found ? structuredClone(found) : undefined;
}

