#!/usr/bin/env bun
/**
 * check:instance-graph — every instance's dependency graph resolves: no
 * missing dependency, no cycle. Bean `a1lq`.
 *
 * The owner's ruling, 2026-09-23: at runtime a missing dependency WARNS and
 * the overlay continues without that layer, because an uncloned git-URL
 * dependency in a partial checkout looks exactly like one, and throwing there
 * stops sessions that work. That leniency is safe only if something fails on
 * it where it matters, and this is that something: in CI the checkout is
 * whole, so a dependency that is missing here is misspelled or gone.
 *
 * A cycle already throws at runtime (`orderedDependencies`); it is reported
 * here as well, so one run names every broken instance rather than the first.
 *
 * ## Declared, and identified (issue #1548)
 *
 * Owner, 2026-09-30: *"QA gates on harness declaration of dependences. harness
 * instancess need IRI for harness."* Two more obligations, gated here:
 *
 * - **Every instance DECLARES `needs`.** Absent is undetermined, and at
 *   runtime it stays a legal third state (`resolution-across-needs.test.ts`
 *   proves what it reports), but in this repository it is a finding. `[]`
 *   declares the floor and is fine. Until this gate, #1508 had made all
 *   instances comply by hand and nothing held them there.
 * - **Every instance has an absolute harness IRI, and no two share one.** The
 *   IRI is `kg-export`'s own `exportIdentity(...).canonicalIri`, called rather
 *   than re-derived, so this gate and the published `@id` cannot disagree.
 *

 * @covers cat-harness
 */
import { relative } from "node:path";

import { instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
import { resolveInstanceGraph, type InstanceGraphProblem } from "../schemas/harness-config.js";

/** The declaration-level findings this gate adds to the graph's own (#1548). */
export type DeclarationProblem =
  | { kind: "undeclared-needs"; detail: string }
  | { kind: "no-iri"; detail: string }
  | { kind: "duplicate-iri"; detail: string };

export interface InstanceGraphReport {
  instances: number;
  problems: Array<{ instance: string; problem: InstanceGraphProblem | DeclarationProblem }>;
  /** Each instance's harness IRI, when one could be derived. */
  iris: Record<string, string>;
}

/** Resolves an instance root to its canonical harness IRI, or `undefined`. */
export type IriOf = (root: string) => string | undefined;

/** The exporter's own answer, loaded lazily: `kg-export` is a large module. */
async function exporterIri(): Promise<IriOf> {
  const { exportIdentity } = await import("./kg-export.js");
  return (root) => exportIdentity({ instanceRoot: root }).canonicalIri;
}

export function collect(repoRoot: string, iriOf?: IriOf): InstanceGraphReport {
  const roots = instanceRootsIn(repoRoot);
  const seen = new Set<string>();
  const problems: InstanceGraphReport["problems"] = [];
  const iris: Record<string, string> = {};
  const byIri = new Map<string, string>();
  for (const root of roots) {
    const name = relative(repoRoot, root) || ".";
    let needs: string[] | undefined;
    try {
      needs = readDeclaration(root)?.needs;
    } catch {
      needs = undefined; // an unreadable declaration has declared nothing
    }
    if (needs === undefined) {
      problems.push({
        instance: name,
        problem: { kind: "undeclared-needs", detail: `${name} declares no \`needs\`; write the layers it is built on, or [] for the floor` },
      });
    }
    if (!iriOf) continue;
    const iri = iriOf(root);
    if (!iri || !/^https?:\/\//.test(iri)) {
      problems.push({
        instance: name,
        problem: { kind: "no-iri", detail: `${name} has no absolute harness IRI (${iri ?? "none"}): declare a canonicalUrl, or publish it from an instance that does` },
      });
      continue;
    }
    iris[name] = iri;
    const other = byIri.get(iri);
    if (other) {
      problems.push({ instance: name, problem: { kind: "duplicate-iri", detail: `${name} and ${other} share the IRI ${iri}` } });
    } else byIri.set(iri, name);
  }
  for (const root of roots) {
    for (const problem of resolveInstanceGraph(root).problems) {
      // An instance's broken edge is reached again from every dependent; say it once.
      const key = `${problem.kind}:${problem.detail}`;
      if (seen.has(key)) continue;
      seen.add(key);
      problems.push({ instance: relative(repoRoot, root) || ".", problem });
    }
  }
  return { instances: roots.length, problems, iris };
}

export function isClean(r: InstanceGraphReport): boolean {
  return r.instances > 0 && r.problems.length === 0;
}

export function formatReport(r: InstanceGraphReport): string {
  if (r.instances === 0) return "NOTHING WAS EXAMINED — no instance declaration was read. That is not a pass.";
  if (r.problems.length === 0) {
    const named = Object.keys(r.iris).length;
    return `✓ ${r.instances} instance(s): every one declares \`needs\`, every dependency resolves, no cycle` +
      (named ? `; ${named} distinct harness IRI(s)` : "");
  }
  return [
    `✗ ${r.problems.length} dependency problem(s) across ${r.instances} instance(s):`,
    ...r.problems.map((p) => `    ${p.problem.kind}  (from ${p.instance})  ${p.problem.detail}`),
  ].join("\n");
}

if (import.meta.main) {
  const report = collect(process.cwd(), await exporterIri());
  (isClean(report) ? console.log : console.error)(formatReport(report));
  process.exit(isClean(report) ? 0 : 1);
}
