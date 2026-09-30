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
  const r = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: dir,
    encoding: "utf-8",
    // The 1 MiB default overflowed on this checkout (ENOBUFS, 2026-09-30, at
    // 1,058,420 bytes of path names), which read as "git could not answer"
    // and failed iri:sync:check. The literal is restated rather than imported
    // from `gitCorpus`'s `GIT_LIST_MAX_BUFFER` for the reason the rest of
    // this module is restated: bootstrap-tools depends on bootstrap and
    // nothing above it (bean `xsqm`). `check:uploads-retired`'s test asks
    // both helpers over one scratch repository past 1 MiB, so the two cannot
    // silently disagree despite having no shared constant.
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error !== undefined || r.status !== 0) return undefined;
  return r.stdout.split("\0").filter(Boolean).map((p) => join(dir, p));
}
