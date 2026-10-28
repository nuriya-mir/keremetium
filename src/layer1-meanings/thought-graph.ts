/** Language independent semantic contract. No morphology or drawing coordinates. */
export type SemanticValue = null | boolean | number | string | SemanticValue[] | { [key: string]: SemanticValue };
export type SemanticRecord = { [key: string]: SemanticValue };
export type ScopeTarget = { kind: 'node' | 'role' | 'relation' | 'anchor'; id: string };
export type FrameKind = 'actual' | 'potential' | 'conditional' | 'counterfactual' | 'imagined' | 'reported' | 'believed' | 'remembered';
export interface MeaningFrame { id: string; kind: FrameKind; parentId?: string; label?: string }
export interface EntityNode {
  id: string; kind: 'entity'; entityType: 'person' | 'object' | 'environment' | 'unknown';
  label: string; person?: 1 | 2 | 3; number?: 'singular' | 'plural'; address?: 'familiar' | 'respectful' | 'unspecified';
}
export interface PredicateNode {
  id: string; kind: 'predicate'; frameId: string;
  predicateType: 'action' | 'state' | 'relation'; extent: 'fact' | 'interval' | 'point';
  lexical: { label: string; concept?: string };
  time: { relation: 'past' | 'present' | 'future' | 'unknown'; anchorId: string | null };
  features: SemanticRecord;
}
export type CorrectionValue = { kind: 'entity'; id: string } | { kind: 'relation-kind'; value: MeaningRelation['kind'] } | { kind: 'quantity'; value: number; unit: string } | { kind: 'weekdays'; value: number[] };
export const OPERATOR_KINDS = ['phase', 'modality', 'negation', 'correction', 'repetition', 'measure', 'origin', 'clock', 'history', 'discourse', 'speech', 'condition', 'comparison', 'purpose', 'assessment'] as const;
export interface OperatorNode {
  id: string; kind: 'operator'; frameId: string; operator: typeof OPERATOR_KINDS[number];
  targets: ScopeTarget[]; agentId?: string; parameters: SemanticRecord;
  /** Correct the declared role/relation/value to accepted; reject the separate alternative. */
  correction?: { accepted: CorrectionValue; rejected: CorrectionValue };
}
export type MeaningNode = EntityNode | PredicateNode | OperatorNode;
export interface MeaningRole {
  id: string; kind: 'actor' | 'experiencer' | 'patient' | 'possessor' | 'addressee' | 'location';
  predicateId: string; entityId: string;
}
export const RELATION_KINDS = ['after', 'after-end', 'after-gap', 'after-start', 'although', 'at-end', 'at-start', 'before', 'blocks', 'by', 'cause', 'coextensive', 'contains', 'contrast', 'despite', 'during', 'each-after', 'each-start', 'even-if', 'faster', 'habit-if', 'habit-while', 'if', 'immediate-start', 'immediately-after', 'instead', 'measured-to', 'midpoint', 'only-if', 'otherwise', 'purpose', 'reported-future', 'result', 'resume', 'same-start', 'since', 'since-result', 'sometimes-during', 'starts-on', 'then', 'together', 'unreached-result', 'until', 'while', 'would-if'] as const;
export interface MeaningRelation { id: string; kind: typeof RELATION_KINDS[number]; from: string; to: string }
export interface TemporalAnchor {
  id: string; kind: 'speech' | 'view' | 'reference';
  value: { status: 'unknown' } | { status: 'known'; label: string; precision: 'year' | 'day' | 'clock' | 'approximate' };
  eventId?: string;
}
export interface TemporalEndpoint { nodeId: string; boundary: 'start' | 'end' }
export interface TemporalConstraint { left: TemporalEndpoint; relation: 'before' | 'not-after' | 'same'; right: TemporalEndpoint }
export interface MeaningGraph {
  version: 1; nodes: MeaningNode[]; roles: MeaningRole[]; relations: MeaningRelation[];
  roots: string[]; frames: MeaningFrame[]; anchors: TemporalAnchor[]; temporal: TemporalConstraint[];
}
export interface GraphIssue { code: 'shape' | 'duplicate-id' | 'reference' | 'reference-type' | 'scope-cycle' | 'frame-cycle' | 'temporal-contradiction'; at: string; message: string }
const frameKinds = ['actual', 'potential', 'conditional', 'counterfactual', 'imagined', 'reported', 'believed', 'remembered'];
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
function semantic(v: unknown): boolean {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return true;
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(semantic);
  return record(v) && Object.values(v).every(semantic);
}

/** Relations imply constraints even when an interpreter omits redundant temporal rows. */
export function meaningTemporalConstraints(g: MeaningGraph): TemporalConstraint[] {
  const temporal = [...g.temporal];
  const inferred = (from: string, fb: 'start' | 'end', relation: TemporalConstraint['relation'], to: string, tb: 'start' | 'end') => temporal.push({ left: {nodeId:from,boundary:fb}, relation, right: {nodeId:to,boundary:tb} });
  for (const r of g.relations) {
    if (r.kind === 'before' || r.kind === 'after-gap') inferred(r.from, 'end', 'before', r.to, 'start');
    if (r.kind === 'same-start' || r.kind === 'coextensive') inferred(r.from, 'start', 'same', r.to, 'start');
    if (r.kind === 'coextensive') inferred(r.from, 'end', 'same', r.to, 'end');
    if (r.kind === 'while' || r.kind === 'habit-while') { inferred(r.from, 'start', 'not-after', r.to, 'end'); inferred(r.to, 'start', 'not-after', r.from, 'end'); }
    if (['contains', 'during', 'midpoint', 'sometimes-during'].includes(r.kind)) { inferred(r.from, 'start', 'not-after', r.to, 'start'); inferred(r.to, 'end', 'not-after', r.from, 'end'); }
  }
  return [...new Map(temporal.map(t => [JSON.stringify([t.left.nodeId,t.left.boundary,t.relation,t.right.nodeId,t.right.boundary]), t])).values()];
}

/** Accepts unknown so future interpreters cannot bypass the same runtime contract. */
export function validateMeaningGraph(input: unknown): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const add = (code: GraphIssue['code'], at: string, message: string) => { issues.push({ code, at, message }); };
  if (!record(input) || input.version !== 1 || !['nodes', 'roles', 'relations', 'roots', 'frames', 'anchors', 'temporal'].every(k => Array.isArray(input[k]))) {
    return [{ code: 'shape', at: 'graph', message: 'Expected a version 1 semantic graph.' }];
  }
  const arrays = ['nodes', 'roles', 'relations', 'frames', 'anchors'] as const;
  for (const key of arrays) {
    for (const item of input[key] as unknown[]) if (!record(item) || !text(item.id)) add('shape', key, 'Every item needs an ID.');
  }
  if (issues.length) return issues;
  const g = input as unknown as MeaningGraph;
  const all = new Map<string, string>();
  for (const key of arrays) for (const item of g[key]) {
    if (all.has(item.id)) add('duplicate-id', item.id, 'IDs are unique throughout the graph.');
    all.set(item.id, key);
  }
  const nodes = new Map(g.nodes.map(n => [n.id, n]));
  const frames = new Map(g.frames.map(f => [f.id, f]));
  const check = (id: unknown, collection: string, at: string, kind?: MeaningNode['kind']) => {
    if (!text(id) || !all.has(id)) add('reference', at, 'The referenced ID does not exist.');
    else if (all.get(id) !== collection || (kind && nodes.get(id)?.kind !== kind)) add('reference-type', at, 'The referenced item has the wrong type.');
  };
  for (const f of g.frames) {
    if (!frameKinds.includes(f.kind)) add('shape', f.id, 'Unknown frame kind.');
    if (f.parentId !== undefined) check(f.parentId, 'frames', f.id);
  }
  for (const n of g.nodes) {
    if (n.kind === 'entity') {
      if (!text(n.label) || !['person', 'object', 'environment', 'unknown'].includes(n.entityType) ||
        (n.person !== undefined && ![1, 2, 3].includes(n.person)) ||
        (n.number !== undefined && !['singular', 'plural'].includes(n.number)) ||
        (n.address !== undefined && !['familiar', 'respectful', 'unspecified'].includes(n.address))) add('shape', n.id, 'Invalid entity.');
    } else if (n.kind === 'predicate' || n.kind === 'operator') {
      check(n.frameId, 'frames', n.id);
      if (n.kind === 'predicate') {
        if (!['action', 'state', 'relation'].includes(n.predicateType) || !['fact', 'interval', 'point'].includes(n.extent) ||
          !record(n.lexical) || !text(n.lexical.label) || !record(n.time) ||
          !['past', 'present', 'future', 'unknown'].includes(n.time.relation) || !record(n.features) || !semantic(n.features)) {
          add('shape', n.id, 'Invalid predicate.');
        } else if (n.time.anchorId !== null) check(n.time.anchorId, 'anchors', n.id);
      } else {
        if (!OPERATOR_KINDS.includes(n.operator) || !Array.isArray(n.targets) || !n.targets.length || !record(n.parameters) || !semantic(n.parameters)) {
          add('shape', n.id, 'Invalid operator.');
        } else for (const target of n.targets) {
          if (!record(target) || !['node', 'role', 'relation', 'anchor'].includes(target.kind)) { add('shape', n.id, 'Invalid scope target.'); continue; }
          const collection = { node: 'nodes', role: 'roles', relation: 'relations', anchor: 'anchors' }[target.kind];
          check(target.id, collection, n.id);
          if (target.kind === 'node' && nodes.get(target.id)?.kind === 'entity') add('reference-type', n.id, 'Use a declared role to scope an entity.');
        }
        if (n.agentId !== undefined) check(n.agentId, 'nodes', n.id, 'entity');
        if (n.operator === 'correction') {
          if (!record(n.correction) || !record(n.correction.accepted) || !record(n.correction.rejected)) add('shape', n.id, 'A correction needs accepted and rejected alternatives.');
          else {
            for (const v of [n.correction.accepted, n.correction.rejected]) {
              if (v.kind === 'entity') check(v.id, 'nodes', n.id, 'entity');
              else if (v.kind === 'relation-kind') { if (!RELATION_KINDS.includes(v.value)) add('shape', n.id, 'Invalid relation alternative.'); }
              else if (v.kind === 'quantity') { if (!Number.isFinite(v.value) || !text(v.unit)) add('shape', n.id, 'Invalid quantity alternative.'); }
              else if (v.kind === 'weekdays') { if (!Array.isArray(v.value) || !v.value.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) add('shape', n.id, 'Invalid day alternative.'); }
              else add('shape', n.id, 'Unknown correction alternative.');
            }
            if (JSON.stringify(n.correction.accepted) === JSON.stringify(n.correction.rejected)) add('shape', n.id, 'Correction alternatives must differ.');
            const accepted = n.correction.accepted, rejected = n.correction.rejected;
            const target = Array.isArray(n.targets) && n.targets.length === 1 ? n.targets[0] : undefined;
            if (accepted.kind !== rejected.kind || !target) add('shape', n.id, 'Correction needs one target and compatible alternative types.');
            else if (accepted.kind === 'entity') {
              const role = target.kind === 'role' ? g.roles.find(r => r.id === target.id) : undefined;
              if (!role || role.entityId !== accepted.id) add('shape', n.id, 'The accepted participant must be assigned to the corrected role.');
            } else if (accepted.kind === 'relation-kind') {
              const relation = target.kind === 'relation' ? g.relations.find(r => r.id === target.id) : undefined;
              if (!relation || relation.kind !== accepted.value) add('shape', n.id, 'The accepted relation must be the corrected relation.');
            } else if (accepted.kind === 'quantity' || accepted.kind === 'weekdays') {
              const repeat = target.kind === 'node' ? nodes.get(target.id) : undefined;
              const value = repeat?.kind === 'operator' && repeat.operator === 'repetition' ? repeat.parameters[accepted.kind === 'quantity' ? 'count' : 'days'] : undefined;
              if (JSON.stringify(value) !== JSON.stringify(accepted.value)) add('shape', n.id, 'The accepted value must belong to the corrected repetition.');
            }
          }
        }
      }
    } else add('shape', (n as { id: string }).id, 'Unknown node kind.');
  }
  for (const r of g.roles) {
    if (!['actor', 'experiencer', 'patient', 'possessor', 'addressee', 'location'].includes(r.kind)) add('shape', r.id, 'Unknown role.');
    check(r.predicateId, 'nodes', r.id, 'predicate'); check(r.entityId, 'nodes', r.id, 'entity');
  }
  for (const r of g.relations) {
    if (!RELATION_KINDS.includes(r.kind)) add('shape', r.id, 'Unknown relation.');
    check(r.from, 'nodes', r.id, 'predicate'); check(r.to, 'nodes', r.id, 'predicate');
  }
  for (const a of g.anchors) {
    if (!['speech', 'view', 'reference'].includes(a.kind) || !record(a.value) ||
      !['known', 'unknown'].includes(a.value.status) ||
      (a.value.status === 'known' && (!text(a.value.label) || !['year', 'day', 'clock', 'approximate'].includes(a.value.precision)))) add('shape', a.id, 'Invalid anchor.');
    if (a.eventId !== undefined) check(a.eventId, 'nodes', a.id, 'predicate');
  }
  for (const id of g.roots) {
    check(id, 'nodes', 'roots');
    if (nodes.get(id)?.kind === 'entity') add('reference-type', 'roots', 'An entity is not an assertion.');
  }
  for (const t of g.temporal) {
    if (!record(t) || !record(t.left) || !record(t.right) || !['before', 'same', 'not-after'].includes(t.relation)) { add('shape', 'temporal', 'Invalid temporal constraint.'); continue; }
    for (const p of [t.left, t.right]) {
      check(p.nodeId, 'nodes', 'temporal', 'predicate');
      if (!['start', 'end'].includes(p.boundary)) add('shape', 'temporal', 'Invalid temporal boundary.');
    }
  }
  const cycles = (ids: string[], edges: (id: string) => string[], code: 'scope-cycle' | 'frame-cycle') => {
    const active = new Set<string>(), done = new Set<string>();
    function visit(id: string) {
      if (active.has(id)) { add(code, id, 'Nesting cannot contain a cycle.'); return; }
      if (done.has(id)) return;
      active.add(id); for (const next of edges(id)) visit(next); active.delete(id); done.add(id);
    }
    for (const id of ids) visit(id);
  };
  cycles([...frames.keys()], id => frames.get(id)?.parentId ? [frames.get(id)!.parentId!] : [], 'frame-cycle');
  cycles([...nodes.keys()], id => {
    const n = nodes.get(id); return n?.kind === 'operator' && Array.isArray(n.targets) ? n.targets.filter(t => t?.kind === 'node').map(t => t.id) : [];
  }, 'scope-cycle');
  if (issues.length) return issues;
  // Transitive <= constraints carry a strict bit. A strict self path is a contradiction.
  const predicates = g.nodes.filter((n): n is PredicateNode => n.kind === 'predicate');
  const endpoints = predicates.flatMap(n => [n.id + ':start', n.id + ':end']);
  const indices = new Map(endpoints.map((id, i) => [id, i]));
  const paths: number[][] = endpoints.map((_, i) => endpoints.map((__, j) => i === j ? 0 : -1));
  const edge = (a: string, b: string, strict: boolean) => {
    const i = indices.get(a)!, j = indices.get(b)!; paths[i][j] = Math.max(paths[i][j], strict ? 1 : 0);
  };
  for (const n of predicates) { edge(n.id + ':start', n.id + ':end', false); if (n.extent === 'point') edge(n.id + ':end', n.id + ':start', false); }
  for (const t of meaningTemporalConstraints(g)) {
    const a = t.left.nodeId + ':' + t.left.boundary, b = t.right.nodeId + ':' + t.right.boundary;
    edge(a, b, t.relation === 'before'); if (t.relation === 'same') edge(b, a, false);
  }
  for (let k = 0; k < paths.length; k++) for (let i = 0; i < paths.length; i++) for (let j = 0; j < paths.length; j++) {
    if (paths[i][k] >= 0 && paths[k][j] >= 0) paths[i][j] = Math.max(paths[i][j], paths[i][k], paths[k][j]);
  }
  if (paths.some((row, i) => row[i] === 1)) add('temporal-contradiction', 'temporal', 'Strict temporal order contradicts another constraint.');
  return issues;
}

