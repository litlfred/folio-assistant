/**
 * Content-repo root resolution for pipeline code.
 *
 * The pipeline lives in **folio-assistant** but operates on a downstream
 * *content* repo (e.g. `qou`), which embeds folio-assistant as a symlinked
 * subdirectory.  Computing the root as `resolve(import.meta.dir, "..", "..")`
 * therefore lands inside folio-assistant's own tree — *not* the content repo
 * — so witness files under `<content-repo>/computations/…` and
 * `<content-repo>/content/<paper>/…` can never be resolved.
 *
 * Instead, walk up from the current working directory (which, for every
 * pipeline invocation, is the content repo) until we find the directory that
 * contains both `computations/` and `content/`.  Fall back to the old
 * import-relative guess if the walk fails (e.g. unusual harnesses), so behaviour
 * never regresses below the previous baseline.
 *
 * @module content/pipeline/repo-root
 */

import { existsSync } from "fs";
import { dirname, join, resolve } from "path";

/**
 * Locate the content-repo root: the nearest ancestor of `process.cwd()`
 * containing both a `computations/` and a `content/` directory.
 */
export function findContentRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 12 && dir !== dirname(dir); i++) {
    if (existsSync(join(dir, "computations")) && existsSync(join(dir, "content"))) {
      return dir;
    }
    dir = dirname(dir);
  }
  // Fallback: previous import-relative heuristic (two levels up from
  // content/pipeline/).  Preserves behaviour when the walk-up finds nothing.
  return resolve(import.meta.dir, "..", "..");
}
