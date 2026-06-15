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

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Q_USAGE_AUTOMATED_CHECKERS,
  Q_USAGE_CRITERION_IDS,
  CHAPTER_EXPECTED_REGIMES,
  type QRegime,
  type QUsageResult,
} from "./qa-checkers-q-usage.ts";
import {
  LEAN_PACKAGES,
  parseLeanRef,
  leanPackageByName,
} from "../../folio-assistant/schemas/lean-packages.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const PAPER_ROOT = join(REPO_ROOT, "content", "quantum-observable-universe");

// ── CLI args ────────────────────────────────────────────────────

const args = process.argv.slice(2);
const noWrite = args.includes("--no-write");
const strict = args.includes("--strict");
const jsonReport = args.includes("--json");
const chapterFilterIdx = args.indexOf("--chapter");
const chapterFilter = chapterFilterIdx >= 0 ? args[chapterFilterIdx + 1] : undefined;

// ── Walk block files ────────────────────────────────────────────

interface BlockTriple {
  label: string;
  kind: string;
  chapter: string;
  ts: string;
  md?: string;
  lean?: string;
}

const PROVABLE_KINDS = new Set([
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "conjecture",
  "remark",
  "example",
  "simulator",
  "prose",
  "diagram",
  "equation",
]);

function walkBlocks(): BlockTriple[] {
  const out: BlockTriple[] = [];

  // Per-Lake-package basename cache. Some blocks have been promoted
  // from sibling .lean files into the Lake-buildable tree (per the
  // cluster-migration pattern, e.g. lean/QOU/BraidKnot/...). When the
  // sibling check fails, fall back to resolving the lean.ref URI via
  // (a) the parsed module path, or (b) a basename match anywhere
  // under the package's Lake root.
  const lakeTreeBasenameCache = new Map<string, Set<string>>();
  function lakeTreeContains(lakeRoot: string, base: string): boolean {
    const abs = resolve(REPO_ROOT, lakeRoot);
    let cached = lakeTreeBasenameCache.get(abs);
    if (!cached) {
      cached = new Set<string>();
      try {
        const stack: string[] = [abs];
        while (stack.length) {
          const dir = stack.pop()!;
          for (const e of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, e.name);
            if (e.isDirectory()) stack.push(full);
            else if (e.isFile() && e.name.endsWith(".lean")) cached.add(e.name);
          }
        }
      } catch { /* Lake root missing — empty cache */ }
      lakeTreeBasenameCache.set(abs, cached);
    }
    return cached.has(base);
  }
  function resolveLakeTreePath(ref: string | undefined): string | undefined {
    if (!ref) return undefined;
    try {
      const parsed = parseLeanRef(ref);
      const pkg = leanPackageByName(parsed.package);
      if (!pkg) return undefined;
      // Try direct module-path resolution first.
      const modulePath = parsed.module.replace(/\./g, "/");
      const direct = resolve(REPO_ROOT, pkg.lakeRoot, `${modulePath}.lean`);
      if (existsSync(direct)) return direct;
      // Basename fallback under the Lake tree.
      if (lakeTreeContains(pkg.lakeRoot, `${parsed.name}.lean`)) {
        // Find the actual path via scan.
        const stack: string[] = [resolve(REPO_ROOT, pkg.lakeRoot)];
        while (stack.length) {
          const dir = stack.pop()!;
          for (const e of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, e.name);
            if (e.isDirectory()) stack.push(full);
            else if (e.isFile() && e.name === `${parsed.name}.lean`) return full;
          }
        }
      }
    } catch { /* parseLeanRef failed — fall through */ }
    return undefined;
  }

  const chapters = readdirSync(PAPER_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const chapter of chapters) {
    if (chapterFilter && chapter !== chapterFilter) continue;
    const chDir = join(PAPER_ROOT, chapter);
    let files: string[];
    try {
      files = readdirSync(chDir);
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.endsWith(".ts")) continue;
      if (f === `${chapter}.ts`) continue; // chapter manifest, not a block
      const tsPath = join(chDir, f);
      const root = f.replace(/\.ts$/, "");
      const mdPath = join(chDir, `${root}.md`);
      const leanPath = join(chDir, `${root}.lean`);
      const ts = readFileSync(tsPath, "utf-8");
      const kindMatch = ts.match(
        /export\s+default\s+(definition|theorem|lemma|proposition|corollary|conjecture|remark|example|simulator|prose|diagram|equation)\s*\(/,
      );
      if (!kindMatch) continue;
      const kind = kindMatch[1];
      const labelMatch = ts.match(/label:\s*["']([^"']+)["']/);
      const label = labelMatch ? labelMatch[1] : root;
      // Resolve .lean: (1) sibling, (2) Lake-tree mirror via lean.ref.
      let leanResolved: string | undefined = existsSync(leanPath) ? leanPath : undefined;
      if (!leanResolved) {
        const refMatch = ts.match(/ref:\s*["']([^"']+)["']/);
        leanResolved = resolveLakeTreePath(refMatch?.[1]);
      }
      out.push({
        label,
        kind,
        chapter,
        ts: tsPath,
        md: existsSync(mdPath) ? mdPath : undefined,
        lean: leanResolved,
      });
    }
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
const SCRIPT_HASH = hashFile(join(REPO_ROOT, SCRIPT_PATH));
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
    sidecar.criteria[criterionId] = [
      ...(sidecar.criteria[criterionId] ?? []).filter(
        (e) => e.reviewer.id !== REVIEWER_ID,
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
 * for the current source state. Per `block-qa/v1` schema, the
 * criterion's "current verdict" is the most recent matching entry;
 * a human-pass dated after the latest script-fail (and with matching
 * hashes) is the documented dispensation mechanism (see
 * `qa-checkers-q-usage.ts` line 435-436).
 */
function hasHumanDispensation(
  b: BlockTriple,
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
  // Most recent first.
  const sorted = [...entries].sort((a, b) =>
    (b.reviewed_at ?? "").localeCompare(a.reviewed_at ?? ""),
  );
  for (const e of sorted) {
    const fh = e.field_hash ?? {};
    const matches =
      fh.ts === currentHashes.ts &&
      fh.md === currentHashes.md &&
      fh.lean === currentHashes.lean;
    if (!matches) continue;
    // Most recent matching entry decides. Stop at first match.
    return e.reviewer?.kind === "human" && e.result === "pass";
  }
  return false;
}

function main(): void {
  const blocks = walkBlocks();
  const stats: Map<string, ChapterStat> = new Map();
  const findings: BlockFinding[] = [];
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

  // Global witness
  const witnessPath = join(
    REPO_ROOT,
    "docs",
    "audits",
    `${NOW_ISO.slice(0, 10)}-q-usage-audit.witness.json`,
  );
  const witness = {
    $schema: "q-usage-audit/v1",
    description: "Per-block q-usage regime audit + chapter-mismatch sweep",
    audited_at: NOW_ISO,
    script: SCRIPT_PATH,
    script_hash: SCRIPT_HASH,
    n_blocks: blocks.length,
    n_chapters: stats.size,
    n_fails: findings.filter((f) => f.result === "fail").length,
    n_warns: findings.filter((f) => f.result === "warn").length,
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
    if (!noWrite) {
      console.error("");
      console.error(`Witness written to ${relative(REPO_ROOT, witnessPath)}`);
    }
  }

  if (strict && witness.n_fails > 0) process.exit(1);
}

main();
