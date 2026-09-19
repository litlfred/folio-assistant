/**
 * Enumerate a repository's files the way a GATE needs to see them.
 *
 * @module scripts/repo-files
 *
 * ## The blind spot this exists to close
 *
 * `git ls-files <tree>` lists **tracked** files only. A file created and not
 * yet committed is invisible to it — so a gate built on it is blind to
 * precisely the files most likely to violate the rule it enforces, at
 * precisely the moment their author would have caught it.
 *
 * Measured, not hypothetical (bean `bgle`, 2026-09-19): while building
 * `iurf`, two new files — `scripts/gen-themes-css.ts` and
 * `scripts/tests/theme-tokens.test.ts` — both hardcoded the site root. A full
 * `bun test` before committing reported **0 fail**, because the gate could not
 * see them. The same suite on CI, after the commit, reported the failure. The
 * earliest possible detection was a red CI cycle on PR #405.
 *
 * What makes it worth a module rather than a one-line fix: the local run is
 * the one that is *supposed* to be cheap, and a gate that passes locally and
 * fails in CI trains its author to stop trusting the local run.
 *
 * ## Tracked ∪ untracked-but-not-ignored
 *
 * `--others --exclude-standard` is the second half, and `--exclude-standard`
 * is what keeps it useful: it honours `.gitignore`, so `node_modules/`,
 * build output and local scratch stay out while new work comes in. Without
 * it the set is unusable and a gate built on it would be abandoned.
 *
 * **Deleted-but-still-tracked files are excluded.** `ls-files` lists a file
 * the working tree no longer has, and a gate reading one would fail on
 * content nobody can fix from here.
 *
 * ## When tracked-only is the RIGHT question
 *
 * Not every `ls-files` call is this bug, and replacing them indiscriminately
 * would break a correct one. `scripts/tests/lean-projects.test.ts` asks
 * whether `.lake/` is *tracked* — being committed is the thing it is
 * checking, so untracked files are legitimately none of its business. Use
 * this module when the question is "what source is in this tree"; keep
 * `ls-files` when the question is literally "what is committed".
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

function gitList(root: string, args: string[]): string[] {
  const proc = Bun.spawnSync(["git", ...args], { cwd: root });
  return new TextDecoder()
    .decode(proc.stdout)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Every file under `trees`, tracked or newly created, excluding ignored ones.
 *
 * Returns repo-relative paths, sorted and de-duplicated — a file can appear in
 * both listings during some index states, and a gate reporting the same
 * offender twice reads as two defects.
 */
export function repoFiles(root: string, trees: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const t of trees) {
    for (const f of gitList(root, ["ls-files", t])) seen.add(f);
    for (const f of gitList(root, ["ls-files", "--others", "--exclude-standard", t])) seen.add(f);
  }
  // A tracked file that has been deleted in the working tree is still listed.
  return [...seen].filter((f) => existsSync(join(root, f))).sort();
}

/** {@link repoFiles}, narrowed to the extensions a gate cares about. */
export function repoFilesWithExt(
  root: string,
  trees: readonly string[],
  exts: readonly string[],
): string[] {
  return repoFiles(root, trees).filter((f) => exts.some((e) => f.endsWith(e)));
}
