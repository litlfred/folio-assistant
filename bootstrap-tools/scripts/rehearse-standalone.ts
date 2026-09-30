#!/usr/bin/env bun
/**
 * Rehearse the split: run bootstrap-tools against bootstrap with NOTHING else
 * present — the two as sibling checkouts in an empty directory, exactly as
 * `litlfred/bootstrap` and `litlfred/bootstrap-tools` will be.
 *
 * @module bootstrap-tools/scripts/rehearse-standalone
 * @covers code — bootstrap-tools itself, run where only bootstrap sits beside it
 *
 * Phase 4 of bean `xsqm`. The closure gate proves no IMPORT reaches above
 * bootstrap-tools; it cannot prove a script does not READ a path above it, or
 * that a test does not lean on a file only the monorepo has. Only running
 * them where nothing else exists can. Each check that fails here is a
 * dependency the split would have broken on its first day.
 *
 * What is copied is what git tracks in each directory — a standalone clone
 * has nothing else — and each copy is made a git repository with those files
 * added, as a clone would be. `node_modules` is linked from this checkout, standing in
 * for the `bun install` a standalone clone would run.
 *
 * NOT rehearsed: `render:check`, which needs a headless Chromium; the drawing
 * is byte-compared by `render:check` in the monorepo, and nothing in it reads
 * a path outside bootstrap-tools.
 *
 * Usage: bun run bootstrap-tools/scripts/rehearse-standalone.ts [--keep]
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

import { gitFiles } from "./git-files.ts";

const TOOLS = join(import.meta.dir, "..");
const REPO = join(TOOLS, "..");

/** The checks a standalone bootstrap-tools must pass, run from its own root. */
export const REHEARSED: ReadonlyArray<readonly [string, string[]]> = [
  ["closure", ["run", "scripts/check-closure.ts"]],
  ["schemas are current", ["run", "scripts/gen-bootstrap-schemas.ts", "--check"]],
  ["vocabulary is current", ["run", "scripts/gen-vocabulary.ts", "--check"]],
  ["IRIs are at the declared version", ["run", "scripts/iri-sync.ts", "--check"]],
  ["node IRIs are their paths", ["run", "scripts/check-node-iris.ts"]],
  ["documents and the built graph parse", ["run", "scripts/validate-bootstrap.ts"]],
  ["the graph exports", ["run", "scripts/export-graph.ts", "--base-url", "https://example.invalid/bootstrap/", "--out", "/dev/null"]],
  ["unit tests", ["test", "."]],
];

function copyTracked(from: string, to: string): number {
  const files = gitFiles(from);
  if (!files) throw new Error(`${from} is not in a git checkout — nothing says which files a clone would hold`);
  for (const abs of files) {
    const rel = relative(from, abs);
    mkdirSync(dirname(join(to, rel)), { recursive: true });
    copyFileSync(abs, join(to, rel));
  }
  // A clone IS a git repository, and some checks ask git what the corpus is
  // (`iri-sync`): an index with the files added is what they read.
  for (const args of [["init", "-q"], ["add", "-A"]]) {
    const r = spawnSync("git", args, { cwd: to, encoding: "utf-8" });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} in ${to}: ${r.stderr}`);
  }
  return files.length;
}

if (import.meta.main) {
  const keep = process.argv.includes("--keep");
  const root = mkdtempSync(join(tmpdir(), "bootstrap-standalone-"));
  const nb = copyTracked(join(REPO, "bootstrap"), join(root, "bootstrap"));
  const nt = copyTracked(TOOLS, join(root, "bootstrap-tools"));
  symlinkSync(join(REPO, "node_modules"), join(root, "bootstrap-tools", "node_modules"), "dir");
  console.log(`Rehearsing in ${root}: bootstrap (${nb} files) and bootstrap-tools (${nt} files), nothing else.`);
  let failed = 0;
  for (const [what, args] of REHEARSED) {
    const r = spawnSync("bun", args, { cwd: join(root, "bootstrap-tools"), encoding: "utf-8" });
    if (r.status === 0) console.log(`  ✓ ${what}`);
    else {
      failed++;
      console.error(`  ✗ ${what} (bun ${args.join(" ")})`);
      const tail = `${r.stdout}\n${r.stderr}`.trim().split("\n").slice(-12);
      for (const l of tail) console.error(`      ${l}`);
    }
  }
  if (!keep) rmSync(root, { recursive: true, force: true });
  if (failed) {
    console.error(`\n✗ ${failed} of ${REHEARSED.length} check(s) fail when bootstrap-tools stands alone — each is a dependency the split would break`);
    process.exit(1);
  }
  console.log(`\n✓ bootstrap-tools passes all ${REHEARSED.length} checks standing alone beside bootstrap`);
}
