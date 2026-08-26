/**
 * Shared path constants for the MCP server.
 *
 * @module scripts/mcp-server/paths
 */

import { resolve } from "path";
import { readFileSync } from "fs";
import { findContentRepoRoot } from "../../content/pipeline/repo-root";

/**
 * The FOLIO's root — the content repo this server serves.
 *
 * Every constant below is a folio concept: `content/`, `chapters/`,
 * `main.tex`, the Lake workspace, `build/`, `todos/`. None of them exist in
 * folio-assistant, which is the platform. This was
 * `resolve(import.meta.dir, "../..")`, so the server rooted itself in the
 * platform and reported `Paper not found` for every paper in the folio it was
 * launched from — and its git operations ran against the platform repo rather
 * than the content branches it is meant to switch between.
 *
 * Same defect class as `q-usage-audit`, `validate`, `validate-bib`,
 * `export-json`, `readme-metadata` and `refresh-authors-note`.
 */
export const REPO_ROOT = findContentRepoRoot();

/** Content objects directory. */
export const CONTENT_DIR = resolve(REPO_ROOT, "content");

/**
 * Ingested documents directory — the `.jsonld` nodes and `sections/*.md` that
 * `docs/proposals/rag-document-ingestion.md` §7-bis specifies.
 *
 * May not exist. That is not an error: the ingest writer is a separate stage,
 * and the graph index reports an absent root as absent rather than as an
 * empty one, so a caller can tell "not built yet" from "nothing matched".
 */
export const LIBRARY_DIR = resolve(REPO_ROOT, "library");

/** LaTeX chapters output directory. */
export const CHAPTERS_DIR = resolve(REPO_ROOT, "chapters");

/** Main LaTeX file. */
export const MAIN_TEX = resolve(REPO_ROOT, "main.tex");

/**
 * Default Lean project directory for the MCP server.
 *
 * Points at the repo-root Lake workspace, which aggregates every paper
 * package registered in `folio-assistant/schemas/lean-packages.ts`.
 * For per-paper operations use the package's `lakeRoot` from that
 * registry instead.
 */
export const LEAN_DIR = REPO_ROOT;

/** Build output directory. */
export const BUILD_DIR = resolve(REPO_ROOT, "build");

/** Preference storage file. */
export const PREFS_FILE = resolve(REPO_ROOT, ".folio-assistant-prefs.json");

/** Gitignored todos directory (survives branch switches). */
export const TODOS_DIR = resolve(REPO_ROOT, "todos");

/** Feedback directory — committed to main via worktree.
 *  Structure: feedback/<paper-dir>/<rootName>.ts */
export const FEEDBACK_DIR = resolve(REPO_ROOT, "folio-assistant/feedback");

/** Worktree directory for committing feedback to main. */
export const FEEDBACK_WORKTREE = resolve(REPO_ROOT, ".feedback-wt");

/** Global config file. */
export const CONFIG_FILE = resolve(REPO_ROOT, "lean-mcp.config.json");

/** Read viewer_port from lean-mcp.config.json (single source of truth). */
function readViewerPort(): number {
  try {
    const cfg = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    return cfg.viewer_port ?? 8080;
  } catch {
    return 8080;
  }
}

/** The port the viewer/assistant serves on (from lean-mcp.config.json). */
export const FOLIO_PORT = parseInt(process.env.VIEWER_PORT || String(readViewerPort()), 10);
