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
    // The unattended PR sweep and its `gh` plumbing. `ci-only` rather than a
    // gate, for the same reason the script itself is exempt: a CI job asking
    // whether a commit has a CI run has already answered it. Bean `3pqn`.
    match: "check:prs-have-runs",
    kind: "ci-only",
    reason:
      "circular as a gate, and it needs `issues: write` and `pull-requests: write`, which the gate jobs deliberately do not have",
  },
  {
    // Mounts each instance's rendered content into the built site. It COPIES
    // rather than checks, so there is no verdict for a contributor to run —
    // and it is meaningless outside a job that has just built `_site/`.
    //
    // Its refusals are not exempt: the collision rule (two instances claiming
    // one path) is asserted by `mount-instance-docs.test.ts` in `bun test`,
    // which IS in the gate set, and the staleness of what it mounts is gated
    // by `iris:pages:check`.
    match: "mount-instance-docs.ts",
    kind: "ci-only",
    reason:
      "a DEPLOY step, not a check: it copies rendered output into ./_site, which only exists " +
      "inside the site-build job. Its path-collision refusal is covered by " +
      "mount-instance-docs.test.ts in `bun test`",
  },
  {
    // Its sibling, and exempt for the same reason. `compose-docs.ts` lays the
    // declared `docs` layers into one tree for Jekyll to build — base
    // (`cat-harness/docs/`) then the repository root's overlay. It COPIES
    // rather than checks, and its output is meaningless outside the job that
    // then runs Jekyll over it.
    //
    // Its guarantees are NOT exempt, and that distinction is the whole reason
    // an exemption here is safe: `compose-docs.test.ts` is in `bun test`, and
    // it asserts on the REAL tree that an empty overlay composes
    // byte-identically, that an override is both applied and REPORTED with
    // both layer ids, and that a declared layer with no directory is a finding
    // rather than a silent empty. Those are what make changing the live
    // publish path's `source:` sound; this exemption only says the copy itself
    // is not something a contributor runs for a verdict.
    match: "compose-docs.ts",
    kind: "ci-only",
    reason:
      "a BUILD step, not a check: it composes the declared docs layers into ./_docs for Jekyll, " +
      "which only means anything inside the site-build job. Its byte-identity, override-reporting " +
      "and missing-layer guarantees are covered by compose-docs.test.ts in `bun test`",
  },
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
  {
    match: "check:escaped-markup",
    kind: "ci-only",
    reason:
      "reads the ASSEMBLED `_site/` for the same reason, and the reason is sharper here: what " +
      "it looks for exists ONLY after the markdown conversion. The template that shipped the " +
      "defect was valid HTML — a Liquid whitespace strip welded two attributes together, " +
      "Kramdown refused the block and escaped it, and the landing page published " +
      "`&lt;article class=\"fa-sticky …\"` as visible text. Nothing readable from a checkout " +
      "could have seen that, which is why every source-level gate passed over it. Its three " +
      "states and the `<code>`/`<pre>` exclusion that keeps it off legitimate documentation " +
      "are covered by `check-escaped-markup.test.ts` in `bun test`, which is in the gate set",
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
  // The two projection writers are run by the SITE BUILD and by nothing else.
  //
  // Their `--check` twins are deliberately not in the gate set (owner,
  // 2026-09-20): both projections derive from the whole repository, so the
  // check reddens when somebody else merges rather than when the author
  // forgets — which is not an omission, and not what a gate is for. Saying
  // "covered-by" here would have been false the moment the gate came out.
  {
    match: "run schema:viz",
    kind: "covered-by",
    reason:
      "the site build runs the writer at deploy, so nothing PUBLISHED goes stale; " +
      "`schema:viz:check` is intentionally not gated — see code-quality-gates.yml",
  },
  {
    match: "run library:viz",
    kind: "covered-by",
    reason:
      "the site build runs the writer at deploy, so nothing PUBLISHED goes stale; " +
      "`library:viz:check` is intentionally not gated — see code-quality-gates.yml",
  },
  {
    match: "run uploads:viz",
    kind: "covered-by",
    reason:
      "the site build runs the writer at deploy, so nothing PUBLISHED goes stale; " +
      "`uploads:viz:check` is intentionally not gated, for `library:viz:check`'s reason — " +
      "it renders that same projection (bean `flh4`: one dataset, two viewers)",
  },
  {
    // The WRITER's step in the site build. Its `--check` IS gated — see the
    // reason beside it in code-quality-gates.yml — so this is the ordinary
    // writer-runs-at-deploy case rather than the schema/library exception.
    match: "run voices:viz",
    kind: "covered-by",
    reason: "`voices:viz:check` is in the gate set; the site build runs the writer at deploy",
  },
  {
    match: "run handler:index",
    kind: "covered-by",
    reason: "`handler:index:check` is in the gate set; the site build runs the writer at deploy",
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
    // Four call sites, one entry — `match` is a substring and the script is
    // the same in every retry loop in `feature-staging.yml`.
    match: "backoff-sleep.ts",
    kind: "ci-only",
    reason:
      "it SLEEPS. Running it as a gate would add a jittered wait of up to 24s to every " +
      "`bun run gates`, to observe a number `retry.test.ts` already covers at the source — " +
      "`waitFor` is the only arithmetic here and this script does not repeat it (bean `06kg`). " +
      "That it is reached from every retry loop, rather than each loop computing its own wait, " +
      "is covered by `retry-backoff-in-workflows.test.ts` in `bun test`, which is a gate",
  },
  {
    match: "staging-banner.ts",
    kind: "ci-only",
    reason:
      "injects the banner into the built `_site` and writes `staging.json` beside it; there is " +
      "no `_site` in a checkout, and the facts it writes (run id, event payload, publish-ref " +
      "listing) exist only in CI. The property it exists for — that the injected bytes do NOT " +
      "depend on the build, which is what lets git deduplicate a preview against its own next " +
      "rebuild (bean `g196`) — is covered by `staging-banner-constant.test.ts` in `bun test`, " +
      "and the client half it ships by `staging-banner.e2e.ts` in the e2e set. Both are gates",
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
    // The third spelling, and the reason there are three: `match` is a
    // substring, and a deploy step whose destination carries a shell variable
    // must quote it. `--out "./_site` and `--out-dir ./_site` were the two
    // forms that had occurred; `--out-dir "./_site` had not until a per-locale
    // export wrote into a foreign instance's subdirectory. Same reason, not a
    // new exemption — a step that got to green by being spelled differently
    // would be the thing this ratchet exists to stop.
    match: '--out-dir "./_site',
    kind: "ci-only",
    reason: "writes into the BUILT `_site`, which Jekyll produces in CI",
  },
  {
    match: "$RUNNER_TEMP",
    kind: "ci-only",
    reason: "a scheduled report written to the runner's temp dir and posted to an issue; the script runs locally, the reporting does not",
  },
  {
    // `bun pm pack`, renamed from `bun pack` 2026-09-20 (bean `frq2`) — the
    // latter is not a bun subcommand and so never ran. It sat as the dead
    // first branch of a `|| npm pack || tar … || true` chain, which is why
    // the release tarball could contain four files and no code without
    // anything failing.
    //
    // The old reason said "only a tagged release run has anything to pack".
    // That workflow has no tag trigger and never has; it is
    // `workflow_dispatch` only, and there are zero tags in this repository.
    match: "bun pm pack",
    kind: "ci-only",
    reason: "builds a release tarball; only a release run, dispatched by hand, has anything to pack",
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
    script: "schema:viz:check",
    kind: "covered-by",
    reason:
      "the site build runs the WRITER at deploy (`docs-site.yml`), so nothing published goes stale. Deliberately not gated (owner, 2026-09-20): the projection derives from the WHOLE repository, so the check reddens when somebody ELSE merges rather than when the author forgets. Measured on PR #583 — `main` moved four times in one session (120, 2, 2, 11 commits) and twice that reddened a branch whose own tree was correct. A red that is not an omission is the thing `gen-docs-pages --check` sets the standard against. Run it by hand, or from `/prepare-merge`",
  },
  {
    script: "library:viz:check",
    kind: "covered-by",
    reason:
      "same as `schema:viz:check` and for the same reason: the writer runs at deploy, and the projection derives from the whole repository, so its red means a sibling merged rather than that this diff forgot. Run it by hand, or from `/prepare-merge`",
  },
  {
    script: "uploads:viz:check",
    kind: "covered-by",
    reason:
      "same as `library:viz:check`, and NECESSARILY so: it renders that projection. The writer runs at deploy (`docs-site.yml`), and what it draws derives from the whole repository, so a red here means a sibling merged rather than that this diff forgot. Gating it would also be worse than gating its sibling, because this generator emits no projection of its own — it publishes a viewer over `assets/library/index.json` (bean `flh4`: one dataset, since two would be two answers to how many are queued), so its staleness is the library projection's staleness wearing a second name. Run it by hand, or from `/prepare-merge`",
  },
  {
    script: "check:session-staleness",
    kind: "report",
    reason:
      "CI CANNOT OBTAIN ITS INPUT, and that is the reason rather than a preference. Probed 2026-09-21 from inside a session container: no session credential in the environment, `api.anthropic.com/v1/sessions` -> 401, `claude.ai/api/code/sessions` -> 403. `list_sessions` is an MCP tool an AGENT holds, not an endpoint a script can call -- the same wall that makes `sibling-sessions.ts` infer sessions from commit trailers. Wired as a gate it would examine NOTHING and report a clean run over every session, which is the `dh4f` defect inside the check written to stop a clean-run-over-nothing one level up. It belongs in the session-start sweep, run by an agent that can produce the listing, or by hand with a saved payload. Bean `rq8s`",
  },
  {
    script: "check:ci-health",
    kind: "report",
    reason:
      "a REPORT, not a gate: it reads the DEFAULT BRANCH, so on a PR it describes main rather than the diff. `ci-health.yml` runs it",
  },
  {
    script: "check:head-has-run",
    kind: "report",
    reason:
      "CIRCULAR as a gate — it asks whether this commit has a workflow run, and a CI job asking that has already answered it. Bean `3pqn`: it exists for the moment BEFORE the run, when a PR shows zero checks and that is indistinguishable from checks not started. Run it by hand, or from `/prepare-merge`",
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
    script: "check:theme-art",
    kind: "report",
    reason:
      "prints every backdrop role and what intake found; `check:theme-art:check` is the gating form",
  },
  {
    script: "check:theme-art:check",
    kind: "report",
    // NOT a permanent exemption, and the unblocking condition is exact rather
    // than "when somebody gets round to it": it refuses `landing-architecture`,
    // which is declared with laptop and card and NO mobile crop.
    // `resolveThemeBackdrop` refuses an incomplete backdrop wholesale, so that
    // theme would render with no art at all — a real finding, not a false one.
    //
    // Gating on it today would make CI red over art that is MISSING rather than
    // over a regression somebody introduced, which is the one thing a ratchet
    // must not do. Wire it the moment the architecture mobile crop lands, or
    // the incomplete declaration is withdrawn.
    reason:
      "refuses `landing-architecture`, whose mobile crop has never been supplied; gating would make CI red over missing art rather than over a regression. Wire it when that crop lands",
  },
  {
    script: "check:undeclared-files",
    kind: "report",
    reason:
      "prints the unaccounted paths with their sizes; `check:undeclared-files:check` is the gating form and is wired",
  },
  {
    script: "ingest:ig:check",
    kind: "covered-by",
    reason:
      "re-derives an IG's artefact index from its PUBLISHED OUTPUT, which this repository does not carry — smart-trust's `gh-pages` is 342,656 files, so no runner here can supply the subject. `check:artifact-index` is wired and covers the half that needs only the repository: that every committed index is a valid `folio-fhir-artifact-index/v1` document, with `count` agreeing with its array and no DAK overlay on an index declaring `dakApi: \"absent\"`. That is DELIBERATELY less than this check would catch — an index that validates can still be stale against an IG that has moved on — and the difference is stated rather than papered over. The script itself exits 2 (\"could not determine\") when the source is absent, never 0, so wiring it would redden CI over a missing clone rather than over a regression. Run it by hand, or from `/prepare-merge`, with the IG checkout as its argument",
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

/**
 * What to print when the gate set could not be derived.
 *
 * Pure, and exported, for one reason: the CLI's `ROOT` is computed from this
 * file's own location (`repoRootFor(import.meta.dir/..)`), so no spawn test can
 * put it in a tree without workflows — `cd` elsewhere and it still reads this
 * repository's. The decision is therefore separated from the exit so the
 * decision is what gets tested.
 *
 * The wording matters as much as the code: a caller must be able to tell this
 * from a failure, so it says so in as many words rather than leaving the exit
 * code to carry the whole distinction.
 */
export function undeterminedReport(e: unknown, root: string): string[] {
  return [
    `? could not derive the gate set: ${e instanceof Error ? e.message : String(e)}`,
    `  Expected ${GATES_WORKFLOW} relative to ${root}.`,
    "  This is NOT a pass and NOT a failure — no verdict is possible, so nothing here",
    "  may be read as a clean tree. Exit 2.",
  ];
}

/**
 * Run a command, streaming its output AND keeping a copy.
 *
 * `stdio: "inherit"` was here, and the summary could say nothing about WHY a
 * gate failed because nothing was captured — bean `ucb9`. Capturing with
 * `spawnSync` and printing afterwards would have worked and is wrong: `bun
 * test` runs for the best part of a minute, and a contributor watching a
 * blank terminal for that long is a regression traded for a recap.
 *
 * So both. The child's streams are pumped to this process as they arrive,
 * which keeps the live output a reader already relies on, and accumulated so
 * the summary can quote the failing lines back at the end.
 */
async function runTee(cmd: string, args: string[]): Promise<{ code: number; output: string }> {
  const child = Bun.spawn([cmd, ...args], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
  const chunks: string[] = [];
  const pump = async (stream: ReadableStream<Uint8Array>, to: NodeJS.WriteStream): Promise<void> => {
    const decoder = new TextDecoder();
    for await (const chunk of stream) {
      const text = decoder.decode(chunk, { stream: true });
      chunks.push(text);
      to.write(text);
    }
  };
  await Promise.all([pump(child.stdout, process.stdout), pump(child.stderr, process.stderr)]);
  return { code: await child.exited, output: chunks.join("") };
}

/**
 * The lines from a failed gate's output worth repeating in the summary.
 *
 * NOT a `bun test` parser. Several shapes matter and each names a different
 * kind of drift, so the patterns are listed rather than one runner being
 * special-cased:
 *
 *   `(fail) <name>`   a test, by name — the shape that started this
 *   `✗ …` / `✘ …`     what most `*:check` scripts print
 *   `error: …`        a script that threw
 *
 * Capped, because a gate can fail in hundreds of places and a summary that
 * reprints all of them is the scrollback it was meant to replace. The cap is
 * reported rather than silent: "and N more" is a different statement from
 * showing everything, and a reader who sees the first is told to scroll.
 *
 * Returns EMPTY when nothing matched, and the caller says so out loud rather
 * than printing the gate alone as though there were nothing to say. An
 * unrecognised shape is not an absence of one — the same rule the rest of
 * this repository applies to could-not-determine.
 */
export function salientFailures(output: string, cap = 6): string[] {
  const shapes = [
    /^\(fail\)\s/,
    /^\s*(✗|✘)\s/,
    /^error:\s/i,
  ];
  const hits: string[] = [];
  const seen = new Set<string>();
  for (const raw of output.split("\n")) {
    const line = raw.replace(/\u001b\[[0-9;]*m/g, "").trimEnd();
    if (!shapes.some((re) => re.test(line))) continue;
    const t = line.trim();
    // A gate that fails a hundred files prints the same shape a hundred
    // times; the SUMMARY wants the distinct ones.
    if (seen.has(t)) continue;
    seen.add(t);
    hits.push(t.length > 160 ? `${t.slice(0, 157)}…` : t);
    if (hits.length === cap) {
      hits.push(`…and more — scroll up for this gate's full output`);
      break;
    }
  }
  return hits;
}

if (import.meta.main) {
  // `await` below — the gate loop tees each child's output (bean `ucb9`).
  const all = process.argv.includes("--all");
  const listOnly = process.argv.includes("--list");

  // ── The third state (bean `6366`) ──────────────────────────────────────
  //
  // Until now this exited 0 or 1 only, so "every gate passed" and "I could not
  // work out what the gates ARE" were the same answer. They are not.
  //
  // `loadGates` was ALREADY right about this and says so in its own message —
  // "no gate commands were extracted. That is not a clean sweep, it is a broken
  // reader" — and it throws for both shapes: the workflow file absent, and the
  // file present but yielding nothing. The defect was here, in the CLI, which
  // let that throw escape as an uncaught exception and so reported a
  // could-not-determine as exit **1**, indistinguishable from a real failure.
  //
  // So this block adds no detection. It translates a refusal the library already
  // makes into the exit code the third-state rule requires, and there is
  // deliberately NO `gates.length === 0` branch underneath it: that check cannot
  // fire, because `loadGates` throws first. A guard that cannot fire is the
  // `build-glossary` dead-guard defect, which reads as protection and is not.
  //
  // Note what is NOT exit 2. UNCLASSIFIED and UNRUN below are *determined*
  // findings — the set is known and every member is named — so they stay a loud
  // report at the existing exit codes. "I know exactly which steps are missing"
  // is not "I could not tell".
  let gates: Gate[];
  try {
    gates = loadGates(ROOT, { all });
  } catch (e) {
    for (const line of undeterminedReport(e, ROOT)) console.error(line);
    process.exit(2);
  }

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

  const failed: { gate: Gate; why: string[] }[] = [];
  for (const g of gates) {
    process.stdout.write(`▸ ${g.command}\n`);
    const [cmd, ...args] = g.command.split(/\s+/);
    const r = await runTee(cmd!, args);
    if (r.code !== 0) failed.push({ gate: g, why: salientFailures(r.output) });
  }

  console.log("");
  if (failed.length === 0) {
    console.log(`✓ ${gates.length} gate(s) pass — the ${all ? "whole" : "fast"} set.`);
    if (!all) console.log("  `bun run gates --all` adds the browser jobs before you push.");
    process.exit(0);
  }
  console.log(`✗ ${failed.length} of ${gates.length} failed:`);
  for (const { gate, why } of failed) {
    console.log(`  · ${gate.command}   (${gate.job} / ${gate.step})`);
    // The whole point of bean `ucb9`. Without these lines a gate that is
    // ALREADY red for a reason you know stays byte-identical when a second
    // failure joins it, and red -> red-for-a-new-reason is invisible where
    // green -> red is loud. The invisible transition is the one that reaches
    // CI: it did, on bean `7yvd`, 2026-09-20.
    for (const line of why) console.log(`      ${line}`);
  }
  if (failed.some(({ why }) => why.length === 0)) {
    console.log(
      `\n  A gate with no lines quoted above printed nothing this tool recognised as a\n` +
        `  failure. Scroll up and read its output — an unrecognised shape is not an\n` +
        `  absence of one.`,
    );
  }
  process.exit(1);
}
