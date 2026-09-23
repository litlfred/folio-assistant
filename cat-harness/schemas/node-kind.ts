/**
 * Node kinds with more than one parent, composed by the platform's one
 * resolve-then-walk. Bean `a1lq`.
 *
 * @module schemas/node-kind
 * @graphNode none — a composition function over other modules' schemas, not a schema
 *
 * ## Why this exists
 *
 * The owner, 2026-09-23, on a review comment being built as a todo:
 *
 * > thhemed todo? we didnt discuss mult-iheritence of harness or node kinds.
 * > we need to have that. once depedencies of (orderd) dependecy tree are
 * > full resolve, walk tree in order starting w/ deepest depenencies
 *
 * and then *"make sure consistent"*. Instances already had a walk. Node kinds
 * had none: a kind with two parents was a Zod `.extend()` with a spread, and
 * when two parents defined one field, whichever spread came last won, silently.
 * Nothing declared a kind's parents, so nothing could walk them.
 *
 * ## The rule is the instances' rule, from the same module
 *
 * A kind DECLARES its parents. {@link nodeKind} resolves every ancestor, orders
 * them with `flattenDependencies` from `schemas/dependency-order.ts` (deepest
 * first, ties on declared parent order), and composes each ancestor's OWN shape
 * in that order. The instance resolver in `harness-config.ts` calls the same
 * flattener. Two answers to "what order do layers compose in" would be free to
 * disagree, so there is one.
 *
 * ## Refused, at the moment the kind is defined
 *
 * - **A field two unrelated ancestors define** (`findConflicts`): the order
 *   between them means nothing, so it must not pick a value.
 * - **A redefinition the child did not declare.** Overriding an inherited field
 *   is allowed and must be said, in `overrides`, so a field that shadows a
 *   parent's by accident is caught rather than shipped.
 * - **A declared override that overrides nothing**, which is a stale claim.
 *
 * All three throw where the kind is defined, i.e. on module load, so the first
 * test that imports the kind fails. A composition error that surfaced only when
 * a file was validated would ship.
 *
 * ## Parents are objects, not ids
 *
 * A kind names its parents by reference, so the graph is the import graph and
 * there is no global registry to be loaded in the wrong order — a failure this
 * repository has paid for (`bunfig.toml`, 2026-09-20). A parent may be a
 * tagged kind (`folio-todo/v1`) or a named mixin (`themed`), which has no
 * `$schema` of its own. Both are kinds here, because both are layers.
 */
import { z } from "zod";

import { findConflicts, flattenDependencies } from "./dependency-order";

/** A node kind: its declared parents, its own fields, and the composed schema. */
export interface NodeKind<S extends z.ZodRawShape = z.ZodRawShape> {
  id: string;
  parents: readonly NodeKind[];
  /** The fields this layer itself declares. */
  own: z.ZodRawShape;
  /** Inherited fields this layer redefines, on purpose. */
  overrides: readonly string[];
  /** Every ancestor and then this kind, deepest first: the composition order. */
  order: readonly string[];
  /** Every field, composed in {@link order}. */
  schema: z.ZodObject<S>;
}

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type ShapeOf<K> = K extends NodeKind<infer S> ? S : never;
type Inherited<P extends readonly NodeKind<z.ZodRawShape>[]> = P extends readonly [] ? Record<never, never> : UnionToIntersection<ShapeOf<P[number]>>;
type Flat<T> = { [K in keyof T]: T[K] };
/** The type-level mirror of the runtime rule: parents' fields, then own fields over them. */
export type Composed<P extends readonly NodeKind<z.ZodRawShape>[], O extends z.ZodRawShape> = AsShape<Flat<Omit<Inherited<P>, keyof O> & O>>;
// Resolved per instantiation, so a concrete composed shape is checked as one
// rather than widened with an index signature (which `Omit` would then erase).
type AsShape<T> = T extends z.ZodRawShape ? T : never;

/** Define a node kind from its parents and its own fields. Throws on any refusal above. */
export function nodeKind<const P extends readonly NodeKind<z.ZodRawShape>[], O extends z.ZodRawShape>(
  id: string,
  parents: P,
  own: O,
  opts: { overrides?: readonly (keyof O & string)[] } = {},
): NodeKind<Composed<P, O>> {
  // Resolve every ancestor once. Post-order, so declaration order is the tie-break.
  const byId = new Map<string, NodeKind>();
  const declared: NodeKind[] = [];
  const visit = (k: NodeKind): void => {
    const prior = byId.get(k.id);
    if (prior) {
      if (prior !== k) throw new Error(`node kind \`${id}\`: two different kinds are both named \`${k.id}\``);
      return;
    }
    byId.set(k.id, k);
    for (const p of k.parents) visit(p);
    declared.push(k);
  };
  for (const p of parents) visit(p);
  if (byId.has(id)) throw new Error(`node kind \`${id}\` is its own ancestor`);

  const steps = [
    ...declared.map((k) => ({ id: k.id, needs: k.parents.map((p) => p.id), fatal: true })),
    { id, needs: parents.map((p) => p.id), fatal: true },
  ];
  const { order, problems } = flattenDependencies(steps);
  if (problems.length > 0) {
    throw new Error(`node kind \`${id}\`: ${problems.map((p) => p.detail).join("; ")}`);
  }

  // Unrelated ancestors must not both define a field — this kind has not had
  // its say yet, so it is left out: redefining the field is how it settles one.
  const ownOf = (k: string): z.ZodRawShape => (k === id ? own : byId.get(k)!.own);
  const conflicts = findConflicts(
    order.filter((s) => s.id !== id),
    (k) => Object.keys(ownOf(k)),
  );
  const inherited = new Set(declared.flatMap((k) => Object.keys(k.own)));
  const redefines = Object.keys(own).filter((f) => inherited.has(f));
  const declaredOverrides = new Set<string>(opts.overrides ?? []);

  const refusals: string[] = [];
  for (const c of conflicts) {
    if (!(c.key in own)) refusals.push(c.detail);
  }
  for (const f of redefines) {
    if (!declaredOverrides.has(f)) {
      refusals.push(`\`${f}\` is inherited and redefined here without being listed in \`overrides\``);
    }
  }
  for (const f of declaredOverrides) {
    if (!redefines.includes(f)) refusals.push(`\`${f}\` is listed in \`overrides\` but no ancestor defines it`);
  }
  if (refusals.length > 0) throw new Error(`node kind \`${id}\`:\n  ${refusals.join("\n  ")}`);

  const shape: z.ZodRawShape = {};
  for (const s of order) Object.assign(shape, ownOf(s.id));
  return {
    id,
    parents,
    own,
    overrides: [...declaredOverrides],
    order: order.map((s) => s.id),
    schema: z.object(shape) as unknown as z.ZodObject<Composed<P, O>>,
  };
}
