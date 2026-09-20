/**
 * dependency-order.ts — flatten a dependency hierarchy into ONE ordered list,
 * with the failure policy attached to each step rather than to the runner.
 *
 * ## Why this is a module and not four hand-written orderings
 *
 * The owner, 2026-09-20, asking for the README render to be placed in the
 * rendering pipeline:
 *
 * > dynamic parts (kg vierwe, visaluzers, etc) render in flattened depndency
 * > order, failures = skip/log/qa or so
 *
 * and immediately after, generalising it:
 *
 * > readme epid need to flattening of depndency hieracy, rulles + tools. as do
 * > other skills. this is a repeable subprocess
 *
 * **A repeatable subprocess is a thing with one implementation.** Four callers
 * wanting "run these in dependency order" is four topological sorts, three of
 * which are subtly different and none of which is tested. The orderings this
 * repository already needs are the render pipeline, the instances table, the
 * work-plan roadmap and the skill graph — and they differ only in what the
 * nodes are, never in what ordering MEANS.
 *
 * ## The four rules, and each one is a decision rather than a default
 *
 * 1. **A node runs after everything it declares `needs`.** Nothing else
 *    implies order. A node that needs nothing is free to run first.
 * 2. **Ties break on declaration order, not on id.** Sorting ties
 *    alphabetically makes the flattened list churn when a node is renamed,
 *    which turns a no-op rename into a pipeline diff nobody can read. The
 *    input order is an authored fact and it is kept.
 * 3. **A cycle is reported, never broken.** Breaking one picks a winner
 *    silently, and the pipeline then runs in an order no one chose. Every
 *    node in the cycle is named — naming one of them sends the reader to fix
 *    the wrong edge.
 * 4. **A missing dependency is reported, never dropped.** `needs: ["x"]` with
 *    no `x` is a claim that failed, and a runner that silently ran the node
 *    anyway would report a clean pass over a broken graph. This is the `dh4f`
 *    defect in ordering form.
 *
 * ## `fatal` is per step, and that is the owner's design
 *
 * > current state of KG renderered as json/jsonld failuer = fatal, readme
 * > updated faliure = fatal , dynamic parts (kg vierwe, visaluzers, etc)
 * > render in flattened depndency order, failures = skip/log/qa or so
 *
 * So the runner cannot own one policy: two steps must stop the build and the
 * rest must not. Carrying it on the STEP means the policy is declared beside
 * the thing it governs and is visible in the flattened list, rather than
 * living in whichever `if` the runner happens to have.
 *
 * A `fatal` step that fails ends the run. A non-fatal one is recorded as
 * `skipped` — and so is every step that needed it, because running a step
 * whose input never rendered produces output that LOOKS complete. That
 * cascade is the whole reason skip is not the same as "carry on".
 *
 * @module scripts/dependency-order
 */

/** One node of a dependency hierarchy, before it is flattened. */
export interface OrderedStep {
  id: string;
  /** Ids this step must run after. Absent or empty means it may run first. */
  needs?: readonly string[];
  /**
   * Does a failure here end the run?
   *
   * Required rather than defaulted: a default would let a step ship without
   * anybody deciding, and the two policies are not interchangeable — one
   * stops the build, the other leaves a gap a reader may not notice. Same
   * reason a graph kind must state `holds` rather than inherit one.
   */
  fatal: boolean;
  /** Free-text, carried through to the report so a reader is not left guessing. */
  label?: string;
}

export type OrderProblem =
  | { kind: "cycle"; ids: string[]; detail: string }
  | { kind: "missing"; id: string; needs: string; detail: string }
  | { kind: "duplicate"; id: string; detail: string };

export interface FlattenResult {
  /** The flattened run order — empty when any problem was found. */
  order: OrderedStep[];
  /**
   * Everything wrong with the graph. NON-EMPTY MEANS `order` IS EMPTY: a
   * partial order over a broken graph is the shape that gets run anyway.
   */
  problems: OrderProblem[];
}

/**
 * Flatten a hierarchy into the order its dependencies imply.
 *
 * Kahn's algorithm with a stable queue, which is rule 2: the queue is drained
 * in declaration order, so the output changes only when the DECLARATIONS
 * change.
 */
export function flattenDependencies(steps: readonly OrderedStep[]): FlattenResult {
  const problems: OrderProblem[] = [];

  const byId = new Map<string, OrderedStep>();
  for (const s of steps) {
    if (byId.has(s.id)) {
      problems.push({
        kind: "duplicate",
        id: s.id,
        detail: `\`${s.id}\` is declared twice — one of the two is being ordered and the other is not, and nothing says which`,
      });
      continue;
    }
    byId.set(s.id, s);
  }

  for (const s of byId.values()) {
    for (const n of s.needs ?? []) {
      if (!byId.has(n)) {
        problems.push({
          kind: "missing",
          id: s.id,
          needs: n,
          detail: `\`${s.id}\` needs \`${n}\`, which is not declared — the claim cannot be honoured, and running ${s.id} anyway reports a clean pass over a broken graph`,
        });
      }
    }
  }

  if (problems.length > 0) return { order: [], problems };

  // Rule 2: the frontier is a QUEUE in declaration order, never a sorted set.
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const s of byId.values()) {
    indegree.set(s.id, (s.needs ?? []).length);
    for (const n of s.needs ?? []) {
      dependents.set(n, [...(dependents.get(n) ?? []), s.id]);
    }
  }

  const order: OrderedStep[] = [];
  const queue = [...byId.values()].filter((s) => indegree.get(s.id) === 0).map((s) => s.id);
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(byId.get(id)!);
    for (const d of dependents.get(id) ?? []) {
      const left = indegree.get(d)! - 1;
      indegree.set(d, left);
      if (left === 0) queue.push(d);
    }
  }

  if (order.length !== byId.size) {
    // Rule 3: name EVERY node still held up, not the first one found.
    const stuck = [...byId.keys()].filter((id) => !order.some((s) => s.id === id)).sort();
    return {
      order: [],
      problems: [
        {
          kind: "cycle",
          ids: stuck,
          detail:
            `${stuck.length} steps cannot be ordered — each waits on another: ` +
            stuck.map((s) => `\`${s}\``).join(", ") +
            ". Breaking the cycle here would pick a winner nobody chose.",
        },
      ],
    };
  }

  return { order, problems: [] };
}

/** What happened to one step once the flattened order was run. */
export type StepOutcome = "ran" | "failed" | "skipped";

export interface RunRecord {
  step: OrderedStep;
  outcome: StepOutcome;
  /** Why it was skipped: the id whose failure reached it. */
  blockedBy?: string;
  detail?: string;
}

/**
 * Run a flattened order, honouring each step's own `fatal`.
 *
 * `run` returns an error message for a failure and `undefined` for success —
 * rather than throwing — so that a non-fatal failure is an ordinary value and
 * a caller cannot forget to catch it.
 *
 * A failure, fatal or not, **skips everything downstream of it**. Recomputed
 * transitively from `needs` rather than from what happens to be later in the
 * list: two steps can be adjacent in the flattened order and unrelated, and
 * skipping an unrelated step would lose a rendering for no reason.
 */
export function runInOrder(
  order: readonly OrderedStep[],
  run: (step: OrderedStep) => string | undefined,
): { records: RunRecord[]; stopped?: string } {
  const records: RunRecord[] = [];
  const blocked = new Map<string, string>();

  for (const step of order) {
    const upstream = (step.needs ?? []).find((n) => blocked.has(n));
    if (upstream !== undefined) {
      // The ORIGIN of the failure, not the nearest blocked neighbour — a
      // reader wants the step that broke, not the chain that carried it.
      const origin = blocked.get(upstream)!;
      blocked.set(step.id, origin);
      records.push({
        step,
        outcome: "skipped",
        blockedBy: origin,
        detail: `needs \`${upstream}\`, which did not render`,
      });
      continue;
    }

    const failure = run(step);
    if (failure === undefined) {
      records.push({ step, outcome: "ran" });
      continue;
    }

    records.push({ step, outcome: "failed", detail: failure });
    if (step.fatal) return { records, stopped: step.id };
    blocked.set(step.id, step.id);
  }

  return { records };
}
