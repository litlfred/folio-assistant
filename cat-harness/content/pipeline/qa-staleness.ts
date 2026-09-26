#!/usr/bin/env bun
/**
 * QA staleness scanner — given a content root, walk every block
 * triple, load the `<block>.qa.json` sidecar, and report:
 *
 *   - blocks with NO sidecar (never audited)
 *   - blocks with sidecar but at least one criterion stale
 *     (the source file changed since the audit's recorded field_hash)
 *   - blocks fully fresh under the watcher's criterion list
 *
 * Usage:
 *
 *   bun run cat-harness/content/pipeline/qa-staleness.ts \
 *     content/quantum-observable-universe/organic-chemistry
 *
 *   bun run cat-harness/content/pipeline/qa-staleness.ts \
 *     content/quantum-observable-universe --json
 *
 *   bun run cat-harness/content/pipeline/qa-staleness.ts \
 *     content/quantum-observable-universe --criteria voice-status-leak,wall-side-correct
 *
 * Exit code 0 always (informational). Use `--ci` to exit 1 when any
 * block has stale or missing audit.
 *
 * @module content/pipeline/qa-staleness
 */

import { existsSync } from "fs";
import { resolve, relative, join } from "path";
import {
  hashBlockFiles,
  walkBlocks,
  loadQaReport,
  summariseFreshness,
} from "./qa-utils";
import {
  qaCriteriaByIdFor,
  qaCriteriaFor,
  WATCHER_CRITERIA_BY_AXIS,
} from "./qa-criteria-registry";
import { findContentRepoRoot } from "./repo-root";
import { blockQaPath, existingBlockQaPath } from "./qa-paths";

interface Args {
  root: string;
  criteria?: string[];
  axis?: string[];
  json: boolean;
  ci: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { root: "", json: false, ci: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--ci") out.ci = true;
    else if (a === "--criteria") {
      out.criteria = (argv[++i] ?? "").split(",").filter(Boolean);
    } else if (a === "--axis") {
      out.axis = (argv[++i] ?? "").split(",").filter(Boolean);
    } else if (!a.startsWith("--")) {
      if (!out.root) out.root = a;
    }
  }
  if (!out.root) {
    console.error(
      "usage: qa-staleness.ts <content-root> [--criteria ID,ID] [--json] [--ci]",
    );
    process.exit(2);
  }
  return out;
}

interface BlockReport {
  label: string;
  kind: string;
  qa_path: string;
  qa_exists: boolean;
  fresh: string[];
  stale: string[];
  missing: string[];
  status: "fresh" | "stale" | "partial" | "missing-sidecar" | "no-criteria-applicable";
}

function run(): void {
  // The instance whose criteria this reads. Resolved here rather than at module
  // scope, and BY ID through `qaCriteriaByIdFor` rather than the static index:
  // since bean `btuv` the voice-overlay criteria are derived from the voices an
  // instance ships, so a static lookup returns `undefined` for every one of them
  // and this file would report four registered criteria as unknown.
  const INSTANCE_ROOT = join(import.meta.dir, "..", "..");
  const criteriaById = qaCriteriaByIdFor(INSTANCE_ROOT);
  const args = parseArgs(process.argv.slice(2));
  const rootAbs = resolve(args.root);
  if (!existsSync(rootAbs)) {
    console.error(`qa-staleness: root not found: ${rootAbs}`);
    process.exit(2);
  }
  // Criterion-selection precedence (most-specific first):
  //   --criteria ID[,ID]  explicit criterion IDs (any axis)
  //   --axis NAME[,...]   one or more watcher axes
  //   (default)           every registered criterion across all axes
  const wantCriteria: string[] =
    args.criteria && args.criteria.length > 0
      ? args.criteria.filter((id) => criteriaById[id])
      : args.axis && args.axis.length > 0
        ? args.axis.flatMap((a) => WATCHER_CRITERIA_BY_AXIS[a] ?? [])
        : qaCriteriaFor(INSTANCE_ROOT).map((c) => c.id);

  const blocks: BlockReport[] = [];
  let totalMissing = 0;
  let totalStale = 0;
  let totalFresh = 0;

  // The instance root a verdict path is resolved against — see qa-paths.ts.
  // Computed once: it walks up from cwd and every block in this scan shares it.
  const repoRoot = findContentRepoRoot();

  for (const block of walkBlocks(rootAbs)) {
    // Prefer the results-tree verdict, falling back to the legacy sibling
    // (a downstream folio that has not migrated yet) — see qa-paths.ts's
    // `existingBlockQaPath`. When neither exists, fall back to the canonical
    // (results-tree) path purely so `qa_path` below reports where a fresh
    // audit would land; `loadQaReport` on a path that does not exist returns
    // `undefined` exactly as it did for the old hand-composed path, so a
    // genuinely unaudited block still counts as `missing-sidecar` /
    // `totalMissing` below rather than silently passing as fresh — this must
    // never collapse into "looked in the wrong place" reading as audited.
    const qaPath =
      existingBlockQaPath(repoRoot, block.root) ?? blockQaPath(repoRoot, block.root);
    const qaRel = relative(process.cwd(), qaPath);
    const paths = { md: block.md, ts: block.ts, lean: block.lean };
    const current = hashBlockFiles(paths);

    const report = loadQaReport(qaPath);
    if (!report) {
      blocks.push({
        label: block.label,
        kind: block.kind,
        qa_path: qaRel,
        qa_exists: false,
        fresh: [],
        stale: [],
        missing: [...wantCriteria],
        status: "missing-sidecar",
      });
      totalMissing++;
      continue;
    }

    const freshSummary = summariseFreshness(report, current, undefined, criteriaById);
    const summaryById = Object.fromEntries(
      freshSummary.map((s) => [s.criterion, s]),
    );

    const fresh: string[] = [];
    const stale: string[] = [];
    const missing: string[] = [];
    for (const cid of wantCriteria) {
      const def = criteriaById[cid];
      if (def?.applies_to && !def.applies_to.includes(block.kind)) continue;
      const summary = summaryById[cid];
      if (!summary) missing.push(cid);
      else if (summary.is_fresh) fresh.push(cid);
      else stale.push(cid);
    }

    let status: BlockReport["status"];
    if (fresh.length === 0 && stale.length === 0 && missing.length === 0)
      status = "no-criteria-applicable";
    else if (missing.length === 0 && stale.length === 0) status = "fresh";
    else if (fresh.length === 0) status = "stale";
    else status = "partial";

    if (status === "fresh") totalFresh++;
    else if (status === "stale" || status === "partial") totalStale++;

    blocks.push({
      label: block.label,
      kind: block.kind,
      qa_path: qaRel,
      qa_exists: true,
      fresh,
      stale,
      missing,
      status,
    });
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          root: relative(process.cwd(), rootAbs),
          want_criteria: wantCriteria,
          totals: {
            blocks: blocks.length,
            fresh: totalFresh,
            stale_or_partial: totalStale,
            missing_sidecar: totalMissing,
          },
          blocks,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`qa-staleness: ${relative(process.cwd(), rootAbs)}`);
    console.log(
      `              ${blocks.length} blocks; fresh=${totalFresh}, stale/partial=${totalStale}, no-sidecar=${totalMissing}`,
    );
    console.log("");
    for (const b of blocks) {
      const tag =
        b.status === "fresh"
          ? "FRESH"
          : b.status === "missing-sidecar"
            ? "NO-QA"
            : b.status === "stale"
              ? "STALE"
              : b.status === "partial"
                ? "PART"
                : "N/A";
      console.log(`  [${tag}] ${b.label}  (${b.kind})`);
      if (b.stale.length > 0)
        console.log(`         stale: ${b.stale.join(", ")}`);
      if (b.missing.length > 0)
        console.log(`         missing: ${b.missing.join(", ")}`);
    }
  }

  if (args.ci && (totalMissing > 0 || totalStale > 0)) {
    process.exit(1);
  }
}

run();
