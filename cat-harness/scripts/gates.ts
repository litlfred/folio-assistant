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
 * **`no-folio`** — the step's INPUT is a folio's tree, and this repository is
 * the platform. `AGENTS.md` states the fact and names two of them; the table
 * below is the first place a machine can read it.
 *
 * Say it precisely, because the imprecise version was wrong here for two
 * months and three entries still carried it on 2026-09-20: **the scripts are
 * the platform's** — `cat-harness/scripts/audit-wiring.ts` and friends are
 * right here. Two entries said "no such path in the platform", which was
 * false, and a third said the platform "has no `pipeline/`", which was also
 * false. An exemption resting on a false reason is precisely what this table
 * exists to prevent, so the error mattered more here than it would have in
 * prose (bean `52dz`).
 *
 * **And the corrected version was still wrong, one turn later.** It said what
 * these steps lack is "the `content/` tree they read" — owner, 2026-09-20:
 * *"content/ shouldnt be expected anymore. folio/ was renamed as
 * default/convention."* So `no-folio` here does not mean "a folio tree we
 * happen not to carry". It means these steps `cd` into `content/`, a root the
 * convention has moved off. `cat-harness/harness.json` already declares
 * `folio/` holding the `folio` graph and carries no `content` entry at all.
 *
 * Two corrections to one paragraph in one day is the argument for the table
 * rather than against it: prose drifts silently, an entry here is read by
 * `check:workflow-paths` and by `gates.test.ts`.
 *
 * The one case where the distinction has teeth: `pipeline/build.ts` runs after
 * `cd content` and names a FOLIO's build, while `cat-harness/content/pipeline/
 * build.ts` exists and is a different file with the same basename. "Fixing"
 * the path to the platform's copy would look correct and silently run the
 * wrong program. `check:workflow-paths` records that as a `FOLIO_PATHS`
 * exemption with the same reason, and a test pins it.
 *
 * What the rename does NOT yet reach — `scripts/init-folio.ts` still
 * scaffolds `content/<slug>/`, and these workflows still `cd content` — is
 * `52dz`'s open half and the owner's call, not this table's to settle.
 *
 * These steps are not broken and not runnable here, and until this table
 * existed nothing could tell either from a real gap.
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
  {
    // One entry, four call sites — `stage`, both `cleanup` paths and
    // `cleanup-dispatch` — because `match` is a substring and the script is
    // the same in all of them, reached by three different relative paths.
    match: "scripts/render-log.ts",
    kind: "ci-only",
    reason:
      "APPENDS to the render log in a `gh-pages` working tree, using a slug off the event " +
      "payload — it writes what happened rather than checking anything, and there is nothing " +
      "for a contributor to run locally. Its refusals (a reasonless removal, an unsafe path) " +
      "are covered by `render-log.test.ts` in `bun test`, and the WIRING by " +
      "`workflow-yaml.test.ts`, both of which are in the gate set",
  },
  {
    match: "check:maintained-artefacts",
    kind: "ci-only",
    reason:
      "reads the ASSEMBLED `_site/`, which exists only after the site build has run — the " +
      "whole point of the check is that a `maintains` claim is verified against what actually " +
      "shipped, not against the source it was generated from, so there is nothing for a " +
      "contributor to run locally and no `--check` twin to gate. Its three-state behaviour " +
      "(exit 2 for could-not-determine, never folded into a pass) is covered by " +
      "`check-maintained-artefacts.test.ts` in `bun test`, which is in the gate set",
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
    reason:
      "runs after `cd content`, so it names a FOLIO's build. `cat-harness/" +
      "content/pipeline/build.ts` does exist — a different file sharing the " +
      "basename — so resolving to it would be a wrong fix that looks right " +
      "(bean `52dz`, 2026-09-20)",
  },
  {
    match: "qa-sweep",
    kind: "no-folio",
    reason:
      "sweeps a folio's blocks from `content/`, a root the convention has " +
      "retired in favour of `folio/` (owner, 2026-09-20)",
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
    reason:
      "audits section titles from a root `content/` — retired; the " +
      "convention is `folio/`, which this instance declares",
  },
  {
    match: "scripts/audit-wiring.ts",
    kind: "no-folio",
    reason:
      "the SCRIPT is the platform's (`cat-harness/scripts/audit-wiring.ts`); " +
      "what it needs and the platform lacks is a folio's witness tree. The " +
      "earlier reason here — \"no such path in the platform\" — was false, " +
      "and an exemption resting on a false reason is what this table exists " +
      "to prevent (bean `52dz`)",
  },
  {
    match: "scripts/section-story-audit.ts",
    kind: "no-folio",
    reason:
      "as `audit-wiring.ts`: the script is the platform's, the section tree " +
      "it audits is a folio's. Previous reason was false (bean `52dz`)",
  },
  {
    match: "trivial-skeleton-audit.ts",
    kind: "no-folio",
    reason: "runs `--cwd content`, a root the convention has retired",
  },
  {
    match: "conditional-class-banner-audit.ts",
    kind: "no-folio",
    reason: "audits block banners from the retired `content/` root; see `52dz`",
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

/* ─────────────────────────────────────────────────────────────────────────
 * The OTHER direction: a check script no workflow runs.
 *
 * `unclassifiedSteps` asks "CI runs this — does the local set?". Its domain
 * is steps found IN WORKFLOWS, which makes it structurally unable to report a
 * check that appears in no workflow at all. Measured 2026-09-20: **9 of 46**
 * `check:` / `:check` scripts here are in no workflow, and one of them,
 * `translate-kg-viewer:check`, was RED on main for an unknown stretch while
 * CI stayed green — bean `ot9a`, which is bean `xom7`'s shape one level down.
 *
 * ## This does NOT make `package.json` the authority
 *
 * The module header's argument stands and is not being re-litigated: the
 * RUNNER derives from the workflow, because the question it answers is *"what
 * will CI run against my change"* and only the workflow knows that. Running
 * every script in `package.json` would fail on things CI does not gate.
 *
 * This asks a different question — *"is there a check nobody runs?"* — and a
 * different question needs a different domain. Six of the nine already had
 * reasons, written as a COMMENT in `code-quality-gates.yml`. A comment cannot
 * be compared against the set it describes, which is why the other three
 * (`health:check`, `landing:data:check`, `landing:sticky:check`) had no reason
 * anywhere and nothing said so.
 *
 * And a reason nothing checks is free to be false. The comment excluded
 * `translate-*:check` as needing *"a translation toolchain not installed on
 * this runner"*; both run clean on a bare checkout, measured. That exclusion
 * kept two working gates out of CI on a premise no longer true.
 * ───────────────────────────────────────────────────────────────────────── */

/** Why a check script is not wired into a workflow. */
export interface ScriptExemption {
  /** The script name, matched EXACTLY. Never a substring — see below. */
  script: string;
  kind: "report" | "covered-by" | "no-folio" | "scheduled";
  reason: string;
}

/**
 * The check scripts CI deliberately does not gate, each with its reason.
 *
 * Lifted out of a comment in `code-quality-gates.yml`. Same reasons, now in
 * a place a test can compare against the actual script list — which is the
 * whole difference, since the comment silently covered six of nine.
 */
export const SCRIPT_EXEMPTIONS: ScriptExemption[] = [
  {
    script: "check:ci-health",
    kind: "report",
    reason:
      "a REPORT, not a gate: it reads the DEFAULT BRANCH, so on a PR it describes main rather than the diff. `ci-health.yml` runs it",
  },
  {
    script: "check:corpus-gate",
    kind: "no-folio",
    reason: "runs over a folio's content tree; the platform carries none",
  },
  {
    script: "check:upstream-pins",
    kind: "scheduled",
    reason: "`upstream-pins.yml` runs it weekly; pins do not move with a diff",
  },
  {
    script: "check:partition:edges",
    kind: "report",
    reason: "prints the edge list; `check:partition` is the gate and is wired",
  },
  {
    script: "health:check",
    kind: "covered-by",
    reason:
      "`health-check.yml` runs `test/health/run.ts` directly rather than through this script name — daily, and it commits its results",
  },
];

/** Thrown when the script scan finds nothing — never reported as full coverage. */
export class NoCheckScriptsFound extends Error {
  constructor(path: string) {
    super(
      `${path}: no \`check:\` or \`:check\` scripts were found. That is not ` +
        `full coverage, it is a broken reader — a filter over nothing passes. ` +
        `Fix the scan; do not treat this as green.`,
    );
    this.name = "NoCheckScriptsFound";
  }
}

/** The exemption covering this script, if any. Exact name, never a substring. */
export function scriptExemptionFor(script: string): ScriptExemption | undefined {
  return SCRIPT_EXEMPTIONS.find((e) => e.script === script);
}

/** Every `check:` / `:check` script this repository declares. */
export function checkScriptNames(root: string): string[] {
  const path = join(root, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf-8")) as { scripts?: Record<string, string> };
  const names = Object.keys(pkg.scripts ?? {})
    .filter((n) => n.startsWith("check:") || n.endsWith(":check"))
    .sort();
  if (names.length === 0) throw new NoCheckScriptsFound("package.json");
  return names;
}

/**
 * Does this command invoke that script?
 *
 * The name must end at a token boundary. A substring match would read
 * `bun run check:partition` as running `check:partition:edges` — two scripts
 * that differ precisely in that one is the gate and the other is a report —
 * and the ungated one would report as covered.
 */
export function commandRunsScript(command: string, script: string): boolean {
  const escaped = script.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)bun run ${escaped}(\\s|$)`).test(command);
}

/** Every `bun` command any workflow runs, the gate set included. */
export function commandsCiRuns(root: string): string[] {
  const out = gatesFrom(readFileSync(join(root, GATES_WORKFLOW), "utf-8"), { all: true }).map(
    (g) => g.command,
  );
  for (const { step } of otherWorkflowSteps(root)) out.push(step.command);
  return out;
}

/**
 * Check scripts no workflow runs and no exemption covers.
 *
 * **Never empty-by-accident:** {@link checkScriptNames} throws on an empty
 * scan rather than returning `[]`, which would read as total coverage.
 */
export function unrunScripts(root: string): string[] {
  const commands = commandsCiRuns(root);
  return checkScriptNames(root).filter(
    (n) => !commands.some((c) => commandRunsScript(c, n)) && !scriptExemptionFor(n),
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

  // The other direction, and reported just as loudly: a check script no
  // workflow runs is a gate that cannot fail. `translate-kg-viewer:check` was
  // red on main while CI was green, because nothing ran it (bean `ot9a`).
  const unrun = unrunScripts(ROOT);
  if (unrun.length) {
    console.log("UNRUN — declared in package.json and in NO workflow:");
    for (const u of unrun) console.log(`  ? bun run ${u}`);
    console.log("  Wire each into a workflow, or add it to SCRIPT_EXEMPTIONS with a reason.\n");
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
