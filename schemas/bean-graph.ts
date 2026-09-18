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
 *     { "id": "defs",      "path": "defs",      "kind": "bean-defs" },
 *     { "id": "workflows", "path": "workflows", "kind": "workflow-state" }
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
 * @module schemas/bean-graph
 */

import { z } from "zod";

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
export const BEAN_NODE_KINDS = ["bean-defs", "workflow-state"] as const;
export type BeanNodeKind = (typeof BEAN_NODE_KINDS)[number];

export const BeanGraphNodeSchema = z.object({
  /** Stable identifier. Overrides and references match on this, never on `path`. */
  id: z.string().min(1),
  /** Directory, relative to the graph root. Never absolute, never escaping the root. */
  path: z.string().min(1),
  /** What this node holds. */
  kind: z.enum(BEAN_NODE_KINDS),
});

export type BeanGraphNode = z.infer<typeof BeanGraphNodeSchema>;

export const BeanGraphSchema = z.object({
  /** Display name — which instance's work plan this is. */
  name: z.string().min(1),
  nodes: z.array(BeanGraphNodeSchema).min(1),
});

export type BeanGraph = z.infer<typeof BeanGraphSchema>;

/** The graph file's name inside its root directory. */
export const BEAN_GRAPH_FILE = "beans.json";

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
  nodes: [
    { id: "defs", path: "defs", kind: "bean-defs" },
    { id: "workflows", path: "workflows", kind: "workflow-state" },
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
export function parseBeanGraph(raw: unknown): BeanGraph {
  const graph = BeanGraphSchema.parse(raw);

  const seen = new Set<string>();
  for (const node of graph.nodes) {
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
  const stateNodes = graph.nodes.filter((n) => n.kind === "workflow-state");
  if (stateNodes.length > 1) {
    throw new Error(
      `bean graph: ${stateNodes.length} workflow-state nodes ` +
        `(${stateNodes.map((n) => n.id).join(", ")}). Process state would be split ` +
        `across them with nothing saying which is authoritative.`,
    );
  }

  return graph;
}

/** The single node of `kind`, or undefined when the graph declares none. */
export function nodeOfKind(graph: BeanGraph, kind: BeanNodeKind): BeanGraphNode | undefined {
  return graph.nodes.find((n) => n.kind === kind);
}
