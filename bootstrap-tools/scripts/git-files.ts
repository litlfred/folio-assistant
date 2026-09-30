/**
 * The files git accounts for under a directory — tracked, plus untracked and
 * not ignored — as absolute paths, or `undefined` when git cannot answer.
 *
 * @module bootstrap-tools/scripts/git-files
 *
 * The same rule as cat-harness's `gitCorpus`, restated here in a dozen lines
 * rather than imported, because importing it reached the harness (bean
 * `xsqm`: bootstrap-tools depends on bootstrap and nothing above it).
 *
 * Two answers that must not collapse: `undefined` means git could not answer
 * (not a work tree, no git) and the caller falls back or reports "could not
 * determine"; `[]` means git looked and there are none. Untracked files count,
 * because a file just written and not yet staged is part of the change a
 * check exists to examine.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export function gitFiles(dir: string): string[] | undefined {
  if (!existsSync(dir)) return undefined;
  const r = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: dir, encoding: "utf-8" });
  if (r.error !== undefined || r.status !== 0) return undefined;
  return r.stdout.split("\0").filter(Boolean).map((p) => join(dir, p));
}
