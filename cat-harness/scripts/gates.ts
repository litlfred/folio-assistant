#!/usr/bin/env bun
/**
 * Run the gates CI runs — DERIVED from the workflow, never listed here.
 *
 * Bean `folio-assistant-n60j`. The SDLC audit
 * (`cat-harness/docs/proposals/sdlc-process-audit.md` §3) found the VERIFICATION
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
 *   bun run gates --jobs 3     # pool size for read-only gates (default: CPUs - 1)
 *
 * Gates whose script declares `outputs: []` in `task-io.ts` run in a worker
 * pool, output printed in workflow order; every other gate runs alone, as it
 * always did (bean `xpcu`).
 *
 * @module scripts/gates
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";
import { parse } from "yaml";

import { distortions } from "./check-environment.ts";

import {
  diffReadings,
  formatMutations,
  formatUndetermined,
  readTree,
  type GateMutation,
} from "./gate-tree-guard.js";
import { jobsFromArgv, orderedEmitter, runCaptured, runPool } from "./task-pool.ts";
import { gateReadsOnly } from "./task-io.ts";

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
 * `52dz`'s owner ruling (2026-09-24) settled the rest: the generic QA
 * workflows and the Lean workflows that `cd content` were moved OUT of
 * `.github/workflows/` into the platform's `templates/`, which `folio_init`
 * writes into a new folio pointed at `folio/`. Their entries left this table
 * with them — an exemption for a step no workflow here runs is the stale
 * claim `gates.test.ts` refuses.
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
    // Bean `wnhh`: each IG whose repository carries a seeded `fhir-ast/*`
    // cache is rendered from it into the preview at `/<instance>/ast/`. The
    // lister asks each IG repository over the network (`git ls-remote`).
    match: "fhir-harness/scripts/stage-ast-sites.ts",
    kind: "ci-only",
    reason:
      "a BUILD step, not a check: it lists the IGs whose repositories carry an AST cache by asking " +
      "each repository over the network; best effort (continue-on-error), its output only feeds the preview",
  },
  {
    // Bean `bamf`: each IG's own just-the-docs site, staged from the source
    // repository its menu.json records. A BUILD step: it clones and copies,
    // and has no verdict a contributor could run without the network and a
    // built `_site/`. The staging logic is asserted by
    // stage-ig-sites.test.ts and build-ig-site.test.ts in `bun test`.
    match: "fhir-harness/scripts/stage-ig-sites.ts",
    kind: "ci-only",
    reason:
      "a BUILD step, not a check: it clones each IG's recorded source and stages a Jekyll source; " +
      "its logic is covered by stage-ig-sites.test.ts and build-ig-site.test.ts in `bun test`",
  },
  {
    // Its post-build sibling: repairs repeated ids in a BUILT IG site and
    // reports each. Writes into `./_site`, which only the staging job has;
    // `dedupeIds` is covered by build-ig-site.test.ts, and the result is
    // judged by `check:duplicate-ids` in the same job.
    match: "fhir-harness/scripts/build-ig-site.ts --dedupe-ids",
    kind: "ci-only",
    reason:
      "a DEPLOY step: it rewrites ids in ./_site, which only the staging job produces; dedupeIds is " +
      "covered by build-ig-site.test.ts, and check:duplicate-ids judges the result",
  },
  {
    // Bean `oi1y`. Rails the pages Jekyll copies through verbatim — wireframe
    // `as-is.html` and bootstrap's `.md`-rendered siblings — which inherit no
    // layout and so no sidebar.
    //
    // `ci-only` for the same reason as `mount-instance-docs`: it WRITES INTO a
    // built `./_site`, which only the deploy and staging jobs produce, so there
    // is nothing for it to operate on in the fast set. Its logic is pinned by
    // `standalone-rail.test.ts` in `bun test`, over a fixture site carrying one
    // page per case, and `bun run preview:site` builds a site to run it on.
    //
    // Its ORDERING is the part no unit test can hold: it must run after every
    // generator that writes a page, and a version that ran 142 lines earlier
    // missed ten pages silently. That is asserted by
    // `check:invocation-parity`, which requires both workflows to run it.
    match: "rail-standalone-pages",
    kind: "ci-only",
    reason:
      "writes into the built ./_site that only the deploy and staging jobs produce; its logic is " +
      "pinned by standalone-rail.test.ts in `bun test`, and its ordering by check:invocation-parity",
  },
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
    // Bean `uoob`. The merge guard's evaluate mode, posting the `merge-guard`
    // commit status. Its subject is a PULL REQUEST's live state on GitHub —
    // labels, comments, timeline, the head's runs — not the tree, so a
    // contributor has no verdict to get from it locally, and it needs
    // `statuses: write`. Its logic is pinned by merge-guard.test.ts in
    // `bun test`, against the three real PRs it exists because of.
    match: "scripts/merge-guard.ts",
    kind: "ci-only",
    reason:
      "judges a PR's live GitHub state rather than the tree and needs `statuses: write`; its logic is " +
      "covered by merge-guard.test.ts in `bun test`",
  },
  {
    // Bean `16ei`. The scheduled retention job for the `qa-reports` branch.
    // It WRITES a branch rather than judging a tree, needs `contents: write`
    // and `pull-requests: read`, and a contributor has no verdict to get from
    // it. Its rule is pinned by `qa-store.test.ts` in `bun test`, on real
    // repositories.
    match: "qa:prune",
    kind: "ci-only",
    reason:
      "a scheduled WRITE to the qa-reports branch, not a check; its retention rule and its " +
      "tip-only rewrite are covered by qa-store.test.ts in `bun test`",
  },
  {
    // Bean `uknu`. It reads a BUILT Jekyll site, which only the staging job
    // produces (`actions/jekyll-build-pages`), so it cannot join the fast set.
    // Its logic is pinned by `duplicate-ids.test.ts`, which IS in `bun test`,
    // and `bun run preview:site` builds a site to run it on locally.
    match: "check:duplicate-ids",
    kind: "ci-only",
    reason:
      "runs on the built ./_site that only the staging job produces; its scanner and the " +
      "nav include's one-checkbox rule are pinned by duplicate-ids.test.ts in `bun test`",
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
  // and lived here. Bean `52dz` decided where they go (owner, 2026-09-24):
  // `qa-sweep.yml`, `qa-sweep-nightly.yml`, `section-title-audit.yml` and the
  // four Lean workflows are now templates `folio_init` writes, so the
  // `qa-staleness` and `qa-section-title-audit.ts` entries went with them.
  // What remains below still matches a workflow in `.github/workflows/`.
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
    // Since `52dz` the only match is the reusable `folio-staging.yml`, which
    // runs inside a FOLIO's staging job and sweeps that folio's `folio_dir`.
    match: "qa-sweep",
    kind: "no-folio",
    reason:
      "runs inside a FOLIO's staging job (`folio-staging.yml`, a reusable " +
      "workflow) over that folio's blocks; the platform carries no folio. " +
      "The standalone qa-sweep workflows are folio_init templates (bean `52dz`)",
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
    match: "publish-verify.ts",
    kind: "ci-only",
    reason:
      "takes `--dir ./_site`: it verifies the BUILT site before a deploy (bean `vigi`); its " +
      "logic is covered in a checkout by publish-verify.test.ts, which builds the documents in memory",
  },
  {
    match: "search-split.ts",
    kind: "ci-only",
    reason:
      "takes `--dir ./_site`: it cuts the BUILT (or, on a preview, borrowed) search index into per-scope " +
      "indices (bean `m7mn`); there is no `_site` in a checkout. Its scope rule, partition and determinism " +
      "are covered by search-split.test.ts, and its output on every deployed tree by publish-verify's " +
      "`search-scopes` verifier",
  },
  {
    match: "publish-id-lookup.ts",
    kind: "ci-only",
    reason:
      "takes `--site ./_site`: it copies the identifier-lookup client and each declared index into the BUILT " +
      "site (bean `1br0`); there is no `_site` in a checkout. Covered by publish-id-lookup.test.ts, and on " +
      "every deployed tree by publish-verify's `search-scopes`, which fails a linked lookup the tree lacks",
  },
  {
    match: "strip-preview-seo.ts",
    kind: "ci-only",
    reason: "rewrites the built `_site` before a preview deploy; there is no `_site` in a checkout",
  },
  {
    // Its last-in-the-pipeline sibling: drops the comments and the unrendered
    // inter-tag whitespace from every emitted page. `ci-only` for the same
    // reason — it takes `--site ./_site` — and for one more that is specific
    // to it: the saving it reports is a fact about the BUILT tree, so a gate
    // run in a checkout would have nothing to measure and would print 0.
    //
    // There IS a `--check` mode, and it is deliberately not gated: it reports
    // what a build would save rather than passing or failing, so it is a
    // measurement, not a verdict. The verdicts are elsewhere —
    // `minify-site.test.ts` holds the equivalence rules (verbatim regions
    // untouched, word boundaries kept, the three comment classes that stay)
    // and idempotency, and `bun run preview:site` builds a tree to run it on.
    match: "minify-site.ts",
    kind: "ci-only",
    reason:
      "takes `--site ./_site`: it minifies the BUILT tree as the last pass before a publish, and " +
      "there is no `_site` in a checkout. Its equivalence rules and its idempotency are covered " +
      "by minify-site.test.ts in `bun test`, and its ORDERING — after every check and rewrite " +
      "that reads the built HTML, two of which decide whether a marker is inside a COMMENT " +
      "(bean `ur84`) — by check:invocation-parity requiring both workflows to run it",
  },
  {
    match: "set-html-lang.ts",
    kind: "ci-only",
    reason:
      "takes `--site ./_site`: it rewrites the BUILT site's `<html>` tags before a deploy (bean " +
      "`zru7`); there is no `_site` in a checkout, and its logic is covered here by " +
      "set-html-lang.test.ts, which builds pages as strings",
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
    // The ChangeSet step of `folio-staging.yml`, the reusable workflow folios
    // call (bean `ojcx`). It computes over a folio's `folio` graph against
    // its base, and this repository holds no folio, so there is nothing for
    // a gate here to run it on. Its logic is not exempt: every change kind
    // is asserted by `folio-assistant-core/schemas/changeset.test.ts` in
    // `bun test`, which IS in the gate set.
    match: "changeset.ts",
    kind: "no-folio",
    reason:
      "runs inside a FOLIO's staging job over that folio's graph; the platform carries no folio. " +
      "Covered by changeset.test.ts in `bun test`",
  },
  {
    // Same reason as the ChangeSet above (bean `423d`): the review-comments
    // Tool ingests a FOLIO's pull-request comments against that folio's
    // blocks, in the folio's staging job and in its comment-triggered
    // refresh. The platform has no folio and no such pull request to run it
    // on here. Its logic is not exempt: `review-comments.test.ts` (the Tool,
    // including the command run offline exactly as both jobs call it) and
    // `review-comment.test.ts` (the kind) are in `bun test`.
    match: "review-comments.ts",
    kind: "no-folio",
    reason:
      "runs inside a FOLIO's staging and comment-refresh jobs over that folio's PR and blocks; the platform carries no folio. " +
      "Covered by review-comments.test.ts and review-comment.test.ts in `bun test`",
  },
  {
    // The same reason again (bean `qbfi`): the block QA summary reads a
    // FOLIO's committed verdicts, in that folio's staging job. The platform
    // has no folio. Its logic is covered by `publish-block-qa.test.ts` and
    // the heat map's unit and Playwright tests, in the gate set.
    match: "publish-block-qa.ts",
    kind: "no-folio",
    reason:
      "runs inside a FOLIO's staging job over that folio's committed QA verdicts; the platform carries no folio. " +
      "Covered by publish-block-qa.test.ts and the review heat map tests in `bun test` and the e2e job",
  },
  {
    // The same reason (bean `0rxe`): the visual diff pictures a FOLIO's
    // changed figures on that folio's published main site and staging build.
    // The platform has no folio. The pixel compare is unit-tested, and the
    // whole Tool runs in Chromium in `block-screenshots.e2e.ts`.
    match: "block-screenshots.ts",
    kind: "no-folio",
    reason:
      "runs inside a FOLIO's staging job over that folio's published site and staging build; the platform carries no folio. " +
      "Covered by block-screenshots.test.ts in `bun test` and block-screenshots.e2e.ts in the e2e job",
  },
  {
    // Bean `5uuf`: publishes a FOLIO's main site at its publish branch's root,
    // the before side of every preview. The platform has no folio, and no
    // publish branch checked out in a gate run.
    match: "publish-main-site.ts",
    kind: "no-folio",
    reason:
      "runs inside a FOLIO's publish-main job over that folio's built site and its publish branch; the platform carries no folio. " +
      "Covered by publish-main-site.test.ts in `bun test`: the manifest, the reserved paths, and the refusals",
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
    match: "staging-record.ts",
    kind: "ci-only",
    reason:
      "writes the preview's `staging-preview` record into the built `_site` at deploy time (bean `6pfo`); " +
      "the PR, issue and the already-published record it updates exist only in CI and on `gh-pages`. " +
      "Its rules — builtAt kept, a retired record refused as live, a corrupt one refused — are in " +
      "`schemas/staging-preview.ts` and covered by `staging-record.test.ts` in `bun test`",
  },
  {
    match: "staging-rotate.ts",
    kind: "ci-only",
    reason:
      "enforces the preview cap (owner ruling 2026-10-02, issue #1868) by removing previews from a " +
      "`gh-pages` checkout at deploy time; that checkout exists only in CI. Its rules — the cap counts " +
      "the current preview, the oldest go, `_retired/` and non-previews are untouched, the age " +
      "fallbacks — are covered by `staging-rotate.test.ts` in `bun test`",
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

/**
 * Does this job install a browser? — the inner loop's one question.
 *
 * **Derived, because the sentence this replaces already said the answer was
 * derivable.** `FAST_JOBS = new Set(["typescript", "gates"])` was documented
 * as *"jobs whose steps need no browser"* and as *"Chromium … is the only
 * question this set actually asks"* — a predicate, written out, beside a
 * hardcoded list of the jobs that happened to satisfy it. Asking it directly
 * removes the gap where those two can disagree.
 *
 * The hazard the old comment names is real and this keeps it: a job the set
 * does not name contributes NOTHING, so `bun run gates` would shrink while
 * still printing a confident pass, and {@link NoGatesFound} could not catch it
 * because the remaining jobs still yield commands. Bean `om30` had to widen
 * the literal by hand when it split the job; the next split will not.
 *
 * It was also already wrong in the other direction. `dependency-advisories`
 * runs `bun run check:dependency-advisories`, needs no browser, and was absent
 * from the literal — so one CI gate had never run in the local fast set at all
 * (157 → 158).
 *
 * `playwright install` is the discriminator rather than a job's name: it is
 * what actually costs the 36 seconds and actually requires Chromium.
 */
function installsBrowser(def: { steps?: { run?: string }[] }): boolean {
  return (def.steps ?? []).some((s) => /playwright\s+install/.test(s.run ?? ""));
}

/**
 * A job granted `contents: write` is a PUBLISHER, not a gate.
 *
 * Bean `16ei`: `code-quality-gates.yml` gained a job that publishes the QA
 * results to the `qa-reports` branch after the gates have run. Its `bun run
 * qa:publish` line would otherwise be extracted here and run by `bun run
 * gates` on a contributor's machine — a gate set that PUSHES. No gate needs
 * write access to judge a tree, so the permission is the structural
 * discriminator, as `playwright install` is for {@link installsBrowser}: it is
 * what the job actually holds, not what it is called.
 *
 * SCOPED TO THE GATES WORKFLOW ({@link loadGates}). Other workflows have jobs
 * holding `contents: write` too — `publish.yml`'s, for one — and their `bun`
 * steps are still classified by {@link otherWorkflowSteps} and the exemption
 * table, which is what keeps a CI step from going unaccounted for. The first
 * version applied it everywhere and three exemptions stopped matching.
 */
export function publishes(def: { permissions?: unknown }): boolean {
  const p = def.permissions;
  if (p === "write-all") return true;
  return typeof p === "object" && p !== null && (p as Record<string, unknown>).contents === "write";
}

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
/**
 * `$VAR` or `${VAR}` — a shell variable this reader cannot resolve.
 *
 * ## Why a command carrying one is NOT a gate
 *
 * The extraction keeps `bun …` lines and discards everything else, which
 * necessarily discards the shell that gave those lines their variables.
 * `code-quality-gates.yml` writes
 *
 *     base="$(git merge-base origin/main HEAD 2>/dev/null || true)"   # :1345
 *     bun run translation:catalogue:check -- --base "$base"           # :1348
 *
 * and only the second line survives. Run as written, git is handed a ref
 * literally named `$base`, so the check exits 2 with *"could not determine:
 * git would not list what this change adds (`$base..HEAD`)"* — on every
 * branch, forever. Measured 2026-10-02, bean `9zok`: this made
 * `bun run gates` report `✗ 1 of 210` on a clean tree, which means the STRICT
 * pre-push rule in `AGENTS.md` was unsatisfiable as written.
 *
 * ## Why skipping loses nothing, and why that was checked rather than assumed
 *
 * The obvious worry is that skipping hides a gate. It does not here, and the
 * reason is measurable: the SAME script is invoked twice in that workflow —
 * once with `--base` for CI, which has a PR base sha, and once bare at :1321
 * for when it does not. Both are extracted, so the bare form already runs in
 * the same sweep. Measured on this workflow: 2 `translation:catalogue`
 * invocations extracted, and exactly 1 command in the whole set carrying an
 * unexpanded variable.
 *
 * ## It is reported, never silently dropped
 *
 * This file's own `NoGatesFound` doctrine is that a reader finding nothing is
 * not a clean sweep. The same applies one command at a time: a skipped
 * command is printed every run under its own heading, so "this reader cannot
 * run it" stays distinguishable from "it passed". Resolving the variable
 * properly would mean executing the workflow's shell, which is a different
 * and much larger thing than reading it.
 */
/** What {@link gatesFrom} takes: `all` widens to the browser jobs; `skipPublishers` drops jobs holding `contents: write` (bean `16ei`). */
export interface GateOpts {
  all?: boolean;
  skipPublishers?: boolean;
}

const SHELL_VAR = /\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/;

/** Whether a command references a shell variable this reader cannot resolve. */
export function carriesUnexpandedVariable(command: string): boolean {
  return SHELL_VAR.test(command);
}

export function gatesFrom(workflowText: string, opts: GateOpts = {}): Gate[] {
  const doc = parse(workflowText) as {
    jobs?: Record<string, { permissions?: unknown; steps?: { name?: string; run?: string }[] }>;
  };
  const out: Gate[] = [];
  for (const [job, def] of Object.entries(doc.jobs ?? {})) {
    if (!opts.all && installsBrowser(def)) continue;
    if (opts.skipPublishers && publishes(def)) continue;
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

/**
 * The commands this reader READ but cannot run.
 *
 * A VIEW over {@link gatesFrom}, not a narrowing of it, and that distinction
 * was paid for: the first version of this fix filtered inside `gatesFrom`
 * itself, which broke two tests that were right to break. `gatesFrom` answers
 * **"what does CI run"** — `unclassifiedSteps` and the `STEP_EXEMPTIONS`
 * staleness check both read it that way, and 14 exemptions went stale the
 * moment a command vanished from it — while *this* answers "what can I run
 * here". CI runs the `--base` command correctly, with a shell; only this tool
 * cannot. Removing it from the first answer asserted something false about CI.
 */
export function unresolvedGatesFrom(workflowText: string, opts: GateOpts = {}): Gate[] {
  return gatesFrom(workflowText, opts).filter((g) => carriesUnexpandedVariable(g.command));
}

/**
 * What this tool will actually run: {@link gatesFrom} minus
 * {@link unresolvedGatesFrom}. The two partition the extraction, so a command
 * is in exactly one of them and none goes missing from both.
 */
export function runnableGatesFrom(workflowText: string, opts: GateOpts = {}): Gate[] {
  return gatesFrom(workflowText, opts).filter((g) => !carriesUnexpandedVariable(g.command));
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

/**
 * The commands this reader could not run, for the CLI to print.
 *
 * Separate from {@link loadGates} rather than returned beside it, because a
 * caller that wants the runnable set must not have to destructure an
 * "and also these" it can then ignore — that is how a skipped gate becomes a
 * silent one.
 */
export function loadUnresolved(root: string, opts: { all?: boolean } = {}): Gate[] {
  // Publishers are dropped here as in `loadGates`: they are not gates, so
  // they are neither run nor reported as unrunnable (bean `16ei`).
  return unresolvedGatesFrom(readFileSync(join(root, GATES_WORKFLOW), "utf-8"), { ...opts, skipPublishers: true });
}

/**
 * Every gate CI RUNS — the runnable set plus the ones only this tool cannot run.
 *
 * The third consumer of this list, and the second time the layering caught me
 * out. `audit:coverage` asks "how many gates declare a kind", which is a
 * question about CI: a gate CI runs and that declares `@covers` still covers
 * its kind, whether or not a local runner can execute it. Pointing it at
 * {@link loadGates} silently shrank its census from 210 to 209 and turned
 * *"all 210 gates have declared, so this is a verdict rather than an upper
 * bound"* into a verdict over a smaller set than reality.
 *
 * So the two questions get two functions with their names on them:
 * `loadGates` for **what can I run**, this for **what does CI run**.
 */
export function loadGatesCiRuns(root: string, opts: { all?: boolean } = {}): Gate[] {
  return [...loadGates(root, opts), ...loadUnresolved(root, opts)];
}

/** Read and parse, refusing an empty result. The RUNNER's list — see {@link loadGatesCiRuns}. */
export function loadGates(root: string, opts: { all?: boolean } = {}): Gate[] {
  const path = join(root, GATES_WORKFLOW);
  // The RUNNER's list, so the filter belongs here rather than in `gatesFrom`:
  // a command referencing a shell variable this reader discarded cannot be run
  // as written, but CI does run it, and `gatesFrom` is what the accounting
  // checks read as "what CI runs". `reportUnresolved` prints what this drops.
  const gates = runnableGatesFrom(readFileSync(path, "utf-8"), { ...opts, skipPublishers: true });
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
 * Jobs are not filtered by {@link installsBrowser} here: that question is asked of the
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
    script: "check:test-budgets",
    kind: "report",
    reason:
      "IT HAS NO SUBJECT UNTIL A SUITE HAS RUN — bean `sff8`. It reads a junit report produced by `bun test --reporter=junit`, so as a gate it would either duplicate the ~5-minute suite or run against a file that is not there; a missing report is exit 2, `could not determine`, which as a CI step would be a gate whose normal state is unable to fire. Its subject is also the wrong KIND for a gate: a test's cost is a fact about the MACHINE, not about this repository, so red here would report the runner while every reviewer read it as a verdict on the diff — the always-red-signal defect `check:bun-runtime` names one input over. Nothing it reports is a defect in this repository's source, so it exits 0 or 2 and never 1 (`nytj`), and 0 cases is exit 2 rather than a clean run over nothing (`6tkl`). It writes NO sidecar, deliberately, because committing milliseconds would pin this container's numbers as the corpus's — the `3vc1` defect — and `check:ci-health` already carries the precedent for asking a machine-shaped question externally every run and caching it nowhere. Whether a threshold should ever GATE is left open on the bean rather than settled here: ~50 cases sit at half the default budget under load, so a threshold gate would need 50 exemptions nobody has read, which is the empty exemption `xd1g` removed a gate for",
  },
  {
    script: "check:environment",
    kind: "report",
    reason:
      "A PRECONDITION, not a gate — bean `3vc1`. `gates.ts` calls `distortions()` directly before running anything and refuses the whole set on a finding, so the script exists for a contributor to ask the same question standalone. It is deliberately in NO workflow: CI installs only from the repository root, so a nested install cannot arise there and the step would be a gate that can never fire — which reads as protection and is not, the same dead-guard defect this file names for `build-glossary`. Its findings exit 2, never 1: a distorted environment is `could not determine` and nothing it reports is a defect in this repository's source (`nytj`). Measured: a nested `bun install` under `adapters/mcp-server` takes root `tsc` from 0 errors to 12 across 6 files with no source change, while CI on the identical commit is green",
  },
  {
    script: "check:bun-runtime",
    kind: "report",
    reason:
      "CI CANNOT OBTAIN A MISMATCH \u2014 the `ingest:ig-menu:check` shape, one input over. It compares the Bun RUNNING in this process against `.bun-version`, and CI installs `.bun-version` at all 22 `setup-bun` sites (that is `check:bun-pin`, which IS gated), so on a runner `running === pinned` by construction. Wired as a gate it would exercise nothing on every run, and its one interesting state would be unreachable from the only place it was ever checked. Its subject is the ENVIRONMENT rather than the corpus, so no commit can change the answer either: red here would report the machine while every reviewer read it as a verdict on the diff, which is the second always-red signal #1442 removed the first one for. **It is not unrun.** `session-start-coord-sweep.sh` runs it with `--markdown` on every session start. What it reports there changed once already: it was built to warn that a mismatched bun rewrites 72 of 86 sidecars on every sweep, and #1452 removed `engine_version` from `saveQaScriptSidecar`'s write-skip comparison, so nothing is rewritten and THAT CLAIM IS RETRACTED (measured: 0 rewritten where this container had produced 72). What it says now is that the agent is not running the code CI will judge its push with, and that a checker changed here stamps its sidecar with the older local engine \u2014 `rmcf`'s downgrade concern, which needs a real content change and is no longer an every-run event. Built so a blind run cannot read as clean: no pin, an unparseable pin or no Bun to ask all exit **2** as `cannot-tell`, never 0. Run it by hand, or read it at session start. Bean `3ozg`",
  },
  {
    script: "check:quiet-claims",
    kind: "report",
    reason:
      "A REPORT, and deliberately not a gate — bean `omki`. It supplies the NETWORK half of `bean-quiet-claims` (an open pull request naming a bean, an unmerged branch changing its file), so it needs a reachable GitHub API and a token, and it fetches before it reads because `pomp` makes ref freshness part of the evidence. Gating on it would make every PR depend on api.github.com being up, and it would redden when a SIBLING's branch merges rather than when this author forgot anything — the property `schema:viz:check` is exempt for. Its findings exit 0 on purpose: a quiet claim is a fact about the repository, not a defect in a diff. Could-not-determine exits 2, so a caller cannot read a blind sweep as a clean one. Run it by hand, or from a goal-review sweep",
  },
  {
    script: "check:kind-validators",
    kind: "covered-by",
    reason:
      "SUBSUMED by `check:kind-validators:require-all`, which CI runs: the same script with a flag that adds one assertion — that no kind has stayed silent about a validator — and performs this one's entire job besides. Kept as a script because the bare form is the REPORT, and a contributor adding a kind wants to read the three states without the non-zero exit while they are still deciding which one applies. Bean `rj0n`",
  },
  {
    script: "check:harness-state",
    kind: "covered-by",
    reason:
      "SUBSUMED by `check:harness-state:check`, which CI runs: the same script with `--check`, so it examines exactly the same four families and fails on a finding instead of reporting it. Kept as a script because the writer is what refreshes the committed sidecar, and a contributor wants the report without the non-zero exit while they are still fixing things. Bean `h1wq`",
  },
  {
    script: "check:source-licence",
    kind: "covered-by",
    reason:
      "SUBSUMED by `check:source-licence:check`, which CI runs: the same script with `--check`, so it computes the same report and fails on the same malformed records, and additionally fails when the committed sidecar is not what the corpus produces. The bare form is the WRITER of `test/results/source-licence.qa-results.json`, and it used to be the gate — so the gate rewrote the record it should have judged, and a stale sidecar failed nothing (bean `i2kp`). Kept as the author's command, and as the writer `regen` pairs with the `:check` twin",
  },
  {
    script: "check:library-qa",
    kind: "covered-by",
    reason:
      "SUBSUMED by `check:library-qa:check`, which CI runs: the same script with `--check`, so it judges exactly the same library entries and fails on a stale sidecar or a could-not-determine entry instead of rewriting the sidecar. Kept as a script because the writer is what refreshes `library-entry-qa.qa-results.json` after an ingest. Issue #1794, bean `8iqc`",
  },
  {
    script: "audit:coverage:check",
    kind: "covered-by",
    reason:
      "SUBSUMED by `audit:coverage:require-all`, which CI runs: that is the same script with `--check --require-all`, so it performs this check's entire job and one more assertion on top. Kept as a script because it is what a contributor runs locally when they want the staleness answer WITHOUT being told about a gate somebody else left undeclared — the two questions have different owners. Bean `3srh`",
  },
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
    script: "wireframe:check",
    kind: "covered-by",
    reason:
      "not a gate but the Tool `wireframe-check`: it takes the candidate files to render as arguments, and with none it has nothing to measure. What it writes, `checks/report.json` beside each wireframe, IS gated, by `check:wireframes`, which fails on a declared visualiser whose wireframe has no report, or a report missing a viewport or holding a fail (issue #1023). Run it by hand when a wireframe changes",
  },
  {
    script: "check:reference-direction",
    kind: "report",
    reason:
      "ADVISORY BECAUSE THE COUNT IS NOT ZERO YET, and for no other reason \u2014 1,206 wrong-direction occurrences across 275 files, measured 2026-09-30, of which 453 in 47 files are PENDING. The repository's own precedent settles this: the ruff comment in `code-quality-gates.yml`, and `repo-partition.ts`'s note that its two axes were each enforced only as they reached zero. Turning a red gate on just teaches the next agent to append `|| true`. It is built so an advisory run CANNOT be mistaken for a clean one: the summary always prints `undetermined \u2014 NOT clean` with its count and what landed there, and 969 occurrences do. THAT NUMBER WAS 11,090 UNTIL 2026-09-30: `folio-assistant` names the repository, the published product AND the root instance, and the check resolved a reference against the instance's ROOT \u2014 which is the repo root, because the declaration file lives there \u2014 rather than against the two directories the instance DECLARES. It now decides per occurrence, so a URL or a repo path reads as `names-repository` (1,986 of them) and only a bare mention with no path and no URL stays undetermined. `--strict` exits 1 on any wrong-direction occurrence and is what flips this to `kind: \"gate\"` once the backlog is drained. NOTHING RUNS THIS SCRIPT IN CI \u2014 `grep -rn 'reference-direction' .github/workflows/` returns 0, so the PENDING guard is UNENFORCED and this entry said the opposite until 2026-09-30 (bean `vzo5`). It exits 1 today on 75 files that name several instances above them and are not in PENDING, which is why wiring it as-is would land red; whether those 75 join PENDING or are ruled on is `zhg2`'s open question, not this entry's to assume. What IS enforced on every run is the IMPORT half of the same arrow \u2014 `check:partition`, 0/0, computing direction through the very same `layer-direction.ts` this consumes, though `p11x` records that its scan is rooted at `cat-harness/` and so cannot see cross-instance edges. Issue #1219, beans `zhg2`, `vzo5`",
  },
  {
    script: "ingest:ig-menu:check",
    kind: "report",
    reason:
      "CI CANNOT OBTAIN ITS INPUT. It compares the committed `menu.json` against the IG's OWN `sushi-config.yaml`, which lives in the upstream source repository — not in this checkout, and not reachable from a runner: `worldhealthorganization.github.io:443` and `litlfred.github.io:443` both answer 403 CONNECT from this environment (measured 2026-09-23, and `wjfu` recorded the same denial on the 21st). Wired as a gate it would exercise nothing on every run. It is built so that CANNOT be mistaken for a pass: with no `--source` it exits **2**, printing `could not determine`, rather than the 0 a silent skip would give. What IS gated, on every run and without the network, is the committed menu's effect: `smart-trust:pages:check` regenerates the 5 left-hand-nav sections FROM `menu.json` and compares them byte for byte, and `check:kind-validators` parses the file against `folio-ig-menu/v1`. Run this one by hand after cloning the IG, or from `/prepare-merge`. Bean `0818`",
  },
  {
    script: "ingest:ig-chrome:check",
    kind: "report",
    reason:
      "CI CANNOT OBTAIN ITS INPUT, and here it needs THREE checkouts rather than one. It compares the committed `chrome.json` against the `fhir.template` chain the IG's `ig.ini` names — `fhir.base.template` and `who.template.root`, which are separate repositories (`HL7/ig-template-base`, `WorldHealthOrganization/smart-ig-template`) that this checkout does not contain and a runner cannot fetch. Same wall as `ingest:ig-menu:check`, one layer worse: an IG's appearance is declared in no file the IG owns. Built so a skip CANNOT be mistaken for a pass — with no `--ig`/`--layer` it exits **2**, printing `could not determine`, rather than the 0 a silent skip would give. What IS gated, on every run and without the network, is the committed chrome's EFFECT: `smart-trust:pages:check` regenerates all 681 pages from it and compares them byte for byte, and `check:kind-validators` parses the file against `folio-ig-chrome/v1`. Run this one by hand after cloning the IG and its templates, or from `/prepare-merge`. Bean `ajx9`",
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
    script: "check:reference-direction:strict",
    kind: "report",
    reason:
      "THE SAME SCRIPT AS `check:reference-direction`, exiting 1 instead of 0 on a wrong-direction occurrence. It is the form this becomes a gate in, kept runnable and wired to nothing while the count is 574: a gate that fails on a backlog is a gate somebody switches off. Run it by hand, or from `/prepare-merge`, to see what enforcement would say today. Flipping the advisory entry above to `kind: \"gate\"` and pointing it here is the whole of the change once the backlog is drained. Bean `zhg2`",
  },
  {
    script: "check:reference-direction:check",
    kind: "report",
    reason:
      "THE SAME SCRIPT AS `check:reference-direction`, with `--check`: it does not write, and it fails ONLY on the committed sidecar (`cat-harness/test/results/reference-direction.qa-results.json`) recording different STATES from the run \u2014 the PENDING set, the entries that no longer qualify, the unlisted multi-destination files, the instances that declare no `needs`. It does NOT grade the verdict counts it records, for `audit-coverage`'s measured reason: a number that moves whenever somebody writes a paragraph makes a gate stale by default, and a gate that is stale by default is one people learn to regenerate without reading. Out of CI for the SAME reason its parent is, and not a second one: the states it grades move when a sibling merges a file naming two instances above it, so wiring it would redden a branch whose own tree is correct \u2014 the `schema:viz:check` case. It becomes wirable on the day `check:reference-direction` does, which is when the backlog reaches zero and the advisory entry above flips to `kind: \"gate\"`. Run it by hand, or from `/prepare-merge`, after regenerating with `bun run check:reference-direction`. Beans `zhg2`, `yj6r`",
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
  // Bean `bo44`: seven producers whose bare form WRITES its QA sidecar. Each
  // used to be the gate, so the gate CI ran was also the writer of the record
  // it reported into. The bare form is now the author's command and the
  // `:check` form — compute, judge, write nothing — is what is wired.
  ...(
    [
      "check:avatar-coverage",
      "check:lane-documentation",
      "check:layout-norms",
      "check:methodology-evidence",
      "check:rendered-labels",
      "check:source-licence",
      "check:wireframes",
    ] as const
  ).map(
    (script): ScriptExemption => ({
      script,
      kind: "report",
      reason: `WRITES its QA sidecar (bean \`bo44\`), so it is the author's command and not a gate; \`${script}:check\` is the judge form — compute, judge, write nothing — and is wired`,
    }),
  ),
  {
    script: "check:upload-names",
    kind: "report",
    reason:
      "prints every name it would change; `check:upload-names:check` is the gating form and is wired",
  },
  {
    script: "check:upload-names:fix",
    kind: "report",
    reason:
      "performs the renames with `git mv`; a FIX is never a gate, and it refuses on a collision rather than picking a winner",
  },
  {
    script: "check:bean-parent-prose",
    kind: "report",
    reason:
      "prints the placement-phrase ratio that justifies the check's own scope; `check:bean-parent-prose:check` is the gating form and is wired",
  },
  {
    script: "check:instance-themes",
    kind: "report",
    reason:
      "prints each declaring instance's themes and their kinds; `check:instance-themes:check` is the gating form and is wired",
  },
  {
    script: "check:navbar-consistency",
    kind: "report",
    reason:
      "prints each instance's icon resolution and the two glyph registries' overlap; `check:navbar-consistency:check` is the gating form and is wired",
  },
  {
    script: "check:navbar-consistency:strict",
    kind: "report",
    reason:
      "fails on the two ADVISORY families as well — declared tiles on the fallback glyph, and art shipped without an `icon`. Both are editorial calls (`glyphFor`'s fallback is deliberate), so the gate runs `:check`; this form exists for a sweep that wants the coverage gap to be fatal",
  },
  {
    script: "check:undeclared-files",
    kind: "report",
    reason:
      "prints the unaccounted paths with their sizes; `check:undeclared-files:check` is the gating form and is wired",
  },
  {
    script: "check:merged",
    kind: "covered-by",
    reason:
      "runs the WHOLE gate set on this branch merged with the current base (bean `nytj`), so wiring it into the workflow the gate set is read from would run the gates inside the gates. In CI the same question is answered by the merge queue: `merge_group:` on the gating workflows tests exactly the commit that will land. `check:merged` is the agent's half, run from `/prepare-merge` before asking for a merge",
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
 * Print the commands the extraction read but cannot run.
 *
 * Unconditional: printed on a green run as well as a red one. A line that
 * appears only when something else is already wrong is a line nobody reads,
 * and the fact being reported — that this tool is not covering a command CI
 * does run — is exactly as true on a clean tree.
 */
function reportUnresolved(root: string, opts: { all?: boolean }): void {
  let skipped: Gate[];
  try {
    skipped = loadUnresolved(root, opts);
  } catch {
    return;
  }
  if (skipped.length === 0) return;
  console.log(
    `\n· ${skipped.length} command(s) COULD NOT BE EXTRACTED — not run, and not counted clean:`,
  );
  for (const g of skipped) console.log(`    ${g.command}   (${g.job} / ${g.step})`);
  console.log(
    `  Each references a shell variable defined on a line this reader discards\n` +
      `  (it keeps \`bun …\` lines only), so running it as written would pass the\n` +
      `  variable's NAME to the script. CI runs these correctly; this tool does not\n` +
      `  run them at all. Bean \`9zok\`.`,
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

/** A run of consecutive gates: either all read-only (may share the pool) or one that runs alone. */
export interface GateSegment {
  parallel: boolean;
  gates: Gate[];
}

/**
 * Split the gate list, in order, into maximal runs of read-only gates and
 * single serial gates — bean `xpcu`.
 *
 * Order across segments is the workflow's: a writing gate is never moved
 * ahead of or behind a reader, so whatever it repairs, a later reader sees
 * repaired exactly as it did serially (and the tree guard still names it).
 */
export function gateSegments(gates: readonly Gate[], readsOnly: (g: Gate) => boolean): GateSegment[] {
  const out: GateSegment[] = [];
  for (const g of gates) {
    const ro = readsOnly(g);
    const last = out[out.length - 1];
    if (ro && last?.parallel) last.gates.push(g);
    else out.push({ parallel: ro, gates: [g] });
  }
  return out;
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
  const jobs = jobsFromArgv(process.argv);

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

  // ── Is the ENVIRONMENT fit to be read from? (bean `3vc1`) ──────────────
  //
  // Asked BEFORE any gate runs, and it refuses the whole set rather than
  // reddening one, because 168 results computed against a filesystem that
  // disagrees with the repository are worse than no results: they look like
  // evidence. Measured 2026-09-26 — a nested `bun install` under
  // `adapters/mcp-server` takes root `tsc --noEmit` from 0 errors to 12 across
  // 6 files with NO source change, and CI on the identical commit is green.
  //
  // Exit 2, never 1, and that distinction is the whole point (`nytj`): nothing
  // it reports is a finding about this repository's source. The third state has
  // to be reachable from here or the reading is indistinguishable from a real
  // red — which is `1xhc`'s subject, and the reason this refusal is not a
  // warning that scrolls past.
  //
  // It is a PRECONDITION rather than one of the gates because CI installs only
  // from the repository root, so the condition cannot arise there: a workflow
  // step would be a gate that can never fire, which reads as protection and is
  // not. `SCRIPT_EXEMPTIONS` carries that reason for `check:unrun-scripts`.
  const distorted = distortions(ROOT);
  if (distorted.length > 0) {
    console.error("REFUSING TO RUN — this checkout's environment is distorted.\n");
    for (const d of distorted) {
      console.error(`  ✗ ${d.path}`);
      console.error(`      ${d.effect}`);
      console.error(`      measured on bean \`${d.bean}\``);
    }
    console.error(
      "\nNo gate ran. A gate set read now would report this repository's source\n" +
        "incorrectly, and a wrong red costs more than a missing one — it sends the\n" +
        "next hour to the wrong file. Move the residue aside and re-run.\n" +
        "\nFor a nested install this is a TRAP and not a mistake: regenerating a\n" +
        "nested lockfile REQUIRES `bun install` in that directory, so doing the\n" +
        "correct thing is what created this. `bun run check:environment` alone\n" +
        "reports the same thing without running any gate.",
    );
    process.exit(2);
  }

  const scope = all
    ? "every job, plus every locally-runnable step from the other workflows"
    : `the fast set (every job that does not install a browser)`;
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
    // `--list` is where somebody goes to learn what this tool covers, so the
    // commands it will NOT run belong here most of all. Omitting them would
    // make the list read as the whole gate set.
    reportUnresolved(ROOT, { all });
    console.log(
      all ? "" : "\n`--all` adds the jobs that need a browser (bpmn-js renders through Chromium).",
    );
    process.exit(0);
  }

  // ── Which gate changed the repository (bean `ymsu`) ────────────────────
  //
  // Snapshot the working tree between gates, so a gate that writes to the tree
  // it is being judged on is attributed to ITSELF rather than discovered later
  // as a mystery dirty file. `gate-tree-guard.ts` carries why this can only
  // live here — no gate can observe what another gate did, which is the
  // definition of the blind spot — and why the predicate is a per-gate DELTA
  // rather than "the tree is dirty", since running gates on your own
  // uncommitted work is the normal case.
  //
  // A failure to read the tree is carried as `undetermined` and reported, not
  // thrown: `gates` has to stay runnable where the question cannot be asked.
  const baseline = readTree(ROOT);
  let seen: ReadonlyMap<string, string> | undefined = baseline.ok ? baseline.entries : undefined;
  const undetermined: string[] = baseline.ok ? [] : formatUndetermined(baseline.why);
  const mutations: GateMutation[] = [];

  // ── Read-only gates run in a pool (bean `xpcu`) ────────────────────────
  //
  // A gate whose script DECLARES `outputs: []` in `task-io.ts` only reads, so a
  // run of consecutive such gates goes to a worker pool and its output is
  // buffered and printed in workflow order. Every other gate — undeclared, or
  // declared as writing — runs alone and streams live, exactly as before, and
  // is a barrier: nothing after it starts until it is done. So `bun test`,
  // which writes, still runs by itself and still has its writes attributed to
  // it by the tree guard below.
  //
  // The tree is snapshotted per SEGMENT. A serial gate's segment is the gate,
  // so attribution is as exact as it was. A read-only batch that changed the
  // tree is attributed to the batch, named in full: that is a declaration that
  // turned out false, and `--jobs 1` re-runs everything one at a time to pin it.
  const segments = gateSegments(gates, (g) => gateReadsOnly(g.command));
  const failed: { gate: Gate; why: string[] }[] = [];
  const t0 = performance.now();
  const parallelCount = segments.filter((s) => s.parallel).reduce((n, s) => n + s.gates.length, 0);
  console.log(
    `${jobs} worker(s): ${parallelCount} read-only gate(s) run in parallel, ` +
      `${gates.length - parallelCount} one at a time (undeclared or writing)\n`,
  );
  for (const seg of segments) {
    if (!seg.parallel || jobs === 1) {
      for (const g of seg.gates) {
        process.stdout.write(`▸ ${g.command}\n`);
        const [cmd, ...args] = g.command.split(/\s+/);
        const r = await runTee(cmd!, args);
        if (r.code !== 0) failed.push({ gate: g, why: salientFailures(r.output) });
        seen = snapshot(seen, g.command);
      }
      continue;
    }
    const emitter = orderedEmitter<{ code: number; output: string; ms: number }>((i, r) => {
      const g = seg.gates[i]!;
      process.stdout.write(`▸ ${g.command}   (${(r.ms / 1000).toFixed(1)}s, parallel)\n`);
      process.stdout.write(r.output);
      if (r.code !== 0) failed.push({ gate: g, why: salientFailures(r.output) });
    });
    await runPool(
      seg.gates.map((g) => ({
        id: g.command,
        outputs: [],
        run: () => runCaptured(g.command.split(/\s+/), ROOT),
      })),
      jobs,
      (i, r) => emitter.push(i, r),
    );
    seen = snapshot(seen, `one of the parallel read-only gates: ${seg.gates.map((g) => g.command).join(", ")}`);
  }
  console.log(`\n(${((performance.now() - t0) / 1000).toFixed(0)}s wall for the gate run)`);

  /** Compare the tree with the last snapshot and attribute any change to `who`. */
  function snapshot(prev: ReadonlyMap<string, string> | undefined, who: string): ReadonlyMap<string, string> | undefined {
    if (prev === undefined) return undefined;
    const now = readTree(ROOT);
    if (!now.ok) {
      // The baseline read fine and this one did not, so the question stops
      // being answerable PART WAY THROUGH. Reported with the gate it stopped
      // at, and the comparison is abandoned rather than continued against a
      // snapshot that is now of unknown age.
      undetermined.push(...formatUndetermined(`${now.why} (after \`${who}\`)`));
      return undefined;
    }
    const changes = diffReadings(prev, now.entries);
    if (changes.length > 0) mutations.push({ gate: who, changes });
    return now.entries;
  }

  console.log("");
  for (const line of undetermined) console.log(line);
  if (undetermined.length) console.log("");
  const mutationReport = formatMutations(mutations);
  for (const line of mutationReport) console.log(line);
  if (mutationReport.length) console.log("");
  if (failed.length === 0) {
    // Every gate passed AND nothing moved underneath them. Only this pair earns
    // the clean line.
    if (mutations.length === 0) {
      console.log(`✓ ${gates.length} gate(s) pass — the ${all ? "whole" : "fast"} set.`);
      reportUnresolved(ROOT, { all });
      if (!all) console.log("  `bun run gates --all` adds the browser jobs before you push.");
      process.exit(0);
    }
    // `152 gate(s) pass` is TRUE here and it is the wrong thing to print: the
    // gates that ran after the mutation were handed a repaired tree, so their
    // passing is a verdict about a state the repository does not contain. The
    // whole of bean `ymsu` is that this sentence was printed anyway, 152 times
    // out of 152, over a value nobody had committed.
    console.log(
      `✗ every gate passed, and the run is NOT clean — ${mutations.length} gate(s) changed the tree.`,
    );
    console.log(
      `  ${gates.length} verdict(s) above were reached against a tree that a gate had already`,
    );
    console.log(
      `  repaired, so the later ones describe a state you have not committed. Details above.`,
    );
    process.exit(1);
  }
  reportUnresolved(ROOT, { all });
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
