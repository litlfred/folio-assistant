#!/usr/bin/env bun
/**
 * A job that RUNS platform code must have CHECKED OUT the platform's submodules.
 *
 * @module folio-assistant/scripts/check-workflow-submodules
 * @covers none — an audit of this repository's workflow YAML; it judges, and writes nothing
 *
 * ## The defect this exists for
 *
 * `cat-harness/schemas/graph-typology-registry.ts` imports
 * `../../bootstrap-tools/schemas/graph`, and `bootstrap-tools` is a git
 * SUBMODULE. So any `bun run` of a platform script that reaches the schema
 * layer dies on `Cannot find module` unless its checkout carried
 * `submodules: true`. A schema import is the least visible dependency a script
 * can acquire — nothing in the script's own text mentions a submodule — and an
 * import added to `schemas/` can break a workflow that nobody edited.
 *
 * ## Why it is a gate and not a fixed list
 *
 * Measured 2026-10-02. `feature-staging.yml`'s `cleanup` job had failed on
 * exactly this for **six consecutive runs** across two days, and `STAGING/`
 * held **80** previews totalling ~19.5 GB, **47** of them for pull requests
 * already closed. The automatic cleanup had stopped working and the only
 * symptom was a red job nobody was reading.
 *
 * The failure mode is worse than a missing cleanup, and it is the reason this
 * is `critical` rather than advisory. In that job the order is: retire the
 * record, `rm -rf` the preview, write the render log, commit, push. The record
 * writer fails first but is guarded with `|| echo ::error`, so the `rm -rf`
 * proceeds; the `render-log.ts` call then dies and — under `bash -e` — aborts
 * the step. **The commit and push never happen.** The preview is deleted in the
 * runner's working copy and left untouched on the publish branch: a cleanup
 * that reports failure having changed nothing, while looking from the outside
 * like a cleanup that ran.
 *
 * A hardcoded list of the two offending steps would be the
 * `check-declared-assets` defect again — that module's own comment records a
 * hardcoded list going stale twice, and being "fixed" once by correcting the
 * list. So the pairs are DISCOVERED from the YAML and a new job is covered the
 * day it is written.
 *
 * ## What it can and cannot see
 *
 * It reads `uses: actions/checkout` steps and `run:` bodies per job. It does
 * NOT try to pair a script to the checkout it came from, and that is the
 * design rather than a shortcut: the paths are written `source/x.ts`,
 * `../source/x.ts` and `"$PLATFORM_DIR/x.ts"` in three jobs of the same
 * repository, and a textual pairing left 18 of them undetermined — including
 * both halves of the `cleanup-dispatch` job that has the very defect. A rule
 * whose answer is mostly "cannot tell" does not protect anything.
 *
 * So the rule is the conservative one: **if a job runs any platform script,
 * every non-publish checkout in that job must carry `submodules`.** It can
 * over-report — a job with two checkouts where only one supplies the script —
 * and that is the right direction to be wrong in, because the remedy is one
 * harmless line and the alternative is a silent broken cleanup.
 *
 * One blind spot remains and is printed every run rather than implied: a
 * composite action or reusable workflow that runs platform code on the
 * caller's behalf is invisible here, because this file reads only `run:`
 * bodies. That is the
 * `could-not-determine-is-a-third-state-everywhere` rule applied to this
 * check's own coverage rather than to its subject.
 *
 * A checkout of a PUBLISH branch is exempt: `gh-pages` and the
 * `publish_branch` input carry built output, never the platform's source, so
 * submodules would cost a large fetch for nothing.
 *
 * Exit: 0 clean, 1 a job runs platform code from a submodule-less checkout.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOWS = ".github/workflows";

/**
 * A publish branch holds BUILT output, so a checkout of one needs no
 * submodules. Matched on the `ref:` rather than on the path, because the path
 * is a local convention (`pages`) and the ref is the actual claim.
 */
const PUBLISH_REF = /^\s*ref:\s*(gh-pages|\$\{\{\s*inputs\.publish_branch\s*\}\})\s*$/;

/**
 * `bun run <path>` / `bun <path>`, where the path ends in `.ts`, however it is
 * spelled — `source/x.ts`, `../source/x.ts`, `"$PLATFORM_DIR/x.ts"`. A
 * `package.json` script name (`bun run gates`) is NOT matched: those resolve
 * through the checkout's own `package.json` and are covered by whichever
 * checkout that is, which this rule already requires to be complete.
 */
const BUN_RUN = /\bbun\s+(?:run\s+)?["']?([^"'\s]*\.ts)\b/g;

export interface Finding {
  readonly workflow: string;
  readonly job: string;
  readonly line: number;
  readonly detail: string;
}

interface CheckoutStep {
  readonly line: number;
  readonly path: string | undefined;
  readonly submodules: boolean;
  readonly publish: boolean;
}

interface Job {
  readonly name: string;
  readonly start: number;
  readonly lines: readonly string[];
}

/**
 * Split a workflow into jobs by indentation.
 *
 * Deliberately textual. A YAML parse would give a cleaner tree and lose the
 * LINE NUMBERS, and a finding a reader cannot navigate to is a finding they
 * have to re-find by hand.
 */
export function jobsOf(src: string): Job[] {
  const lines = src.split("\n");
  const jobs: Job[] = [];
  let inJobs = false;
  let current: { name: string; start: number; body: string[] } | undefined;
  const flush = (): void => {
    if (current) jobs.push({ name: current.name, start: current.start, lines: current.body });
    current = undefined;
  };
  for (const [i, line] of lines.entries()) {
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true;
      continue;
    }
    if (!inJobs) continue;
    // A non-indented, non-blank line ends the `jobs:` block.
    if (/^\S/.test(line)) {
      flush();
      inJobs = false;
      continue;
    }
    const header = /^  ([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (header?.[1] !== undefined) {
      flush();
      current = { name: header[1], start: i + 1, body: [] };
      continue;
    }
    current?.body.push(line);
  }
  flush();
  return jobs;
}

/** Every `actions/checkout` in one job, with the `with:` keys that matter here. */
export function checkoutsOf(job: Job): CheckoutStep[] {
  const out: CheckoutStep[] = [];
  for (const [i, line] of job.lines.entries()) {
    if (!/uses:\s*actions\/checkout/.test(line)) continue;
    // The step's own `with:` block: up to the next line at or below the
    // `- uses:`/`- name:` indentation, which is where the next step begins.
    const block: string[] = [];
    for (const next of job.lines.slice(i + 1)) {
      if (/^\s{0,8}- /.test(next)) break;
      block.push(next);
    }
    const pathLine = block.find((l) => /^\s*path:\s*\S/.test(l));
    out.push({
      line: job.start + i + 1,
      path: /^\s*path:\s*["']?([^"'\s]+)/.exec(pathLine ?? "")?.[1],
      submodules: block.some((l) => /^\s*submodules:\s*(true|recursive)\s*$/.test(l)),
      publish: block.some((l) => PUBLISH_REF.test(l)),
    });
  }
  return out;
}

/** Every platform script a job's `run:` bodies invoke, as written. */
export function bunRunsOf(job: Job): { line: number; script: string }[] {
  const out: { line: number; script: string }[] = [];
  for (const [i, line] of job.lines.entries()) {
    for (const m of line.matchAll(BUN_RUN)) {
      if (m[1] !== undefined) out.push({ line: job.start + i + 1, script: m[1] });
    }
  }
  return out;
}

export function auditWorkflow(
  file: string,
  src: string,
): { findings: Finding[]; composites: Finding[] } {
  const findings: Finding[] = [];
  const composites: Finding[] = [];
  for (const job of jobsOf(src)) {
    const checkouts = checkoutsOf(job).filter((c) => !c.publish);
    const runs = bunRunsOf(job);
    if (runs.length === 0) {
      // A job that runs no platform script but delegates to a composite action
      // could still be running one. Named, not assumed either way.
      for (const [i, line] of job.lines.entries()) {
        const m = /uses:\s*\.\/(\.github\/actions\/[A-Za-z0-9._/-]+)/.exec(line);
        if (m?.[1] !== undefined && checkouts.some((c) => !c.submodules)) {
          composites.push({
            workflow: file,
            job: job.name,
            line: job.start + i + 1,
            detail: `delegates to \`${m[1]}\` — whether that runs platform code is not readable here`,
          });
        }
      }
      continue;
    }
    const bare = checkouts.filter((c) => !c.submodules);
    if (bare.length === 0) continue;
    for (const c of bare) {
      findings.push({
        workflow: file,
        job: job.name,
        line: c.line,
        detail:
          `checkout has no \`submodules\`, and this job runs ${runs.length} platform ` +
          `script(s) (first: \`${runs[0]?.script ?? "?"}\` at line ${runs[0]?.line ?? 0}) — ` +
          `one reaching \`cat-harness/schemas/\` dies on \`bootstrap-tools\``,
      });
    }
  }
  return { findings, composites };
}

if (import.meta.main) {
  const files = readdirSync(WORKFLOWS)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .sort();
  const findings: Finding[] = [];
  const composites: Finding[] = [];
  for (const f of files) {
    const r = auditWorkflow(f, readFileSync(join(WORKFLOWS, f), "utf8"));
    findings.push(...r.findings);
    composites.push(...r.composites);
  }

  console.log(`Workflow submodules (${files.length} workflow(s) read)`);
  const seen = new Set<string>();
  for (const f of findings) {
    const key = `${f.workflow}:${f.job}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  ✗ ${f.workflow} › ${f.job} (line ${f.line}): ${f.detail}`);
  }
  if (findings.length === 0) {
    console.log("  ✓ every job that runs a platform script checked out its submodules");
  }
  if (composites.length > 0) {
    console.log(
      `\n  · ${composites.length} composite-action call(s) COULD NOT BE DETERMINED — reported, never counted clean:`,
    );
    for (const u of composites.slice(0, 8)) {
      console.log(`      ${u.workflow} › ${u.job} (line ${u.line}): ${u.detail}`);
    }
    if (composites.length > 8) console.log(`      …and ${composites.length - 8} more`);
    console.log(
      "    This file reads `run:` bodies, so platform code invoked INSIDE a composite\n" +
        "    action is not visible to it. Settle one by reading that action, or by adding\n" +
        "    `submodules: true` to the checkout and moving on.",
    );
  }
  process.exit(findings.length > 0 ? 1 : 0);
}
