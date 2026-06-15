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
 *   bun run pipeline/qa-staleness.ts \
 *     content/quantum-observable-universe/organic-chemistry
 *
 *   bun run pipeline/qa-staleness.ts \
 *     content/quantum-observable-universe --json
 *
 *   bun run pipeline/qa-staleness.ts \
 *     content/quantum-observable-universe --criteria voice-status-leak,wall-side-correct
 *
 * Exit code 0 always (informational). Use `--ci` to exit 1 when any
 * block has stale or missing audit.
 *
 * @module content/pipeline/qa-staleness
 */

import { existsSync } from "fs";
import { resolve, relative } from "path";
import {
  hashBlockFiles,
  walkBlocks,
  loadQaReport,
  summariseFreshness,
} from "./qa-utils";
import {
  QA_CRITERIA_BY_ID,
  QA_CRITERIA_REGISTRY,
  WATCHER_CRITERIA_BY_AXIS,
} from "./qa-criteria-registry";

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
      ? args.criteria.filter((id) => QA_CRITERIA_BY_ID[id])
      : args.axis && args.axis.length > 0
        ? args.axis.flatMap((a) => WATCHER_CRITERIA_BY_AXIS[a] ?? [])
        : QA_CRITERIA_REGISTRY.map((c) => c.id);

  const blocks: BlockReport[] = [];
  let totalMissing = 0;
  let totalStale = 0;
  let totalFresh = 0;

  for (const block of walkBlocks(rootAbs)) {
    const qaPath = block.root + ".qa.json";
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

    const freshSummary = summariseFreshness(report, current);
    const summaryById = Object.fromEntries(
      freshSummary.map((s) => [s.criterion, s]),
    );

    const fresh: string[] = [];
    const stale: string[] = [];
    const missing: string[] = [];
    for (const cid of wantCriteria) {
      const def = QA_CRITERIA_BY_ID[cid];
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
