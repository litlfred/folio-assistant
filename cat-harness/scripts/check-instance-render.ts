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
 *   not carry". CatBootstrap's skills left the published graph in silence;
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

import { basename, relative, resolve } from "node:path";

import {
  instanceRootFor,
  instanceRootsIn,
  declaredKinds,
  readDeclaration,
  renderExemptionProblems,
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
  /**
   * Determined empties — things this instance was looked for and has none of.
   *
   * Reported, never fatal, and that is the distinction it exists to carry.
   * "No workflow diagrams under a declared knowledge-graph directory" is a
   * fact worth printing and not a reason to fail an instance: a skills
   * package with no process is ordinary. Before this, it was a `problem`, and
   * three instances holding one skill each failed on it alone.
   *
   * Different from `omitted`, which is "never looked for". This one IS the
   * result of looking.
   */
  notes?: readonly string[];
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
    notes: nodes.notes,
    reasons,
  };
}

/**
 * Every instance this repository owns — the root, and any beside it.
 *
 * The docstring above is unchanged and was FALSE in both halves until
 * 2026-09-20: this listed `["cat-harness", "bootstrap"]`, so the root was not
 * in it and two instances beside it were missing. There are four —
 * `folio-assist-core` and the repository root are the two that were going
 * unchecked, and `check-declared-assets` carried the same literal and the same
 * blind spot (bean `6tkl`).
 *
 * Now it asks the filesystem. A list that must be edited when a directory is
 * added is a list that will be wrong, and this one had already been wrong once
 * before — the sibling gate's own docstring recorded that.
 */
export function instancesIn(repoRoot: string): string[] {
  return instanceRootsIn(repoRoot);
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
        `      \u2717 publishes ${r.undeclared.length} kind(s) it does not declare — ` +
          `${r.undeclared.join(", ")}`,
      );
    }
    if (r.omitted.length) out.push(`      not looked for: ${r.omitted.join(", ")}`);
    // Printed for a RENDERED instance too — a determined empty that only
    // shows up on failures is a determined empty nobody reads.
    for (const n of r.notes ?? []) out.push(`      looked, found none: ${n}`);
  }
  const failed = rs.filter((r) => r.verdict === "failed").length;
  const undet = rs.filter((r) => r.verdict === "undetermined").length;
  out.push("");
  const findings = rs.reduce((n, r) => n + r.undeclared.length, 0);
  out.push(`${rs.length - failed - undet} rendered, ${failed} failed, ${undet} undetermined.`);
  if (findings) {
    // FATAL since bean `3jj9`. The line here used to read "reported and not
    // fatal … they become fatal when collectGraphKinds() is instance-scoped
    // and the count reaches zero — bean z4mq". Both halves have happened:
    // `collectGraphKinds` takes a root and filters by `declaredKinds`, and
    // the count is zero across every instance in this repository.
    //
    // The repository's standing rule is that a check is an error only once
    // its count is zero, and the corollary is that it should become one THEN
    // rather than later — a finding left advisory after it is clearable is
    // how the next instance quietly reacquires it.
    out.push(
      `${findings} instance(s) publish a graph kind they do not declare. An instance that ` +
        `advertises a vocabulary it cannot reach is a type that does not dereference.`,
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

  // THE EXEMPTION, checked here because this is the gate it is an exemption
  // FROM. Bean `hfkl`: bootstrap is excused the visualiser and the
  // workflow visualiser, and owes its own `.jsonld`/`.json` instead.
  //
  // Checked across every instance in ONE call rather than per instance,
  // because the property that matters is not "is this claim well-formed" but
  // "how many layers claim it". The exemption is the bottom of the stack and
  // there is one bottom; a second claimant is the requirement spreading
  // upward, which a per-instance check structurally cannot see. See
  // `renderExemptionProblems`.
  const exemptionProblems = renderExemptionProblems(
    roots.map((r) => {
      const d = readDeclaration(r);
      return { name: d?.name ?? (relative(repoRoot, r) || "."), renderExemption: d?.renderExemption };
    }),
  );
  if (exemptionProblems.length) {
    console.error("");
    for (const p of exemptionProblems) console.error(`  \u2717 ${p}`);
    process.exit(1);
  }

  if (reports.some((r) => r.verdict === "failed")) process.exit(1);
  // Bean `3jj9`: fatal now that the count is zero. See the report text above
  // for why it was advisory until this change, and why leaving it advisory
  // after it became clearable is how the defect returns.
  if (reports.some((r) => r.undeclared.length > 0)) process.exit(1);
  if (reports.some((r) => r.verdict === "undetermined")) process.exit(2);
  process.exit(0);
}

// Re-exported for callers that already import it from here (bean `3jj9`
// moved the implementation to the declaration reader to break a cycle).
export { declaredKinds };
