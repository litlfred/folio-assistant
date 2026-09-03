#!/usr/bin/env bun
/**
 * Q-usage audit — walk every content block under
 * `content/quantum-observable-universe/`, run the seven q-usage
 * criteria, and emit (a) per-block `<block>.qa.json` entries, and
 * (b) a global witness summary.
 *
 * Usage:
 *
 *   bun run content/pipeline/q-usage-audit.ts                 # default
 *   bun run content/pipeline/q-usage-audit.ts --no-write      # report only
 *   bun run content/pipeline/q-usage-audit.ts --strict        # exit 1 on fail
 *   bun run content/pipeline/q-usage-audit.ts --chapter <dir> # one chapter
 *   bun run content/pipeline/q-usage-audit.ts --json          # JSON report
 *
 * Output:
 *   - per-block: writes/updates `<block>.qa.json` with one entry per
 *     q-usage criterion (the regime vector lives in the `notes` field
 *     of `q-usage-regime-detected`).
 *   - global witness: `docs/audits/<YYYY-MM-DD>-q-usage-audit.witness.json`
 *     summarising fails/warns by chapter + criterion.
 *
 * @module content/pipeline/q-usage-audit
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Q_USAGE_AUTOMATED_CHECKERS,
  Q_USAGE_CRITERION_IDS,
  CHAPTER_EXPECTED_REGIMES,
  chapterFromPath,
  detectRegimes,
  checkQUsagePositivityImplicit,
  type QUsageResult,
} from "./qa-checkers-q-usage.ts";
import { checkWallSide, checkBaseRingMinimal } from "./qa-checkers-voice.ts";
// Single source of truth for block discovery + candidate-1→candidate-2
// `lean.ref` resolution + library-tree enumeration. q-usage-audit MUST
// NOT reimplement these (it used to carry a private copy — removed so the
// resolution logic can never drift from qa-sweep / qa-utils).
import {
  walkBlocks as utilWalkBlocks,
  listPackageLeanFiles,
} from "./qa-utils.ts";
// Shared content-root + paper discovery. The pipeline lives in
// folio-assistant but audits a downstream content repo; deriving the root
// from this file's own location lands inside the platform tree instead.
import { findContentRepoRoot, findPapers } from "./repo-root.ts";
import { paperArg } from "./cli-args";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Root of the PLATFORM checkout (folio-assistant). Correct anchor for the
 * *checker script* hash below — `qa-checkers-q-usage.ts` genuinely lives
 * here — and for nothing else.
 */
const PLATFORM_ROOT = resolve(SCRIPT_DIR, "..", "..");

/**
 * Root of the CONTENT repo being audited.
 *
 * This used to be `resolve(SCRIPT_DIR, "..", "..")` — i.e. PLATFORM_ROOT —
 * with the paper hardcoded to `quantum-observable-universe`. That was
 * correct only while the pipeline lived inside the content repo. Once it
 * moved to folio-assistant, `<platform>/content/quantum-observable-universe`
 * stopped existing, `walkBlocks` found nothing, and the audit reported
 * "0 blocks across 0 chapters" and **exited 0** — a silent no-op that made
 * the seven `q-usage-*` criteria unrefreshable in every downstream sidecar.
 * Observed live on qou #4673.
 */
// ── CLI args ────────────────────────────────────────────────────

const args = process.argv.slice(2);
const noWrite = args.includes("--no-write");
const strict = args.includes("--strict");
const jsonReport = args.includes("--json");
const noOrphans = args.includes("--no-orphans");
const chapterFilterIdx = args.indexOf("--chapter");
const chapterFilter = chapterFilterIdx >= 0 ? args[chapterFilterIdx + 1] : undefined;
const paperFilter = paperArg(args);

/**
 * Reject anything this tool does not understand, instead of ignoring it.
 *
 * This audit is CORPUS-WIDE by design — it walks every paper and rewrites a
 * sidecar per block. Its only scoping is `--paper` / `--chapter`; there is no
 * positional interface and never has been. Silently discarding an unrecognised
 * argument therefore turns a caller who *believes* they scoped the run into a
 * caller who rewrites the whole corpus.
 *
 * That is not hypothetical. Invoked as
 *
 *     q-usage-audit.ts content/<paper>/braids-and-knots/why-b3.md
 *
 * intending to refresh ONE block, it ignored the path and modified **3,573
 * sidecars**, created untracked `.qa.json` files for blocks that had none, and
 * emitted a witness — the mass-refresh the content repo's own idle-pass policy
 * forbids ("cap ≤ 10 sidecars per pass"; "never mass-refresh"). Reverting it
 * was possible only because the tree was otherwise clean. qou bean `qou-fx71`.
 *
 * Exiting non-zero here costs a caller one error message; the alternative cost
 * a full revert.
 */
const KNOWN_FLAGS = new Set([
  "--no-write", "--strict", "--json", "--no-orphans", "--chapter", "--paper",
]);
/**
 * The flags that consume the token after them. Derived by scanning `args`
 * rather than from a per-flag index binding: the `--paper` sweep of #151
 * replaced this file's `paperFilterIdx` with `paperArg(args)` and left the
 * set below still naming it, so the module failed to load outright with
 * `ReferenceError: paperFilterIdx is not defined` — taking every
 * `q-usage-audit` invocation and its CLI test down with it.
 *
 * Re-adding a bare `indexOf` on the flag name is NOT the fix: that is exactly
 * the unguarded idiom `scripts/tests/cli-args-paper-guard.test.ts` forbids,
 * and it fails that test — which is text-based, so even naming the idiom
 * verbatim in a comment trips it. Scanning for the flag tokens gets the
 * indices without re-introducing the idiom, and handles a repeated flag.
 */
const VALUE_FLAGS = new Set(["--chapter", "--paper"]);
const flagValueIdx = new Set(
  args.flatMap((a, i) => (VALUE_FLAGS.has(a) ? [i + 1] : [])),
);
const unknownArgs = args.filter(
  (a, i) => !KNOWN_FLAGS.has(a) && !flagValueIdx.has(i),
);
if (unknownArgs.length > 0) {
  console.error(
    `q-usage-audit: unrecognised argument(s): ${unknownArgs.join(", ")}\n` +
      `\nThis audit is corpus-wide and has no positional/per-file interface.\n` +
      `Scope it with:  --paper <name>   --chapter <name>\n` +
      `Other flags:    --no-write  --strict  --json  --no-orphans\n` +
      `\nRefusing to run: a discarded scope argument would rewrite every\n` +
      `sidecar in the corpus (measured: 3,573). See qou bean qou-fx71.`,
  );
  // EX_USAGE (sysexits.h). NOT 2 -- this tool already exits 2 for "no content
  // repo found", and a caller scripting around it must be able to tell a bad
  // argument from a bad working directory.
  process.exit(64);
}

// ── Content repo discovery (AFTER args are validated) ───────────

const REPO_ROOT = findContentRepoRoot();

/**
 * Papers to audit: `--paper <name>` if given, else every paper in the
 * folio. The platform must not privilege one paper by name — a folio may
 * hold several (`findPapers` is the shared discovery used by the rest of
 * the pipeline).
 */
const PAPERS: string[] = paperFilter ? [paperFilter] : findPapers(REPO_ROOT);
const PAPER_ROOTS: string[] = PAPERS.map((p) => join(REPO_ROOT, "content", p));

// ── Walk block files ────────────────────────────────────────────

interface BlockTriple {
  label: string;
  kind: string;
  chapter: string;
  ts: string;
  md?: string;
  lean?: string;
}

/**
 * Discover every content block under each paper root via the shared
 * `qa-utils.walkBlocks` — the single source of truth for block discovery
 * AND candidate-1 (sibling) → candidate-2 (library/Lake tree) `lean.ref`
 * resolution. The owning chapter is read from the block's `.ts` path, NOT
 * from the resolved Lean file's directory, so the regime profile stays
 * content-based (CLAUDE.md §7c — never infer the regime from the
 * lean-tree directory name).
 */
function walkBlocks(): BlockTriple[] {
  const out: BlockTriple[] = [];
  for (const b of PAPER_ROOTS.flatMap((r) => [...utilWalkBlocks(r)])) {
    const chapter = chapterFromPath(b.ts) ?? "";
    if (chapterFilter && chapter !== chapterFilter) continue;
    out.push({
      label: b.label,
      kind: b.kind,
      chapter,
      ts: b.ts,
      md: b.md,
      lean: b.lean,
    });
  }
  return out;
}

function hashFile(path: string): string {
  if (!existsSync(path)) return "";
  return createHash("sha256")
    .update(readFileSync(path))
    .digest("hex")
    .slice(0, 12);
}

// ── Sidecar I/O ─────────────────────────────────────────────────

interface QaEntry {
  field_hash: { md?: string; ts?: string; lean?: string };
  result: "pass" | "fail" | "warn" | "n/a";
  severity?: "critical" | "major" | "minor";
  evidence?: string;
  reviewer: {
    kind: "script";
    id: string;
    script_hash?: string;
  };
  reviewed_at: string;
  /**
   * Repo HEAD SHA at audit time — required by block-qa/v1 schema
   * (#1640-Copilot @ q-usage-audit.ts:141).
   */
  reviewed_sha: string;
  notes?: string;
}

interface QaSidecar {
  $schema: "block-qa/v1";
  label: string;
  kind: string;
  paths: { ts: string; md?: string; lean?: string };
  source_hashes: { md?: string; ts?: string; lean?: string };
  criteria: Record<string, QaEntry[]>;
  updated_at: string;
}

const CRITERION_SEVERITY: Record<string, "critical" | "major" | "minor"> = {
  "q-usage-regime-detected": "minor",
  "q-usage-fixed-q0-leak": "major",
  "q-usage-archimedean-in-categorical-chapter": "major",
  "q-usage-positivity-implicit": "minor",
  "q-usage-modulus-vs-real-mismatch": "minor",
  "q-usage-root-of-unity-undeclared": "minor",
  "q-usage-narrative-chapter-mismatch": "minor",
};

const SCRIPT_PATH = "content/pipeline/qa-checkers-q-usage.ts";
// Anchored at PLATFORM_ROOT, not REPO_ROOT: the checker source lives in
// folio-assistant, not in the content repo being audited.
const SCRIPT_HASH = hashFile(join(PLATFORM_ROOT, SCRIPT_PATH));
const NOW_ISO = new Date().toISOString();
const REVIEWER_ID = "q-usage-audit";

// Capture HEAD SHA once per run for `reviewed_sha` in every entry —
// required by block-qa/v1 (#1640-Copilot @ q-usage-audit.ts:168).
function captureHeadSha(): string {
  try {
    const headPath = join(REPO_ROOT, ".git", "HEAD");
    if (!existsSync(headPath)) return "uncommitted";
    const head = readFileSync(headPath, "utf-8").trim();
    if (head.startsWith("ref: ")) {
      const refPath = join(REPO_ROOT, ".git", head.slice(5));
      if (existsSync(refPath)) return readFileSync(refPath, "utf-8").trim();
    }
    return head;
  } catch {
    return "uncommitted";
  }
}
const HEAD_SHA = captureHeadSha();

function updateSidecar(b: BlockTriple, results: Map<string, QUsageResult>): void {
  const sidecarPath = b.ts.replace(/\.ts$/, ".qa.json");
  let sidecar: QaSidecar;
  if (existsSync(sidecarPath)) {
    try {
      sidecar = JSON.parse(readFileSync(sidecarPath, "utf-8")) as QaSidecar;
    } catch {
      sidecar = makeFreshSidecar(b);
    }
  } else {
    sidecar = makeFreshSidecar(b);
  }

  // Refresh source hashes + paths
  sidecar.source_hashes = {
    ts: hashFile(b.ts),
    md: b.md ? hashFile(b.md) : undefined,
    lean: b.lean ? hashFile(b.lean) : undefined,
  };
  sidecar.paths = {
    ts: relative(REPO_ROOT, b.ts),
    md: b.md ? relative(REPO_ROOT, b.md) : undefined,
    lean: b.lean ? relative(REPO_ROOT, b.lean) : undefined,
  };
  sidecar.label = b.label;
  sidecar.kind = b.kind;
  sidecar.updated_at = NOW_ISO;

  for (const [criterionId, r] of results.entries()) {
    const entry: QaEntry = {
      field_hash: { ...sidecar.source_hashes },
      result: r.result,
      reviewer: {
        kind: "script",
        id: REVIEWER_ID,
        script_hash: SCRIPT_HASH,
      },
      reviewed_at: NOW_ISO,
      reviewed_sha: HEAD_SHA,
    };
    if (r.result === "fail" || r.result === "warn") {
      entry.severity = CRITERION_SEVERITY[criterionId];
      if (r.hits.length > 0) {
        entry.evidence = r.hits
          .slice(0, 4)
          .map((h) => `${relative(REPO_ROOT, h.file)}:${h.line} — ${h.text}`)
          .join(" | ");
      }
    }
    if (criterionId === "q-usage-regime-detected") {
      const regimes = r.regimes ?? [];
      entry.notes = JSON.stringify({
        regimes,
        chapter: r.chapter,
        expected: r.chapter && CHAPTER_EXPECTED_REGIMES[r.chapter]
          ? [...CHAPTER_EXPECTED_REGIMES[r.chapter]].sort()
          : null,
      });
    }
    // Drop EVERY script-kind entry for this criterion, not just ones this
    // tool wrote. `qa-sweep` also writes these criteria, under a different
    // reviewer id (its `source_file`, `content/pipeline/qa-checkers-q-usage.ts`),
    // and it drops all script entries on refresh. Filtering only on
    // REVIEWER_ID meant the two producers never cleared each other, so every
    // run left both entries behind and the sidecars grew without bound —
    // measured in qou at 3420 `q-usage-audit` + 2762 `qa-checkers-q-usage.ts`
    // entries for a single criterion, nearly all of them evidence-free
    // leftovers. Agent and human adjudications are preserved, as ever.
    sidecar.criteria[criterionId] = [
      ...(sidecar.criteria[criterionId] ?? []).filter(
        (e) => e?.reviewer?.kind !== "script",
      ),
      entry,
    ];
  }

  if (!noWrite) {
    writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2) + "\n", "utf-8");
  }
}

function makeFreshSidecar(b: BlockTriple): QaSidecar {
  return {
    $schema: "block-qa/v1",
    label: b.label,
    kind: b.kind,
    paths: {
      ts: relative(REPO_ROOT, b.ts),
      md: b.md ? relative(REPO_ROOT, b.md) : undefined,
      lean: b.lean ? relative(REPO_ROOT, b.lean) : undefined,
    },
    source_hashes: {
      ts: hashFile(b.ts),
      md: b.md ? hashFile(b.md) : undefined,
      lean: b.lean ? hashFile(b.lean) : undefined,
    },
    criteria: {},
    updated_at: NOW_ISO,
  };
}

// ── Main ────────────────────────────────────────────────────────

interface ChapterStat {
  chapter: string;
  n_blocks: number;
  by_criterion: Record<string, { pass: number; fail: number; warn: number; "n/a": number }>;
  regime_dist: Record<string, number>;
}

interface BlockFinding {
  label: string;
  kind: string;
  chapter: string;
  criterion: string;
  result: "fail" | "warn";
  severity: string;
  evidence: string;
}

/**
 * Check the existing sidecar for a human dispensation on `criterion`
 * whose `field_hash` matches the present source files. Returns true
 * iff a human-pass entry exists that supersedes the script verdict
 * for the current source state.
 *
 * PRECEDENCE. Among entries whose `field_hash` matches the current sources, a
 * HUMAN entry outranks a script entry outright; `reviewed_at` only breaks ties
 * within the same reviewer kind.
 *
 * This used to be a flat "most recent matching entry wins", which made a
 * dispensation last exactly one run. Every audit appends its own `kind:
 * "script"` entry stamped at run time, so the moment the audit that HONOURED a
 * dispensation finished, its own fail entry was the newest matching entry and
 * the next run read the dispensation as superseded. Measured: run 1
 * `dispensations-honored=5, fails=1`; runs 2 and 3, byte-identical sources,
 * `dispensations-honored=0, fails=6`.
 *
 * The flat rule cannot express the documented mechanism at all. The script
 * re-runs and always stamps later, so under it no human entry can ever
 * outlive the next sweep — the dispensation feature was unusable by
 * construction, and silently so: the sidecar still showed the human entry,
 * the audit just stopped reading it.
 */
export function hasHumanDispensation(
  // Only the `.ts` path is read — the sidecar is derived from it. Taking the
  // whole `BlockTriple` overstated the dependency and forced callers (and the
  // regression test) to construct five fields this never looks at.
  b: Pick<BlockTriple, "ts">,
  criterionId: string,
  currentHashes: { ts?: string; md?: string; lean?: string },
): boolean {
  const sidecarPath = b.ts.replace(/\.ts$/, ".qa.json");
  if (!existsSync(sidecarPath)) return false;
  let sidecar: { criteria?: Record<string, Array<{
    field_hash?: { ts?: string; md?: string; lean?: string };
    result?: string;
    reviewer?: { kind?: string };
    reviewed_at?: string;
  }>> };
  try {
    sidecar = JSON.parse(readFileSync(sidecarPath, "utf-8"));
  } catch { return false; }
  const entries = sidecar.criteria?.[criterionId] ?? [];
  const applicable = entries.filter((e) => {
    const fh = e.field_hash ?? {};
    return (
      fh.ts === currentHashes.ts &&
      fh.md === currentHashes.md &&
      fh.lean === currentHashes.lean
    );
  });
  if (applicable.length === 0) return false;
  // Human first, then most recent — see the precedence note above.
  const [decisive] = [...applicable].sort((a, b) => {
    const humanness = (e: typeof a) => (e.reviewer?.kind === "human" ? 0 : 1);
    return (
      humanness(a) - humanness(b) ||
      (b.reviewed_at ?? "").localeCompare(a.reviewed_at ?? "")
    );
  });
  return decisive.reviewer?.kind === "human" && decisive.result === "pass";
}

// ── Orphan library-tree coverage ────────────────────────────────
//
// Block-driven auditing only reaches Lean files referenced by some
// block's `lean.ref`. Library-tree files that NO block references
// (orphans) would otherwise go unswept — exactly how a gratuitous
// `(q : ℝ)` can slip in unseen. We audit them with the CONTENT-BASED,
// chapter-INDEPENDENT checkers only: an orphan has no owning content
// block, hence no chapter, and CLAUDE.md §7c forbids inferring the
// regime from the lean-tree directory name (the path heuristic
// over-fires — `lean/QOU/BraidKnot/` legitimately holds archimedean
// files like the QBeta ladder). So the chapter-relative checkers
// (`*-in-categorical-chapter`, `fixed-q0-leak`, `narrative-chapter-
// mismatch`) are NOT run on orphans; only same-file content signals are:
//   - wall-side-correct          — mixed archimedean + generic-R in one file
//   - wall-base-ring-minimal     — field/inverse restatable over ℤ[q,q⁻¹]
//   - q-usage-positivity-implicit — Real.* on q without a positivity hyp
// plus the detected regime vector (reported, never used to fail).

/** Minimal shape shared by CheckerResult and QUsageResult. */
type MiniResult = {
  result: "pass" | "fail" | "warn" | "n/a";
  hits: Array<{ file: string; line: number; text: string }>;
};

interface OrphanFinding {
  file: string;
  criterion: string;
  result: "fail" | "warn";
  regimes: string[];
  evidence: string;
}

export function scanOrphanLeanFiles(coveredLean: Set<string>): {
  scanned: number;
  orphans: number;
  findings: OrphanFinding[];
} {
  const all = listPackageLeanFiles(REPO_ROOT);
  const findings: OrphanFinding[] = [];
  let orphans = 0;
  for (const file of all) {
    if (coveredLean.has(resolve(file))) continue; // referenced by a block
    orphans++;
    const regimes = [
      ...detectRegimes(undefined, undefined, file).regimes,
    ].sort();
    const checks: Array<{ id: string; r: MiniResult }> = [
      { id: "wall-side-correct", r: checkWallSide(undefined, file) },
      { id: "wall-base-ring-minimal", r: checkBaseRingMinimal(file) },
      {
        id: "q-usage-positivity-implicit",
        r: checkQUsagePositivityImplicit(undefined, undefined, file),
      },
    ];
    for (const { id, r } of checks) {
      if (r.result === "fail" || r.result === "warn") {
        findings.push({
          file: relative(REPO_ROOT, file),
          criterion: id,
          result: r.result,
          regimes,
          evidence: r.hits
            .slice(0, 3)
            .map((h) => `${relative(REPO_ROOT, h.file)}:${h.line} — ${h.text}`)
            .join(" | "),
        });
      }
    }
  }
  return { scanned: all.length, orphans, findings };
}

function main(): void {
  const blocks = walkBlocks();

  // A sweep that discovers nothing is a BROKEN sweep, not a clean one.
  // Exiting 0 here is what let the root-resolution bug hide: callers and
  // CI read the zero exit as "audited, nothing wrong" while the seven
  // q-usage criteria silently went unrefreshed everywhere. Fail loudly,
  // and say which root was searched so the cause is obvious.
  if (blocks.length === 0) {
    console.error("q-usage-audit: found NO blocks to audit — refusing to report success.");
    console.error(`  content repo root : ${REPO_ROOT}`);
    console.error(`  papers            : ${PAPERS.length ? PAPERS.join(", ") : "(none discovered)"}`);
    if (chapterFilter) console.error(`  --chapter         : ${chapterFilter}`);
    if (paperFilter) console.error(`  --paper           : ${paperFilter}`);
    console.error(
      PAPERS.length === 0
        ? "  No `content/<paper>/<paper>.ts` manifest found. Run from the content repo root."
        : "  Papers resolved but no blocks matched. Check --chapter / --paper spelling.",
    );
    process.exit(2);
  }

  const stats: Map<string, ChapterStat> = new Map();
  const findings: BlockFinding[] = [];
  const coveredLean = new Set<string>();
  let touchedSidecars = 0;
  let dispensationsHonored = 0;

  for (const b of blocks) {
    const stat = stats.get(b.chapter) ?? {
      chapter: b.chapter,
      n_blocks: 0,
      by_criterion: Object.fromEntries(
        Q_USAGE_CRITERION_IDS.map((id) => [id, { pass: 0, fail: 0, warn: 0, "n/a": 0 }]),
      ),
      regime_dist: {},
    };
    stat.n_blocks++;
    if (b.lean) coveredLean.add(resolve(b.lean));
    const currentHashes = {
      ts: hashFile(b.ts),
      md: b.md ? hashFile(b.md) : undefined,
      lean: b.lean ? hashFile(b.lean) : undefined,
    };
    const results = new Map<string, QUsageResult>();
    for (const [id, fn] of Object.entries(Q_USAGE_AUTOMATED_CHECKERS)) {
      const r = fn({ md: b.md, ts: b.ts, lean: b.lean });
      // Honor existing human dispensation: if the sidecar carries a
      // human-pass entry for this criterion with field_hash matching
      // the current source files, the script's raw finding is
      // overridden to pass and excluded from the findings report.
      // The script entry is still written to the sidecar (so the
      // dispensation chain stays auditable) but reporting + counts
      // reflect the human verdict.
      if ((r.result === "fail" || r.result === "warn") &&
          hasHumanDispensation(b, id, currentHashes)) {
        dispensationsHonored++;
        const dispensed: QUsageResult = { ...r, result: "pass", hits: [] };
        results.set(id, dispensed);
        stat.by_criterion[id]["pass"]++;
        continue;
      }
      results.set(id, r);
      stat.by_criterion[id][r.result]++;
      if (r.result === "fail" || r.result === "warn") {
        findings.push({
          label: b.label,
          kind: b.kind,
          chapter: b.chapter,
          criterion: id,
          result: r.result,
          severity: CRITERION_SEVERITY[id],
          evidence: r.hits
            .slice(0, 3)
            .map((h) => `${relative(REPO_ROOT, h.file)}:${h.line} — ${h.text}`)
            .join(" | "),
        });
      }
      if (id === "q-usage-regime-detected" && r.regimes) {
        for (const rg of r.regimes) {
          stat.regime_dist[rg] = (stat.regime_dist[rg] ?? 0) + 1;
        }
      }
    }
    stats.set(b.chapter, stat);
    updateSidecar(b, results);
    if (!noWrite) touchedSidecars++;
  }

  // Orphan library-tree coverage — Lean files reachable by no block's
  // lean.ref. Skipped for a single-chapter run (--chapter) since the
  // library tree is paper-wide, and on demand via --no-orphans.
  const orphan =
    noOrphans || chapterFilter
      ? { scanned: 0, orphans: 0, findings: [] as OrphanFinding[] }
      : scanOrphanLeanFiles(coveredLean);

  // Global witness
  const witnessPath = join(
    REPO_ROOT,
    "docs",
    "audits",
    `${NOW_ISO.slice(0, 10)}-q-usage-audit.witness.json`,
  );
  const witness = {
    $schema: "q-usage-audit/v1",
    description:
      "Per-block q-usage regime audit + chapter-mismatch sweep + orphan " +
      "library-tree coverage (content-based, chapter-independent)",
    audited_at: NOW_ISO,
    script: SCRIPT_PATH,
    script_hash: SCRIPT_HASH,
    n_blocks: blocks.length,
    n_chapters: stats.size,
    n_fails: findings.filter((f) => f.result === "fail").length,
    n_warns: findings.filter((f) => f.result === "warn").length,
    lean_tree_scanned: orphan.scanned,
    n_orphan_files: orphan.orphans,
    n_orphan_findings: orphan.findings.length,
    by_chapter: Object.fromEntries(
      [...stats.entries()].sort().map(([k, v]) => [k, v]),
    ),
    findings: findings.sort((a, b) => {
      const sev: Record<string, number> = { critical: 0, major: 1, minor: 2 };
      const da = sev[a.severity] ?? 9;
      const db = sev[b.severity] ?? 9;
      if (da !== db) return da - db;
      return (a.chapter + a.label).localeCompare(b.chapter + b.label);
    }),
    orphan_findings: orphan.findings.sort((a, b) =>
      a.file.localeCompare(b.file) || a.criterion.localeCompare(b.criterion),
    ),
  };
  if (!noWrite) {
    mkdirSync(dirname(witnessPath), { recursive: true });
    writeFileSync(witnessPath, JSON.stringify(witness, null, 2) + "\n", "utf-8");
  }

  if (jsonReport) {
    process.stdout.write(JSON.stringify(witness, null, 2) + "\n");
  } else {
    console.error(`q-usage-audit — ${blocks.length} blocks across ${stats.size} chapters`);
    console.error(
      `  fails=${witness.n_fails}  warns=${witness.n_warns}  sidecars-touched=${touchedSidecars}  dispensations-honored=${dispensationsHonored}`,
    );
    if (!noOrphans && !chapterFilter) {
      console.error(
        `  lean-tree-scanned=${orphan.scanned}  orphan-files=${orphan.orphans}  orphan-findings=${orphan.findings.length}`,
      );
    }
    console.error("");
    console.error("Chapter regime distribution (top tags only):");
    for (const stat of [...stats.values()].sort((a, b) => a.chapter.localeCompare(b.chapter))) {
      const top = Object.entries(stat.regime_dist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ");
      console.error(`  ${stat.chapter.padEnd(40)} blocks=${stat.n_blocks.toString().padStart(3)}  ${top}`);
    }
    console.error("");
    console.error("Findings (severity-sorted):");
    for (const f of witness.findings.slice(0, 40)) {
      console.error(
        `  [${f.severity.padEnd(8)}] ${f.result} ${f.criterion}  ${f.chapter}/${f.label}`,
      );
      if (f.evidence) console.error(`            ${f.evidence.slice(0, 200)}`);
    }
    if (witness.findings.length > 40) {
      console.error(`  …and ${witness.findings.length - 40} more (see witness JSON)`);
    }
    if (orphan.findings.length > 0) {
      console.error("");
      console.error("Orphan library-tree findings (no owning block):");
      for (const f of orphan.findings.slice(0, 40)) {
        console.error(`  [${f.result.padEnd(4)}] ${f.criterion}  ${f.file}  [${f.regimes.join(",")}]`);
        if (f.evidence) console.error(`            ${f.evidence.slice(0, 200)}`);
      }
      if (orphan.findings.length > 40) {
        console.error(`  …and ${orphan.findings.length - 40} more (see witness JSON)`);
      }
    }
    if (!noWrite) {
      console.error("");
      console.error(`Witness written to ${relative(REPO_ROOT, witnessPath)}`);
    }
  }

  // Orphan `fail`s are real §7c violations (mixed-substrate files); count
  // them toward strict exit. Orphan `warn`s (base-ring advisories) do not.
  const orphanFails = orphan.findings.filter((f) => f.result === "fail").length;
  if (strict && witness.n_fails + orphanFails > 0) process.exit(1);
}

// Run as a CLI only when invoked directly; importing the module (e.g. in
// tests) must not execute the audit or write a witness.
if (import.meta.main) main();
