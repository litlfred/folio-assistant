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
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";
import { parse } from "yaml";

// The REPOSITORY root. `GATES_WORKFLOW` is `.github/workflows/…`, which
// belongs to the repository rather than to this instance, and the gates
// themselves are npm scripts run from the repository root. This arrived from
// `main` as `resolve(import.meta.dir, "..")` — correct there, because the
// instance and the repository were one directory; after the move (bean
// `wggr`) it named `cat-harness/.github/`, which does not exist, and
// `loadGates` would have thrown `NoGatesFound` on a workflow that is fine.
const ROOT = repoRootFor(resolve(import.meta.dir, ".."));

/** The workflow that defines the FAST set. One place, declared. */
export const GATES_WORKFLOW = join(".github", "workflows", "code-quality-gates.yml");

/** Where every workflow lives. `--all` reads all of them, not just the one. */
export const WORKFLOW_DIR = join(".github", "workflows");

/**
 * Why a step CI runs is not in the local set.
 *
 * ## The gap this closes, and what it cost
 *
 * This module read ONE workflow. Measured 2026-09-20: four others carry `bun`
 * steps CI executes and no local command did. It surfaced the way it had to —
 * `bun run gates --all` passed 46 gates on a tree CI then rejected, because
 * the npm script behind one gate was a strict SUBSET of the workflow's four
 * steps. "Green locally" and "green in CI" were two different claims with
 * nothing saying so, which is the `dh4f` shape applied to a checker rather
 * than a directory.
 *
 * ## Two legitimate reasons a step stays out, and one that is not
 *
 * **`covered-by`** — the workflow runs a GENERATOR and the gate set already
 * runs its `--check` twin. Running both locally would regenerate and then
 * verify what was just written, which passes by construction.
 *
 * **`ci-only`** — the step needs something a checkout does not have: a built
 * `_site`, a `gh-pages` working tree, a deploy slug off the event payload.
 *
 * **`no-folio`** — the step runs against a FOLIO's tree, and this repository is
 * the platform. `AGENTS.md` states the fact and names two of them; the table
 * below is the first place a machine can read it. These workflows resolve
 * `pipeline/build.ts`, `content/pipeline/qa-sweep.ts`, a `content/` at the
 * repository root — paths a folio has and the platform does not. They are not
 * broken and they are not runnable here, and until this table existed nothing
 * could tell either from a real gap.
 *
 * **Not a reason: "it is slow" or "it usually passes."** A step with no entry
 * here is reported as UNCLASSIFIED and fails `gates.test.ts`, so a new
 * workflow step lands in the gate set or in this table, and never in the gap
 * between them. The reason is required for the same cause `folio:no-skill`
 * and `workflow-policy.json` require one: an exemption nobody can review is
 * one somebody added to get to green.
 */
export interface StepExemption {
  /** Matched against the command as a substring — a script path, usually. */
  match: string;
  kind: "covered-by" | "ci-only" | "no-folio";
  reason: string;
}

export const STEP_EXEMPTIONS: StepExemption[] = [
  {
    match: "bun install",
    kind: "ci-only",
    reason: "installing dependencies is not a check; every workflow opens with it",
  },
  // ── Generators whose `--check` twin is gated ────────────────────────
  {
    match: "scripts/gen-schema-docs.ts",
    kind: "covered-by",
    reason: "`gen-schema-docs.ts --check` is in the gate set; the site build runs the writer",
  },
  {
    match: "scripts/gen-skill-docs.ts",
    kind: "covered-by",
    reason: "`gen-skill-docs.ts --check` is in the gate set; the site build runs the writer",
  },
  {
    match: "scripts/gen-docs-pages.ts",
    kind: "covered-by",
    reason: "`gen-docs-pages.ts --check` is in the gate set; the site build runs the writer",
  },
  {
    match: "run translation:index",
    kind: "covered-by",
    reason: "`translation:index:check` is in the gate set; the site build runs the writer",
  },
  {
    match: "gen-jsonld-context.ts --check",
    kind: "covered-by",
    reason: "run by `gen:jsonld:check`, which is in the gate set",
  },
  {
    match: "gen-block-jsonld.ts --check",
    kind: "covered-by",
    reason: "run by `gen:jsonld:check`, which is in the gate set",
  },
  {
    match: "gen-library-jsonld.ts --check",
    kind: "covered-by",
    reason: "run by `gen:jsonld:check`, which is in the gate set",
  },
  {
    // THE ONE THAT WAS MISSING, and the reason this table exists. It was not
    // in `gen:jsonld:check` at all until 2026-09-20 — three of the
    // workflow's four, with nothing comparing the lists.
    match: "gen-site-jsonld.ts --check",
    kind: "covered-by",
    reason: "run by `gen:jsonld:check`, which is in the gate set — added there the day this table was written",
  },
  // ── Runs against a FOLIO's tree, which the platform does not have ──
  //
  // `AGENTS.md`: "qa-sweep and witness-refresh fail by design in this repo:
  // the first preflights on `content/package.json`, the second needs
  // `computations/`, and the platform carries no folio." That was true of two
  // workflows and prose; it is true of these and now declared.
  //
  // WORTH SAYING PLAINLY: several of these were authored for `litlfred/qou`
  // and live here. One names `quantum-observable-universe` outright. Whether
  // they belong in the platform repository at all is bean `52dz` — this table
  // records what they are, and does not pretend that is the same as deciding
  // where they go.
  {
    match: "pipeline/build.ts",
    kind: "no-folio",
    reason: "a folio's LaTeX/Lean build; the platform has no `pipeline/` and no folio to build",
  },
  {
    match: "qa-sweep",
    kind: "no-folio",
    reason: "sweeps a folio's blocks; preflights on `content/package.json`, which the platform does not carry",
  },
  {
    match: "qa-staleness",
    kind: "no-folio",
    reason: "as `qa-sweep` — a verdict's freshness against blocks the platform does not have",
  },
  {
    match: "check-witnesses",
    kind: "no-folio",
    reason: "witness files are produced from a folio's computations; the platform has none",
  },
  {
    match: "render-atlas",
    kind: "no-folio",
    reason: "renders a folio's Lean atlas",
  },
  {
    match: "latex-overfull-report.ts",
    kind: "no-folio",
    reason: "reads `main.log` from a folio's LaTeX run",
  },
  {
    match: "qa-section-title-audit.ts",
    kind: "no-folio",
    reason: "audits a folio's section titles from a root `content/`; the platform's own content sits under the instance",
  },
  {
    match: "scripts/audit-wiring.ts",
    kind: "no-folio",
    reason: "a folio-side script; no such path in the platform",
  },
  {
    match: "scripts/section-story-audit.ts",
    kind: "no-folio",
    reason: "a folio-side script; no such path in the platform",
  },
  {
    match: "trivial-skeleton-audit.ts",
    kind: "no-folio",
    reason: "runs `--cwd content`, a folio's package root",
  },
  {
    match: "conditional-class-banner-audit.ts",
    kind: "no-folio",
    reason: "audits a folio's block banners from a root `content/`",
  },
  {
    match: "codemod-leanval.ts",
    kind: "no-folio",
    reason: "a codemod over a folio's Lean blocks",
  },
  // ── Needs something a checkout does not have ────────────────────────
  {
    match: "site-links.ts",
    kind: "ci-only",
    reason: "takes `--site ./_site`: it resolves links in the BUILT site, which Jekyll produces in CI",
  },
  {
    match: "strip-preview-seo.ts",
    kind: "ci-only",
    reason: "rewrites the built `_site` before a preview deploy; there is no `_site` in a checkout",
  },
  {
    match: "restore-staging.ts",
    kind: "ci-only",
    reason: "reconciles the `gh-pages` working tree against the open PRs' previews; needs that branch checked out",
  },
  {
    match: "staging-cleanup-preflight.ts",
    kind: "ci-only",
    reason: "takes a deploy slug off the event payload; there is no event locally",
  },
  {
    match: "--out \"./_site",
    kind: "ci-only",
    reason: "writes into the BUILT `_site`, which Jekyll produces in CI",
  },
  {
    match: "--out-dir ./_site",
    kind: "ci-only",
    reason: "writes into the BUILT `_site`, which Jekyll produces in CI",
  },
  {
    match: "$RUNNER_TEMP",
    kind: "ci-only",
    reason: "a scheduled report written to the runner's temp dir and posted to an issue; the script runs locally, the reporting does not",
  },
  {
    match: "bun pack",
    kind: "ci-only",
    reason: "builds a release tarball; only a tagged release run has anything to pack",
  },
  {
    match: "run render:bpmn",
    kind: "covered-by",
    reason: "`render:bpmn:check` is in the gate set; the site build runs the writer",
  },
  {
    match: "jsonld-label-resolution.test.ts",
    kind: "covered-by",
    reason: "`bun test` is in the gate set and runs every test file, this one included",
  },
];

/** The exemption covering this command, if any. */
export function exemptionFor(command: string): StepExemption | undefined {
  return STEP_EXEMPTIONS.find((e) => command.includes(e.match));
}

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
  if (!opts.all) return gates;

  // `--all` adds the OTHER workflows' locally-runnable steps. The fast set is
  // deliberately untouched: it is the inner loop, and widening it would make
  // the cheap check expensive without making it more true.
  const seen = new Set(gates.map((g) => g.command));
  for (const { file, step } of otherWorkflowSteps(root)) {
    if (seen.has(step.command)) continue;
    if (exemptionFor(step.command)) continue;
    seen.add(step.command);
    gates.push({ ...step, job: `${file}/${step.job}` });
  }
  return gates;
}

/** One `bun` step from a workflow that is not {@link GATES_WORKFLOW}. */
export interface ForeignStep {
  file: string;
  step: Gate;
}

/**
 * Every `bun` step in every OTHER workflow, in file order.
 *
 * Jobs are not filtered by {@link FAST_JOBS} here: that set names jobs of the
 * gates workflow, and a job called `typescript` in another file is a different
 * job. Reading them all and classifying each is what keeps the two lists from
 * drifting.
 */
export function otherWorkflowSteps(root: string): ForeignStep[] {
  const dir = join(root, WORKFLOW_DIR);
  const out: ForeignStep[] = [];
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort()) {
    const rel = join(WORKFLOW_DIR, f);
    if (rel === GATES_WORKFLOW) continue;
    for (const step of gatesFrom(readFileSync(join(dir, f), "utf-8"), { all: true })) {
      out.push({ file: f, step });
    }
  }
  return out;
}

/**
 * Steps CI runs that are neither gated nor exempted.
 *
 * **Never empty-by-accident:** an unreadable workflow directory yields an
 * empty `otherWorkflowSteps`, and this would then report nothing unclassified
 * — a clean run over a directory it could not read. `gates.test.ts` asserts
 * the step list is non-empty for exactly that reason.
 */
export function unclassifiedSteps(root: string): ForeignStep[] {
  const gated = new Set(loadGates(root, { all: false }).map((g) => g.command));
  for (const g of gatesFrom(readFileSync(join(root, GATES_WORKFLOW), "utf-8"), { all: true })) {
    gated.add(g.command);
  }
  return otherWorkflowSteps(root).filter(
    ({ step }) => !gated.has(step.command) && !exemptionFor(step.command),
  );
}

if (import.meta.main) {
  const all = process.argv.includes("--all");
  const listOnly = process.argv.includes("--list");
  const gates = loadGates(ROOT, { all });

  const scope = all
    ? "every job, plus every locally-runnable step from the other workflows"
    : `the fast set (${[...FAST_JOBS].join(", ")})`;
  console.log(`${gates.length} gate(s) — ${scope}\n`);

  // Reported on EVERY run, not only with `--list`: an unclassified step is a
  // check CI runs and this does not, and the whole cost of that gap was
  // learning about it from a red PR instead of from here.
  const unclassified = unclassifiedSteps(ROOT);
  if (unclassified.length) {
    console.log("UNCLASSIFIED — CI runs these and the local set does not:");
    for (const u of unclassified) console.log(`  ? ${u.file}: ${u.step.command}`);
    console.log("  Add each to the gate set, or to STEP_EXEMPTIONS with a reason.\n");
  }

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
