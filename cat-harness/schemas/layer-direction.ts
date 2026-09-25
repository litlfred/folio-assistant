/**
 * layer-direction.ts — is this edge pointing the way its layers allow?
 *
 * ONE answer to one question, asked by two tools that used to answer it
 * separately or not at all (bean `j79e`):
 *
 * - `scripts/partition/engine.ts` (`check:partition`) asks it of every import
 *   between modules, where the layers are the repos a module is assigned to.
 * - `skills/graph-management/kg-detangle.ts` asks it of every outbound edge of a
 *   candidate group, where the layers are the instances a node lives in and
 *   the allowed relation is each instance's declared `needs`.
 *
 * Until this module the second one never asked: `detangle.ts` declared
 * `CUT_KINDS` with `wrong-direction` among them and not one edge in the
 * pinned results was classified, while the partition engine computed exactly
 * that verdict inline with `spec.allowed[from].includes(to)`. Two tools, one
 * question, and the one that had a name for the answer had no function.
 *
 * ## What it decides, and what it refuses to
 *
 * It decides DIRECTION and nothing else. An edge from layer A to layer B is
 * wrong-direction exactly when B is not among what A declares it may reach
 * and no permit names that edge. That is mechanical: it reads two
 * declarations and a list, and a person can re-check it by reading the same
 * three things.
 *
 * It does NOT decide whether a permitted edge is a restatement (a rename away
 * from gone) or essential (a real dependency). Those need judgement about
 * what the target MEANS, and `detangle.ts` says the carve is an adjudication.
 * A function that guessed would turn a reason to look into a finding.
 *
 * ## Four verdicts, not a boolean
 *
 * `allowed`, `permitted`, `wrong-direction` and `undetermined`. The last is
 * the three-state rule: an instance with no `needs` has not declared its
 * layer, and absent is UNDETERMINED, never "may reach nothing" and never
 * "may reach anything" (`cat-harness.ts`, `needs`). Collapsing it into either
 * would make every undeclared instance look either tangled into everything or
 * clean, and the report would look the same as when the analysis is right.
 *
 * Self is not implicit. A caller whose layers may reach themselves says so
 * in `allowed` — the partition's `ALLOWED` lists each repo first — so the
 * rule a reader checks is the rule that ran.
 *
 * @module schemas/layer-direction
 * @graphNode none — a classification function: it defines no schema
 */

/** An exception to the direction rule. The reason is required: a permit with no reason is a hole. */
export interface DirectionPermit {
  from: string;
  to: string;
  reason: string;
}

/**
 * The declared direction rule.
 *
 * `allowed.get(layer)` is the set of layers `layer` may point at, INCLUDING
 * itself if it may. A layer absent from the map is undetermined.
 */
export interface LayerRule {
  allowed: ReadonlyMap<string, ReadonlySet<string>>;
  permits?: readonly DirectionPermit[];
}

export type DirectionVerdict =
  | { verdict: "allowed"; basis: string }
  | { verdict: "permitted"; basis: string; permit: DirectionPermit }
  | { verdict: "wrong-direction"; basis: string }
  | { verdict: "undetermined"; basis: string };

/**
 * Classify one edge `from → to`, whose ends sit in `fromLayer` and `toLayer`.
 *
 * A permit is consulted only for an edge the rule would refuse, so a permit
 * on an allowed edge is never "honoured" — which is what lets a caller report
 * a permit nothing needs as stale.
 */
export function directionOf(
  edge: { from: string; to: string },
  fromLayer: string | undefined,
  toLayer: string | undefined,
  rule: LayerRule,
): DirectionVerdict {
  if (fromLayer === undefined || toLayer === undefined) {
    const which = fromLayer === undefined ? edge.from : edge.to;
    return { verdict: "undetermined", basis: `${which} sits in no declared layer` };
  }
  const reach = rule.allowed.get(fromLayer);
  if (reach === undefined) {
    return { verdict: "undetermined", basis: `layer '${fromLayer}' declares nothing about what it may reach` };
  }
  if (reach.has(toLayer)) {
    return {
      verdict: "allowed",
      basis: fromLayer === toLayer ? `same layer '${fromLayer}'` : `'${fromLayer}' is built on '${toLayer}'`,
    };
  }
  const permit = (rule.permits ?? []).find((p) => p.from === edge.from && p.to === edge.to);
  if (permit) return { verdict: "permitted", basis: `permitted: ${permit.reason}`, permit };
  return {
    verdict: "wrong-direction",
    basis: `'${fromLayer}' does not declare '${toLayer}' among what it may reach`,
  };
}

/**
 * The allowed relation for a `needs` graph: each layer may reach itself and
 * everything it transitively needs.
 *
 * `needs` values of `undefined` are left OUT of the map, so {@link directionOf}
 * reports them undetermined — `[]` is the floor, absent is nobody-has-said.
 * `ancestors` is `ancestorsOf` from `dependency-order.ts`, passed in rather
 * than recomputed so a cycle or a missing node is refused once, there.
 */
export function allowedFromNeeds(
  needs: ReadonlyMap<string, readonly string[] | undefined>,
  ancestors: ReadonlyMap<string, ReadonlySet<string>>,
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const [layer, n] of needs) {
    if (n === undefined) continue;
    out.set(layer, new Set([layer, ...(ancestors.get(layer) ?? [])]));
  }
  return out;
}
