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
 * @covers cat-harness
 */
import { relative } from "node:path";

import { instanceRootsIn } from "../schemas/cat-harness.js";
import { resolveInstanceGraph, type InstanceGraphProblem } from "../schemas/harness-config.js";

export interface InstanceGraphReport {
  instances: number;
  problems: Array<{ instance: string; problem: InstanceGraphProblem }>;
}

export function collect(repoRoot: string): InstanceGraphReport {
  const roots = instanceRootsIn(repoRoot);
  const seen = new Set<string>();
  const problems: InstanceGraphReport["problems"] = [];
  for (const root of roots) {
    for (const problem of resolveInstanceGraph(root).problems) {
      // An instance's broken edge is reached again from every dependent; say it once.
      const key = `${problem.kind}:${problem.detail}`;
      if (seen.has(key)) continue;
      seen.add(key);
      problems.push({ instance: relative(repoRoot, root) || ".", problem });
    }
  }
  return { instances: roots.length, problems };
}

export function isClean(r: InstanceGraphReport): boolean {
  return r.instances > 0 && r.problems.length === 0;
}

export function formatReport(r: InstanceGraphReport): string {
  if (r.instances === 0) return "NOTHING WAS EXAMINED — no instance declaration was read. That is not a pass.";
  if (r.problems.length === 0) return `✓ ${r.instances} instance(s): every dependency resolves, no cycle`;
  return [
    `✗ ${r.problems.length} dependency problem(s) across ${r.instances} instance(s):`,
    ...r.problems.map((p) => `    ${p.problem.kind}  (from ${p.instance})  ${p.problem.detail}`),
  ].join("\n");
}

if (import.meta.main) {
  const report = collect(process.cwd());
  (isClean(report) ? console.log : console.error)(formatReport(report));
  process.exit(isClean(report) ? 0 : 1);
}
