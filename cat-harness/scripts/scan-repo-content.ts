#!/usr/bin/env bun
/**
 * Scan an existing repository for material a folio could take over.
 *
 * This runs on the `overlay` branch of `processes/getting-started.bpmn`,
 * before anything is scaffolded and long before anything is moved. It is the
 * "look first" half of a rule that only works in one order: **scan, show, ask,
 * then move.**
 *
 * ## Three buckets, and the third is the reason this exists
 *
 * `library` is external source material — something somebody else wrote, which
 * the folio cites or ingests. `content` is material authored here, which could
 * become folio blocks. `unclassified` is everything it could not place, and it
 * is *reported*, never quietly assigned.
 *
 * A two-bucket classifier has an accuracy nobody can assess and delivers its
 * mistakes as moved files. The same third-state discipline runs through
 * `readme-sections.ts` ("could not determine" is never rendered as "empty") and
 * `decisions/pages-live-gate.dmn` ("could not check" is never rendered as "not
 * yet"). Here the cost of collapsing it would be an author's PDFs filed as
 * their drafts.
 *
 * ## Path and extension only — deliberately
 *
 * It does not read file contents, call a model, or try to be clever. It tries
 * to be fast, explicable and reversible, so that an author can disagree with
 * any row in one word. A classifier whose reasoning cannot be stated in a
 * sentence cannot be corrected by the person it is wrong about.
 *
 * ## It never writes
 *
 * No moves, no mkdir, no git. Ingestion is a separate process with its own
 * diagram (`document-ingestion.bpmn`) and its own gate.
 *
 * Usage:
 *   bun run cat-harness/scripts/scan-repo-content.ts [dir]           # report
 *   bun run cat-harness/scripts/scan-repo-content.ts [dir] --json    # facts
 *
 * @module scripts/scan-repo-content
 */

import { spawnSync } from "node:child_process";
import { LEGACY_HARNESS_CONFIG } from "../schemas/harness-config";
import { existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

export type Bucket = "library" | "content" | "unclassified";

export interface ScanEntry {
  /** Path relative to the scanned root, with `/` separators. */
  path: string;
  bucket: Bucket;
  /** Why it landed there, in a few words an author can argue with. */
  why: string;
  bytes: number;
}

export interface ScanGroup {
  /** Directory the group is keyed on — `.` for the root. */
  dir: string;
  bucket: Bucket;
  files: number;
  bytes: number;
  /** Up to five example paths, so a report never becomes a file listing. */
  examples: string[];
  /** The distinct reasons contributing to this group. */
  why: string[];
}

export interface ScanResult {
  root: string;
  /** Whether the tree came from `git ls-files` or a filesystem walk. */
  source: "git" | "filesystem";
  entries: ScanEntry[];
  groups: ScanGroup[];
  totals: Record<Bucket, { files: number; bytes: number }>;
  /** Paths skipped as folio scaffolding or VCS bookkeeping, counted only. */
  skipped: number;
}

/** Extensions that are source material whoever authored them. */
const LIBRARY_EXT = new Set([
  ".pdf", ".epub", ".djvu", ".ps",
  ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".odt", ".ods", ".odp",
  ".bib", ".ris", ".enl", ".nbib",
  ".csv", ".tsv", ".parquet",
  ".mp3", ".wav", ".m4a", ".flac", ".mp4", ".mov", ".webm",
  ".tif", ".tiff", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp",
]);

/** Extensions that are prose somebody wrote here. */
const CONTENT_EXT = new Set([".md", ".markdown", ".rst", ".org", ".adoc", ".tex", ".txt"]);

/** Directory names that say "external source" loudly enough to override extension. */
const LIBRARY_DIRS = new Set([
  "library", "sources", "source-material", "papers", "references", "refs",
  "bibliography", "literature", "reading", "scans", "uploads", "attachments",
  "data", "datasets", "corpus", "archive", "pdfs",
]);

/** Directory names that say "authored here". */
const CONTENT_DIRS = new Set([
  "content", "docs", "doc", "documentation", "notes", "drafts", "draft",
  "chapters", "sections", "manuscript", "book", "paper", "papers-src",
  "writing", "posts", "_posts", "articles", "guides", "spec", "specs",
]);

/** Paths that are neither the author's material nor a question — just noise. */
const SKIP_DIRS = new Set([
  ".git", ".github", ".vscode", ".idea", "beans", ".claude",
  // Moved out of `.harness/` on 2026-09-20 and DECLARED, so they are skipped
  // by name rather than by a dot-prefix that no longer exists.
  "interaction", "issue-marks",
  "node_modules", ".venv", "venv", "__pycache__", "dist", "build", "target",
  ".next", ".cache", "coverage", ".lake", ".pytest_cache", "vendor",
]);

const SKIP_FILES = new Set([
  ".gitignore", ".gitattributes", ".gitmodules", ".editorconfig",
  "package-lock.json", "bun.lock", "bun.lockb", "yarn.lock", "pnpm-lock.yaml",
  "poetry.lock", "cargo.lock", "gemfile.lock",
  "license", "licence", "copying", "notice",
]);

/**
 * Files the folio itself owns. Present on a repo that has already been
 * converted; skipping them keeps a re-run from proposing to import the
 * scaffolding it wrote last time.
 */
// The config is matched by SUFFIX now, not by name: it is
// `<instance>.config.json` as of 2026-09-20 and this module scans a
// repository it may not yet have a declaration for. The retired global name
// stays in the set so a re-run over a not-yet-migrated repo still skips it
// rather than proposing to import it as content.
const FOLIO_FILES = new Set([
  LEGACY_HARNESS_CONFIG, "agents.md", "claude.md", "gemini.md", ".mcp.json",
]);
const CONFIG_SUFFIX = ".config.json";

function isSkipped(rel: string): boolean {
  const parts = rel.split("/");
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  const base = parts[parts.length - 1]!.toLowerCase();
  if (parts.length === 1 && base.endsWith(CONFIG_SUFFIX)) return true;
  if (SKIP_FILES.has(base) || FOLIO_FILES.has(base)) return true;
  // A dotfile sitting at the repo root is configuration, not the author's work.
  if (base.startsWith(".") && parts.length === 1) return true;
  return false;
}

/**
 * Classify one path. Directory convention beats extension, because an author
 * who put a `.md` in `references/` meant it as a reference — and because the
 * directory is a statement of intent while the extension is an accident of
 * tooling.
 */
export function classify(rel: string): { bucket: Bucket; why: string } {
  const parts = rel.split("/");
  const dirs = parts.slice(0, -1).map((d) => d.toLowerCase());
  const ext = extname(rel).toLowerCase();

  const libDir = dirs.find((d) => LIBRARY_DIRS.has(d));
  if (libDir) return { bucket: "library", why: `under ${libDir}/` };

  const contentDir = dirs.find((d) => CONTENT_DIRS.has(d));
  if (contentDir) return { bucket: "content", why: `under ${contentDir}/` };

  if (LIBRARY_EXT.has(ext)) return { bucket: "library", why: `${ext} is source material` };
  if (CONTENT_EXT.has(ext)) return { bucket: "content", why: `${ext} is prose` };

  return {
    bucket: "unclassified",
    why: ext ? `no rule for ${ext}` : "no extension, no directory hint",
  };
}

/** Prefer git's view of the tree: it already honours `.gitignore`. */
function listFiles(root: string): { files: string[]; source: "git" | "filesystem" } {
  const NUL = String.fromCharCode(0);
  const r = spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "buffer" });
  if (r.status === 0 && r.stdout) {
    const files = r.stdout.toString("utf-8").split(NUL).filter(Boolean);
    return { files, source: "git" };
  }
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) out.push(relative(root, full).split(sep).join("/"));
    }
  };
  walk(root);
  return { files: out, source: "filesystem" };
}

export function scanRepo(root: string): ScanResult {
  const abs = resolve(root);
  const { files, source } = listFiles(abs);

  const entries: ScanEntry[] = [];
  let skipped = 0;

  for (const rel of files) {
    if (isSkipped(rel)) {
      skipped++;
      continue;
    }
    const { bucket, why } = classify(rel);
    let bytes = 0;
    try {
      bytes = statSync(join(abs, rel)).size;
    } catch {
      // A file git knows about but the working tree does not (a broken symlink,
      // a sparse checkout). Counted at zero rather than dropped: the author
      // should still see it listed.
    }
    entries.push({ path: rel, bucket, why, bytes });
  }

  const totals: Record<Bucket, { files: number; bytes: number }> = {
    library: { files: 0, bytes: 0 },
    content: { files: 0, bytes: 0 },
    unclassified: { files: 0, bytes: 0 },
  };
  for (const e of entries) {
    totals[e.bucket].files++;
    totals[e.bucket].bytes += e.bytes;
  }

  // Group by (directory, bucket). The author decides per directory, never per
  // file — a 400-row confirmation loop is the accessibility failure in
  // interaction-modality.md §0 with extra steps.
  const byKey = new Map<string, ScanGroup>();
  for (const e of entries) {
    const slash = e.path.lastIndexOf("/");
    const dir = slash === -1 ? "." : e.path.slice(0, slash);
    const key = `${dir}\t${e.bucket}`;
    let g = byKey.get(key);
    if (!g) {
      g = { dir, bucket: e.bucket, files: 0, bytes: 0, examples: [], why: [] };
      byKey.set(key, g);
    }
    g.files++;
    g.bytes += e.bytes;
    if (g.examples.length < 5) g.examples.push(e.path);
    if (!g.why.includes(e.why)) g.why.push(e.why);
  }

  const groups = [...byKey.values()].sort(
    (a, b) => b.files - a.files || a.dir.localeCompare(b.dir),
  );

  return { root: abs, source, entries, groups, totals, skipped };
}

const human = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
};

export function formatScan(r: ScanResult): string {
  const out: string[] = [];
  out.push(`Scanned ${r.root}`);
  out.push(
    r.source === "git"
      ? "  file list: git ls-files (.gitignore honoured)"
      : "  file list: filesystem walk — not a git repo, so .gitignore was NOT applied",
  );
  out.push("");

  const order: Bucket[] = ["library", "content", "unclassified"];
  const label: Record<Bucket, string> = {
    library: "library/ — source material somebody else wrote",
    content: "folio/ — prose authored here",
    unclassified: "unclassified — I could not tell; you decide",
  };

  for (const b of order) {
    const t = r.totals[b];
    out.push(`${label[b]}: ${t.files} file(s), ${human(t.bytes)}`);
    const gs = r.groups.filter((g) => g.bucket === b).slice(0, 8);
    for (const g of gs) {
      const where = g.dir === "." ? "(repo root)" : `${g.dir}/`;
      out.push(`   ${where} — ${g.files} file(s), ${human(g.bytes)}  [${g.why.join("; ")}]`);
      for (const ex of g.examples.slice(0, 3)) out.push(`      ${ex}`);
      if (g.files > 3) out.push(`      … and ${g.files - 3} more`);
    }
    const rest = r.groups.filter((g) => g.bucket === b).length - gs.length;
    if (rest > 0) out.push(`   … and ${rest} more director${rest === 1 ? "y" : "ies"}`);
    out.push("");
  }

  out.push(`${r.skipped} path(s) skipped as VCS bookkeeping, build output or folio scaffolding.`);
  out.push("");
  if (r.totals.unclassified.files > 0) {
    out.push(
      `${r.totals.unclassified.files} file(s) are unclassified. That is the scan working, not failing —\n` +
        "nothing is filed on a guess. Decide those by directory before anything moves.",
    );
  } else if (r.entries.length > 0) {
    out.push(
      "Nothing was left unclassified. On a real repository that is worth a second look:\n" +
        "suspect the rules rather than celebrate the result.",
    );
  }
  out.push("");
  out.push("This scan wrote nothing. Next: skills/folio-core/repo-conversion.md §2 — three");
  out.push("questions (import or not; library or content; leave in place or reorganise).");
  return out.join("\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const dir = args.find((a) => !a.startsWith("--")) ?? ".";
  if (!existsSync(dir)) {
    console.error(`No such directory: ${dir}`);
    process.exit(2);
  }
  const result = scanRepo(dir);
  console.log(json ? JSON.stringify(result, null, 2) : formatScan(result));
}
