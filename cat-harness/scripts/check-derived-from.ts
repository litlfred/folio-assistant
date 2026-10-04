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
 * And one ADVISORY count: directories in the `derived` layer that name no
 * `derivedFrom`. Absent means "not declared", and a `library/` is derived from
 * an external publication, not from a graph. Making silence fail needs a field
 * for "why not", which is the owner's call, so it is reported, not graded.
 *
 * @module cat-harness/scripts/check-derived-from
 * @covers none — it judges directory declarations, which no graph kind holds
 */
import { resolve } from "node:path";

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
  | { kind: "cycle"; nodes: string[] };

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
export function judge(instances: readonly Inst[]): Judgement {
  const byName = new Map(instances.map((i) => [i.name, i]));
  const declares = (inst: string, id: string) => byName.get(inst)?.dirs.some((d) => d.id === id) ?? false;
  const findings: Finding[] = [];
  const edges: Edge[] = [];
  const undeclared: string[] = [];

  for (const inst of instances) {
    for (const d of inst.dirs) {
      if (d.derived && d.derivedFrom === undefined) undeclared.push(node(inst.name, d.id));
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

/** Read the real checkout into `judge`'s shape. */
export function analyse(repoRoot = REPO_ROOT): Judgement {
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
        derived: d.graphKinds.some((k) => graphLayer(k) === "derived"),
        ...(d.derivedFrom ? { derivedFrom: d.derivedFrom } : {}),
      })),
    };
  });
  return judge(instances);
}

if (import.meta.main) {
  const j = analyse();
  const hard = j.findings.filter((f) => f.kind !== "layering-gap");
  const { regressions, stale } = ratchet(j.findings, BASELINE);
  console.log(`check:derived-from — ${j.edges.length} edge(s) resolved`);
  for (const e of j.edges) console.log(`  ${e.from} ← ${e.to}`);
  for (const f of hard) {
    if (f.kind === "unknown-id") console.log(`  ✗ ${f.instance}/${f.directory}: derivedFrom "${f.target}" is declared by no instance`);
    else if (f.kind === "order") console.log(`  ✗ ${f.instance}/${f.directory}: derivedFrom "${f.target}" ${f.detail}`);
    else if (f.kind === "cycle") console.log(`  ✗ cycle: ${f.nodes.join(" → ")}`);
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
