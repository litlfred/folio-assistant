#!/usr/bin/env bun
/**
 * Verdicts in the results tree whose block is gone — the corpus-wide half.
 *
 * ## Why `no-orphan-sidecar` cannot be this
 *
 * That check runs per directory load and, since bean `2634`, reaches exactly
 * one results directory: the mirror of the block directory being loaded. That
 * is enough for the case it exists for — a block MOVING between chapters and
 * leaving a verdict at the old path — because both chapters still exist and
 * both get loaded.
 *
 * It is structurally blind to one case. **Delete a block directory outright
 * and its mirror survives with nothing to visit it, ever**, because the only
 * thing that reaches a mirror is a load of the directory it mirrors. Under the
 * old adjacency this could not arise: the verdicts were INSIDE the directory
 * and went with it. Bean `pb2b`.
 *
 * Widening `no-orphan-sidecar` to walk the whole tree was rejected and the
 * reasoning is worth keeping: it would report the entire repo's orphans when
 * you asked to validate one chapter, and it would report each of them once per
 * chapter loaded. A corpus question needs a corpus entry point.
 *
 * ## Two kinds of finding, because the remedies differ
 *
 * `moved` — the block directory still exists and the manifest does not. A
 * block moved or was deleted; `validate` sees this too, and either place is a
 * fine one to notice it.
 *
 * `abandoned` — **the block directory itself is gone.** Nothing else in this
 * repository will ever report it. This is the finding that justifies the
 * sweep, and it is reported separately so a reader can tell the sweep earned
 * its run.
 *
 * @module content/pipeline/orphan-verdict-sweep
 * @covers qa
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { BLOCK_QA_RESULTS_DIR, BLOCK_QA_SUFFIX, blockOfQaPath } from "./qa-paths";

export interface OrphanVerdict {
  /** Repo-relative path of the verdict with no block behind it. */
  verdict: string;
  /** Repo-relative path of the manifest it claims to audit. */
  expects: string;
  /**
   * `abandoned` when the block's whole directory is gone — the case only this
   * sweep can see. `moved` when the directory survives without the manifest.
   */
  kind: "abandoned" | "moved";
}

/** Every `*.qa.json` under the results tree, depth-first. */
function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(BLOCK_QA_SUFFIX)) out.push(p);
  }
  return out;
}

/**
 * Orphaned block verdicts across the whole results tree.
 *
 * An ABSENT results tree is a determined empty, not an error: a folio that has
 * never run a sweep since migrating has no tree, and reporting that as a
 * problem would put a finding in front of every such folio on day one.
 */
export function orphanVerdicts(repoRoot: string): OrphanVerdict[] {
  const out: OrphanVerdict[] = [];
  for (const verdict of walk(join(repoRoot, BLOCK_QA_RESULTS_DIR))) {
    const ts = blockOfQaPath(repoRoot, verdict);
    // `undefined` means the path is not under the results tree, which `walk`
    // makes impossible — but the contract is allowed to refuse and this must
    // not invent an answer when it does.
    if (!ts || existsSync(ts)) continue;
    out.push({
      verdict: relative(repoRoot, verdict),
      expects: relative(repoRoot, ts),
      kind: existsSync(dirname(ts)) ? "moved" : "abandoned",
    });
  }
  return out.sort((a, b) => a.verdict.localeCompare(b.verdict));
}

if (import.meta.main) {
  const { findContentRepoRoot } = await import("./repo-root");
  const root = findContentRepoRoot();
  const found = orphanVerdicts(root);
  const abandoned = found.filter((f) => f.kind === "abandoned");

  if (found.length === 0) {
    console.log(`✓ no orphaned block verdicts under ${BLOCK_QA_RESULTS_DIR}`);
    process.exit(0);
  }
  console.error(`${found.length} orphaned block verdict(s):\n`);
  for (const f of found) {
    console.error(`  ✗ ${f.verdict}`);
    console.error(`      expects ${f.expects} — ${f.kind === "abandoned"
      ? "its block DIRECTORY is gone; nothing else reports this"
      : "the directory survives, so validate sees this too"}`);
  }
  console.error(
    `\n${abandoned.length} of them are abandoned directories, which only this sweep can see.\n` +
      `Delete the verdict (git history keeps it) or restore the manifest.`,
  );
  // Non-zero, because an orphan inflates every census taken over the tree and
  // can never be refreshed — no sweep will visit a block that does not exist.
  process.exit(1);
}
