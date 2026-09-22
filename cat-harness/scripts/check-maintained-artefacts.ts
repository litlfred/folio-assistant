#!/usr/bin/env bun
/**
 * Every artefact a Tool claims to maintain is actually in the published tree.
 *
 * @module scripts/check-maintained-artefacts
 *
 * ## The gap this closes, and who opened it
 *
 * `maintains` on a Tool node asserts the Tool is authoritative for a **published**
 * artefact. `kg:schema:check` reconciles those claims against produced files, but
 * only for artefacts whose declaring Tool invokes `bun run kg:schema` — it was
 * narrowed to that on 2026-09-20, because it had encoded a premise `maintains`
 * never carried (that a maintained artefact is produced by the schema exporter)
 * and reported the first counterexample as drift.
 *
 * The narrowing was right: that script cannot see whether the site build wrote a
 * file into `_site/`, and a check that answers a question it cannot see is worse
 * than one that declines to. But *right to decline* is not *covered*, and the
 * uncovered direction is the one that matters to a reader — **a claim that rotted
 * is a 404 they follow.** Bean `6f1x`, opened by the change that caused it.
 *
 * So this asks the question where the answer exists: after `_site/` is assembled.
 *
 * ## Three states, and the third is the point
 *
 * - **present** — the artefact is a file in the tree. The claim holds.
 * - **absent** — it is not. The claim is a 404 waiting to be followed.
 * - **could not determine** — there is no tree to look in. **Not a pass.**
 *
 * The third state is why this is a separate script rather than a test. A test run
 * on a developer's checkout has no `_site/`, and a check that quietly passed there
 * would be green in exactly the place nobody built the site — which is how the
 * `docs-site` workflow failed 30 times over two months without anybody noticing.
 * Exit 2 on could-not-determine, distinct from exit 1 on a real absence.
 *
 * ## Why it does not build the site itself
 *
 * Because then it would be testing its own build rather than the one that ships.
 * The workflow assembles `_site/` and this reads it — the same seam
 * `strip-preview-seo` uses, and for the same reason.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-maintained-artefacts.ts ./_site
 *   bun run check:maintained-artefacts -- ./_site
 */
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { tools } from "../tools/discover.js";

/** One claim, and whether the tree bears it out. */
export interface ArtefactCheck {
  tool: string;
  artefact: string;
  source: string;
  present: boolean;
}

/**
 * Check every `maintains` claim against a built tree.
 *
 * Takes the directory rather than finding it, so a caller in a workflow and a
 * caller in a test exercise the same code path.
 */
export function checkMaintainedArtefacts(siteDir: string): ArtefactCheck[] {
  const out: ArtefactCheck[] = [];
  for (const t of tools()) {
    for (const m of t.maintains ?? []) {
      const p = join(siteDir, m.artefact);
      // A directory is not an artefact: `maintains.artefact` names a document a
      // consumer dereferences, and a directory at that path would serve an index
      // or a 404 depending on the host. Treated as absent so the claim is
      // reported rather than passing on a coincidence of the filesystem.
      const present = existsSync(p) && statSync(p).isFile();
      out.push({ tool: t.id, artefact: m.artefact, source: m.source, present });
    }
  }
  return out.sort((a, b) => a.artefact.localeCompare(b.artefact));
}

function main(): void {
  const dir = process.argv[2];
  if (dir === undefined) {
    console.error("usage: check-maintained-artefacts <built-site-dir>");
    console.error("  Nothing was checked. That is `could not determine`, not a pass.");
    process.exit(2);
  }
  const siteDir = resolve(dir);
  if (!existsSync(siteDir) || !statSync(siteDir).isDirectory()) {
    console.error(`could not determine: ${dir} is not a directory.`);
    console.error("  Assemble the site first. An unbuilt tree clears nothing.");
    process.exit(2);
  }

  const checks = checkMaintainedArtefacts(siteDir);
  if (checks.length === 0) {
    // Vacuity guard, the same one the workflow-yaml suite carries: a green run
    // over zero rows reads as coverage that is not there.
    console.error("could not determine: no Tool node declares `maintains`.");
    console.error("  Either the graph lost its declarations or this is reading the wrong one.");
    process.exit(2);
  }

  const missing = checks.filter((c) => !c.present);
  for (const c of checks) {
    console.log(`  ${c.present ? "✓" : "✗"} ${c.artefact}  (${c.tool} ← ${c.source})`);
  }
  if (missing.length > 0) {
    console.error(`\n✗ ${missing.length} of ${checks.length} maintained artefact(s) are not in the tree:`);
    for (const c of missing) {
      console.error(
        `  · ${c.artefact}\n` +
          `      Tool "${c.tool}" claims it, produced from ${c.source}, and the built site does not carry it.\n` +
          `      Either the build stopped writing it — a 404 for every consumer following the claim — or the\n` +
          `      claim names the wrong path. Fix the build, or fix the declaration; do not drop the claim to\n` +
          `      silence this.`,
      );
    }
    process.exit(1);
  }
  console.log(`\n✓ all ${checks.length} maintained artefact(s) present in the built tree`);
}

if (import.meta.main) main();
