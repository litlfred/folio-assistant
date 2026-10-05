#!/usr/bin/env bun
/**
 * derive:publish — build every derived artefact that cannot be current in a
 * commit, at the moment the site is built. Bean `0b8c` (#2230).
 *
 * @module cat-harness/scripts/derive-at-publish
 * @covers none — it runs the writers `check:derived-from` names; it judges no graph
 *
 * ## Why this exists
 *
 * A derived artefact is current only relative to its inputs. When every
 * input is kept in the commit, a committed copy plus a `:check` gate keeps
 * them together. When an input is kept on a BRANCH, it moves without a
 * commit, and a committed copy is stale on main and on every open PR the
 * moment somebody writes there — measured 2026-10-05, when one `state:push`
 * to `cat/cat-harness/fsh-guts` turned `fsh-guts:viz:check` red everywhere.
 *
 * So such an artefact is never committed. `check:derived-from` works out
 * which artefacts those are by walking the `derivedFrom` edges up to a
 * branch-kept input — a visualisation counting as derived from the directory
 * it shows — and refuses any that is tracked. This script is the other half:
 * the site build runs it after `state:mount` and before composing the site,
 * and it runs each one's declared `writer`, sources before consumers.
 *
 * No list of generators lives here or in a workflow. Adding the next
 * branch-kept graph (beans, todos) with a declared visualiser `writer` is the
 * whole change; this step picks it up.
 *
 * ## Refusals, not silence
 *
 * A writer that exits non-zero fails the step, naming it. A writer reads a
 * mounted graph and refuses an unmounted one (exit 2), so a build that forgot
 * `state:mount` fails here rather than publishing an empty page.
 *
 * ```
 * bun run derive:publish            # run every writer
 * bun run derive:publish --list     # print what would run, run nothing
 * ```
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { judge, readTree, renderingOrder, trackedIn, type PublishArtefact } from "./check-derived-from.ts";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

/** The publish-time artefacts in rendering order: a source's artefacts before its consumers'. */
export function publishPlan(repoRoot = REPO_ROOT): PublishArtefact[] {
  const tree = readTree(repoRoot);
  const j = judge(tree, (p) => existsSync(resolve(repoRoot, p)), trackedIn(repoRoot));
  const order = renderingOrder(tree, j.edges);
  const rank = new Map(order.map((n, k) => [n, k]));
  return [...j.publish].sort((a, b) => (rank.get(a.node) ?? 0) - (rank.get(b.node) ?? 0) || a.artefact.localeCompare(b.artefact));
}

if (import.meta.main) {
  const plan = publishPlan();
  const listOnly = process.argv.includes("--list");
  console.log(`derive:publish — ${plan.length} artefact(s) built at publish`);
  for (const a of plan) console.log(`  ${a.artefact}  ← ${a.via.join(" ← ")}  (writer: ${a.writer.join(", ")})`);
  if (listOnly) process.exit(0);
  for (const a of plan) {
    // The writer list holds scripts and, for a directory, template directories
    // it READS (ending in `/`); only the scripts are run.
    for (const w of a.writer.filter((p) => !p.endsWith("/"))) {
      const r = spawnSync("bun", ["run", w], { cwd: REPO_ROOT, stdio: "inherit" });
      if (r.status !== 0) {
        console.log(`::error::derive:publish: writer ${w} for ${a.artefact} exited ${r.status ?? "on a signal"}`);
        process.exit(1);
      }
    }
  }
  console.log(`  ✓ ${plan.length} artefact(s) built`);
}
