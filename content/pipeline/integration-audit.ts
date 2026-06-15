#!/usr/bin/env bun
/**
 * Sidecar-invalidation CLI for the integration-watcher pipeline.
 *
 * Backs the `/integration-audit` skill — see
 * `.claude/skills/local/integration-audit.md` for the user-facing
 * spec.
 *
 * Use when a checker bug is fixed in `qa-checkers-voice.ts` (or any
 * sibling checker), or when a registry update adds a criterion that
 * existing sidecars haven't been audited under. The CLI deletes the
 * cached reviewer entries for the named criteria and (optionally)
 * re-runs `qa-sweep` to repopulate them.
 *
 * Usage:
 *
 *   bun run pipeline/integration-audit.ts <content-root> \
 *     --criteria ID[,ID]      # explicit criterion IDs
 *   bun run pipeline/integration-audit.ts <content-root> \
 *     --axis NAME[,NAME]      # one or more watcher axes
 *   bun run pipeline/integration-audit.ts <content-root> --all
 *                             # every registered criterion
 *
 *   --dry-run                 # report what would change, do nothing
 *   --include-agent           # also invalidate agent-reviewer entries
 *                             # (default: only script-reviewer entries)
 *   --json                    # emit machine-readable summary
 *   --no-sweep                # skip the post-invalidation re-sweep
 *
 * @module content/pipeline/integration-audit
 */

import { existsSync } from "fs";
import { resolve, relative, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { walkBlocks, loadQaReport, saveQaReport } from "./qa-utils";
import {
  QA_CRITERIA_BY_ID,
  QA_CRITERIA_REGISTRY,
  WATCHER_CRITERIA_BY_AXIS,
} from "./qa-criteria-registry";
import type { BlockQaReport } from "../../folio-assistant/schemas/block-qa";

interface Args {
  root: string;
  criteria?: string[];
  axis?: string[];
  all: boolean;
  dryRun: boolean;
  includeAgent: boolean;
  json: boolean;
  noSweep: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    root: "",
    all: false,
    dryRun: false,
    includeAgent: false,
    json: false,
    noSweep: false,
  };
  // Read the next argv token as a value for a flag, refusing tokens
  // that start with `--` (those are clearly the next flag, not a
  // value). Surfaces an error rather than silently consuming the
  // following flag.
  const valueFor = (flag: string, idx: number): string => {
    const next = argv[idx + 1];
    if (next === undefined || next.startsWith("--")) {
      console.error(
        `integration-audit: ${flag} requires a value (got ${
          next === undefined ? "end of args" : `'${next}' which looks like a flag`
        })`,
      );
      process.exit(2);
    }
    return next;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") out.all = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--include-agent") out.includeAgent = true;
    else if (a === "--json") out.json = true;
    else if (a === "--no-sweep") out.noSweep = true;
    else if (a === "--criteria") {
      out.criteria = valueFor(a, i++).split(",").filter(Boolean);
    } else if (a === "--axis") {
      out.axis = valueFor(a, i++).split(",").filter(Boolean);
    } else if (!a.startsWith("--")) {
      if (!out.root) out.root = a;
    }
  }
  if (!out.root) {
    console.error(
      "usage: integration-audit.ts <content-root> " +
        "[--criteria ID,ID | --axis NAME,NAME | --all] " +
        "[--dry-run] [--include-agent] [--json] [--no-sweep]",
    );
    process.exit(2);
  }
  if (!out.criteria && !out.axis && !out.all) {
    console.error(
      "integration-audit: one of --criteria / --axis / --all is required",
    );
    process.exit(2);
  }
  return out;
}

function resolveCriteria(args: Args): string[] {
  if (args.all) {
    return QA_CRITERIA_REGISTRY.map((c) => c.id);
  }
  const set = new Set<string>();
  if (args.criteria) {
    for (const id of args.criteria) {
      if (QA_CRITERIA_BY_ID[id]) set.add(id);
      else console.error(`integration-audit: unknown criterion '${id}'`);
    }
  }
  if (args.axis) {
    for (const a of args.axis) {
      const ids = WATCHER_CRITERIA_BY_AXIS[a];
      if (!ids) {
        console.error(`integration-audit: unknown axis '${a}'`);
        continue;
      }
      ids.forEach((id) => set.add(id));
    }
  }
  return Array.from(set);
}

interface InvalidationDetail {
  criterion: string;
  entries_removed: number;
  entries_preserved: number;
}

function invalidateBlock(
  report: BlockQaReport,
  toInvalidate: string[],
  includeAgent: boolean,
): InvalidationDetail[] {
  const details: InvalidationDetail[] = [];
  for (const criterionId of toInvalidate) {
    const entries = report.criteria[criterionId];
    if (!entries || entries.length === 0) continue;
    let removed = 0;
    const kept = entries.filter((e) => {
      const kind = e.reviewer?.kind;
      if (kind === "script") {
        removed++;
        return false;
      }
      if (kind === "agent" && includeAgent) {
        removed++;
        return false;
      }
      return true;
    });
    if (removed === 0) continue;
    if (kept.length === 0) {
      delete report.criteria[criterionId];
    } else {
      report.criteria[criterionId] = kept;
    }
    details.push({
      criterion: criterionId,
      entries_removed: removed,
      entries_preserved: kept.length,
    });
  }
  return details;
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  const rootAbs = resolve(args.root);
  if (!existsSync(rootAbs)) {
    console.error(`integration-audit: root not found: ${rootAbs}`);
    process.exit(2);
  }

  const toInvalidate = resolveCriteria(args);
  if (toInvalidate.length === 0) {
    console.error("integration-audit: nothing to invalidate (empty set)");
    process.exit(2);
  }

  const byCriterion: Record<
    string,
    { removed: number; blocks: number }
  > = {};
  let totalBlocks = 0;
  let blocksAffected = 0;

  for (const block of walkBlocks(rootAbs)) {
    totalBlocks++;
    const qaPath = block.root + ".qa.json";
    const report = loadQaReport(qaPath);
    if (!report) continue;

    const details = invalidateBlock(
      report,
      toInvalidate,
      args.includeAgent,
    );
    if (details.length === 0) continue;
    blocksAffected++;
    for (const d of details) {
      const entry = (byCriterion[d.criterion] ??= { removed: 0, blocks: 0 });
      entry.removed += d.entries_removed;
      entry.blocks++;
    }

    if (!args.dryRun) {
      saveQaReport(qaPath, report);
    }
  }

  const summary = {
    root: relative(process.cwd(), rootAbs),
    criteria: toInvalidate,
    include_agent: args.includeAgent,
    dry_run: args.dryRun,
    totals: {
      blocks_scanned: totalBlocks,
      blocks_affected: blocksAffected,
      entries_invalidated: Object.values(byCriterion).reduce(
        (acc, v) => acc + v.removed,
        0,
      ),
    },
    by_criterion: byCriterion,
  };

  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(
      `\n[integration-audit] root=${summary.root} ` +
        `criteria=${toInvalidate.length} ` +
        `include_agent=${args.includeAgent} ` +
        `dry_run=${args.dryRun}\n`,
    );
    console.log(
      `Scanned ${totalBlocks} blocks; ${blocksAffected} affected; ` +
        `${summary.totals.entries_invalidated} entries invalidated\n`,
    );
    for (const [crit, info] of Object.entries(byCriterion)) {
      console.log(
        `  ${crit}: ${info.removed} entries / ${info.blocks} blocks`,
      );
    }
    if (args.dryRun) {
      console.log("\n(dry run — no files changed)");
    }
  }

  // Default behaviour: re-run `qa-sweep` to repopulate sidecars
  // for the invalidated criteria. Skipped under --dry-run or
  // --no-sweep.
  if (!args.dryRun && !args.noSweep) {
    if (!args.json) {
      console.log(
        `\n[integration-audit] re-running qa-sweep ` +
          `--only ${toInvalidate.join(",")}…`,
      );
    }
    const sweepScript = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "qa-sweep.ts",
    );
    const child = spawnSync(
      "bun",
      [
        "run",
        sweepScript,
        rootAbs,
        "--only",
        toInvalidate.join(","),
      ],
      { stdio: args.json ? "ignore" : "inherit" },
    );
    if (child.status !== 0) {
      console.error(
        `\n[integration-audit] qa-sweep exited non-zero (${child.status}) ` +
          `— sidecars may be partially repopulated`,
      );
      process.exit(child.status ?? 1);
    }
  }
}

run();
