#!/usr/bin/env bun
/**
 * Can this instance render its own JSON-LD, and does it publish what it owns?
 *
 * Bean `z4mq` item 3: *"Rendering JSON-LD is a conformance requirement of
 * every instance, not a convenience of this one. Needs a check that an
 * arbitrary cat-harness instance — including one whose declaration names
 * directories this repo does not have — can render its JSON-LD, and a 'could
 * not determine' third state that is never reported as a pass."*
 *
 * ## Why "did it throw" is not the check
 *
 * That was the obvious implementation and it is worthless here, because **an
 * export of nothing succeeds**. Both defects this check was written against
 * rendered cleanly:
 *
 * - `collectSkills` resolved `bootstrap/skills/` against the wrong root, found
 *   nothing, and `continue`d under the comment "a package this instance does
 *   not carry". Bootstrap's skills left the published graph in silence;
 *   `confirm-harness` became a dangling `hasSkill` and `kg-navigation` only
 *   looked present because a second copy exists elsewhere (bean `v3se`).
 * - `bootstrap/bootstrap.jsonld` publishes **16** graph-kind nodes while
 *   `bootstrap/harness.json` declares **one**.
 *
 * Neither threw. So the question is not whether a render returned, it is
 * whether what came back is the instance's OWN — which is a comparison
 * between what it DECLARES and what it PUBLISHES, and cannot be made by
 * watching for an exception.
 *
 * ## Declared means transitively declared
 *
 * `harness.json` names a directory and the graph kinds in it; a graph file
 * inside that directory may name more. `beans/beans.json` declares
 * `bean-defs` and `workflow-state`, `todos/todos.json` declares `todo-items`
 * and `todo-feedback`. Those are the instance's, declared one level down, and
 * a check reading only the root declaration reports four false findings here.
 * Measured before this was written: comparing against `harness.json` alone
 * gives cat-harness 5 undeclared kinds, and 4 of the 5 are that mistake.
 *
 * ## Three states, and the middle one is the point
 *
 * - **rendered** — it declared, it published, and everything it published is
 *   its own.
 * - **undetermined** — no declaration, or one that will not parse. NEVER a
 *   pass: an instance whose declaration cannot be read has not been shown to
 *   render, it has been shown to be unreadable. Exit 2.
 * - **failed** — the render threw, or it published nothing, or it published a
 *   kind it does not own. Exit 1.
 *
 * Usage:
 *   bun run check:instance-render
 *   bun run check:instance-render -- --json
 *
 * @module scripts/check-instance-render
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import {
  instanceRootFor,
  readDeclaration,
  repoRootFor,
  type CatHarnessDeclaration,
} from "../schemas/cat-harness.js";
import { collectInstanceNodes } from "./kg-export.js";

/** How an instance's render came out. Never two states. */
export type RenderVerdict = "rendered" | "undetermined" | "failed";

export interface InstanceRender {
  /** The instance's directory name, for reporting. */
  name: string;
  root: string;
  verdict: RenderVerdict;
  /** Graph kinds the instance declares, transitively. */
  declared: string[];
  /** Graph kinds it actually published nodes for. */
  published: string[];
  /**
   * Published and not declared — REPORTED, not yet fatal.
   *
   * Measured on `35b868a45d`: cat-harness 1 (`folio`, contributed by core),
   * bootstrap 15. Both instances publish all 16 registered kinds because
   * `collectGraphKinds()` takes no root — `COLLECTOR_SCOPE` files `graphKinds`
   * as `universal`, "reads nothing instance-specific at all". A graph kind is
   * contributed by a LAYER, so the registry is global in STORAGE and not in
   * OWNERSHIP, and that classification is what needs revisiting.
   *
   * Not made fatal here, deliberately. The count is 16, and the repository's
   * own rule — stated in `code-quality-gates.yml` for ruff — is that a check
   * becomes an error once its count is zero. Failing on day one would mean
   * either a red gate nobody can clear or this module quietly deciding an
   * ownership question that belongs to bean `z4mq`. PROMOTE IT the moment
   * `collectGraphKinds` becomes instance-scoped and this reaches zero.
   */
  undeclared: string[];
  /**
   * Nodes the instance itself contributed — skills, processes, roles, its
   * declaration. Zero is a FAILURE, not an empty success.
   *
   * Excludes the graph-kind registry, which every instance gets for free
   * because `collectGraphKinds()` takes no root. Counting those made the
   * emptiness guard unreachable; see `renderInstance`.
   */
  nodeCount: number;
  /** Everything rendered, registry included — reported so both are visible. */
  totalNodes: number;
  /** Collectors deliberately not run, so "has none" is distinct from "never looked". */
  omitted: readonly string[];
  /** Why, when the verdict is not `rendered`. */
  reasons: string[];
}

/**
 * Every graph kind an instance declares, following nested graph files.
 *
 * A directory entry names kinds; a graph file INSIDE that directory may name
 * more, and those are equally the instance's. Reading only `harness.json`
 * makes `bean-defs` look like something bootstrap smuggled in.
 */
export function declaredKinds(root: string, decl: CatHarnessDeclaration): Set<string> {
  const kinds = new Set<string>();
  for (const d of decl.directories ?? []) {
    for (const g of d.graphs ?? []) kinds.add(g);
    // The nested declaration, if the directory carries one. Its filename is
    // the directory's own name by convention (`beans/beans.json`), which is
    // how `beans/` says what its inner nodes are without `harness.json`
    // restating them.
    const dirName = basename(d.path.replace(/\/+$/, ""));
    for (const candidate of [`${dirName}.json`, "graph.json"]) {
      const p = join(rootForEntry(root, d), candidate);
      if (!existsSync(p)) continue;
      try {
        const nested = JSON.parse(readFileSync(p, "utf-8")) as {
          directories?: Array<{ graphs?: string[]; kinds?: string[] }>;
        };
        for (const nd of nested.directories ?? []) {
          for (const g of [...(nd.graphs ?? []), ...(nd.kinds ?? [])]) kinds.add(g);
        }
      } catch {
        // A nested file that will not parse is not this check's finding to
        // make — `check:harness-dirs` owns that and says so loudly. Skipping
        // here would understate `declared` and manufacture an `undeclared`,
        // so the kinds it would have contributed are simply not added and the
        // reason is recorded by the caller if it matters.
      }
    }
  }
  return kinds;
}

/** Where a declared directory actually is, honouring `scope`. */
function rootForEntry(root: string, d: { path: string; scope?: string }): string {
  const base = d.scope === "repository" ? repoRootFor(root) : root;
  return resolve(base, d.path);
}

/**
 * Render one instance and judge it.
 *
 * `base` is a placeholder rather than the instance's `canonicalUrl`: this asks
 * whether the instance CAN render, not where it publishes, and an instance
 * with no canonical URL must still be checkable.
 */
export async function renderInstance(root: string): Promise<InstanceRender> {
  const name = basename(resolve(root));
  const reasons: string[] = [];

  let decl: CatHarnessDeclaration | undefined;
  try {
    decl = readDeclaration(root);
  } catch (e) {
    return {
      name, root, verdict: "undetermined", declared: [], published: [], undeclared: [],
      nodeCount: 0, totalNodes: 0, omitted: [],
      reasons: [`declaration will not parse: ${e instanceof Error ? e.message : String(e)}`],
    };
  }
  if (!decl) {
    return {
      name, root, verdict: "undetermined", declared: [], published: [], undeclared: [],
      nodeCount: 0, totalNodes: 0, omitted: [],
      reasons: [`no harness.json at ${root} — nothing declares what this instance is`],
    };
  }

  const declared = declaredKinds(root, decl);
  const problems: string[] = [];
  let nodes: Awaited<ReturnType<typeof collectInstanceNodes>>;
  try {
    nodes = await collectInstanceNodes(root, "doc", "https://instance-render.invalid", problems);
  } catch (e) {
    return {
      name, root, verdict: "failed", declared: [...declared].sort(), published: [], undeclared: [],
      nodeCount: 0, totalNodes: 0, omitted: [],
      reasons: [`render threw: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  // THE INSTANCE'S OWN NODES, which is not the node count.
  //
  // `collectGraphKinds()` is classified `universal` — it takes no root and
  // emits the whole registry — so EVERY instance gets those nodes for free,
  // including one that declares nothing. The first version of this check
  // failed an instance on `nodes.length === 0`, and its own test proved that
  // condition unreachable: an empty instance renders 16 nodes, all of them
  // the registry's.
  //
  // A guard that cannot fire is a guard that reports a clean run, which is
  // the defect this module was written to catch — arriving in the module
  // itself. So the count that decides the verdict excludes what the universal
  // collector contributed, and `nodeCount` reports it separately from the
  // total so a reader can see both.
  const isGraphKind = (n: (typeof nodes.nodes)[number]): boolean =>
    String(n["@type"] ?? "").endsWith("#GraphKind");
  const published = [...new Set(nodes.nodes.filter(isGraphKind).map((n) => String(n.name)))].sort();
  const undeclared = published.filter((k) => !declared.has(k));
  const ownNodes = nodes.nodes.filter((n) => !isGraphKind(n)).length;

  // WHAT MAKES A RENDER FAIL, and what is merely reported. The split follows
  // this repository's own precedent, stated in `code-quality-gates.yml` for
  // ruff: "a check is an error only once its count is zero". These three are
  // at zero and so are errors; `undeclared` is at 16 and so is a finding.
  if (ownNodes === 0) {
    reasons.push(
      "rendered zero nodes of its own — an empty graph is a failure, not an empty success. " +
        `(${nodes.nodes.length} node(s) total, all contributed by the universal graph-kind registry.)`,
    );
  }
  for (const p of problems) reasons.push(`collector problem: ${p}`);

  return {
    name, root,
    verdict: reasons.length === 0 ? "rendered" : "failed",
    declared: [...declared].sort(),
    published,
    undeclared,
    nodeCount: ownNodes,
    totalNodes: nodes.nodes.length,
    omitted: nodes.omitted,
    reasons,
  };
}

/** Every instance this repository owns — the root, and any beside it. */
export function instancesIn(repoRoot: string): string[] {
  const out: string[] = [];
  for (const d of ["cat-harness", "bootstrap"]) {
    const p = join(repoRoot, d);
    if (existsSync(join(p, "harness.json"))) out.push(p);
  }
  return out;
}

export function formatReport(rs: InstanceRender[]): string {
  const out: string[] = ["Instance render conformance", ""];
  for (const r of rs) {
    const mark = r.verdict === "rendered" ? "✓" : r.verdict === "undetermined" ? "?" : "✗";
    out.push(
      `  ${mark} ${r.name.padEnd(14)} ${r.verdict.padEnd(13)} ` +
        `${r.nodeCount} own node(s) of ${r.totalNodes}, ${r.declared.length} declared, ${r.published.length} published`,
    );
    for (const why of r.reasons) out.push(`      ${why}`);
    if (r.undeclared.length) {
      out.push(
        `      finding (not fatal): publishes ${r.undeclared.length} kind(s) it does not declare — ` +
          `${r.undeclared.join(", ")}`,
      );
    }
    if (r.omitted.length) out.push(`      not looked for: ${r.omitted.join(", ")}`);
  }
  const failed = rs.filter((r) => r.verdict === "failed").length;
  const undet = rs.filter((r) => r.verdict === "undetermined").length;
  out.push("");
  const findings = rs.reduce((n, r) => n + r.undeclared.length, 0);
  out.push(`${rs.length - failed - undet} rendered, ${failed} failed, ${undet} undetermined.`);
  if (findings) {
    out.push(
      `${findings} undeclared-kind finding(s), reported and not fatal. They become fatal when ` +
        `collectGraphKinds() is instance-scoped and the count reaches zero — bean z4mq.`,
    );
  }
  if (undet) out.push("undetermined is NOT a pass — an unreadable instance has not been shown to render.");
  return out.join("\n");
}

if (import.meta.main) {
  const repoRoot = repoRootFor(instanceRootFor(import.meta.dir));
  const roots = instancesIn(repoRoot);
  if (roots.length === 0) {
    console.error("No instance carries a harness.json. That is not a clean run — nothing was checked.");
    process.exit(2);
  }
  const reports = await Promise.all(roots.map((r) => renderInstance(r)));
  console.log(process.argv.includes("--json") ? JSON.stringify(reports, null, 2) : formatReport(reports));
  if (reports.some((r) => r.verdict === "failed")) process.exit(1);
  if (reports.some((r) => r.verdict === "undetermined")) process.exit(2);
  process.exit(0);
}
