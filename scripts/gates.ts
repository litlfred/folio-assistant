#!/usr/bin/env bun
/**
 * Run the gates CI runs — DERIVED from the workflow, never listed here.
 *
 * Bean `folio-assistant-n60j`. The SDLC audit
 * (`fsh-guts/proposals/sdlc-process-audit.md` §3) found the VERIFICATION
 * phase unowned for the platform: the commands a contributor runs before
 * pushing lived in `package.json` and in CI YAML and nowhere an agent was
 * told to read. An agent found them by grepping.
 *
 * ## Why the workflow is the authority, and `package.json` is not
 *
 * The failure being prevented is specifically **locally green, red in CI**.
 * So the question an agent needs answered is not "what checks exist" — it is
 * *"what will CI run against my change"*. Only the workflow knows that.
 *
 * `package.json` over-answers it. Measured 2026-09-19: of 33 `check:` /
 * `:check` scripts, 21 appeared in no workflow at all — running them all
 * would fail on things CI does not gate, and the workflow's own comments
 * list six it deliberately excludes, each with a reason (`check:ci-health`
 * is a report, not a gate; `check:corpus-gate` needs a folio; and so on).
 *
 * A hand-maintained list under-answers it, and this script exists because
 * that was demonstrated rather than feared: the agent writing it had run
 * **17** gates by hand that day, repeatedly, and reported them as the sweep.
 * The workflow runs about thirty. The list was a guess that read as coverage
 * — exactly the drift bean `n60j` predicted a restated list would suffer.
 *
 * ## Fast vs full is DERIVED too
 *
 * From job membership, not from a judgement encoded here. The `typescript`
 * job needs no browser; the `e2e` job installs Chromium, which is why
 * `render:bpmn:check` lives there — bpmn-js renders through a browser, and
 * it passed "locally" once only because a browser had been staged earlier in
 * that session. Default is the fast set; `--all` adds the rest.
 *
 * ## The vacuity guard
 *
 * If the extraction finds no commands it **fails**. A runner that silently
 * executes an empty list exits 0 and reads as a clean sweep — the defect
 * this repository has now paid for in `lean-bare-import` (a grep over zero
 * files reporting OK), in `ruff` (a scan of missing paths reporting a clean
 * baseline it never computed), and in `readme:sync:check` (passing over a
 * README with no markers). A filter over nothing passes.
 *
 * Usage:
 *   bun run gates              # the fast set — what the `typescript` job runs
 *   bun run gates --all        # plus the jobs that need a browser
 *   bun run gates --list       # print them and exit, running nothing
 *
 * @module scripts/gates
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";

const ROOT = resolve(import.meta.dir, "..");

/** The workflow that defines what "the gates" means. One place, declared. */
export const GATES_WORKFLOW = join(".github", "workflows", "code-quality-gates.yml");

/** Jobs whose steps need no browser — the inner loop. */
const FAST_JOBS = new Set(["typescript"]);

/** One runnable gate, with the job and step that ask for it. */
export interface Gate {
  job: string;
  /** The step's `name:`, which is what the Actions UI shows on a failure. */
  step: string;
  /** The command line, exactly as the workflow runs it. */
  command: string;
}

/**
 * Every gate the workflow runs, in workflow order.
 *
 * Only `bun`/`bunx` lines are taken. The Lean, Python and Rust jobs are shell
 * scripts against trees a folio has and the platform does not — they SKIP
 * here by design, and running their bodies locally would report a clean scan
 * of nothing, which is the thing this module refuses to do.
 */
export function gatesFrom(workflowText: string, opts: { all?: boolean } = {}): Gate[] {
  const doc = parse(workflowText) as {
    jobs?: Record<string, { steps?: { name?: string; run?: string }[] }>;
  };
  const out: Gate[] = [];
  for (const [job, def] of Object.entries(doc.jobs ?? {})) {
    if (!opts.all && !FAST_JOBS.has(job)) continue;
    for (const step of def.steps ?? []) {
      if (!step.run) continue;
      // A step's `run` may hold several lines; each `bun …` line is its own
      // gate, which is also how the workflow's own multi-command step is
      // meant to be read (`set -e`: the first failure names itself).
      for (const raw of step.run.split("\n")) {
        const line = raw.trim();
        if (!/^(bun|bunx) /.test(line)) continue;
        out.push({ job, step: step.name ?? "(unnamed step)", command: line });
      }
    }
  }
  return out;
}

/** Thrown when the extraction finds nothing — never reported as a clean run. */
export class NoGatesFound extends Error {
  constructor(path: string) {
    super(
      `${path}: no gate commands were extracted. That is not a clean sweep, ` +
        `it is a broken reader — the workflow was renamed, restructured, or ` +
        `no longer runs its checks through \`bun\`. Fix the extraction or the ` +
        `workflow; do not treat this as green.`,
    );
    this.name = "NoGatesFound";
  }
}

/** Read and parse, refusing an empty result. */
export function loadGates(root: string, opts: { all?: boolean } = {}): Gate[] {
  const path = join(root, GATES_WORKFLOW);
  const gates = gatesFrom(readFileSync(path, "utf-8"), opts);
  if (gates.length === 0) throw new NoGatesFound(GATES_WORKFLOW);
  return gates;
}

if (import.meta.main) {
  const all = process.argv.includes("--all");
  const listOnly = process.argv.includes("--list");
  const gates = loadGates(ROOT, { all });

  const scope = all ? "every job" : `the fast set (${[...FAST_JOBS].join(", ")})`;
  console.log(`${gates.length} gate(s) from ${GATES_WORKFLOW} — ${scope}\n`);

  if (listOnly) {
    for (const g of gates) console.log(`  ${g.command.padEnd(52)} ${g.step}`);
    console.log(
      all ? "" : "\n`--all` adds the jobs that need a browser (bpmn-js renders through Chromium).",
    );
    process.exit(0);
  }

  const failed: Gate[] = [];
  for (const g of gates) {
    process.stdout.write(`▸ ${g.command}\n`);
    const [cmd, ...args] = g.command.split(/\s+/);
    const r = spawnSync(cmd!, args, { cwd: ROOT, stdio: "inherit" });
    if (r.status !== 0) failed.push(g);
  }

  console.log("");
  if (failed.length === 0) {
    console.log(`✓ ${gates.length} gate(s) pass — the ${all ? "whole" : "fast"} set.`);
    if (!all) console.log("  `bun run gates --all` adds the browser jobs before you push.");
    process.exit(0);
  }
  console.log(`✗ ${failed.length} of ${gates.length} failed:`);
  for (const g of failed) console.log(`  · ${g.command}   (${g.job} / ${g.step})`);
  process.exit(1);
}
