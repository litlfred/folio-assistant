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
import { criterionSourceHash } from "./qa-criterion-hash";
import { maskStringsAndComments, parseStringField } from "./uses-field";
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
  CompanionRole,
} from "../../schemas/block-qa";
import { COMPANION_ROLES } from "../../schemas/block-qa";
import { ALL_BLOCK_BUILDER_ALT, kindForBuilder } from "../../schemas/block-kinds";
import { QA_CRITERIA_BY_ID } from "./qa-criteria-registry";
import { leanStatementHash } from "./lean-signature";
import { findContentRepoRoot } from "./repo-root";
import { loadBlockModuleSync, type BlockLoadFailure } from "./block-module";

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

/**
 * Build a companion hash bundle, omitting absent files.
 *
 * Accepts any {@link CompanionRole}, not just the paper adapter's
 * `md`/`ts`/`lean` — a WHO L2 block hashes its `.dmn`, an L3 block its
 * `.fsh`. Roles the caller does not pass are simply absent, so every
 * existing `{md, ts, lean}` call site is unchanged.
 */
export function hashBlockFiles(
  paths: Partial<Record<CompanionRole, string>>,
): QaFieldHash {
  const out: QaFieldHash = {};
  for (const role of COMPANION_ROLES) {
    if (role === "lean") continue; // handled below — it also derives a statement hash
    const p = paths[role];
    if (!p) continue;
    const h = hashFile(p);
    if (h) out[role] = h;
  }
  if (paths.lean) {
    const h = hashFile(paths.lean);
    if (h) out.lean = h;
    // Statement-level hash for criteria that only read the signature
    // (`lean_granularity: "statement"`). `undefined` when the file has
    // no lexable declarations — freshness then falls back to `lean`,
    // which over-invalidates rather than under.
    const sh = leanStatementHash(paths.lean);
    if (sh) out.lean_statement = sh;
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
export function gitHeadSha(repoRoot?: string): string {
  try {
    // `repoRoot` matters once the pipeline is run from a DIFFERENT repo
    // than the one being described. Without `-C`, this reads
    // `process.cwd()` — the content repo — which is right for a block
    // verdict's `reviewed_sha` and wrong for anything recording the
    // platform's own state.
    const args = repoRoot
      ? ["-C", repoRoot, "rev-parse", "HEAD"]
      : ["rev-parse", "HEAD"];
    return execFileSync("git", args, {
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
  /**
   * 12-char SHA-256 of the checker's own code: its dispatch entry plus the
   * transitive closure of module-local declarations it references. Falls back
   * to hashing the whole source file when that closure cannot be resolved.
   * Empty if the file is absent.
   *
   * Per-criterion rather than per-file so that editing one checker does not
   * invalidate every other criterion sharing its module — see
   * `qa-criterion-hash.ts` for why that matters.
   */
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
    // Prefer the per-criterion closure hash; fall back to the whole file when
    // the criterion cannot be located or its closure cannot be trusted. The
    // fallback over-invalidates (churn) rather than under-invalidating (stale
    // verdicts silently kept), which is the safe direction.
    script_hash:
      criterionSourceHash(absSource, criterionId) ?? hashFile(absSource) ?? "",
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
/**
 * Does `file` textually declare a top-level `name` (theorem/def/…)?
 *
 * Used to reject the **import-only aggregator** trap: a ref like
 * `qou:QOU.BraidKnot.foo` has module `QOU.BraidKnot`, whose direct
 * module-path `QOU/BraidKnot.lean` is an `import …`-only aggregator that
 * declares nothing. Candidate (a) must not return it — the decl `foo`
 * lives in a leaf file under `QOU/BraidKnot/`. Lenient (comment-blind) on
 * purpose: it only *gates* candidate (a), and a false positive there is no
 * worse than the pre-fix behaviour.
 */
/** Regex fragment listing every Lean top-level declaration keyword. */
const _DECL_KW =
  "theorem|lemma|def|abbrev|instance|structure|class|inductive|opaque|axiom";

/**
 * Does `file` declare **anything at all**, or is it an import-only aggregator?
 *
 * Used to keep the safe fallback from handing back a file that declares
 * nothing. A ref naming a decl that does not exist (e.g. `qou:QOU.Foo` when no
 * `Foo` was ever written) parses with module `QOU`, whose module-path file is
 * the library root — a list of `import` lines. Returning that made every
 * checker audit the import list and **pass**, which is strictly worse than the
 * honest `n/a` an unresolved ref produces. Measured on the qou corpus
 * 2026-08-15: 65 of 1220 blocks resolved this way (bean `qou-cu0a`).
 */
function fileDeclaresAnything(file: string): boolean {
  let body: string;
  try {
    body = readFileSync(file, "utf-8");
  } catch {
    return false;
  }
  return new RegExp(`^\\s*(?:noncomputable\\s+|private\\s+|protected\\s+)*(?:${_DECL_KW})\\s`, "mu")
    .test(body);
}

function fileDeclaresName(file: string, name: string): boolean {
  let body: string;
  try {
    body = readFileSync(file, "utf-8");
  } catch {
    return false;
  }
  const short = name.includes(".") ? name.split(".").pop()! : name;
  const esc = short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `\\b(?:theorem|lemma|def|abbrev|instance|structure|class|inductive|opaque|axiom)\\s+(?:[\\w'.\\u00C0-\\uFFFF]*\\.)?${esc}\\b`,
    "u",
  ).test(body);
}

const _DECL_RE =
  /^(?:@\[[^\]]*\]\s*)*(?:(?:private|protected|scoped|local|noncomputable|partial|unsafe|nonrec)\s+)*(?:theorem|lemma|def|abbrev|instance|structure|class|inductive|opaque|axiom)\s+([A-Za-z_À-￿][^\s:({\[⦃⟨]*)/u;
const _NS_RE = /^namespace\s+([A-Za-z_À-￿][\w'.À-￿]*)/u;
const _END_RE = /^end\b/;
const _SEC_RE = /^section\b/;
const _SHORT = "|short|";

/**
 * Walk one Lake root once, indexing **fully-qualified declaration name →
 * file** (namespace-aware). This is candidate (c): it resolves a
 * `lean.ref` whose last segment is a *declaration* name whose file
 * basename differs (e.g. `binding_isovector_mirror_from_chiral` living in
 * `BindingIsovectorChiralResidue.lean`) — the case candidates (a) and (b)
 * both miss. Unambiguous short names are also indexed under a sentinel key
 * as a looser fallback. Comment/section aware so a keyword inside `/- … -/`
 * or a `namespace … end` scope is handled correctly.
 */
function buildLakeDeclMap(absRoot: string): Map<string, string> {
  const map = new Map<string, string>();
  const short = new Map<string, string | null>();
  const files: string[] = [];
  try {
    const stack: string[] = [absRoot];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.isFile() && e.name.endsWith(".lean")) files.push(full);
      }
    }
  } catch {
    return map;
  }
  for (const file of files) {
    let body: string;
    try {
      body = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const nsStack: string[] = [];
    const openKind: ("ns" | "sec")[] = [];
    let blockDepth = 0;
    for (const rawLine of body.split("\n")) {
      // Strip block comments (`/- … -/`, nesting) and `--` line comments.
      let line = "";
      let i = 0;
      while (i < rawLine.length) {
        if (blockDepth > 0) {
          if (rawLine.startsWith("-/", i)) {
            blockDepth--;
            i += 2;
          } else if (rawLine.startsWith("/-", i)) {
            blockDepth++;
            i += 2;
          } else i++;
        } else if (rawLine.startsWith("/-", i)) {
          blockDepth++;
          i += 2;
        } else if (rawLine.startsWith("--", i)) {
          break;
        } else {
          line += rawLine[i];
          i++;
        }
      }
      const t = line.trim();
      if (!t) continue;
      let m: RegExpMatchArray | null;
      if ((m = t.match(_NS_RE))) {
        nsStack.push(m[1]);
        openKind.push("ns");
        continue;
      }
      if (_SEC_RE.test(t)) {
        openKind.push("sec");
        continue;
      }
      if (_END_RE.test(t)) {
        if (openKind.pop() === "ns") nsStack.pop();
        continue;
      }
      if ((m = t.match(_DECL_RE))) {
        const declName = m[1];
        const full = [nsStack.join("."), declName].filter(Boolean).join(".");
        if (!map.has(full)) map.set(full, file);
        const s = declName.includes(".") ? declName.split(".").pop()! : declName;
        if (!short.has(s)) short.set(s, file);
        else if (short.get(s) !== file) short.set(s, null);
      }
    }
  }
  for (const [k, v] of short) if (v && !map.has(_SHORT + k)) map.set(_SHORT + k, v);
  return map;
}

/** Fetch (or lazily build + cache) the decl-name index for a Lake root. */
function lakeDeclMap(
  absRoot: string,
  cache?: LakeTreeCache,
): Map<string, string> {
  const key = `${absRoot}|decls`;
  if (!cache) return buildLakeDeclMap(absRoot);
  let m = cache.get(key);
  if (!m) {
    m = buildLakeDeclMap(absRoot);
    cache.set(key, m);
  }
  return m;
}

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
  const lakeRootAbs = resolve(repoRoot, pkg.lakeRoot);
  // (a) Direct module-path — trust ONLY if the file actually declares the
  //     decl. This rejects the import-only aggregator (`QOU/BraidKnot.lean`)
  //     that a module-with-subdirectory shares its name with.
  const direct = resolve(
    lakeRootAbs,
    `${parsed.module.replace(/\./g, "/")}.lean`,
  );
  const directExists = existsSync(direct);
  if (directExists && fileDeclaresName(direct, parsed.name)) return direct;
  // (b) Basename fallback under the Lake tree.
  const byBasename = lakeBasenameMap(lakeRootAbs, cache).get(
    `${parsed.name}.lean`,
  );
  if (byBasename) return byBasename;
  // (c) Fully-qualified decl → file scan (decl-named ref whose file basename
  //     differs AND whose module path is an aggregator).
  const declMap = lakeDeclMap(lakeRootAbs, cache);
  const byDecl = declMap.get(parsed.decl) ?? declMap.get(_SHORT + parsed.name);
  if (byDecl) return byDecl;
  // (safe fallback) preserve legacy behaviour: a ref that resolved to the
  //   direct module-path before the (a)-gate still resolves to it, so no
  //   previously-resolving ref regresses to `undefined`.
  //
  //   EXCEPT when that file declares nothing at all. An import-only aggregator
  //   carries no statement to audit, so returning it makes every checker pass
  //   vacuously on a list of `import` lines — strictly worse than the honest
  //   `n/a` that `undefined` produces, because a false green is indistinguishable
  //   from a real one. Refs naming a decl that exists nowhere land here (module
  //   `QOU` → the library root); 65 of 1220 qou blocks did, bean `qou-cu0a`.
  //   Real single-module files still fall back exactly as before.
  if (directExists && fileDeclaresAnything(direct)) return direct;
  return undefined;
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

/**
 * Resolve every companion file present for a block stem.
 *
 * Roles the caller has already resolved (`md`, `ts`, and especially `lean`,
 * which may live in the Lake tree rather than beside the manifest) are passed
 * in and taken as-is. The rest are plain `<stem>.<role>` siblings.
 *
 * Returning a map rather than named fields is what lets `qa-sweep` gate
 * applicability by iterating a criterion's `depends_on` instead of carrying a
 * hard-coded `if` per role — which is how `.dmn` and `.fsh` blocks would
 * otherwise have fallen through to `n/a-no-md` and recorded a clean verdict
 * for an axis that never ran.
 */
/**
 * The first companion role a criterion needs and the block does not have, or
 * `undefined` when the criterion applies.
 *
 * Pure and exported so the applicability rule can be tested directly. It used
 * to be two hard-coded `if` statements inside `qa-sweep`'s block loop, keyed
 * on `.md` and `.lean` — the paper adapter's companion set. A criterion over a
 * `.dmn` decision table or a `.fsh` profile therefore had no gate, and every
 * WHO L2/L3 block took the `.md` branch and recorded a clean `n/a` for an axis
 * that never ran.
 *
 * Order matters and follows the criterion's own `depends_on` array, so the
 * reported role (and the sidecar `notes` string built from it) is stable.
 */
export function applicabilityGap(
  depends_on: readonly CompanionRole[],
  companions: Partial<Record<CompanionRole, string>>,
): CompanionRole | undefined {
  return depends_on.find((role) => !companions[role]);
}

/** The sidecar `notes` string recorded when {@link applicabilityGap} fires. */
export function missingCompanionNote(role: CompanionRole): string {
  return `block has no .${role} sibling`;
}

export function resolveCompanions(
  root: string,
  known: Partial<Record<CompanionRole, string>> = {},
): Partial<Record<CompanionRole, string>> {
  const out: Partial<Record<CompanionRole, string>> = {};
  for (const role of COMPANION_ROLES) {
    const preset = known[role];
    if (preset !== undefined) {
      out[role] = preset;
      continue;
    }
    if (role in known) continue; // explicitly resolved to absent
    const p = `${root}.${role}`;
    if (existsSync(p)) out[role] = p;
  }
  return out;
}

export interface BlockPaths {
  /** Block label (e.g. `def:carbon-valence`). Read from the .ts file. */
  label: string;
  /** Block kind (`definition`, `proposition`, `remark`, …). */
  kind: string;
  /**
   * Absolute path **stem** shared by all sibling files — the sibling paths
   * minus their extension, e.g. `/abs/path/to/carbon-valence`. Append an
   * extension to get a sibling: `` `${root}.lean` ``.
   *
   * Not a bare basename, which is what this said before ("Root name … e.g.
   * `carbon-valence`"). A caller who believed that and wrote
   * `join(dirname(b.ts), \`${b.root}.lean\`)` doubles the path and matches
   * nothing — and gets a clean `0` rather than an error, which is exactly how a
   * sibling-coverage measurement reported "0 siblings across 3486 blocks" and
   * looked plausible enough to nearly publish.
   */
  root: string;
  /** Absolute paths to present sibling files. */
  ts: string;
  md?: string;
  lean?: string;
  qa?: string;
  /**
   * Every present companion, keyed by role — the paper adapter's
   * `md`/`ts`/`lean` plus the WHO L2/L3 siblings (`bpmn`, `dmn`, `fsh`,
   * `cql`, `json`, `xlsx`).
   *
   * `md`, `ts` and `lean` are mirrored here as well as in their own fields, so
   * a caller iterating `depends_on` generically does not have to special-case
   * the three that predate the map. `lean` carries the Lake-resolved path when
   * there is no literal sibling, which is why it is copied rather than
   * re-derived from `root`.
   */
  companions: Partial<Record<CompanionRole, string>>;
}

/**
 * `export default <kind>(` for every kind in the schema's `Block` union.
 *
 * Built from `BLOCK_KINDS` rather than written out, because writing it out is
 * what went wrong: this regex listed 13 of the 15 kinds, omitting `algorithm`
 * and `table`. `readBlockManifest` returns `undefined` for an unrecognised
 * builder and `walkBlocks` skips whatever it returns `undefined` for, so on
 * the qou corpus 461 blocks — 445 `table`, 16 `algorithm` — were never
 * yielded to any QA tool. Never swept, never audited, no sidecar; ~13% of the
 * corpus, excluded by a stale list rather than by a decision.
 *
 * Container kinds (`chapter`, `paper`, `folio`) are correctly absent: they are
 * not in the `Block` union, and `readBlockManifest` is documented to reject
 * them.
 */
// Alternates over BUILDER names, not kind strings. For the paper adapter the
// two are the same token; for the `dak` adapter they are not, because a kind
// like `decision-table` is data and a hyphen is not a valid identifier — so
// the builder is `decisionTable` and `kindForBuilder` maps back. Longest-first
// ordering matters in an alternation: without it `profile` would shadow
// nothing here, but `measure` would shadow a future `measureGroup`.
const BLOCK_BUILDER_RE = new RegExp(
  `export\\s+default\\s+(${ALL_BLOCK_BUILDER_ALT})\\s*\\(`,
);

/**
 * Read `export default <kind>({ ... label: "...", ... })` from a .ts
 * manifest. Returns the block's kind + label, or `undefined` if the
 * file is not a single-block manifest (chapter, paper, etc.).
 *
 * **This detects a candidate; it does not establish identity.** Reading a
 * label out of source text is wrong in three demonstrated ways, pinned in
 * `scripts/tests/block-walk-verify.test.ts`:
 *
 * | source                          | this reads        | the block *is*   |
 * |---------------------------------|-------------------|------------------|
 * | `label: LBL` (a constant)       | `undefined` — skipped | `prop:computed` |
 * | an earlier `label:` in a helper | `not-the-block`   | `prop:real`      |
 * | `proposition({label:"theorem:x"})` | `theorem:x`    | rejected by the schema |
 *
 * The middle row is the dangerous one: not a miss but a *wrong answer*, which
 * keys a sidecar and a graph node to a label the block does not have.
 * `walkBlocks(root, { verify: true })` settles identity by loading the module
 * instead — see `loadBlockModuleSync`.
 *
 * What this stays authoritative for is **whether a file may be executed at
 * all**. A content tree holds more than manifests, and importing runs them, so
 * the masked regex below is the gate that decides what the loader is allowed to
 * touch. Keep it cheap and keep it textual.
 *
 * **Matched against a string- and comment-masked copy**, so a builder call or
 * a `label:` written inside a string literal or a comment cannot make an
 * ordinary source file look like a block manifest. Offsets are preserved by
 * masking, so the values still come from the original text.
 *
 * That is not a hypothetical: `content/pipeline/witness-substitution-audit.ts`
 * contains a self-test reading
 *
 * ```ts
 * parseWitnessList(`export default proposition({ label: "prop:x" });`)
 * ```
 *
 * and the raw scan yielded that audit script as a content block labelled
 * `prop:x`. Every per-block checker then ran on it and attributed the results
 * to a block that does not exist.
 */
export function readBlockManifest(
  tsPath: string,
): { kind: string; label: string } | undefined {
  if (!existsSync(tsPath)) return undefined;
  const src = readFileSync(tsPath, "utf-8");
  const masked = maskStringsAndComments(src);
  const kindMatch = masked.match(BLOCK_BUILDER_RE);
  if (!kindMatch) return undefined;
  const label = parseStringField(src, "label");
  if (!label) return undefined;
  // The regex captures a BUILDER name; the block's kind is what it builds.
  // Identical for paper kinds, different for every multi-word DAK kind.
  const kind = kindForBuilder(kindMatch[1]!);
  if (!kind) return undefined;
  return { kind, label };
}

/**
 * Walk a content directory (recursively) and yield every block
 * triple. Skips chapter manifests, paper manifests, and any .ts
 * file that is not a single-block manifest.
 */
/**
 * A block manifest that declares a builder but **no `label:`** — `prose()`
 * connective tissue. Returns its kind plus the file's slug standing in for the
 * label; `undefined` when the file is not a block manifest at all, or when it
 * does have a label (use `readBlockManifest` for those).
 *
 * The slug is what the corpus's existing sidecars for these blocks already key
 * on, so this adopts the convention rather than minting a second one.
 *
 * Masked like `readBlockManifest`, so a builder call inside a string or comment
 * still does not qualify — the fix in `#125` must not be undone by the looser
 * path being added beside it.
 */
export function readUnlabelledBlockManifest(
  tsPath: string,
): { kind: string; label: string } | undefined {
  if (!existsSync(tsPath)) return undefined;
  const src = readFileSync(tsPath, "utf-8");
  if (parseStringField(src, "label")) return undefined; // labelled: not ours
  const kindMatch = maskStringsAndComments(src).match(BLOCK_BUILDER_RE);
  if (!kindMatch) return undefined;
  const slug = tsPath.split("/").pop()!.replace(/\.ts$/, "");
  const kind = kindForBuilder(kindMatch[1]!);
  if (!kind) return undefined;
  return { kind, label: slug };
}

export interface WalkBlocksOptions {
  /**
   * Also yield blocks that declare **no `label:`** — `prose()` connective
   * tissue (chapter intros and outros, author's notes, the notation register).
   *
   * Default `false`, which is right for the **dependency graph**: a block with
   * no label cannot be a node, and nothing can reference it.
   *
   * It is wrong for **QA**. `walkBlocks` is not only the graph's enumeration,
   * it is every checker's, and 63 such blocks in the `qou` corpus render into
   * the paper carrying 27,390 words that no criterion could reach. They already
   * hold `.qa.json` sidecars — written by a one-off bulk pass that enumerated
   * differently — which `qa-sweep` could never refresh, so a stale sidecar and
   * a current one were indistinguishable. See `qou/3fui`.
   *
   * Unlabelled blocks are yielded with their **slug** as `label`, which is the
   * identity the existing sidecars already use; this adopts a convention rather
   * than inventing one.
   */
  includeUnlabelled?: boolean;

  /**
   * Settle each block's `kind` and `label` by **importing** it, instead of
   * reading them out of its source text.
   *
   * The textual read is wrong in three ways `readBlockManifest` now documents,
   * and the middle one returns a confidently wrong label rather than nothing.
   * Importing runs the builder, so what comes back is the block the rest of the
   * pipeline sees, validated against the schema.
   *
   * `readBlockManifest` still decides *which* files are candidates — importing
   * executes a module, and a content tree holds scripts as well as manifests
   * (`qa-agent-drain-queue.ts` starts a sweep at import time). Verification
   * upgrades identity; it does not widen what gets executed.
   *
   * **Default `true`, on measured evidence.** This repo has twice learned that
   * changing what the walk enumerates must be measured against real content
   * before it lands — `#125` admitted a non-block, `qou/3fui` missed 63 real
   * ones and the measurement reversed the recommendation the change had been
   * argued on. So `verify-block-walk.ts` was written first and run against the
   * `qou` corpus, all 3557 blocks:
   *
   *     textual walk : 3557 blocks in  493 ms
   *     verified walk: 3557 blocks in 1473 ms
   *     identity differences 0 · found by only one mode 0 · failed to import 0
   *
   * A second of wall-clock, and nothing else about that corpus moves. What it
   * buys is the three failure classes above becoming impossible rather than
   * merely absent-so-far. Measured on **one** corpus; `verify: false` is the
   * escape hatch, and re-run that command on any other folio before relying on
   * the default there.
   *
   * The one new coupling: importing a block resolves its imports, and a folio's
   * blocks import the platform through a symlink its setup script creates
   * (`<folio>/folio-assistant`). Without it every block fails to load — the
   * walk still yields all of them under their textual identity, and says so.
   */
  verify?: boolean;

  /**
   * Where a block that fails to import is reported.
   *
   * A block that throws is a *finding*, not a file to pass over — that is how a
   * sweep reports clean by looking at nothing. Omit this and failures go to
   * stderr, once per file. Either way the block is still yielded, carrying its
   * degraded textual identity: dropping it would trade a loud problem for a
   * silent coverage hole, which is the `qou/3fui` mistake in reverse.
   */
  onLoadFailure?: (failure: BlockLoadFailure) => void;
}

export function* walkBlocks(
  rootDir: string,
  opts: WalkBlocksOptions = {},
): Generator<BlockPaths> {
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
  const verify = opts.verify ?? true;
  const report = makeFailureReporter(opts);

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
        // Skip chapter / paper manifests by checking the export shape. The
        // masked builder-call match is the gate on what may be *executed*
        // below; the label is a question about identity, answered after.
        const textual = readBlockManifest(full);
        // Reading the unlabelled shape costs a second read + mask, so only pay
        // it when someone can act on the answer.
        const unlabelled =
          textual || !(verify || opts.includeUnlabelled)
            ? undefined
            : readUnlabelledBlockManifest(full);
        if (!textual && !unlabelled) continue; // not a block manifest at all
        const manifest = verify
          ? verifiedManifest(full, textual, unlabelled, report)
          : textualIdentity(textual, unlabelled);
        if (!manifest) continue;
        if (!manifest.labelled && !opts.includeUnlabelled) continue;
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
        const mdResolved = existsSync(md) ? md : undefined;
        yield {
          label: manifest.label,
          kind: manifest.kind,
          root,
          ts: full,
          md: mdResolved,
          lean: leanResolved,
          qa: existsSync(qa) ? qa : undefined,
          companions: resolveCompanions(root, {
            ts: full,
            md: mdResolved,
            lean: leanResolved,
          }),
        };
      }
    }
  }
  yield* recurse(rootDir);
}

type TextualManifest = { kind: string; label: string };
/**
 * `labelled` records whether the block has a real `label:` — which only the
 * module can settle — as opposed to standing in under its slug. `walkBlocks`
 * needs the distinction *after* verification, because a computed label makes a
 * block labelled even though its source text does not say so.
 */
type VerifiedManifest = TextualManifest & { labelled: boolean };

/** The reading `walkBlocks` has always used: whatever the source text says. */
function textualIdentity(
  textual: TextualManifest | undefined,
  unlabelled: TextualManifest | undefined,
): VerifiedManifest | undefined {
  if (textual) return { ...textual, labelled: true };
  if (unlabelled) return { ...unlabelled, labelled: false };
  return undefined;
}

/**
 * Replace a textually-read `{ kind, label }` with the one the module actually
 * exports.
 *
 * On a throw the textual reading is kept and the failure reported: the block
 * stays in the walk (so no criterion silently stops covering it) while the
 * reason it could not be verified is visible. A `undefined` return from the
 * loader means the default export is not a block after all — the candidate gate
 * was fooled — which is likewise reported rather than silently dropped.
 */
function verifiedManifest(
  tsPath: string,
  textual: TextualManifest | undefined,
  unlabelled: TextualManifest | undefined,
  report: FailureReporter,
): VerifiedManifest | undefined {
  const degraded = () => textualIdentity(textual, unlabelled);
  try {
    const loaded = loadBlockModuleSync(tsPath);
    // A label the module actually carries. This is the only reading that can
    // be trusted, and it is how a computed `label:` — invisible to the regex —
    // becomes a labelled block rather than being skipped or mistaken for prose.
    if (loaded) return { kind: loaded.kind, label: loaded.label, labelled: true };
  } catch (e) {
    report(tsPath, String(e).replace(/\s+/g, " ").slice(0, 300));
    return degraded();
  }
  // The loader found no labelled block. When the source had no textual label
  // either, that agrees with `prose()` connective tissue and its slug identity
  // stands. When the source *did* carry a label, the candidate gate was fooled
  // by a file whose default export is not a block — a finding.
  if (unlabelled) return { ...unlabelled, labelled: false };
  report(
    tsPath,
    `default export is not a labelled block, but the source looks like a ` +
      `manifest (read textually as ${textual?.kind} ${textual?.label})`,
  );
  return degraded();
}

/**
 * How many unloadable files are named before the rest are only counted.
 *
 * When a folio is checked out without its `folio-assistant` symlink, *every*
 * block fails for the same reason — measured: 3557 of 3557 on `qou`. Naming
 * them one by one buries the single line that says what to fix under three and
 * a half thousand that do not, so the enumeration stops and the tail is
 * summarised.
 */
const MAX_NAMED_LOAD_FAILURES = 5;

type FailureReporter = (file: string, error: string) => void;

/**
 * One reporter per walk, **not** one per process.
 *
 * A process runs several walks — `qa-sweep` calls `usesGraphHash` before its
 * own — and a budget shared across them means the second walk's genuine
 * failures are swallowed by the first walk's having spent it. Scoping the
 * counter to the walk keeps each one's report complete on its own terms.
 */
function makeFailureReporter(opts: WalkBlocksOptions): FailureReporter {
  const sink = opts.onLoadFailure;
  if (sink) return (file, error) => sink({ file, error });
  const seen = new Set<string>();
  return (file, error) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (seen.size <= MAX_NAMED_LOAD_FAILURES) {
      console.warn(
        `  ⚠ ${file} could not be loaded; using its source text for kind/label.\n` +
          `      ${error}`,
      );
    } else if (seen.size === MAX_NAMED_LOAD_FAILURES + 1) {
      console.warn(
        `  ⚠ …and more blocks that would not load. Every one is walked under its\n` +
          `      source-text identity, so nothing is skipped — but none of them was\n` +
          `      verified. If this is the whole corpus, the cause is usually a folio\n` +
          `      checked out without its platform symlink (<folio>/folio-assistant).\n` +
          `      Run: bun run content/pipeline/verify-block-walk.ts <content-root>`,
      );
    }
  };
}

// ── QA report IO ────────────────────────────────────────────────

/** Paths already warned about, so a sweep reports each file once. */
const warnedSidecars = new Set<string>();

export function loadQaReport(path: string): BlockQaReport | undefined {
  if (!existsSync(path)) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf-8"));
  } catch (err) {
    // A corrupt sidecar used to return `undefined` — the same answer as a file
    // that does not exist. Callers treat that as "no QA has ever been done"
    // and `qa-sweep` bootstraps a fresh report over the top of it, so a stray
    // edit could destroy a block's recorded history without a word. Say so.
    if (!warnedSidecars.has(path)) {
      warnedSidecars.add(path);
      console.error(
        `qa: sidecar is not valid JSON, ignoring: ${path}\n` +
          `    ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return undefined;
  }
  try {
    const rec = raw as Record<string, unknown>;
    if (rec?.$schema !== "block-qa/v1") {
      // The marker was introduced after some sidecars were written. Rejecting
      // an unmarked file outright discarded real recorded state: 32 sidecars
      // in the qou corpus carry 315 criterion entries between them and were
      // invisible to every reader. Worse, once their blocks became reachable
      // again, the next sweep would have bootstrapped empty reports over them.
      //
      // Accept on SHAPE instead — a `criteria` object is what block-qa/v1 is —
      // and say the marker is missing so it gets added. Anything else (a
      // paper-level `section-title-audit.qa.json` is `{criterion, paper,
      // chapters}`) is genuinely not this schema and is still rejected.
      if (!rec || typeof rec.criteria !== "object" || rec.criteria === null) {
        return undefined;
      }
      if (!warnedSidecars.has(path)) {
        warnedSidecars.add(path);
        console.error(`qa: sidecar missing '$schema: "block-qa/v1"', reading anyway: ${path}`);
      }
      rec.$schema = "block-qa/v1";
    }
    // Normalize malformed criterion values at the IO boundary: some
    // agent-written sidecars carry a bare entry OBJECT where block-qa/v1
    // requires a single-entry ARRAY (observed corpus-wide in qou on
    // 2026-07-12: 83 sidecars × 13 `da-*` criteria). Downstream code
    // (entryIsFresh iteration, preserveNonScriptEntries) assumes arrays
    // and crashed with `existing.filter is not a function`. Wrapping here
    // preserves the entry verbatim; any other non-array shape (string,
    // number, null) is dropped as unrecoverable.
    const criteria = rec.criteria as Record<string, unknown> | undefined;
    if (criteria && typeof criteria === "object") {
      for (const [id, value] of Object.entries(criteria)) {
        if (Array.isArray(value)) continue;
        if (value && typeof value === "object") criteria[id] = [value];
        else delete criteria[id];
      }
    }
    return rec as unknown as BlockQaReport;
  } catch {
    return undefined;
  }
}

export function saveQaReport(path: string, report: BlockQaReport): void {
  writeFileSync(path, JSON.stringify(report, null, 2) + "\n");
}

// ── Staleness check ─────────────────────────────────────────────

/**
 * The files whose hashes invalidate a cached verdict for `def`:
 * `depends_on` (which also gates applicability) UNION
 * `also_invalidated_by` (which does not).
 *
 * Always use this — not `depends_on` alone — when computing freshness.
 * A criterion that reads a file it cannot list in `depends_on` (because
 * doing so would `n/a` the blocks it exists to check) is otherwise
 * unable to clear its own stale verdict when that file is the only
 * thing that changed.
 */
export function freshnessKeys(def: {
  depends_on: CompanionRole[];
  also_invalidated_by?: Array<CompanionRole | "graph">;
}): Array<CompanionRole | "graph"> {
  return [...new Set([...def.depends_on, ...(def.also_invalidated_by ?? [])])];
}

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
  depends_on: Array<CompanionRole | "graph">,
  current_script_hashes?: CriterionScriptHashes,
  lean_granularity?: "file" | "statement",
): boolean {
  // Uniform rule for every result kind: a file the criterion
  // depends on is "stable" iff (a) it was absent at audit AND is
  // absent now (the criterion's lean-side / md-side did not apply
  // then and still does not), OR (b) the hashes match.
  for (const k of depends_on) {
    // Legacy / older-schema entries (e.g. agent-authored `n/a` verdicts
    // written before the per-entry field_hash convention) may lack
    // `field_hash` entirely. Optional-chain so a missing hash is treated
    // as "not verifiable ⇒ stale": any currently-present depended-on file
    // then trips the `!expected && actual` branch below (re-review), and
    // the sweep no longer crashes with `undefined is not an object`.
    // Statement-granularity criteria compare the SIGNATURE hash, so a
    // proof-body rewrite leaves them fresh. Falls back to the
    // whole-file hash whenever either side lacks a statement hash —
    // an unlexable file, or an entry written before this field existed.
    // That fallback over-invalidates, which is the safe direction: the
    // alternative is presenting a stale verdict as current.
    const useStatement =
      k === "lean" &&
      lean_granularity === "statement" &&
      entry.field_hash?.lean_statement !== undefined &&
      current.lean_statement !== undefined;
    const key: keyof QaFieldHash = useStatement ? "lean_statement" : k;
    const expected = entry.field_hash?.[key];
    const actual = current[key];
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
 * Does a freshly-computed script entry say the same thing as the one already
 * recorded?
 *
 * Compares everything that carries meaning — verdict, the input hashes it was
 * computed from, the reviewer identity and its script/deps hashes, and the
 * checker's own output (notes, evidence, metrics, severity) — while ignoring
 * `reviewed_at` and `reviewed_sha`, which say only WHEN the sweep last ran.
 *
 * Callers use this to keep the existing entry verbatim when a re-run reproduces
 * it, so re-running a checker is not by itself a change to the sidecar. That
 * matters because some criteria are deliberately re-evaluated on every sweep
 * (an `n/a` whose `depends_on` is now satisfied must be re-checked in case it
 * became applicable); without this, each such re-check restamped the entry and
 * dirtied the file forever.
 *
 * `reviewed_sha` is deliberately NOT refreshed on an unchanged verdict: the
 * matching `field_hash` already proves the inputs are identical, so the older
 * sha remains a truthful record of when the verdict was established.
 *
 * `script_commit_sha` is excluded for the same reason. It is a FILE-level
 * pointer — the last commit to touch the checker module — so it moves when a
 * neighbouring criterion is edited, and comparing it would reintroduce exactly
 * the file-level coupling that per-criterion `script_hash` exists to remove.
 * `script_hash` is the field that actually answers "did this criterion's code
 * change", and it IS compared.
 */
export function sameScriptVerdict(
  a: QaCriterionEntry | undefined,
  b: QaCriterionEntry,
): boolean {
  if (!a) return false;
  const shape = (e: QaCriterionEntry) => ({
    result: e.result,
    field_hash: e.field_hash,
    notes: e.notes,
    evidence: e.evidence,
    metrics: e.metrics,
    severity: e.severity,
    reviewer: {
      kind: e.reviewer?.kind,
      id: e.reviewer?.id,
      version: e.reviewer?.version,
      script_hash: e.reviewer?.script_hash,
      deps_hash: e.reviewer?.deps_hash,
    },
  });
  return JSON.stringify(shape(a)) === JSON.stringify(shape(b));
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
    const dependsOn = def ? freshnessKeys(def) : (["md"] as CompanionRole[]);
    const sh = scriptHashesByCriterion?.[criterion];
    const fresh: QaCriterionEntry[] = [];
    const stale: QaCriterionEntry[] = [];
    for (const e of entries) {
      if (entryIsFresh(e, current, dependsOn, sh, def?.lean_granularity)) fresh.push(e);
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
  // Skip the write when nothing SUBSTANTIVE changed.
  //
  // `last_run_at` is a fresh timestamp on every sweep, so an unconditional
  // write dirtied every script sidecar in this repo each time any consumer
  // ran a sweep — 76 modified files after one qou run, none of them a real
  // change. That churn is not free: it is indistinguishable, in `git
  // status`, from an actual checker-hash movement.
  //
  // Everything except the two `last_run_*` fields is content-derived, so
  // comparing on those alone is the right test: identical hashes mean the
  // recorded state is already accurate and the timestamp adds nothing.
  const prev = loadQaScriptSidecar(sidecar.criterion_id, repoRoot);
  if (
    prev &&
    prev.source_file === sidecar.source_file &&
    prev.script_hash === sidecar.script_hash &&
    prev.script_commit_sha === sidecar.script_commit_sha &&
    prev.deps_hash === sidecar.deps_hash &&
    prev.engine_version === sidecar.engine_version &&
    JSON.stringify(prev.extra_inputs ?? []) ===
      JSON.stringify(sidecar.extra_inputs ?? [])
  ) {
    return;
  }
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
