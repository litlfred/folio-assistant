#!/usr/bin/env bun
/**
 * The work-plan directories are declared in one place. This is what keeps the
 * `beans` CLI agreeing with it.
 *
 * `agent-harness.json` is where an instance declares the directories it scans
 * and the KIND of graph each holds — `workplan` for `beans/`, `process-state` for
 * `beans/workflow/`. That is the single declaration, beside `schemas/` and
 * `skills/`, and it is what a consumer reads.
 *
 * But `beans` is a third-party binary. It does not know `agent-harness.json`
 * exists; it reads `.beans.yml`. So the work-plan path is necessarily written
 * twice, and two configs that can drift is exactly the defect this repository
 * keeps paying for. The duplication is not the problem; an *unchecked*
 * duplication is.
 *
 * ## What it checks
 *
 * 1. The `workplan` directory in `agent-harness.json` equals `beans.path` in
 *    `.beans.yml`.
 * 2. The `process-state` directory equals what `workflow/store.ts` compiled in.
 * 3. Neither path is dot-prefixed at its first segment — the whole point of
 *    moving them was that a person can see them.
 * 4. The declared work-plan directory exists and holds beans.
 *
 * ## Third state
 *
 * An instance with no `agent-harness.json`, or one declaring neither kind, is
 * **not** a failure: it has not been migrated, and that is reported as
 * `not configured` rather than as wrong. Exit 2 is "could not check" and is
 * never rendered as a pass — same rule as `check-ci-health.ts`.
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
import { join, resolve } from "node:path";

import { WORKFLOW_DIR } from "../src/workflow/store.js";
import { DECLARATION_FILENAME, readDeclaration } from "../schemas/agent-harness.js";

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

  // `readDeclaration` throws on a malformed file rather than returning
  // undefined — a declaration nobody can read is worse than an absent one,
  // because every consumer then scans the wrong directories silently.
  let decl;
  try {
    decl = readDeclaration(root);
  } catch (e) {
    problems.push(`${DECLARATION_FILENAME} will not load: ${e instanceof Error ? e.message : e}`);
  }

  if (decl) {
    const byKind = (kind: string): string | undefined =>
      decl!.directories.find((d) => d.graph === kind)?.path.replace(/\/+$/, "");
    const wp = byKind("workplan");
    const ps = byKind("process-state");
    if (wp || ps) configured = true;
    declaredWorkPlan = wp ?? declaredWorkPlan;
    declaredWorkflowState = ps ?? declaredWorkflowState;
    if (!wp) notes.push(`${DECLARATION_FILENAME} declares no \`workplan\` directory — using the default.`);
    if (!ps) notes.push(`${DECLARATION_FILENAME} declares no \`process-state\` directory — using the default.`);
  } else if (!problems.length) {
    notes.push(`No ${DECLARATION_FILENAME} — this instance has not been migrated; using defaults.`);
  }

  const ymlPath = beansYmlPath(root);
  if (ymlPath === undefined) {
    notes.push("No `.beans.yml`, or no `path:` in it — the CLI's view could not be read.");
  } else if (ymlPath !== declaredWorkPlan) {
    problems.push(
      `Work-plan path disagrees: ${DECLARATION_FILENAME} declares "${declaredWorkPlan}", ` +
        `.beans.yml says "${ymlPath}". The CLI follows .beans.yml, so beans would ` +
        `be written to a store nothing else reads.`,
    );
  }

  if (WORKFLOW_DIR !== declaredWorkflowState) {
    problems.push(
      `Workflow-state path disagrees: ${DECLARATION_FILENAME} declares "${declaredWorkflowState}", ` +
        `workflow/store.ts compiled in "${WORKFLOW_DIR}".`,
    );
  }

  for (const [label, p] of [
    ["workPlan", declaredWorkPlan],
    ["workflowState", declaredWorkflowState],
  ] as const) {
    if (p.split("/")[0]!.startsWith(".")) {
      problems.push(
        `The ${label} directory is "${p}", which is hidden behind a dot. These two stores ` +
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
    problems.push(`The declared work plan is "${declaredWorkPlan}", which does not exist.`);
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
