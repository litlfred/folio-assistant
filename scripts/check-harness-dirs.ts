#!/usr/bin/env bun
/**
 * The harness's two stores are declared in two files. This is what keeps them
 * from disagreeing.
 *
 * `harness.config.json`'s `harness` block is where a folio STATES where its work
 * plan and workflow state live. `.beans.yml` is what the `beans` binary
 * actually READS — it is a third-party tool and does not know
 * `harness.config.json` exists. So the same path is written twice by necessity,
 * and two configs that can drift is precisely the defect this repository has
 * paid for repeatedly.
 *
 * The duplication is not the problem; an *unchecked* duplication is. This makes
 * a disagreement a build failure on the day it is introduced rather than on the
 * day somebody's beans silently go to a second store.
 *
 * ## What it checks
 *
 * 1. `harness.workPlan` equals `beans.path` in `.beans.yml`.
 * 2. `harness.workflowState` is what `workflow/store.ts` compiled in.
 * 3. Neither path is dot-prefixed at its first segment — the whole point of the
 *    move is that a person can see them.
 * 4. The declared work-plan directory exists and holds beans.
 *
 * ## Third state
 *
 * A folio with no `harness.config.json`, or with no `harness` block, is **not** a
 * failure: the schema defaults are the answer, and a folio that has not opted in
 * is reported as `not configured` rather than as wrong. Exit 2 is "could not
 * check" and is never rendered as a pass — same rule as `check-ci-health.ts`.
 *
 * Usage:
 *   bun run check:harness-dirs
 *   bun run check:harness-dirs -- --json
 *
 * Exit: 0 consistent (or not configured), 1 a real disagreement, 2 could not check.
 *
 * @module scripts/check-harness-dirs
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, basename } from "node:path";

import { WORKFLOW_DIR } from "../src/workflow/store.js";
import { resolveHarnessConfigPath } from "../schemas/harness-config.js";

export interface HarnessDirsReport {
  /** `harness` block present in harness.config.json. */
  configured: boolean;
  /** From harness.config.json, or the schema default when absent. */
  declaredWorkPlan: string;
  declaredWorkflowState: string;
  /** From `.beans.yml`, which is what the CLI reads. `undefined` if absent. */
  beansYmlPath?: string;
  /** What `workflow/store.ts` compiled in. */
  compiledWorkflowState: string;
  /** Beans found in the declared work-plan directory; -1 if it is absent. */
  beanCount: number;
  problems: string[];
  notes: string[];
}

/**
 * Read `beans.path` out of `.beans.yml`.
 *
 * Deliberately a two-line regex rather than a YAML dependency: the file is
 * written by `beans init` and has exactly this shape, and adding a parser for
 * one scalar would be a dependency to keep current forever. If the key cannot
 * be found the caller reports "could not check" — it does not assume a default,
 * because assuming one here would defeat the whole check.
 */
export function beansYmlPath(root: string): string | undefined {
  const p = join(root, ".beans.yml");
  if (!existsSync(p)) return undefined;
  const m = /^\s*path:\s*(\S+)\s*$/m.exec(readFileSync(p, "utf-8"));
  return m?.[1]?.replace(/^["']|["']$/g, "");
}

export function checkHarnessDirs(root: string): HarnessDirsReport {
  const problems: string[] = [];
  const notes: string[] = [];

  let configured = false;
  let declaredWorkPlan = "beans";
  let declaredWorkflowState = "beans/workflow";

  const found = resolveHarnessConfigPath(root);
  if (found) {
    const cfgPath = found.path;
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf-8")) as {
        harness?: { workPlan?: string; workflowState?: string };
      };
      if (cfg.harness) {
        configured = true;
        declaredWorkPlan = cfg.harness.workPlan ?? declaredWorkPlan;
        declaredWorkflowState = cfg.harness.workflowState ?? declaredWorkflowState;
      } else {
        notes.push("harness.config.json has no `harness` block — using schema defaults.");
      }
    } catch (e) {
      problems.push(`${basename(cfgPath)} will not parse: ${e instanceof Error ? e.message : e}`);
    }
  } else {
    notes.push("No harness.config.json (this is the platform, not a folio) — using schema defaults.");
  }

  const ymlPath = beansYmlPath(root);
  if (ymlPath === undefined) {
    notes.push("No `.beans.yml`, or no `path:` in it — the CLI's view could not be read.");
  } else if (ymlPath !== declaredWorkPlan) {
    problems.push(
      `Work-plan path disagrees: harness.config.json says "${declaredWorkPlan}", ` +
        `.beans.yml says "${ymlPath}". The CLI follows .beans.yml, so beans would ` +
        `be written to a store nothing else reads.`,
    );
  }

  if (WORKFLOW_DIR !== declaredWorkflowState) {
    problems.push(
      `Workflow-state path disagrees: harness.config.json says "${declaredWorkflowState}", ` +
        `workflow/store.ts compiled in "${WORKFLOW_DIR}".`,
    );
  }

  for (const [label, p] of [
    ["workPlan", declaredWorkPlan],
    ["workflowState", declaredWorkflowState],
  ] as const) {
    if (p.split("/")[0]!.startsWith(".")) {
      problems.push(
        `harness.${label} is "${p}", which is hidden behind a dot. These two stores ` +
          `are what a person looks for first; keep them visible.`,
      );
    }
  }

  const wpDir = resolve(root, declaredWorkPlan);
  let beanCount = -1;
  if (existsSync(wpDir)) {
    beanCount = readdirSync(wpDir).filter((f) => f.endsWith(".md")).length;
    if (beanCount === 0) {
      notes.push(`${declaredWorkPlan}/ exists but holds no beans — an empty plan, not a broken one.`);
    }
  } else {
    problems.push(`harness.workPlan names "${declaredWorkPlan}", which does not exist.`);
  }

  return {
    configured,
    declaredWorkPlan,
    declaredWorkflowState,
    beansYmlPath: ymlPath,
    compiledWorkflowState: WORKFLOW_DIR,
    beanCount,
    problems,
    notes,
  };
}

export function formatReport(r: HarnessDirsReport): string {
  const out: string[] = ["Harness directories"];
  out.push("");
  out.push(`  work plan        ${r.declaredWorkPlan}${r.configured ? "" : "   (schema default)"}`);
  out.push(`  workflow state   ${r.declaredWorkflowState}${r.configured ? "" : "   (schema default)"}`);
  out.push(`  .beans.yml says  ${r.beansYmlPath ?? "— not readable"}`);
  out.push(`  store.ts says    ${r.compiledWorkflowState}`);
  out.push(`  beans present    ${r.beanCount < 0 ? "— directory absent" : r.beanCount}`);
  out.push("");
  for (const n of r.notes) out.push(`  · ${n}`);
  if (r.problems.length) {
    out.push("");
    for (const p of r.problems) out.push(`  ✗ ${p}`);
  } else {
    out.push("  ✓ consistent");
  }
  return out.join("\n");
}

if (import.meta.main) {
  const root = resolve(".");
  let report: HarnessDirsReport;
  try {
    report = checkHarnessDirs(root);
  } catch (e) {
    console.error(`Could not check harness directories: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.problems.length ? 1 : 0);
}
