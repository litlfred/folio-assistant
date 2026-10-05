#!/usr/bin/env bun
/**
 * check:derived-from — the edges between derived subgraphs resolve, form no
 * cycle, and respect the interim rendering order. Bean `nama`, step 2.
 *
 * `derivedFrom` (schemas/cat-harness.ts) names the declared directory ids a
 * derived graph is computed FROM. An edge nothing checks is prose, so this
 * gate gives it three refusals and one ratchet, per the owner's rulings of
 * 2026-10-04 (design note docs/proposals/derived-graph-dependencies-2026-10-04.md):
 *
 * - **Resolution.** An id resolves to the NEAREST instance that declares it:
 *   the edge's own instance first, then the instances it `needs`, closest
 *   first. Ids are not unique across instances (`library` is declared six
 *   times), so the instance picked is part of the answer and is printed.
 * - **An id declared nowhere** is refused.
 * - **An id declared only by an instance the edge's instance does not need**
 *   is a LAYERING GAP: the chrome case, where an IG's pages are styled by
 *   smart-base's chrome across no `needs` path. The owner ruled it a RATCHET
 *   (option 1 of 3). It is held in `derived-from.baseline.ts` with a reason; a
 *   new gap fails, and a cleared one leaves the baseline stale until shrunk.
 * - **A cycle** is refused.
 * - **The interim order** (the owner's rule: declaration order is rendering
 *   order until a topological order is computed). A directory whose source is
 *   declared AFTER it in the same instance is refused, because it would render
 *   from a stale source.
 *
 * - **A dangling `writer`** is refused: the staging cone reads a directory's
 *   generator from it (bean `4j86`), and a path that does not exist would
 *   silently shrink the cone rather than fail.
 *
 * And one ADVISORY count: directories in the `derived` layer that name no
 * `derivedFrom`. Absent means "not declared", and a `library/` is derived from
 * an external publication, not from a graph. Making silence fail needs a field
 * for "why not", which is the owner's call, so it is reported, not graded.
 *
 * @module cat-harness/scripts/check-derived-from
 * @covers none — it judges directory declarations, which no graph typology holds
 */
import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { graphLayer, readDeclaration } from "../schemas/cat-harness.ts";
import { ancestorsOf, flattenDependencies } from "../schemas/dependency-order.js";
import { allowedFromNeeds } from "../schemas/layer-direction.js";
import { readInstances } from "./check-import-direction.ts";
import { BASELINE, type DerivedFromBaselineEntry } from "./derived-from.baseline.ts";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

export interface Dir {
  id: string;
  /** Position in the instance's declaration — the interim rendering order. */
  index: number;
  derived: boolean;
  derivedFrom?: readonly string[];
  /** Repo-relative, ending in `/`. Absent in a hand-built tree that does not need it. */
  path?: string;
  /** The generator, as declared (`writer`), repo-relative. */
  writer?: readonly string[];
}

export interface Inst {
  name: string;
  /** This instance's dependencies, NEAREST first. */
  ancestors: readonly string[];
  dirs: readonly Dir[];
}

export type Finding =
  | { kind: "unknown-id"; instance: string; directory: string; target: string }
  | { kind: "layering-gap"; instance: string; directory: string; target: string; declaredBy: string[] }
  | { kind: "order"; instance: string; directory: string; target: string; detail: string }
  | { kind: "cycle"; nodes: string[] }
  | { kind: "missing-writer"; instance: string; directory: string; writer: string };

export interface Edge {
  from: string;
  to: string;
}

export interface Judgement {
  findings: Finding[];
  edges: Edge[];
  /** Derived-layer directories with no derivedFrom: advisory. */
  undeclared: string[];
}

const node = (instance: string, id: string) => `${instance}/${id}`;

/** Pure: the rules, over already-read declarations. */
export function judge(instances: readonly Inst[], exists: (repoRelative: string) => boolean = () => true): Judgement {
  const byName = new Map(instances.map((i) => [i.name, i]));
  const declares = (inst: string, id: string) => byName.get(inst)?.dirs.some((d) => d.id === id) ?? false;
  const findings: Finding[] = [];
  const edges: Edge[] = [];
  const undeclared: string[] = [];

  for (const inst of instances) {
    for (const d of inst.dirs) {
      if (d.derived && d.derivedFrom === undefined) undeclared.push(node(inst.name, d.id));
      // A dangling writer would silently SHRINK the staging cone, so it is refused.
      for (const w of d.writer ?? []) {
        if (!exists(w)) findings.push({ kind: "missing-writer", instance: inst.name, directory: d.id, writer: w });
      }
      for (const target of d.derivedFrom ?? []) {
        const owner = [inst.name, ...inst.ancestors].find((n) => declares(n, target));
        if (owner === undefined) {
          const declaredBy = instances.filter((i) => declares(i.name, target)).map((i) => i.name);
          findings.push(
            declaredBy.length === 0
              ? { kind: "unknown-id", instance: inst.name, directory: d.id, target }
              : { kind: "layering-gap", instance: inst.name, directory: d.id, target, declaredBy },
          );
          continue;
        }
        edges.push({ from: node(inst.name, d.id), to: node(owner, target) });
        if (owner === inst.name) {
          const src = inst.dirs.find((x) => x.id === target)!;
          if (src.index > d.index) {
            findings.push({
              kind: "order",
              instance: inst.name,
              directory: d.id,
              target,
              detail: `declared at position ${d.index}, before its source at ${src.index}: under the interim rule it would render from a stale source`,
            });
          }
        }
      }
    }
  }

  // Cycles, over the resolved edges (depth-first, colouring).
  const out = new Map<string, string[]>();
  for (const e of edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  const colour = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const seen = new Set<string>();
  const visit = (n: string): void => {
    colour.set(n, 1);
    stack.push(n);
    for (const m of out.get(n) ?? []) {
      if (colour.get(m) === 1) {
        const cyc = stack.slice(stack.indexOf(m));
        const key = [...cyc].sort().join(" ");
        if (!seen.has(key)) {
          seen.add(key);
          findings.push({ kind: "cycle", nodes: [...cyc, m] });
        }
      } else if (colour.get(m) === undefined) visit(m);
    }
    stack.pop();
    colour.set(n, 2);
  };
  for (const n of out.keys()) if (colour.get(n) === undefined) visit(n);

  return { findings, edges, undeclared };
}

/** The ratchet over layering gaps: a gap not in the baseline regresses; a baseline entry no longer a gap is stale. */
export function ratchet(findings: readonly Finding[], baseline: readonly DerivedFromBaselineEntry[]) {
  const key = (i: string, d: string, t: string) => `${i}\u0000${d}\u0000${t}`;
  const gaps = findings.filter((f): f is Extract<Finding, { kind: "layering-gap" }> => f.kind === "layering-gap");
  const held = new Set(baseline.map((b) => key(b.instance, b.directory, b.target)));
  const live = new Set(gaps.map((g) => key(g.instance, g.directory, g.target)));
  return {
    regressions: gaps.filter((g) => !held.has(key(g.instance, g.directory, g.target))),
    stale: baseline.filter((b) => !live.has(key(b.instance, b.directory, b.target))),
  };
}

/** Read the real checkout into `judge`'s shape, instances DEPENDENCY-FIRST (the interim order across instances). */
export function readTree(repoRoot = REPO_ROOT): Inst[] {
  const all = readInstances(repoRoot);
  const byName = new Map(all.map((i) => [i.name, i]));
  const flat = flattenDependencies(
    all.map((i) => ({ id: i.name, needs: (i.needs ?? []).filter((n) => byName.has(n)), fatal: false })),
  );
  if (flat.problems.length > 0) {
    throw new Error(`check:derived-from: the instance needs graph is broken — ${flat.problems.map((p) => p.detail).join("; ")}`);
  }
  // The SAME reach as check:document-kind-sources, so the two gates cannot
  // disagree about what an instance may name: itself plus what it needs,
  // transitively, and only itself when it declares no `needs`.
  const allowed = allowedFromNeeds(new Map(all.map((i) => [i.name, i.needs ?? []])), ancestorsOf(flat.order));
  // `flat.order` is dependency-first, so a LATER position is NEARER to a consumer.
  const position = new Map(flat.order.map((s, i) => [s.id, i]));
  const instances: Inst[] = all.map((i) => {
    const decl = readDeclaration(i.root);
    return {
      name: i.name,
      ancestors: [...(allowed.get(i.name) ?? [])].filter((n) => n !== i.name).sort((a, b) => (position.get(b) ?? 0) - (position.get(a) ?? 0)),
      dirs: (decl?.directories ?? []).map((d, index) => ({
        id: d.id,
        index,
        derived: d.graphTypologies.some((k) => graphLayer(k) === "derived"),
        ...(d.derivedFrom ? { derivedFrom: d.derivedFrom } : {}),
        path: `${relative(repoRoot, join(i.root, d.path)).replace(/\/$/, "")}/`,
        ...(d.writer ? { writer: d.writer } : {}),
      })),
    };
  });
  return instances.sort((a, b) => (position.get(a.name) ?? 0) - (position.get(b.name) ?? 0));
}

export function analyse(repoRoot = REPO_ROOT): Judgement {
  return judge(readTree(repoRoot), (p) => existsSync(join(repoRoot, p)));
}

/**
 * The rendering order DERIVED from the edges (bean `nama`, Done-when 4): a
 * topological order over every declared directory, a source before everything
 * computed from it. Stable under the interim rule: of the directories ready at
 * once, the one declared first (instances dependency-first, then declaration
 * order) goes first. So while the gate passes, this order and the interim one
 * agree — the gate's `order` refusal and the `needs` direction of a resolved
 * edge are exactly what make them agree — and it stays right once they may not.
 * A cycle's members never become ready and are left out; `judge` refuses them.
 */
export function renderingOrder(instances: readonly Inst[], edges: readonly Edge[]): string[] {
  const interim = instances.flatMap((i) => [...i.dirs].sort((a, b) => a.index - b.index).map((d) => node(i.name, d.id)));
  const rank = new Map(interim.map((n, k) => [n, k]));
  const indegree = new Map(interim.map((n) => [n, 0]));
  const consumers = new Map<string, string[]>();
  for (const e of edges) {
    indegree.set(e.from, (indegree.get(e.from) ?? 0) + 1);
    consumers.set(e.to, [...(consumers.get(e.to) ?? []), e.from]);
  }
  const ready = interim.filter((n) => indegree.get(n) === 0);
  const out: string[] = [];
  while (ready.length > 0) {
    ready.sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
    const n = ready.shift()!;
    out.push(n);
    for (const m of consumers.get(n) ?? []) {
      const left = (indegree.get(m) ?? 0) - 1;
      indegree.set(m, left);
      if (left === 0) ready.push(m);
    }
  }
  return out;
}

/**
 * What must be re-rendered when `changed` change: the changed directories and
 * everything transitively computed from them, in rendering order. The graph
 * half of the staging cone (bean `4j86`) and of the main publish job (bean
 * `lbz8`); the file and import-closure half is theirs.
 */
export function downstreamOf(changed: readonly string[], order: readonly string[], edges: readonly Edge[]): string[] {
  const consumers = new Map<string, string[]>();
  for (const e of edges) consumers.set(e.to, [...(consumers.get(e.to) ?? []), e.from]);
  const hit = new Set<string>();
  const queue = [...changed];
  while (queue.length > 0) {
    const n = queue.shift()!;
    if (hit.has(n)) continue;
    hit.add(n);
    queue.push(...(consumers.get(n) ?? []));
  }
  return order.filter((n) => hit.has(n));
}

if (import.meta.main) {
  const tree = readTree();
  const j = judge(tree, (p) => existsSync(join(REPO_ROOT, p)));
  const order = renderingOrder(tree, j.edges);
  const at = process.argv.indexOf("--downstream");
  if (at !== -1) {
    // A query, not the gate: `--downstream smart-base/smart-base-themes …`.
    const asked = process.argv.slice(at + 1).filter((a) => !a.startsWith("--"));
    const unknown = asked.filter((n) => !order.includes(n));
    if (unknown.length > 0) {
      console.log(`✗ not a declared directory (instance/id): ${unknown.join(", ")}`);
      process.exit(2);
    }
    for (const n of downstreamOf(asked, order, j.edges)) console.log(n);
    process.exit(0);
  }
  const hard = j.findings.filter((f) => f.kind !== "layering-gap");
  const { regressions, stale } = ratchet(j.findings, BASELINE);
  console.log(`check:derived-from — ${j.edges.length} edge(s) resolved`);
  for (const e of j.edges) console.log(`  ${e.from} ← ${e.to}`);
  const inEdge = new Set(j.edges.flatMap((e) => [e.from, e.to]));
  console.log(`  rendering order, derived from the edges (${order.length} directories; those in an edge): ${order.filter((n) => inEdge.has(n)).join(" → ") || "none"}`);
  for (const f of hard) {
    if (f.kind === "unknown-id") console.log(`  ✗ ${f.instance}/${f.directory}: derivedFrom "${f.target}" is declared by no instance`);
    else if (f.kind === "order") console.log(`  ✗ ${f.instance}/${f.directory}: derivedFrom "${f.target}" ${f.detail}`);
    else if (f.kind === "cycle") console.log(`  ✗ cycle: ${f.nodes.join(" → ")}`);
    else if (f.kind === "missing-writer") console.log(`  ✗ ${f.instance}/${f.directory}: writer "${f.writer}" does not exist`);
  }
  for (const g of regressions) {
    if (g.kind === "layering-gap") {
      console.log(`  ✗ NEW layering gap: ${g.instance}/${g.directory} derivedFrom "${g.target}", declared only by ${g.declaredBy.join(", ")}, which ${g.instance} does not need`);
    }
  }
  for (const s of stale) console.log(`  ✗ STALE baseline: ${s.instance}/${s.directory} → ${s.target} is no longer a gap — remove it from derived-from.baseline.ts`);
  console.log(`  · ${j.undeclared.length} derived-layer director(ies) name no derivedFrom — advisory, not graded: ${j.undeclared.join(", ") || "none"}`);
  if (hard.length || regressions.length || stale.length) process.exit(1);
  console.log(`  ✓ every edge resolves, no cycle, the interim order holds; ${BASELINE.length} baselined layering gap(s)`);
}
