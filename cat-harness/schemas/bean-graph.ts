/**
 * The bean graph — what `beans/` is, rather than where it happens to be.
 *
 * `beans/` is not a directory that incidentally holds markdown. It is a
 * **graph** with named nodes, each node a store with its own kind and path:
 *
 * ```jsonc
 *  // beans/beans.json
 * {
 *   "name": "folio-assistant",
 *   "nodes": [
 *     { "id": "defs",      "path": "defs",      "kinds": ["bean-defs"] },
 *     { "id": "workflows", "path": "workflows", "kinds": ["workflow-state"] }
 *   ]
 * }
 * ```
 *
 * ## Why this file exists rather than a block in the harness config
 *
 * The predecessor (bean `8xzw`) declared both paths in `harness.config.json`
 * under `harness.workPlan` / `harness.workflowState`. That was one source of
 * truth too many: the same path was already written in `.beans.yml`, which the
 * third-party `beans` binary reads, so `check:harness-dirs` existed to stop the
 * two drifting.
 *
 * Moving the declaration here does not add a third place — it **removes one**.
 * The graph states the layout; the harness config no longer restates it.
 *
 * **The `.beans.yml` duplication survives and is not a defect of this design.**
 * `beans` is third-party and will never read our schema, so its path must be
 * written where it looks. That duplication stays checked, because an unchecked
 * duplication is the thing this repository has paid for repeatedly.
 *
 * ## Paths are relative to the graph root, deliberately
 *
 * A node's `path` is resolved against the directory holding `beans.json`, not
 * against the repo root. So the graph is **relocatable**: moving `beans/` to
 * `work/` requires editing nothing inside it. A path escaping its own root
 * (`..`, or absolute) is rejected — a store outside the graph it belongs to is
 * not a node of that graph, and silently accepting one would let a folio scan
 * a directory its graph does not own.
 *
 * ## Three states, as everywhere here
 *
 * - **Absent** → `undefined`. An unmigrated repo falls back to the documented
 *   defaults; this is ordinary, not an error.
 * - **Present but unreadable** → **throws**. A graph nobody can parse leaves
 *   every consumer guessing where the work plan is, which is worse than having
 *   no graph at all — the fallback is at least documented.
 * - **Unknown node kind** → rejected, not accepted and ignored. A node whose
 *   kind nothing understands is a store nothing will read.
 *
 * ## It defers to `cat-harness.ts`, and does not restate it
 *
 * A bean-graph entry IS a {@link ContentDirectory}: an id, a path, and the
 * graph kinds found there. Same schema, same open registry, same JSON-LD
 * projection.
 *
 * This file briefly had its own parallel vocabulary — `nodes` with
 * `kinds: BeanNodeKind[]`, a closed Zod enum — which said exactly what
 * `directories` with `graphs: GraphKind[]` already said, in different words.
 * Two spellings of one concept is the drift this repository keeps paying for,
 * so the kinds moved into `BASE_GRAPH_KINDS` and the shape is now imported
 * rather than redeclared.
 *
 * What remains here is only what is SPECIFIC to the bean graph and not true
 * of declarations generally: paths resolve against this file's own directory
 * rather than the instance root, and at most one directory may hold
 * `workflow-state`.
 *
 * @module schemas/bean-graph
 * @graphNode schema
 */

import { z } from "zod";

import {
  GraphNodeDirectorySchema,
  defaultGraphKinds,
  type GraphNodeDirectory,
  type GraphKindRegistry,
} from "./cat-harness";

/**
 * The kinds of store a bean-graph node can be.
 *
 * `bean-defs` holds the work-plan items themselves — one markdown file per
 * bean, the store the `beans` CLI reads. `workflow-state` holds one JSON file
 * per running BPMN process instance.
 *
 * They are separate kinds because they answer different questions and are
 * written by different things: the definitions say WHAT is being worked on and
 * are authored by agents and people; the workflow state says WHERE A PROCESS
 * GOT TO and is written by the workflow engine. Collapsing them into one store
 * was considered in `docs/proposals/workflow-state-in-beans.md` and rejected
 * (Option A: two stores, one link).
 */
/**
 * The graph kinds a bean graph's directories hold.
 *
 * Both are registered in {@link BASE_GRAPH_KINDS}, not defined here — the
 * vocabulary is shared with `harness.json`, so a consumer that knows
 * one declaration knows the other. This constant is a convenience for callers
 * that want the bean-specific subset, never a second source of truth.
 */
export const BEAN_NODE_KINDS = ["bean-defs", "workflow-state"] as const;
export type BeanNodeKind = (typeof BEAN_NODE_KINDS)[number];

/**
 * A bean-graph directory — the shared {@link ContentDirectorySchema}, reused
 * rather than redeclared.
 *
 * `graphs` is an array for the reason it is one there: a directory is a PLACE
 * TO LOOK and may hold more than one part of the graph. It does not say how to
 * tell the contents apart, deliberately — **the files declare what they are.**
 * A bean carries its id, `title`, `status` and `type` in front matter; a
 * workflow instance carries `"$schema": "folio-workflow-instance/v1"`.
 */
export const BeanGraphNodeSchema = GraphNodeDirectorySchema;

export type BeanGraphNode = GraphNodeDirectory;

export const BeanGraphSchema = z.object({
  /** Display name — which instance's work plan this is. */
  name: z.string().min(1),
  /** Named `directories`, like the harness declaration, not `nodes`. */
  directories: z.array(BeanGraphNodeSchema).min(1),
});

export type BeanGraph = z.infer<typeof BeanGraphSchema>;

/**
 * The graph file's name inside its root directory.
 *
 * DERIVED from the `beans` kind rather than written here, so the name exists
 * once. Both spellings were correct and they disagreed about what happens on a
 * move: this module holds that relocating `beans/` to `work/` must rename
 * nothing inside it, while `declaredKinds` computed `${basename(path)}.json`
 * and would have gone looking for `work/work.json`. Same fact, two places, and
 * the drift only appears when somebody relocates — so nothing would have
 * caught it.
 *
 * The owner's rule, 2026-09-20: **each type declares its own filename.** The
 * kind is the type here, so the kind is where it is declared.
 *
 * The `??` is unreachable while the kind carries the field and is not a
 * default: a registry that has lost the kind has bigger problems than this
 * filename, and falling back to the literal keeps the reader oriented rather
 * than crashing in a constant initialiser.
 */
export const BEAN_GRAPH_FILE = defaultGraphKinds.get("beans")?.declarationFile ?? "beans.json";

/** Where the graph root sits, when a repo has not moved it. */
export const DEFAULT_BEAN_GRAPH_ROOT = "beans";

/**
 * The layout a repo gets when it carries no graph file.
 *
 * Documented rather than implied, so the absent case is a known answer instead
 * of scattered string literals.
 */
export const DEFAULT_BEAN_GRAPH: BeanGraph = {
  name: "default",
  directories: [
    { id: "defs", path: "defs", graphKinds: ["bean-defs"] },
    { id: "workflows", path: "workflows", graphKinds: ["workflow-state"] },
  ],
};

/**
 * A node `path` must stay inside the graph root.
 *
 * Checked on parse rather than at use: a consumer that resolves the path is
 * already committed to reading it, and by then the escape has happened.
 */
function pathEscapesRoot(p: string): boolean {
  if (p.startsWith("/") || /^[A-Za-z]:/.test(p)) return true;
  const parts = p.split(/[\\/]+/).filter((s) => s.length > 0 && s !== ".");
  let depth = 0;
  for (const seg of parts) {
    if (seg === "..") depth--;
    else depth++;
    if (depth < 0) return true;
  }
  return depth <= 0;
}

/**
 * Parse a bean graph, rejecting what must not be accepted quietly.
 *
 * Throws on malformed input — see the module docstring for why "present but
 * unreadable" is a hard failure rather than a fallback to defaults.
 */
export function parseBeanGraph(
  raw: unknown,
  registry: GraphKindRegistry = defaultGraphKinds,
): BeanGraph {
  const graph = BeanGraphSchema.parse(raw);

  const seen = new Set<string>();
  for (const node of graph.directories) {
    // Kind validation lives here rather than in the Zod shape for the reason
    // `readDeclaration` gives: the vocabulary is OPEN, so the valid set is
    // whatever has been registered by the time the graph is read, not what
    // existed at module load. Reusing `ContentDirectorySchema` brought the
    // shape but not this check, and a test caught the gap — an unknown kind
    // was being accepted and ignored, which is the failure mode this schema's
    // own docstring forbids.
    for (const g of node.graphKinds) {
      if (!registry.has(g)) {
        throw new Error(
          `bean graph: directory "${node.id}" declares unknown graph kind "${g}". ` +
            `Known kinds: ${registry.names().join(", ")}.`,
        );
      }
    }

    if (seen.has(node.id)) {
      throw new Error(
        `bean graph: duplicate node id "${node.id}". Ids are what overrides and ` +
          `references match on, so two nodes sharing one make the graph ambiguous.`,
      );
    }
    seen.add(node.id);

    if (pathEscapesRoot(node.path)) {
      throw new Error(
        `bean graph: node "${node.id}" has path "${node.path}", which is absolute ` +
          `or escapes the graph root. A store outside the graph is not a node of it.`,
      );
    }
  }

  // Not a uniqueness rule in general — a graph may one day hold several
  // definition stores — but exactly one workflow-state node is what every
  // consumer today assumes, and an unnoticed second would split the state.
  const stateNodes = graph.directories.filter((n) => n.graphKinds.includes("workflow-state"));
  if (stateNodes.length > 1) {
    throw new Error(
      `bean graph: ${stateNodes.length} workflow-state nodes ` +
        `(${stateNodes.map((n) => n.id).join(", ")}). Process state would be split ` +
        `across them with nothing saying which is authoritative.`,
    );
  }

  return graph;
}

/**
 * The first node declaring `kind`, or undefined when the graph declares none.
 *
 * "First" rather than "the": a kind may appear on several nodes now that
 * `kinds` is an array. Only `workflow-state` is constrained to one node (see
 * {@link parseBeanGraph}), because splitting process state is a correctness
 * problem rather than a layout choice.
 */
export function nodeOfKind(graph: BeanGraph, kind: BeanNodeKind): BeanGraphNode | undefined {
  return graph.directories.find((n) => n.graphKinds.includes(kind));
}
