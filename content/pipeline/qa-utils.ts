/**
 * Shared utilities for QA sidecar tooling.
 *
 * @module content/pipeline/qa-utils
 */

import { createHash } from "crypto";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "fs";
import { join, resolve } from "path";
import { execFileSync } from "child_process";
import {
  parseLeanRef,
  leanPackageByName,
  LEAN_PACKAGES,
} from "../../schemas/lean-packages";
import { mkdirSync } from "fs";
import { dirname } from "path";
import type {
  BlockQaReport,
  QaFieldHash,
  QaCriterionEntry,
  QaScriptSidecar,
} from "../../schemas/block-qa";
import { QA_CRITERIA_BY_ID } from "./qa-criteria-registry";
import { findContentRepoRoot } from "./repo-root";

// ── Hashing ─────────────────────────────────────────────────────

/**
 * 12-char SHA-256 prefix of a file's UTF-8 bytes — mirrors
 * `folio-assistant/computations/witness_staleness_tracker.py`.
 */
export function hashFile(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex").slice(0, 12);
}

/** Build a {md, ts, lean} hash bundle, omitting absent files. */
export function hashBlockFiles(paths: {
  md?: string;
  ts?: string;
  lean?: string;
}): QaFieldHash {
  const out: QaFieldHash = {};
  if (paths.md) {
    const h = hashFile(paths.md);
    if (h) out.md = h;
  }
  if (paths.ts) {
    const h = hashFile(paths.ts);
    if (h) out.ts = h;
  }
  if (paths.lean) {
    const h = hashFile(paths.lean);
    if (h) out.lean = h;
  }
  return out;
}

// ── Repo info ───────────────────────────────────────────────────

/**
 * Sentinel used when git is unavailable or the path is untracked.
 * Matches the convention in `witness_base._git_file_sha()` (Python
 * compute pipeline) so JSON consumers see an explicit token rather
 * than an empty string.
 */
export const GIT_SHA_UNKNOWN = "unknown";

/**
 * Current HEAD SHA (full). Returns the `unknown` sentinel outside
 * a git repo.
 */
export function gitHeadSha(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return GIT_SHA_UNKNOWN;
  }
}

/**
 * Full git SHA of the most recent commit touching `relPath`, where
 * `relPath` is repo-relative (e.g. `content/pipeline/foo.ts`).
 * Returns the `unknown` sentinel if `path` is not tracked / outside
 * a git repo.
 *
 * Runs `git -C <repoRoot> log ... -- <relPath>` via `execFileSync`
 * (no shell interpolation) — git pathspecs are interpreted relative
 * to the repo root, so passing an absolute path is brittle and
 * tooling-cwd-dependent. Pinning cwd via `-C` makes the call
 * robust regardless of where the qa-sweep process is invoked from.
 */
export function gitFileCommitSha(relPath: string, repoRoot: string): string {
  try {
    const out = execFileSync(
      "git",
      ["-C", repoRoot, "log", "-n", "1", "--format=%H", "--", relPath],
      { stdio: ["ignore", "pipe", "ignore"] },
    )
      .toString()
      .trim();
    return out || GIT_SHA_UNKNOWN;
  } catch {
    return GIT_SHA_UNKNOWN;
  }
}

// ── Script-hash helpers ─────────────────────────────────────────

/**
 * 12-char SHA-256 prefix of the concatenated content of `paths`,
 * in the order given. Used for `deps_hash` on reviewer entries
 * (multiple extra inputs roll up into one fingerprint).
 *
 * Each entry of `paths` is `{ label, abs }`: `abs` is the
 * filesystem path to read bytes from; `label` is the path string
 * mixed into the hash to disambiguate "two files with the same
 * content but different declared paths" from each other AND to
 * mark presence/absence. Callers should pass **repo-relative**
 * labels (not absolute) so the hash is portable across machines /
 * checkout locations — otherwise the same byte-identical inputs
 * produce different `deps_hash` values per environment.
 */
export function hashFiles(
  paths: Array<{ label: string; abs: string }>,
): string | undefined {
  if (paths.length === 0) return undefined;
  const h = createHash("sha256");
  for (const { label, abs } of paths) {
    if (!existsSync(abs)) {
      h.update(`__absent__:${label}\n`);
      continue;
    }
    h.update(`__file__:${label}\n`);
    h.update(readFileSync(abs));
    h.update("\n");
  }
  return h.digest("hex").slice(0, 12);
}

/**
 * Cache key for the script-hash bundle attached to one criterion.
 * Computed once per qa-sweep run and reused for every block under
 * sweep.
 */
export interface CriterionScriptHashes {
  /** Criterion id. */
  criterion_id: string;
  /** Path to checker source file (may not exist on disk). */
  source_file: string;
  /** 12-char SHA-256 of the source file. Empty if absent. */
  script_hash: string;
  /** Full git SHA of the file's most recent commit. */
  script_commit_sha: string;
  /** Resolved extra-input paths, in declared order. */
  extra_inputs: string[];
  /** 12-char SHA-256 over concat(extra_inputs). Undefined if no extras. */
  deps_hash?: string;
}

/**
 * Build the script-hash bundle for one criterion: hash its source
 * file + its extra-input files (if any). Pure read of disk; no
 * caching here — callers should memoize across the sweep run.
 *
 * `sourceFile` and `extraInputs` are repo-relative paths. `repoRoot`
 * is the absolute directory they should be resolved against — this
 * decouples the helper from `process.cwd()`, since qa-sweep runs
 * with cwd inside `content/`.
 */
export function computeCriterionScriptHashes(
  criterionId: string,
  sourceFile: string,
  extraInputs: string[] = [],
  repoRoot: string = process.cwd(),
): CriterionScriptHashes {
  const absSource = join(repoRoot, sourceFile);
  // Hash extra inputs with their repo-relative labels (NOT
  // absolute paths) so the resulting `deps_hash` is portable across
  // machines / checkout locations. Bytes are still read from the
  // absolute path; only the label salt comes from the relative
  // form.
  const labelled = extraInputs.map((p) => ({
    label: p,
    abs: join(repoRoot, p),
  }));
  return {
    criterion_id: criterionId,
    source_file: sourceFile,
    script_hash: hashFile(absSource) ?? "",
    // Pass the repo-relative `sourceFile` (not `absSource`) so git
    // interprets the pathspec correctly against `repoRoot`.
    script_commit_sha: gitFileCommitSha(sourceFile, repoRoot),
    extra_inputs: extraInputs,
    deps_hash: extraInputs.length > 0 ? hashFiles(labelled) : undefined,
  };
}

// ── Canonical lean.ref resolution (single source of truth) ──────
//
// This is THE resolver for `lean.ref` → on-disk Lean file. Every QA
// consumer — `walkBlocks` (used by qa-sweep), `q-usage-audit`,
// `qa-agent-write`, and orphan-coverage scans — routes through
// `resolveCanonicalLean` so the candidate-1 (sibling) → candidate-2
// (Lake/library tree) resolution can never drift between tools. Do not
// reimplement this walk anywhere else; pass a `LakeTreeCache` for bulk
// callers and reuse the same function.

/**
 * Per-package basename → first-path index for one Lake root, keyed by
 * the absolute Lake-root path. Bulk callers (walking many blocks) build
 * this once and reuse it so the library tree is scanned a single time
 * rather than once per ref.
 */
export type LakeTreeCache = Map<string, Map<string, string>>;

/** Walk one Lake root once, indexing `*.lean` basename → absolute path. */
function buildLakeBasenameMap(absRoot: string): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const stack: string[] = [absRoot];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name);
        if (e.isDirectory()) stack.push(full);
        // First occurrence wins for ambiguous basenames; the common
        // case (one file per basename) is unambiguous.
        else if (e.isFile() && e.name.endsWith(".lean") && !map.has(e.name))
          map.set(e.name, full);
      }
    }
  } catch {
    /* Lake root missing — empty map */
  }
  return map;
}

/** Fetch (or lazily build + cache) the basename index for a Lake root. */
function lakeBasenameMap(
  absRoot: string,
  cache?: LakeTreeCache,
): Map<string, string> {
  if (!cache) return buildLakeBasenameMap(absRoot);
  let m = cache.get(absRoot);
  if (!m) {
    m = buildLakeBasenameMap(absRoot);
    cache.set(absRoot, m);
  }
  return m;
}

/**
 * Resolve a content block's package-qualified `lean.ref` URI (e.g.
 * `qou:QOU.FluidDynamics.q_bkm_criterion`) to the **canonical compiled
 * declaration file** under the package's Lake tree, e.g.
 * `<repo>/content/quantum-observable-universe/lean/QOU/FluidDynamics/q_bkm_criterion.lean`.
 *
 * Tries (a) the direct module-path file, then (b) a basename search
 * under the package Lake root. Returns `undefined` if the ref is absent,
 * malformed, the package is unknown, or no file is found.
 *
 * QA tooling uses this so it scores the canonical (package-compiled)
 * declaration rather than an uncompiled sibling stub: a content block's
 * `<root>.lean` may be a `True := by trivial` placeholder while the real
 * statement lives in the library module named by `lean.ref` (CLAUDE.md
 * §3b-cond — the sibling stub is not the integrity gate).
 *
 * Pass a shared `cache` when resolving many refs (e.g. a corpus sweep)
 * so the Lake tree is scanned once; omit it for single-block callers.
 */
export function resolveCanonicalLean(
  ref: string | undefined,
  repoRoot: string,
  cache?: LakeTreeCache,
): string | undefined {
  if (!ref) return undefined;
  let parsed: ReturnType<typeof parseLeanRef>;
  try {
    parsed = parseLeanRef(ref);
  } catch {
    return undefined;
  }
  const pkg = leanPackageByName(parsed.package);
  if (!pkg) return undefined;
  // (a) Direct module-path resolution.
  const direct = resolve(
    repoRoot,
    pkg.lakeRoot,
    `${parsed.module.replace(/\./g, "/")}.lean`,
  );
  if (existsSync(direct)) return direct;
  // (b) Basename fallback under the Lake tree.
  const lakeRootAbs = resolve(repoRoot, pkg.lakeRoot);
  return lakeBasenameMap(lakeRootAbs, cache).get(`${parsed.name}.lean`);
}

/**
 * Enumerate every `*.lean` file under every configured package's Lake
 * tree (absolute paths). Single source for "what library-tree files
 * exist", consumed by orphan-coverage scans that audit Lean files
 * reachable by **no** block's `lean.ref`. Returns `[]` when no packages
 * are configured (e.g. the framework repo with no content injected).
 */
export function listPackageLeanFiles(repoRoot: string): string[] {
  const out: string[] = [];
  for (const pkg of LEAN_PACKAGES) {
    const absRoot = resolve(repoRoot, pkg.lakeRoot);
    try {
      const stack: string[] = [absRoot];
      while (stack.length) {
        const dir = stack.pop()!;
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, e.name);
          if (e.isDirectory()) stack.push(full);
          else if (e.isFile() && e.name.endsWith(".lean")) out.push(full);
        }
      }
    } catch {
      /* Lake root missing — skip this package */
    }
  }
  return out;
}

// ── Block discovery ─────────────────────────────────────────────

export interface BlockPaths {
  /** Block label (e.g. `def:carbon-valence`). Read from the .ts file. */
  label: string;
  /** Block kind (`definition`, `proposition`, `remark`, …). */
  kind: string;
  /** Root name shared by all sibling files (e.g. `carbon-valence`). */
  root: string;
  /** Absolute paths to present sibling files. */
  ts: string;
  md?: string;
  lean?: string;
  qa?: string;
}

/**
 * Read `export default <kind>({ ... label: "...", ... })` from a .ts
 * manifest. Returns the block's kind + label, or `undefined` if the
 * file is not a single-block manifest (chapter, paper, etc.).
 *
 * Robust to surrounding fields; uses naive regex (no TypeScript
 * loader needed for this scan).
 */
export function readBlockManifest(
  tsPath: string,
): { kind: string; label: string } | undefined {
  if (!existsSync(tsPath)) return undefined;
  const src = readFileSync(tsPath, "utf-8");
  const kindMatch = src.match(
    /export\s+default\s+(definition|theorem|lemma|proposition|corollary|conjecture|example|remark|proof|prose|equation|diagram|simulator)\s*\(/,
  );
  if (!kindMatch) return undefined;
  const labelMatch = src.match(/\blabel\s*:\s*"([^"]+)"/);
  if (!labelMatch) return undefined;
  return { kind: kindMatch[1], label: labelMatch[1] };
}

/**
 * Walk a content directory (recursively) and yield every block
 * triple. Skips chapter manifests, paper manifests, and any .ts
 * file that is not a single-block manifest.
 */
export function* walkBlocks(rootDir: string): Generator<BlockPaths> {
  // When a block's sibling `<root>.lean` is missing but its `lean.ref`
  // URI points at a file in the package's Lake tree (the cluster-
  // migration pattern, e.g. lean/QOU/BraidKnot/MarkovAxiomsPrimitive.lean),
  // fall back to the canonical resolver so qa-checkers that consume the
  // .lean source (wall-side, voice, q-usage, …) don't silently skip.
  // `resolveCanonicalLean` is the single source of truth for that walk;
  // a shared cache scans each Lake tree once across the whole block walk.
  // The Lake tree lives in the CONTENT repo (e.g. qou/content/**/lean), not
  // the folio-assistant tree this pipeline lives in — resolve against the
  // content-repo root (findContentRepoRoot), else `resolve(import.meta.dir,
  // "../..")` lands in folio-assistant and library-only blocks (no sibling
  // .lean) resolve to `undefined`, silently skipping every checker that reads
  // the .lean (wall-side, compute-prop-has-probe/-consumer, voice, q-usage).
  const REPO_ROOT = findContentRepoRoot();
  const lakeCache: LakeTreeCache = new Map();

  function* recurse(d: string): Generator<BlockPaths> {
    if (!existsSync(d)) return;
    for (const entry of readdirSync(d)) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "lean")
        continue;
      const full = join(d, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        yield* recurse(full);
      } else if (entry.endsWith(".ts")) {
        // Skip chapter / paper manifests by checking the export shape.
        const manifest = readBlockManifest(full);
        if (!manifest) continue;
        const root = full.slice(0, -3); // strip ".ts"
        const md = root + ".md";
        const lean = root + ".lean";
        const qa = root + ".qa.json";
        let leanResolved: string | undefined = existsSync(lean) ? lean : undefined;
        if (!leanResolved) {
          // Parse the .ts source for a lean.ref URI and try Lake-tree
          // resolution.  Manifest is already loaded; extract the URI
          // via a regex over the raw file (mirrors q-usage-audit).
          const tsSrc = readFileSync(full, "utf-8");
          const refMatch = tsSrc.match(/ref:\s*["']([^"']+)["']/);
          leanResolved = resolveCanonicalLean(refMatch?.[1], REPO_ROOT, lakeCache);
        }
        yield {
          label: manifest.label,
          kind: manifest.kind,
          root,
          ts: full,
          md: existsSync(md) ? md : undefined,
          lean: leanResolved,
          qa: existsSync(qa) ? qa : undefined,
        };
      }
    }
  }
  yield* recurse(rootDir);
}

// ── QA report IO ────────────────────────────────────────────────

export function loadQaReport(path: string): BlockQaReport | undefined {
  if (!existsSync(path)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(path, "utf-8"));
    if (raw?.$schema !== "block-qa/v1") return undefined;
    return raw as BlockQaReport;
  } catch {
    return undefined;
  }
}

export function saveQaReport(path: string, report: BlockQaReport): void {
  writeFileSync(path, JSON.stringify(report, null, 2) + "\n");
}

// ── Staleness check ─────────────────────────────────────────────

/**
 * A criterion entry is "fresh" iff every file the criterion depends
 * on has the same current hash as the entry's field_hash. Otherwise
 * the entry is stale (the source files have changed since the audit).
 *
 * An `n/a` entry is fresh iff the not-applicable condition still
 * holds: the file the entry was missing is still missing AND the
 * files the entry DID see have not changed.
 */
export function entryIsFresh(
  entry: QaCriterionEntry,
  current: QaFieldHash,
  depends_on: Array<"md" | "ts" | "lean">,
  current_script_hashes?: CriterionScriptHashes,
): boolean {
  // Uniform rule for every result kind: a file the criterion
  // depends on is "stable" iff (a) it was absent at audit AND is
  // absent now (the criterion's lean-side / md-side did not apply
  // then and still does not), OR (b) the hashes match.
  for (const k of depends_on) {
    const expected = entry.field_hash[k];
    const actual = current[k];
    if (!expected && !actual) continue; // both absent — still inapplicable
    if (!expected && actual) return false; // file appeared since audit
    if (expected && !actual) return false; // file removed since audit
    if (expected !== actual) return false; // file changed since audit
  }
  // Script-side staleness — only applies to `kind: "script"` entries
  // that were written by a sweep aware of the script-hash convention.
  // Legacy entries lacking these fields are treated as fresh: missing
  // metadata is not an invalidation signal.
  if (entry.reviewer.kind === "script" && current_script_hashes) {
    if (
      entry.reviewer.script_hash &&
      current_script_hashes.script_hash &&
      entry.reviewer.script_hash !== current_script_hashes.script_hash
    ) {
      return false; // checker source file changed
    }
    const recordedDepsHash = entry.reviewer.deps_hash;
    const currentDepsHash = current_script_hashes.deps_hash;
    if (
      recordedDepsHash &&
      currentDepsHash &&
      recordedDepsHash !== currentDepsHash
    ) {
      return false; // one of the extra inputs changed
    }
    // Asymmetry case: entry never recorded deps_hash but the
    // current criterion now declares extra_inputs. Treat as stale —
    // the new dep declaration must propagate.
    if (!recordedDepsHash && currentDepsHash) return false;
  }
  return true;
}

/**
 * Entries a script sweep must NOT drop when it re-runs a criterion.
 *
 * A script re-run is a REFRESH, not a new opinion: it must REPLACE the
 * prior `kind: "script"` entry rather than append a duplicate. So when
 * a sweep writes a fresh script entry it keeps only the non-script
 * entries — `kind: "agent"` (the multi-reviewer audit trail across
 * agent passes is meaningful and co-exists) and `kind: "human"` (final
 * authority; never dropped) — and appends the one fresh script entry.
 *
 * Filtering the stale script entry here is what keeps `<block>.qa.json`
 * criterion arrays from growing unboundedly on every sweep. This mirrors
 * the invalidation contract in the `integration-audit` skill ("Pure
 * script: delete every `kind:"script"` reviewer entry; sweep re-runs" /
 * "Human: always preserved").
 */
export function preserveNonScriptEntries(
  existing: QaCriterionEntry[],
): QaCriterionEntry[] {
  // Optional chaining guards against malformed / legacy / hand-edited
  // sidecar entries (a null entry, or one missing its `reviewer`): the
  // `.qa.json` files are external JSON that `loadQaReport` does not
  // shape-validate. Such an entry is NOT a recognizable script entry, so
  // it is PRESERVED rather than dropped — dropping a malformed `human`
  // entry would violate the "human always preserved" invariant above.
  return existing.filter((e) => e?.reviewer?.kind !== "script");
}

/**
 * Per-criterion freshness summary for one block.
 *
 * - `fresh-entries`: reviewer entries whose field_hash matches.
 * - `stale-entries`: reviewer entries whose field_hash does not match.
 * - `most_recent`: the newest entry (by reviewed_at), regardless of
 *   freshness; used by the watcher to surface "last result was X but
 *   it's stale" diagnostics.
 */
export interface CriterionFreshness {
  criterion: string;
  fresh_entries: QaCriterionEntry[];
  stale_entries: QaCriterionEntry[];
  most_recent?: QaCriterionEntry;
  is_fresh: boolean;
}

export function summariseFreshness(
  report: BlockQaReport,
  current: QaFieldHash,
  scriptHashesByCriterion?: Record<string, CriterionScriptHashes>,
): CriterionFreshness[] {
  const out: CriterionFreshness[] = [];
  for (const [criterion, entries] of Object.entries(report.criteria)) {
    const def = QA_CRITERIA_BY_ID[criterion];
    const dependsOn = def?.depends_on ?? ["md"];
    const sh = scriptHashesByCriterion?.[criterion];
    const fresh: QaCriterionEntry[] = [];
    const stale: QaCriterionEntry[] = [];
    for (const e of entries) {
      if (entryIsFresh(e, current, dependsOn, sh)) fresh.push(e);
      else stale.push(e);
    }
    const sorted = [...entries].sort((a, b) =>
      b.reviewed_at.localeCompare(a.reviewed_at),
    );
    out.push({
      criterion,
      fresh_entries: fresh,
      stale_entries: stale,
      most_recent: sorted[0],
      is_fresh: fresh.length > 0,
    });
  }
  return out;
}

// ── Script sidecar IO ──────────────────────────────────────────

/**
 * Repo-relative directory where per-criterion script sidecars live.
 * One file per automated criterion: `<criterion-id>.script.json`.
 */
export const SCRIPT_SIDECAR_DIR = "content/pipeline/script-sidecars";

/**
 * Resolve a criterion's script-sidecar path. `repoRoot` should be
 * the absolute path to the repo root; the sidecar lives under
 * `<repoRoot>/content/pipeline/script-sidecars/<id>.script.json`.
 */
export function scriptSidecarPath(
  criterionId: string,
  repoRoot: string = process.cwd(),
): string {
  return join(repoRoot, SCRIPT_SIDECAR_DIR, `${criterionId}.script.json`);
}

/** Load a script sidecar by criterion id; returns undefined if absent. */
export function loadQaScriptSidecar(
  criterionId: string,
  repoRoot: string = process.cwd(),
): QaScriptSidecar | undefined {
  const p = scriptSidecarPath(criterionId, repoRoot);
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as QaScriptSidecar;
  } catch {
    return undefined;
  }
}

/** Write a script sidecar; deterministic JSON formatting. */
export function saveQaScriptSidecar(
  sidecar: QaScriptSidecar,
  repoRoot: string = process.cwd(),
): void {
  const p = scriptSidecarPath(sidecar.criterion_id, repoRoot);
  // Use `dirname(p)` (not `join(p, "..")`) — the latter happens to
  // normalise to the parent on POSIX but reads as "go up from this
  // FILE", which is semantically wrong. `dirname` is the standard
  // idiom and tools that statically interpret paths don't see a
  // bogus directory entry.
  // Native `mkdirSync({ recursive: true })` rather than shelling out
  // to `mkdir -p` — avoids shell escaping issues if a criterion id
  // ever contains unusual characters, and is faster.
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(sidecar, null, 2) + "\n");
}
