#!/usr/bin/env bun
/**
 * QA sweep CLI — run automated criteria on every block under a path
 * and write / update per-block `<block>.qa.json` audit reports.
 *
 * Usage:
 *
 *   # Sweep one section (relative to repo root)
 *   bun run pipeline/qa-sweep.ts \
 *     content/quantum-observable-universe/organic-chemistry
 *
 *   # Sweep the whole paper
 *   bun run pipeline/qa-sweep.ts content/quantum-observable-universe
 *
 *   # Restrict to a single criterion
 *   bun run pipeline/qa-sweep.ts \
 *     content/.../organic-chemistry \
 *     --only voice-status-leak,voice-ai-slop
 *
 *   # Show what would change, write nothing
 *   bun run pipeline/qa-sweep.ts content/.../organic-chemistry --dry-run
 *
 *   # Emit a structured JSON summary to stdout (machine-readable)
 *   bun run pipeline/qa-sweep.ts content/... --json
 *
 * Behaviour:
 *
 *   - For each block triple under <root>, computes the current
 *     md/ts/lean SHA-256 prefixes.
 *   - Loads the existing <block>.qa.json (if any).
 *   - For each automated criterion:
 *       - If a fresh entry exists (field_hash matches current),
 *         skip — no need to re-audit.
 *       - Otherwise, run the checker and write a reviewer entry with
 *         reviewer.kind="script", reviewer.id="qa-sweep". A script
 *         re-run is a REFRESH: the fresh entry REPLACES the prior
 *         script entry (agent/human entries are preserved) so the
 *         criterion array does not grow unboundedly across sweeps.
 *   - Non-automated criteria (scholarly-default, ai-slop, fit-...)
 *     are reported as `needs-agent` in the summary but NOT written
 *     to the sidecar — the watcher dispatches an agent to fill those.
 *   - Writes the updated sidecar (unless --dry-run).
 *
 * Exit codes:
 *   0 — sweep complete, no critical findings
 *   1 — at least one critical finding (use in --ci)
 *   2 — invocation error
 *
 * @module content/pipeline/qa-sweep
 */

import { existsSync, statSync } from "fs";
import { resolve, relative, dirname, join } from "path";
import { fileURLToPath } from "url";

// Stable anchor for path normalisation: repo root, computed from
// this file's location (`content/pipeline/qa-sweep.ts` → repo root
// is two levels up). Using `process.cwd()` instead would make the
// emitted `.qa.json` paths sensitive to the directory from which
// the sweep is invoked (sweep run from `content/` produced bare
// paths, sweep run from repo root produced `content/...` paths —
// noisy diffs in CI vs local). The repo-root anchor is invariant.
const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");

/**
 * Root of the CONTENT repo that owns the swept blocks, discovered by
 * walking up from the sweep target until a directory containing `.git`
 * (a dir in a normal checkout, a file in a git worktree) or
 * `folio.config.json` is found.
 *
 * Sidecar `paths` must be anchored HERE, not at `REPO_ROOT` (this
 * platform checkout): anchoring at REPO_ROOT bakes the content
 * checkout's *directory name* into every recorded path
 * (`../qou/content/...`), which poisons sidecars when the sweep runs
 * against a git worktree (`../agent-<id>/content/...` — dangling once
 * the worktree is pruned; observed live in qou PR #3604). Paths
 * relative to the content repo root (`content/...`) are invariant
 * across checkout names, worktrees, and invocation cwd.
 *
 * REPO_ROOT remains the right anchor for the *checker script* hashes
 * and script sidecars — those genuinely live in this platform repo.
 */
function findContentRepoRoot(startAbs: string): string {
  // The sweep target may be a block-path PREFIX (`.../<block>` with no
  // extension) rather than an existing file or directory — statSync on
  // it would throw ENOENT. Walk up from the nearest existing directory.
  let dir = existsSync(startAbs) && statSync(startAbs).isDirectory()
    ? startAbs
    : dirname(startAbs);
  while (true) {
    if (existsSync(join(dir, ".git")) || existsSync(join(dir, "folio.config.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      // Fell off the filesystem root: fall back to the legacy anchor so
      // the sweep still runs (paths then match the pre-fix behaviour).
      return REPO_ROOT;
    }
    dir = parent;
  }
}
import {
  hashBlockFiles,
  gitHeadSha,
  walkBlocks,
  loadQaReport,
  saveQaReport,
  entryIsFresh,
  freshnessKeys,
  preserveNonScriptEntries,
  sameScriptVerdict,
  applicabilityGap,
  missingCompanionNote,
  computeCriterionScriptHashes,
  saveQaScriptSidecar,
  type CriterionScriptHashes,
} from "./qa-utils";
import {
  QA_CRITERIA_REGISTRY,
  QA_CRITERIA_BY_ID,
  WATCHER_CRITERIA_BY_AXIS,
  getCriterionSourceFile,
  getCriterionExtraInputs,
} from "./qa-criteria-registry";
import { AUTOMATED_CHECKERS } from "./qa-checkers-voice";
import { usesGraphHash } from "./uses-graph-hash";

import type { CheckerResult } from "./qa-checkers-extended";
import type {
  BlockQaReport,
  QaCriterionEntry,
  QaScriptSidecar,
  CompanionRole,
} from "../../schemas/block-qa";


// ── CLI parsing ─────────────────────────────────────────────────

interface Args {
  root: string;
  only?: string[];
  axis?: string[];
  dryRun: boolean;
  json: boolean;
  ci: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { root: "", dryRun: false, json: false, ci: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--json") out.json = true;
    else if (a === "--ci") out.ci = true;
    else if (a === "--only") {
      out.only = (argv[++i] ?? "").split(",").filter(Boolean);
    } else if (a === "--axis") {
      out.axis = (argv[++i] ?? "").split(",").filter(Boolean);
    } else if (!a.startsWith("--")) {
      if (!out.root) out.root = a;
    }
  }
  if (!out.root) {
    console.error(
      "usage: qa-sweep.ts <content-root> [--only ID,ID] [--axis NAME[,NAME]] [--dry-run] [--json] [--ci]",
    );
    process.exit(2);
  }
  return out;
}

// ── Sweep ───────────────────────────────────────────────────────

interface BlockSweepResult {
  label: string;
  kind: string;
  md?: string;
  ts: string;
  lean?: string;
  qa_path: string;
  criteria_run: number;
  criteria_skipped_fresh: number;
  criteria_needs_agent: number;
  fail_critical: number;
  fail_major: number;
  fail_minor: number;
  details: Array<{
    criterion: string;
    // `CheckerResult["result"]` is assigned here verbatim, so this union must
    // contain all of it. It omitted `"warn"` and plain `"n/a"` — meaning a
    // soft finding was written into the details JSON as a value the type said
    // could not occur, and a consumer switching exhaustively on `outcome`
    // would not handle it. `CheckerResult` documents that `warn` is
    // "preserved end-to-end … without being silently coerced to `pass`", and
    // an earlier `warn` -> `pass` coercion in the extended dispatch did
    // silently drop chapter-mismatch warnings (#1640). Referencing the type
    // rather than restating it is what stops the two drifting again.
    outcome:
      | "fresh-skip"
      | "needs-agent"
      | `n/a-no-${CompanionRole}`
      | CheckerResult["result"];
    severity?: "critical" | "major" | "minor";
    hits?: number;
    first_hit?: string;
  }>;
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  const rootAbs = resolve(args.root);
  // Anchor for recorded block paths: the content repo that owns the
  // swept blocks (NOT this platform checkout — see findContentRepoRoot).
  const contentRepoRoot = findContentRepoRoot(rootAbs);
  // Single-block targets: accept a sibling file path (`<block>.ts`,
  // `.md`, `.lean`, `.qa.json`) or an extension-less block-path prefix
  // in addition to a chapter/paper directory. The walk then starts at
  // the block's directory, filtered down to that one block root.
  let walkRoot = rootAbs;
  let blockRootFilter: string | undefined;
  if (!existsSync(rootAbs) || !statSync(rootAbs).isDirectory()) {
    const blockRoot = rootAbs.replace(/\.(qa\.json|ts|md|lean)$/, "");
    if (existsSync(blockRoot + ".ts")) {
      walkRoot = dirname(blockRoot);
      blockRootFilter = blockRoot;
    } else if (existsSync(rootAbs)) {
      console.error(
        `qa-sweep: target has no block manifest (${blockRoot}.ts): ${rootAbs}`,
      );
      process.exit(2);
    } else {
      console.error(`qa-sweep: root not found: ${rootAbs}`);
      process.exit(2);
    }
  }

  const headSha = gitHeadSha();
  const nowIso = new Date().toISOString();
  // Criterion-selection precedence (most-specific first):
  //   --only ID[,ID]    explicit criterion IDs (any axis)
  //   --axis NAME[,...] one or more watcher axes (one-voice, proof,
  //                     canonical, compute, detangler)
  //   (default)         every registered criterion across all axes
  const criteriaToRun: string[] =
    args.only && args.only.length > 0
      ? args.only.filter((id) => QA_CRITERIA_BY_ID[id])
      : args.axis && args.axis.length > 0
        ? args.axis.flatMap((a) => WATCHER_CRITERIA_BY_AXIS[a] ?? [])
        : QA_CRITERIA_REGISTRY.map((c) => c.id);

  // Precompute one (script_hash, script_commit_sha, deps_hash) bundle
  // per criterion under sweep. The bundle is reused for every block
  // visited, then written out at the end of the run as a per-criterion
  // script sidecar under `content/pipeline/script-sidecars/`.
  const scriptHashesByCriterion: Record<string, CriterionScriptHashes> = {};
  for (const id of criteriaToRun) {
    const def = QA_CRITERIA_BY_ID[id];
    if (!def?.automated) continue;
    scriptHashesByCriterion[id] = computeCriterionScriptHashes(
      id,
      getCriterionSourceFile(id),
      getCriterionExtraInputs(id),
      REPO_ROOT,
    );
  }
  const engineVersion = `bun-${Bun.version}`;

  // Hash of the `uses[]` edge set under sweep, computed once per run.
  //
  // The detangler criteria answer questions about the GRAPH — forward
  // references, dependency cycles, cone depth, graph energy — so editing block
  // A's `uses[]` changes block B's verdict while B's own files are untouched.
  // Keyed only on its own `field_hash`, B stays `fresh-skip` and keeps a
  // verdict that is now wrong. Criteria opt in with
  // `also_invalidated_by: ["graph"]`; only their entries carry and compare it.
  //
  // The edge SET is hashed rather than the `.ts` files, so an edit that does
  // not touch `uses[]` does not invalidate the axis — hashing the manifests
  // would reintroduce exactly the churn per-criterion `script_hash` removed.
  const graphHash = usesGraphHash(walkRoot);

  const results: BlockSweepResult[] = [];

  let totalBlocks = 0;
  let totalCritical = 0;
  let totalMajor = 0;
  let totalMinor = 0;
  let totalNeedsAgent = 0;

  // `includeUnlabelled`: the sweep's question is "what prose ships?", not "what
  // is in the dependency graph". Unlabelled `prose()` blocks — chapter intros
  // and outros, the notation register — render into the paper and were outside
  // every criterion, while already carrying sidecars nothing could refresh.
  // See `qou/3fui`.
  for (const block of walkBlocks(walkRoot, { includeUnlabelled: true })) {
    if (blockRootFilter && block.root !== blockRootFilter) continue;
    totalBlocks++;
    const paths = { md: block.md, ts: block.ts, lean: block.lean };
    const currentHashes = hashBlockFiles(paths);

    // Load or initialise report.
    const qaPath = block.root + ".qa.json";
    const existingReport = loadQaReport(qaPath);
    const newPaths = {
      ts: relative(contentRepoRoot, block.ts),
      md: block.md ? relative(contentRepoRoot, block.md) : undefined,
      lean: block.lean ? relative(contentRepoRoot, block.lean) : undefined,
    };
    const report: BlockQaReport = existingReport ?? {
      $schema: "block-qa/v1",
      label: block.label,
      kind: block.kind,
      paths: newPaths,
      source_hashes: currentHashes,
      criteria: {},
      updated_at: nowIso,
    };

    // Detect whether metadata drifted — moved files, renamed blocks,
    // or refreshed hashes (chapter relocation triggers all three).
    // Any drift forces a save even when every criterion is fresh.
    const metadataDrifted =
      !existingReport ||
      existingReport.label !== block.label ||
      existingReport.kind !== block.kind ||
      JSON.stringify(existingReport.paths) !== JSON.stringify(newPaths) ||
      JSON.stringify(existingReport.source_hashes) !==
        JSON.stringify(currentHashes);

    // Refresh top-level metadata (paths / hashes may have shifted).
    report.label = block.label;
    report.kind = block.kind;
    report.paths = newPaths;
    report.source_hashes = currentHashes;

    // Did any criterion's VERDICT actually move this run? Re-running a checker
    // is not by itself a change: a criterion that re-evaluates to exactly what
    // the sidecar already records must keep its existing entry, timestamps and
    // all. Without this, the `staleNa` re-check below (which deliberately
    // re-evaluates every applicable `n/a` on every sweep) restamps
    // `reviewed_at` forever, so every sidecar's `updated_at` moved on every
    // sweep and feature branches carried the churn regardless of the
    // per-criterion `script_hash` fix.
    let verdictChanged = false;

    const sweepResult: BlockSweepResult = {
      label: block.label,
      kind: block.kind,
      md: block.md ? relative(process.cwd(), block.md) : undefined,
      ts: relative(process.cwd(), block.ts),
      lean: block.lean ? relative(process.cwd(), block.lean) : undefined,
      qa_path: relative(process.cwd(), qaPath),
      criteria_run: 0,
      criteria_skipped_fresh: 0,
      criteria_needs_agent: 0,
      fail_critical: 0,
      fail_major: 0,
      fail_minor: 0,
      details: [],
    };

    for (const criterionId of criteriaToRun) {
      const def = QA_CRITERIA_BY_ID[criterionId];
      if (!def) continue;

      // Applicability gate.
      if (def.applies_to && !def.applies_to.includes(block.kind)) {
        continue;
      }

      // Skip if a fresh entry already exists. An `n/a` entry whose
      // depends_on files are now all present (i.e. the criterion is
      // newly applicable — typically because `depends_on` was
      // relaxed in the registry) must NOT short-circuit the sweep;
      // it has to be re-evaluated against the actual checker.
      // Graph-scoped criteria (the detangler axis) compare an extra `graph`
      // key so that a `uses[]` edit ANYWHERE in the chapter invalidates them.
      // Only their entries carry it — adding it unconditionally would grow
      // every field_hash on every block for no signal.
      const graphScoped = freshnessKeys(def).includes("graph");
      const fieldHash = graphScoped
        ? { ...currentHashes, graph: graphHash }
        : currentHashes;
      const existing = report.criteria[criterionId] ?? [];
      // A script re-run is a REFRESH, not a new opinion: it must REPLACE the
      // prior script entry rather than append. Only agent-kind reviewers
      // append (their multi-reviewer audit trail is meaningful); human
      // adjudications are always kept. Dropping stale script entries here
      // keeps sidecars from growing unboundedly on every sweep. NOTE: the
      // freshness gate below still scans the FULL `existing` array (including
      // the old script entry) so an unchanged block still short-circuits as
      // `fresh-skip`.
      const nonScriptExisting = preserveNonScriptEntries(existing);
      const scriptHashes = scriptHashesByCriterion[criterionId];
      const freshExisting = existing.find((e) =>
        entryIsFresh(e, fieldHash, freshnessKeys(def), scriptHashes, def.lean_granularity),
      );
      const dependsOnSatisfied = def.depends_on.every(
        (k) => currentHashes[k] !== undefined,
      );
      const staleNa =
        freshExisting?.result === "n/a" && dependsOnSatisfied;
      if (freshExisting && !staleNa) {
        sweepResult.criteria_skipped_fresh++;
        sweepResult.details.push({
          criterion: criterionId,
          outcome: "fresh-skip",
        });
        continue;
      }

      // If non-automated, mark as needing agent and continue.
      const checker = AUTOMATED_CHECKERS[criterionId];
      if (!def.automated || !checker) {
        sweepResult.criteria_needs_agent++;
        totalNeedsAgent++;
        sweepResult.details.push({
          criterion: criterionId,
          outcome: "needs-agent",
        });
        continue;
      }

      // If the criterion depends on a file the block doesn't have,
      // write an explicit n/a entry so the staleness scanner knows
      // the criterion was considered and judged not-applicable.
      // Reviewer-identity block shared by every script-kind entry
      // written below. `id` points at the source file containing
      // the checker function (NOT the dispatcher) so the recorded
      // `script_hash` aligns with the file qa-sweep just hashed.
      const scriptReviewer = {
        kind: "script" as const,
        id: scriptHashes?.source_file ?? "content/pipeline/qa-sweep.ts",
        version: "v1",
        script_hash: scriptHashes?.script_hash || undefined,
        script_commit_sha:
          scriptHashes?.script_commit_sha || undefined,
        deps_hash: scriptHashes?.deps_hash,
      };

      // Applicability gate, over whichever companion roles the criterion
      // declares. This was two hard-coded `if`s for `.md` and `.lean` — the
      // paper adapter's companion set — so a criterion depending on a `.dmn`
      // or `.fsh` had no gate at all, and every WHO L2/L3 block fell through
      // the `.md` branch to a clean `n/a` for an axis that never ran. A
      // criterion that reports `n/a` on a corpus it did not check is
      // indistinguishable downstream from one that found nothing wrong.
      const missingRole = applicabilityGap(def.depends_on, block.companions);
      if (missingRole) {
        const naEntry: QaCriterionEntry = {
          field_hash: fieldHash,
          result: "n/a",
          reviewer: { ...scriptReviewer },
          reviewed_at: nowIso,
          reviewed_sha: headSha,
          notes: missingCompanionNote(missingRole),
        };
        const priorNa = existing.find((e) => e?.reviewer?.kind === "script");
        report.criteria[criterionId] = [
          ...nonScriptExisting,
          sameScriptVerdict(priorNa, naEntry)
            ? priorNa!
            : ((verdictChanged = true), naEntry),
        ];
        sweepResult.details.push({
          criterion: criterionId,
          outcome: `n/a-no-${missingRole}`,
        });
        continue;
      }

      // Run the automated checker.
      sweepResult.criteria_run++;
      const checkRes = checker(paths);
      const entry: QaCriterionEntry = {
        field_hash: fieldHash,
        result: checkRes.result,
        reviewer: { ...scriptReviewer },
        reviewed_at: nowIso,
        reviewed_sha: headSha,
      };
      // Surface checker-supplied context (e.g. a cache-staleness reason
      // from `proof-lean-compiles`) so the sidecar records WHY a result
      // is what it is, not just the verdict.
      if (checkRes.notes) entry.notes = checkRes.notes;
      // Persist any structured heuristic measures the checker emits
      // (e.g. the detangler graph metrics) so the sidecar carries the
      // numeric snapshot, not just the pass/fail verdict. Recorded for
      // every result kind (pass/warn/fail), since the measure is useful
      // even when the block is within band.
      if (checkRes.metrics && Object.keys(checkRes.metrics).length > 0)
        entry.metrics = checkRes.metrics;
      if (checkRes.result === "fail") {
        entry.severity = def.default_severity;
        entry.evidence = checkRes.hits
          .slice(0, 5)
          .map((h) => `${relative(process.cwd(), h.file)}:${h.line}: ${h.text}`)
          .join(" | ");
        if (def.default_severity === "critical") {
          sweepResult.fail_critical++;
          totalCritical++;
        } else if (def.default_severity === "major") {
          sweepResult.fail_major++;
          totalMajor++;
        } else {
          sweepResult.fail_minor++;
          totalMinor++;
        }
      }

      // Write the fresh script entry, REPLACING the prior script entry
      // (agent + human entries are preserved via `nonScriptExisting`). When
      // the re-run reproduces what the sidecar already records, keep the
      // existing entry verbatim so its timestamps survive — a re-run is not a
      // change.
      const priorScript = existing.find((e) => e?.reviewer?.kind === "script");
      const settled = sameScriptVerdict(priorScript, entry)
        ? priorScript!
        : ((verdictChanged = true), entry);
      report.criteria[criterionId] = [...nonScriptExisting, settled];

      sweepResult.details.push({
        criterion: criterionId,
        outcome: checkRes.result,
        severity: entry.severity,
        hits: checkRes.hits.length,
        first_hit: checkRes.hits[0]
          ? `${relative(process.cwd(), checkRes.hits[0].file)}:${
              checkRes.hits[0].line
            }`
          : undefined,
      });
    }

    // Save when any of the following changed since the loaded sidecar:
    //   - a criterion's verdict (or its inputs / checker identity) moved
    //   - sidecar metadata drifted (file moved, kind/label changed,
    //     source-file content hash changed)
    //
    // Note this is NOT `criteria_run > 0`. Running a checker and reproducing
    // the recorded verdict leaves the sidecar semantically identical, and
    // saving it anyway rewrote `updated_at` on every block on every sweep —
    // which is what made an otherwise no-op sweep dirty the whole corpus.
    const wroteSomething = verdictChanged || metadataDrifted;
    // Only advance the file's own timestamp when its content actually moved,
    // for the same reason.
    if (wroteSomething) report.updated_at = nowIso;
    if (!args.dryRun && wroteSomething) {
      saveQaReport(qaPath, report);
    }
    results.push(sweepResult);
  }

  // Write one script sidecar per automated criterion under sweep
  // to `content/pipeline/script-sidecars/<criterion-id>.script.json`.
  // Skipped under --dry-run.
  if (!args.dryRun) {
    for (const [id, hashes] of Object.entries(scriptHashesByCriterion)) {
      if (!hashes.script_hash) continue; // source file absent — skip
      const sidecar: QaScriptSidecar = {
        $schema: "qa-script/v1",
        criterion_id: id,
        source_file: hashes.source_file,
        script_hash: hashes.script_hash,
        script_commit_sha: hashes.script_commit_sha,
        extra_inputs:
          hashes.extra_inputs.length > 0 ? hashes.extra_inputs : undefined,
        deps_hash: hashes.deps_hash,
        last_run_at: nowIso,
        // The PLATFORM's HEAD, not `headSha`. This sidecar lives in and
        // describes folio-assistant's own checker scripts; `headSha` is the
        // CONTENT repo's HEAD (correct for a block's `reviewed_sha`, since
        // that verdict is about content at that commit). Stamping the
        // content SHA here recorded a foreign repo's commit as this repo's
        // "HEAD at last run".
        last_run_sha: gitHeadSha(REPO_ROOT),
        engine_version: engineVersion,
      };
      saveQaScriptSidecar(sidecar, REPO_ROOT);
    }
  }

  // ── Output ────────────────────────────────────────────────────

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          root: relative(process.cwd(), rootAbs),
          head: headSha,
          generated_at: nowIso,
          criteria: criteriaToRun,
          totals: {
            blocks: totalBlocks,
            fail_critical: totalCritical,
            fail_major: totalMajor,
            fail_minor: totalMinor,
            needs_agent: totalNeedsAgent,
          },
          results,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`qa-sweep: ${relative(process.cwd(), rootAbs)}`);
    console.log(`         HEAD: ${headSha.slice(0, 12) || "(no git)"}`);
    console.log(
      `         criteria: ${criteriaToRun.length}, blocks: ${totalBlocks}`,
    );
    console.log(
      `         findings: ${totalCritical} critical, ${totalMajor} major, ${totalMinor} minor; needs-agent: ${totalNeedsAgent}`,
    );
    console.log("");

    // Per-block summary, only show blocks with findings or needs-agent.
    for (const r of results) {
      if (
        r.fail_critical === 0 &&
        r.fail_major === 0 &&
        r.fail_minor === 0 &&
        r.criteria_needs_agent === 0
      ) {
        continue;
      }
      console.log(
        `  ${r.label}  (${r.kind})  → ${r.qa_path}`,
      );
      for (const d of r.details) {
        if (d.outcome === "fail") {
          console.log(
            `    [${d.severity}] ${d.criterion}: ${d.hits} hit(s)${
              d.first_hit ? `  first @ ${d.first_hit}` : ""
            }`,
          );
        } else if (d.outcome === "needs-agent") {
          console.log(`    [needs-agent] ${d.criterion}`);
        }
      }
    }
  }

  if (args.ci && totalCritical > 0) {
    process.exit(1);
  }
}

run();
