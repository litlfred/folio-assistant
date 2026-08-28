/**
 * Paper adapter — path constants.
 *
 * These are resolved relative to the repo root, which is passed in at runtime.
 * For backward compatibility with the copied tool files, we export the same
 * constants that the original paths.ts did, but computed from REPO_ROOT.
 *
 * @module folio-assistant/adapters/paper/paths
 */

import { resolve } from "path";

// Default: assume folio-assistant/adapters/paper/ is inside the repo
let _repoRoot = resolve(import.meta.dir, "../../..");

/** Set the repo root (called at startup). */
export function setRepoRoot(root: string): void {
  _repoRoot = root;
}

/** Repository root directory. */
export function getRepoRoot(): string {
  return _repoRoot;
}

// ── Convenience getters (match original paths.ts export names) ───

export const get = {
  REPO_ROOT: () => _repoRoot,
  CONTENT_DIR: () => resolve(_repoRoot, "content"),
  CHAPTERS_DIR: () => resolve(_repoRoot, "chapters"),
  MAIN_TEX: () => resolve(_repoRoot, "main.tex"),
  /**
   * Default Lean workspace directory.  Points at the repo root where
   * the aggregating `lakefile.toml` lives (see schemas/lean-packages.ts
   * for per-paper Lake roots).
   */
  LEAN_DIR: () => _repoRoot,
  BUILD_DIR: () => resolve(_repoRoot, "build"),
  PREFS_FILE: () => resolve(_repoRoot, ".folio-prefs.json"),
  FEEDBACK_DIR: () => resolve(_repoRoot, ".folio-feedback"),
  UPLOADS_DIR: () => resolve(_repoRoot, "uploads"),
};

// ── Static exports for backward compatibility with tool files ────
// These are evaluated once at import time. For dynamic resolution,
// tools should import `get` above.

export const REPO_ROOT = _repoRoot;
export const CONTENT_DIR = resolve(_repoRoot, "content");
export const CHAPTERS_DIR = resolve(_repoRoot, "chapters");
export const MAIN_TEX = resolve(_repoRoot, "main.tex");
export const LEAN_DIR = _repoRoot;
export const BUILD_DIR = resolve(_repoRoot, "build");
export const PREFS_FILE = resolve(_repoRoot, ".folio-prefs.json");
export const FEEDBACK_DIR = resolve(_repoRoot, ".folio-feedback");
