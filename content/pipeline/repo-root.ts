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

import { existsSync, readdirSync, statSync } from "fs";
import { dirname, join, resolve } from "path";

/**
 * Locate the content-repo root by walking up from `process.cwd()`.
 *
 * Two passes, because `computations/` is NOT universal — it is a
 * convention of folios that carry Python computation witnesses. A paper
 * folio with no computations, or a WHO SMART Guidelines folio, has only
 * `content/`. Requiring both made this resolver silently return the
 * folio-assistant tree for such repos, which is how "platform, not
 * content" leaks: every pipeline script then reads the wrong root.
 *
 * 1. Prefer an ancestor with BOTH `computations/` and `content/` — the
 *    strongest signal, and it keeps behaviour identical for folios that
 *    have both.
 * 2. Otherwise accept the nearest ancestor with `content/`.
 *
 * The first pass runs to completion before the second, so a nested
 * `content/` directory cannot shadow a true root further up.
 */
export function findContentRepoRoot(): string {
  const ancestors: string[] = [];
  let dir = process.cwd();
  for (let i = 0; i < 12 && dir !== dirname(dir); i++) {
    ancestors.push(dir);
    dir = dirname(dir);
  }
  for (const d of ancestors) {
    if (existsSync(join(d, "computations")) && existsSync(join(d, "content"))) return d;
  }
  for (const d of ancestors) {
    if (existsSync(join(d, "content"))) return d;
  }
  // Fallback: import-relative heuristic (two levels up from
  // content/pipeline/). Preserves behaviour when the walk-up finds nothing.
  return resolve(import.meta.dir, "..", "..");
}

/**
 * Discover the folio's papers: directories under `content/` that carry a
 * same-named manifest (`content/<paper>/<paper>.ts`).
 *
 * Exists so pipeline code stops hardcoding a paper directory. A folio
 * may hold several papers, and the platform must not privilege one of
 * them — see `.beans/` and `docs/proposals/` for the portability work.
 *
 * Returns directory names (not paths), sorted, so callers can join them
 * onto their own root.
 */
export function findPapers(repoRoot?: string): string[] {
  const root = repoRoot ?? findContentRepoRoot();
  const contentDir = join(root, "content");
  if (!existsSync(contentDir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(contentDir)) {
    if (entry.startsWith(".")) continue;
    const d = join(contentDir, entry);
    try {
      if (!statSync(d).isDirectory()) continue;
    } catch {
      continue;
    }
    if (existsSync(join(d, `${entry}.ts`))) out.push(entry);
  }
  return out.sort();
}

/**
 * The single paper of a one-paper folio.
 *
 * Returns `undefined` when the folio has zero or several papers —
 * callers must then take the paper as an explicit argument rather than
 * guess. Guessing is what produced the hardcoded paper names this
 * helper replaces.
 */
export function soleFolioPaper(repoRoot?: string): string | undefined {
  const papers = findPapers(repoRoot);
  return papers.length === 1 ? papers[0] : undefined;
}
