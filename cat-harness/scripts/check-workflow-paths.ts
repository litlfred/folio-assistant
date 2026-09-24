#!/usr/bin/env bun
/**
 * TWO criteria over the same parse of `.github/workflows/`:
 *
 * 1. **Every script path a workflow invokes must RESOLVE** — from the
 *    directory the step actually runs in. Bean `52dz`, and the whole of the
 *    history below.
 * 2. **Every `working-directory` must EXIST.** Bean `ai9u`, and the section
 *    §"The second criterion" near the end of this comment.
 *
 * They are one module because the second is a by-product of the first's
 * parse — the cwd model criterion 1 needs is criterion 2's whole subject —
 * and separating them would mean two readers of the same YAML, free to
 * disagree about what a job's checkout layout is.
 *
 * ## Criterion 1 — a path that does not resolve
 *
 * Bean `folio-assistant-52dz`. The #223 split moved the platform's scripts
 * under `cat-harness/`, and the workflows that name them without that prefix
 * kept naming them without it. Nothing caught this, for a reason worth
 * stating plainly: **a path that does not resolve is not a type error, not a
 * lint error, and not a test failure.** It is discovered when the step runs,
 * and a step that never runs never discovers it.
 *
 * Two classes were found the day this was written, and only the second is
 * the one people expect:
 *
 * 1. **`workflow_dispatch`-only workflows nobody dispatches.** Eight of them,
 *    two with zero runs in their entire history. Broken since the split and
 *    structurally incapable of saying so — `check:ci-health` reads *runs*,
 *    and a workflow with no runs has nothing to be red.
 * 2. **SCHEDULED workflows that fire weekly and crash on line one.**
 *    `ci-health.yml` and `upstream-pins.yml`. These DID fail, visibly, every
 *    week — in a tab nobody opens. `ci-health.yml` is the workflow whose
 *    whole purpose is catching workflows that fail where nobody looks
 *    (`xom7`), so it had been failing at its own job, at its own job.
 *
 * ## Why this reads the working directory rather than just the path
 *
 * An unprefixed path is not automatically wrong. A step that sets
 * `working-directory: cat-harness`, or opens its `run:` block with
 * `cd content`, is correct with a bare `pipeline/build.ts`. Checking the
 * spelling alone would report those as broken and train a reader to skim
 * past this check's output — which is worse than not having it, because a
 * check nobody reads still costs a CI minute and still looks like coverage.
 *
 * So the cwd is COMPUTED: the job's `defaults.run.working-directory`, then
 * the step's own `working-directory`, then any `cd` earlier in the same
 * `run:` block. That is a real parse of the common cases, not a guess.
 *
 * ## The fourth input, and why three were not enough (bean `7iog`)
 *
 * A cwd is only half an answer. The other half is **where the tree is** —
 * `actions/checkout` with a `path:` puts it somewhere other than the
 * workspace root, and then the root holds NOTHING.
 *
 * The first version collected those prefixes and used them only to *strip*,
 * which made the check strictly more permissive: a path under a checkout
 * resolved, and a path that was not under one resolved too, because it fell
 * through to the repository. So `feature-staging.yml`'s `cleanup` job — which
 * checks out to `source/` — ran `bun run cat-harness/scripts/backoff-sleep.ts`
 * from the workspace root and passed, while at run time that directory is
 * empty. `run:` blocks are `bash -e`, so the step aborted, and **the retry
 * loops those calls exist to provide never ran**: the first lost push race
 * ended the job. Three of the four were wrong this way and this check said
 * `✓ every workflow script path resolves` over all three.
 *
 * A checkout at another `ref:` is a third state again. `pages` holds
 * `gh-pages`: the directory is there and its contents are real, they are
 * simply not the tree a working copy of HEAD can read. Stripping that prefix
 * measured paths against the wrong commit, which is how the third broken call
 * kept passing after the other two were caught. It is now
 * {@link Verdict.Undetermined} — not a pass, per the rule below.
 *
 * ## What this check structurally CANNOT see, and where that exposure went
 *
 * `bun run check:l1-complete` is an npm script NAME, so {@link invokedPath}
 * declines it — deliberately, since naming the script instead of the path is
 * the fix this check recommends. Bean `a6kl` lives exactly there: the
 * workflow line was correct, and `check:l1-complete` resolved its own corpus
 * from `process.cwd()` (the repository root, which carries no declaration),
 * found nothing, and reported `nothing to check` over 1,402 files.
 *
 * So the recommended fix MOVES the risk rather than removing it: out of the
 * workflow, into the script's own root resolution. This module used to claim
 * that class had its own reader — `check:anchor-names` — and that "between
 * them the path is accounted for at both ends". **The second half was wrong,
 * and the sweep closing `a6kl` measured it.** Reintroducing the defect (the
 * four call sites in `check-l1-complete.ts` reverted to `resolve(".")`) leaves
 * `check:anchor-names` at exit 0, along with `check:command-paths`,
 * `check:partition`, `check:harness-dirs`, `check:declared-assets` and this
 * check. `check:anchor-names` audits anchor NAMES — `REPO_ROOT`,
 * `INSTANCE_ROOT`, `PLATFORM` — and those call sites pass an inline expression
 * under no named anchor, so it is structurally blind to them.
 *
 * What DOES catch it is the gate's own refusal: `checkAll` throws rather than
 * returning `[]`, so the reintroduced defect exits 2 saying *"This is NOT a
 * pass. Treat it as unknown."* That is the half of `a6kl`'s fix doing the
 * work — not the root resolution, which is why the distinction is recorded
 * here rather than left as two interchangeable bullet points.
 *
 * So: this check owns the workflow end. The script end is guarded by each
 * script refusing its own empty corpus, one script at a time, with no
 * cross-gate reader over that convention. Naming the gap is not closing it,
 * and a reader that pinned every corpus-walking gate non-empty is queued
 * rather than built.
 *
 * ## "Could not determine" is never green
 *
 * When a `cd` names something this module cannot resolve statically — a
 * shell variable, a glob, a command substitution — the invocation is
 * reported as {@link Verdict.Undetermined} and the run FAILS. This is the
 * house rule (`ci-health`, `health`, `kg:audit` all carry it) and it exists
 * because an unknown rendered as a pass is indistinguishable from a real
 * pass, while an unknown rendered as a failure merely costs somebody a
 * minute's reading.
 *
 * ## The folio allowlist
 *
 * Some paths are correct and still absent: they name a *folio's* tree, which
 * the platform repository does not carry. Those are declared in
 * {@link FOLIO_PATHS} with a reason each, the same shape as `STEP_EXEMPTIONS`
 * in `gates.ts` and for the same reason — a machine can then read what prose
 * asserted, and an exemption cannot outlive the step it exempts (an entry
 * matching nothing is itself a failure).
 *
 * ## The second criterion — `working-directory` must exist (bean `ai9u`)
 *
 * Criterion 1 reads `working-directory` to compute the frame a path resolves
 * against. It was INPUT there, and trusted: nothing asked whether the
 * directory was there. **Eight declarations across four workflows named
 * absent directories while this module printed `✓ every workflow script path
 * resolves`** — a gate that fires, passes, and is blind to the case, which is
 * `1xhc` one level up from the gate that never fires at all.
 *
 * Two causes compounded. The value was never a subject; and a step running
 * `npx typedoc` rather than a script path contributes NO invocation, so it
 * was never examined however broken it was. A step whose `working-directory`
 * is missing fails **every time, whatever it runs** — a stronger and cheaper
 * property than any path resolution here, and the one not checked.
 *
 * Three things about it that are NOT simply criterion 1 applied to the cwd,
 * each carrying its reason at the code: `cd` targets are excluded (GitHub
 * evaluates `working-directory` *before* the script runs, so it must
 * pre-exist, while a `cd` may target what the same block just created); a
 * checkout at another `ref:` **resolves** at its root here where the same
 * prefix is {@link Verdict.Undetermined} for a path, because the only
 * question for a cwd is whether the directory exists and `actions/checkout`
 * makes it; and a workflow-level default is ONE finding however many jobs
 * inherit it, folded only when the verdict is identical.
 *
 * Its allowlist is {@link FOLIO_WORKDIRS} — absent on purpose, always will
 * be. Separately, {@link workDirBaseline} is a RATCHET for the ones somebody
 * still owes an answer for; keeping the two apart is what stops an open
 * defect becoming accepted architecture.
 *
 * Usage:
 *   bun run check:workflow-paths          # report and exit non-zero on a finding
 *   bun run check:workflow-paths --list   # print every invocation, verdict and cwd
 *
 * ## Its sibling, `scripts/tests/workflow-paths-resolve.test.ts`
 *
 * Not a duplicate, and the two must not be consolidated. That test covers
 * **4 allowlisted workflows** but **every path-shaped token on a line** (a
 * `cp` argument, a `paths:` filter entry, a typedoc entry list, a `bun -e`
 * string). This covers **all workflows** but only **script invocations**,
 * with a cwd model.
 *
 * Measured 2026-09-20 by breaking each in turn and running both: a `cp`
 * argument naming a missing directory in `docs-site.yml` is caught by the
 * test and missed here; `bun run scripts/does-not-exist.ts` in `publish.yml`
 * is caught here and missed by the test. Neither subsumes the other, and
 * deleting either loses a class of defect nothing else in this repository
 * would see.
 *
 * @module scripts/check-workflow-paths
 * @covers none — .github/workflows/ is not a declared graph kind
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";
import { parse } from "yaml";

const ROOT = repoRootFor(resolve(import.meta.dir, ".."));

/** Where the workflows live, relative to the repository root. */
export const WORKFLOW_DIR = join(".github", "workflows");

/** What became of one invocation. */
export enum Verdict {
  /** The file is there, from the directory the step runs in. */
  Resolves = "resolves",
  /** The cwd is known and the file is not there. A defect. */
  Missing = "missing",
  /** Declared in {@link FOLIO_PATHS}: absent here on purpose. */
  NeedsFolio = "needs-folio",
  /** The cwd could not be computed. NOT a pass. */
  Undetermined = "undetermined",
}

/**
 * A path that is absent from the platform repository ON PURPOSE.
 *
 * `match` is a substring of the invoked path. Every entry must match at least
 * one invocation, or the run fails — an exemption for a step that no longer
 * exists is a claim about the present that stopped being true.
 */
export interface FolioPath {
  match: string;
  reason: string;
}

export const FOLIO_PATHS: FolioPath[] = [
  // ── They name `content/`, and `content/` is NOT the convention ──────
  //
  // Owner, 2026-09-20: *"content/ shouldnt be expected anymore. folio/ was
  // renamed as default/convention."*
  //
  // So these are not "waiting for a folio tree we happen not to carry".
  // They `cd content` — a directory the convention has moved off. The
  // instance's own declaration already says so: `cat-harness/harness.json`
  // declares `folio/` holding the `folio` graph, and there is no `content`
  // entry anywhere in it.
  //
  // Bean `52dz` (owner, 2026-09-24) moved the QA and Lean workflows that
  // `cd content` into the `folio_init` templates, pointed at `folio/`, and
  // their entries (`pipeline/qa-sweep.ts`, `scripts/lean-build-all.sh`) left
  // this table with them. What remains is `publish.yml`, the workflow folios
  // CALL, whose `cd content` is the caller's layout.
  //
  // They stay exempt rather than becoming failures for one reason: the
  // verdict here is about whether a PATH RESOLVES, and a retired path in a
  // workflow nobody dispatches is a filing question, not a broken build.
  // Recording WHY is the contribution — the previous reasons asserted
  // `content/` was "where a folio's sources live", which was the old
  // convention stated as a present fact, and that is the exact failure this
  // whole module exists to stop.
  {
    match: "pipeline/build.ts",
    reason:
      "runs after `cd content`, a directory the convention has retired in " +
      "favour of `folio/`. Note `cat-harness/content/pipeline/build.ts` DOES " +
      "exist — a different file sharing the basename — so resolving to it " +
      "would be a wrong fix that looks right",
  },
  {
    match: "pipeline/export-bibtex.ts",
    reason: "same retired `cd content` root as build.ts",
  },
  {
    match: "pipeline/latex-preflight.ts",
    reason: "same retired `cd content` root",
  },
  {
    match: "pipeline/validate.ts",
    reason: "same retired `cd content` root",
  },
  {
    match: "pipeline/trivial-skeleton-audit.ts",
    reason: "invoked with `--cwd content`, the retired root",
  },
  {
    match: "content/pipeline/latex-overfull-report.ts",
    reason:
      "reads a FOLIO's `main.log`, inside `publish.yml` — the ONE workflow " +
      "exposing `workflow_call`, which `litlfred/qou` invokes at `@main` " +
      "(`qou/.github/workflows/build.yml:10`). Its four sibling invocations " +
      "are folio-relative (`cd content && bun run pipeline/...`) and its " +
      "`actions/checkout` steps carry no `repository:`, so they check out the " +
      "CALLING repo: a `cat-harness/` prefix resolves to nothing there. " +
      "I prefixed this line under `52dz` because THIS check demanded it, " +
      "which made the file internally inconsistent in the one workflow folios " +
      "consume. The check was right that the path does not resolve here and " +
      "wrong about the remedy; that is what this table is for",
  },
  {
    match: "pipeline/codemod-leanval.ts",
    reason: "reads blocks under the retired `content/` root",
  },

  // ── Found by widening the extractor to `bash` (bean `7iog`) ────────
  //
  // Five shell scripts that were invisible to this check until the verb was
  // added. None is platform rot; all five are FOLIO-facing, and each would
  // be made worse by the obvious fix. (Four since `52dz`: `lean-build-all.sh`
  // went with `lean-build-sidecar.yml` into the `folio_init` templates.)
  {
    match: "scripts/build-gmp.sh",
    reason:
      "`snappea_wasm.yml` runs entirely under workflow-level " +
      "`working-directory: folio-assistant/snappea-wasm`, a directory that " +
      "exists in NO checkout of this repository — the layout from before the " +
      "#223 split, when a folio carried the platform as `folio-assistant/`. " +
      "The workflow is `workflow_dispatch`-only and has never been able to " +
      "run; that is `52dz`'s documented class, not a path to repoint",
  },
  {
    match: "scripts/build-pari.sh",
    reason: "same dead `folio-assistant/snappea-wasm` root as build-gmp.sh",
  },
  {
    match: "scripts/build-snappea.sh",
    reason: "same dead `folio-assistant/snappea-wasm` root as build-gmp.sh",
  },
  {
    match: "scripts/link.sh",
    reason: "same dead `folio-assistant/snappea-wasm` root as build-gmp.sh",
  },
];

/** One script invocation found in a workflow. */
export interface Invocation {
  file: string;
  job: string;
  step: string;
  /** The path exactly as the workflow spells it. */
  path: string;
  /** The directory the step runs in, relative to the repo root; "" is the root. */
  cwd: string;
  verdict: Verdict;
  /** Set on {@link Verdict.NeedsFolio} and {@link Verdict.Undetermined}. */
  note?: string;
}

/**
 * Pull the invoked script path out of one shell line.
 *
 * Two verbs, for two reasons.
 *
 * `bun run <path>` and `bun <path>`, where the path looks like a file rather
 * than an npm script name. `bun run check:ci-health` is a script NAME and is
 * deliberately not a path — which is also the fix this check recommends,
 * since it puts the path in `package.json` once instead of in every caller.
 *
 * `bash <path>` and `sh <path>`, added 2026-09-20 because **the class
 * recurred in the same file within the hour, from a different session**.
 * `feature-staging.yml`'s `cleanup` job ran
 * `bash cat-harness/scripts/render-log-union-attr.sh` at the workspace root
 * while the platform is checked out at `source/` — twice — and both calls
 * died `rc=127` under `bash -e`, taking the retry they were added to protect
 * with them. A shell script has no `package.json` indirection to escape
 * into, so the path in the workflow is the only spelling there is and the
 * verb was the only reason this reader could not see it.
 *
 * A `-c` or a flag is not a path and is declined by the extension test: a
 * shell script here ends `.sh`.
 */
export function invokedPath(line: string): string | undefined {
  const t = line.trim();
  const bun = /^(?:bun|bunx)\s+(?:run\s+)?(?:--cwd\s+\S+\s+)?(\S+)/.exec(t);
  if (bun) {
    const candidate = bun[1];
    if (!/\.(ts|js|mjs)$/.test(candidate)) return undefined; // an npm script name
    if (candidate.startsWith("-")) return undefined;
    return candidate;
  }
  const sh = /^(?:bash|sh)\s+(\S+)/.exec(t);
  if (sh) {
    const candidate = sh[1];
    if (!/\.sh$/.test(candidate)) return undefined; // `-c`, a flag, a heredoc
    if (candidate.startsWith("-")) return undefined;
    return candidate;
  }
  return undefined;
}

/**
 * The `--cwd` flag, which bun applies instead of the shell's directory.
 *
 * Read separately from {@link invokedPath} because it relocates the path
 * without a `cd`, and missing it would report a correct invocation as broken.
 */
export function cwdFlag(line: string): string | undefined {
  return /--cwd\s+(\S+)/.exec(line)?.[1];
}

/** A `cd` this module can follow. Anything else returns undefined. */
export function cdTarget(line: string): string | undefined | null {
  const m = /^cd\s+(\S+)/.exec(line.trim());
  if (!m) return undefined;
  const target = m[1].replace(/^["']|["']$/g, "");
  // A variable, a substitution or a glob cannot be resolved by reading.
  if (/[$*?`]/.test(target)) return null;
  return target;
}

/** Join a cwd with a `cd`, honouring `..` and absolute-ish resets. */
function applyCd(cwd: string, target: string): string {
  if (target === ".") return cwd;
  if (isAbsolute(target)) return cwd; // an absolute cd leaves the repo's frame
  const parts = cwd ? cwd.split("/") : [];
  for (const seg of target.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

interface WorkflowDoc {
  /**
   * Workflow-level `defaults:`. Read because `snappea_wasm.yml` sets its cwd
   * HERE and not per job, so every path in it was being measured from the
   * repository root — the same "wrong frame" error this module exists to
   * catch, inside the module that catches it.
   */
  defaults?: { run?: { "working-directory"?: string } };
  jobs?: Record<
    string,
    {
      defaults?: { run?: { "working-directory"?: string } };
      steps?: {
        name?: string;
        run?: string;
        uses?: string;
        with?: { path?: string; repository?: string; ref?: string };
        "working-directory"?: string;
      }[];
    }
  >;
}

/**
 * A `ref:` that names the commit the workflow is already running on.
 *
 * `ref: ${{ github.sha }}` and friends check out the same tree the checkout
 * would have taken by default, so they are NOT a different commit. Anything
 * else — a branch name, a tag, a computed ref — is a tree this module cannot
 * read from a working copy of HEAD.
 */
const SELF_REF = /github\.(sha|ref|head_ref|event\.pull_request\.head\.sha)/;

/**
 * What a job actually materialises by checking THIS repository out.
 *
 * `actions/checkout` with a `path:` puts the repo somewhere other than the
 * workspace root, and a step working there spells its paths from that
 * directory — correctly. Locally that directory does not exist, so without
 * this the check would call a working workflow broken, which is the failure
 * mode that teaches people to skim its output.
 *
 * **`atRoot` is the half that was missing, and it is the half that catches
 * things.** Collecting the prefixes only ever made the check MORE permissive:
 * a path under a checkout resolved, and a path *not* under one resolved too,
 * because it was then measured against the repository. So a job that checks
 * out to `source/` and runs `bun run cat-harness/scripts/x.ts` from the
 * workspace root passed — while at run time that directory is empty and the
 * step dies. Knowing the prefixes is not the same as knowing where the tree
 * IS.
 *
 * A checkout naming a DIFFERENT `repository:` is deliberately not collected:
 * its contents are not this repo's and nothing here can say whether a path
 * in it resolves. `any` therefore counts checkouts of THIS repository only —
 * a job whose sole checkout is someone else's tree is one this module has no
 * layout for, and it falls back to the old behaviour rather than inventing a
 * verdict.
 */
export interface CheckoutLayout {
  /** Non-root `path:` values holding THIS commit's tree, in workflow order. */
  paths: string[];
  /**
   * Checkouts of this repository at a DIFFERENT ref — `ref: gh-pages` and the
   * like. The directory exists at run time and holds a real tree; it is just
   * not the tree this module can read. Kept apart from {@link paths} because
   * stripping such a prefix measures a path against the wrong commit, which
   * is how the third of `feature-staging.yml`'s three broken backoff calls
   * went on passing after the other two were caught.
   */
  otherRef: { path: string; ref: string }[];
  /** This repository is checked out AT the workspace root. */
  atRoot: boolean;
  /** This repository is checked out somewhere, root or not. */
  any: boolean;
}

export function checkoutLayout(
  steps: NonNullable<WorkflowDoc["jobs"]>[string]["steps"],
): CheckoutLayout {
  const paths: string[] = [];
  const otherRef: { path: string; ref: string }[] = [];
  let atRoot = false;
  let any = false;
  for (const step of steps ?? []) {
    if (!step.uses?.startsWith("actions/checkout")) continue;
    if (step.with?.repository) continue; // someone else's tree
    const path = step.with?.path;
    const ref = step.with?.ref;
    if (path && /[$*?`]/.test(path)) continue; // a computed directory
    if (ref !== undefined && !SELF_REF.test(ref)) {
      // A different commit of this repository. `path` is required in practice
      // for such a checkout to coexist with another; without one it REPLACES
      // the root tree, so nothing here can be judged and the job gets no
      // usable layout.
      if (path) otherRef.push({ path: path.replace(/\/+$/, ""), ref });
      continue;
    }
    any = true;
    // No `path:` at all, or an explicit `.`, is the workspace root — the
    // default, and the case every ordinary workflow uses.
    if (!path || path === "." || path === "./") {
      atRoot = true;
      continue;
    }
    paths.push(path.replace(/\/+$/, ""));
  }
  return { paths, otherRef, atRoot, any };
}

/**
 * Strip a checkout prefix, so `source/cat-harness/x.ts` resolves as
 * `cat-harness/x.ts`.
 *
 * Applied to the JOINED, normalised path rather than to the cwd alone. The
 * first version stripped only the cwd, and CI found the two shapes it
 * therefore missed within the hour — `feature-staging.yml` spells the prefix
 * in the PATH from the workspace root (`bun run source/cat-harness/...`), and
 * once, from a sibling checkout, relatively (`bun run ../source/cat-harness/
 * ...`). Both are correct invocations that this reported as broken.
 *
 * A check whose false positives are the thing people meet first is worse than
 * no check: it teaches the reader to skim, and then the true positive goes by
 * unread too.
 */
function stripCheckout(path: string, checkouts: string[]): string {
  for (const c of checkouts) {
    if (path === c) return "";
    if (path.startsWith(`${c}/`)) return path.slice(c.length + 1);
  }
  return path;
}

/** Every script invocation in one workflow, with the cwd each runs in. */
export function invocationsFrom(file: string, text: string): Invocation[] {
  const doc = parse(text) as WorkflowDoc;
  const out: Invocation[] = [];
  for (const [job, def] of Object.entries(doc.jobs ?? {})) {
    // Precedence is GitHub's: step, then job defaults, then workflow
    // defaults, then the workspace root.
    const jobCwd =
      def.defaults?.run?.["working-directory"] ??
      doc.defaults?.run?.["working-directory"] ??
      "";
    const layout = checkoutLayout(def.steps);
    for (const step of def.steps ?? []) {
      if (!step.run) continue;
      const stepCwd = step["working-directory"] ?? jobCwd;
      // `cd` accumulates WITHIN a run block and resets between them: each
      // `run:` is its own shell, which is exactly why a `cd content` in the
      // install step does not carry into the step that follows it. Reading
      // it as if it did is how an unprefixed path looks correct.
      let cwd: string | null = stepCwd;
      for (const raw of step.run.split("\n")) {
        for (const segment of raw.split("&&")) {
          const line = segment.trim();
          if (!line || line.startsWith("#")) continue;
          const cd = cdTarget(line);
          if (cd === null) {
            cwd = null; // unresolvable from here on in this block
            continue;
          }
          if (cd !== undefined) {
            cwd = cwd === null ? null : applyCd(cwd, cd);
            continue;
          }
          const path = invokedPath(line);
          if (!path) continue;
          const flag = cwdFlag(line);
          const effective = cwd === null ? null : flag ? applyCd(cwd, flag) : cwd;
          out.push(
            classify(
              { file, job, step: step.name ?? "(unnamed step)", path, cwd: effective },
              layout,
            ),
          );
        }
      }
    }
  }
  return out;
}

function classify(
  inv: { file: string; job: string; step: string; path: string; cwd: string | null },
  layout: CheckoutLayout,
): Invocation {
  const base = { file: inv.file, job: inv.job, step: inv.step, path: inv.path };
  if (inv.cwd === null) {
    return {
      ...base,
      cwd: "(unresolved)",
      verdict: Verdict.Undetermined,
      note: "a `cd` in this block names a variable, glob or substitution",
    };
  }
  // Join FIRST, then strip: the prefix may be in the cwd, in the path, or
  // reached relatively through `..` from a sibling checkout.
  const joined = applyCd(inv.cwd, inv.path);
  const inTree = stripCheckout(joined, layout.paths);
  // Lands inside a checkout of a DIFFERENT commit. The directory is there and
  // its contents are real; they are simply not readable from here, so this is
  // an unknown rather than a pass — the house rule this module already states
  // for an unresolvable `cd`.
  const foreign = layout.otherRef.find(
    (c) => joined === c.path || joined.startsWith(`${c.path}/`),
  );
  if (foreign) {
    return {
      ...base,
      cwd: inv.cwd,
      verdict: Verdict.Undetermined,
      note:
        `it resolves inside \`${foreign.path}/\`, which is this repository at ` +
        `\`${foreign.ref}\` — a different tree from the one being checked. ` +
        `Nothing here can say whether \`${joined}\` is in it`,
    };
  }
  // A job that checks this repository out SOMEWHERE ELSE has an empty
  // workspace root. A path that lands there names a directory the job never
  // materialised, and it is broken however well the same spelling reads
  // against the repository — which is exactly how three of four backoff
  // calls in `feature-staging.yml` passed this check while aborting their
  // step at run time (bean `7iog`).
  if (layout.any && !layout.atRoot && inTree === joined) {
    return {
      ...base,
      cwd: inv.cwd,
      verdict: Verdict.Missing,
      note:
        `this job checks the repository out to ` +
        `${layout.paths.map((p) => `\`${p}/\``).join(", ")} and nothing to the ` +
        `workspace root, so \`${joined}\` names an empty directory at run ` +
        `time. The same spelling resolves here, which is why it reads as ` +
        `correct`,
    };
  }
  if (existsSync(resolve(ROOT, inTree))) {
    return { ...base, cwd: inv.cwd, verdict: Verdict.Resolves };
  }
  const folio = FOLIO_PATHS.find((f) => inv.path.includes(f.match));
  if (folio) {
    return { ...base, cwd: inv.cwd, verdict: Verdict.NeedsFolio, note: folio.reason };
  }
  return { ...base, cwd: inv.cwd, verdict: Verdict.Missing };
}

/**
 * A `working-directory` that is absent from the platform repository ON PURPOSE.
 *
 * Same contract as {@link FOLIO_PATHS} and for the same reason: `match` is the
 * declared value, every entry carries a reason, and an entry matching nothing
 * FAILS the run. An exemption that outlives its step reads as coverage.
 */
export interface FolioWorkDir {
  match: string;
  reason: string;
}

// `content` left this table under bean `52dz` (2026-09-24): its only matches
// were `qa-sweep` and `lean-build`, which moved to the `folio_init` templates.
export const FOLIO_WORKDIRS: FolioWorkDir[] = [
  {
    // declared-path-literal: a value this repo MATCHES against workflow text, not a path it reads. No declaration answers it — the workflows own the spelling.
    match: "folio-assistant/computations",
    reason:
      "bean `u9r9`. NOT simply absent, and the distinction is the finding: " +
      "`cat-harness/computations` EXISTS one directory over, so the prefix is " +
      "stale from the split — but it holds one `.json` and ZERO `.py` while " +
      "the step runs Python. Correcting the path would move the failure " +
      "rather than fix it, so this stays an exemption until the computations " +
      "themselves arrive",
  },
  {
    // declared-path-literal: a value this repo MATCHES against workflow text, not a path it reads. No declaration answers it — the workflows own the spelling.
    match: "folio-assistant/snappea-wasm",
    reason:
      "bean `u9r9`. Exists under NO prefix — unlike its neighbour above, " +
      "there is nothing to point a corrected path at",
  },
  {
    // declared-path-literal: a value this repo MATCHES against workflow text, not a path it reads. No declaration answers it — the workflows own the spelling.
    match: "tools/hecke-engine",
    reason:
      "the Rust engine's own source. `tools/` exists here and holds " +
      "`index.ts` alone, so this is absent content rather than a stale " +
      "prefix. Matches `tools/hecke-engine-wasm` too",
  },
  {
    // declared-path-literal: a value this repo MATCHES against workflow text, not a path it reads. No declaration answers it — the workflows own the spelling.
    match: "tools/pyhecke",
    reason: "the Python binding's own source; absent here for the same reason",
  },
];

/**
 * One `working-directory` declaration, and what became of it.
 *
 * ## Why this is a SEPARATE criterion from {@link Invocation}
 *
 * `invocationsFrom` reads `working-directory` to compute the frame a script
 * path resolves against. It is INPUT there, and trusted — nothing asks
 * whether the directory is there. Bean `ai9u`: eight declarations named
 * absent directories across four workflows while this module printed
 * `✓ every workflow script path resolves`.
 *
 * Two causes, and they compound. The value is never a subject; and a step
 * running `npx typedoc` rather than a script path contributes NO invocation
 * at all, so it is never examined however broken it is. A step whose
 * `working-directory` is missing fails 100 % of the time whatever it runs —
 * a stronger property than any path resolution here, and the one not checked.
 *
 * ## Why `cd` targets are NOT included
 *
 * GitHub evaluates `working-directory` **before** the script runs, so the
 * directory must pre-exist. A `cd` inside a `run:` block need not: the same
 * block may have just created it, and `publish.yml` does exactly that
 * (`mkdir -p appendices/`, then works in it). Folding the two together would
 * report a correct workflow as broken, which this module's own header calls
 * worse than having no check — it teaches the reader to skim, and then the
 * true positive goes by unread too.
 */
export interface WorkDir {
  file: string;
  job: string;
  /** The step's name, or `(job defaults)` / `(workflow defaults)`. */
  step: string;
  /** The value exactly as the workflow spells it. */
  dir: string;
  verdict: Verdict;
  note?: string;
}

/** A value GitHub computes at run time — nothing here can resolve it. */
const COMPUTED = /[$*?`]/;

function classifyWorkDir(
  wd: { file: string; job: string; step: string; dir: string },
  layout: CheckoutLayout,
): WorkDir {
  const base = { file: wd.file, job: wd.job, step: wd.step, dir: wd.dir };
  if (COMPUTED.test(wd.dir)) {
    return {
      ...base,
      verdict: Verdict.Undetermined,
      note:
        "the value is a matrix entry or expression, so which directory it " +
        "names is not knowable from the file",
    };
  }
  const dir = wd.dir.replace(/^\.\//, "").replace(/\/+$/, "");

  // A checkout at another ref RESOLVES here, and that is a real difference
  // from how {@link classify} treats the same prefix.
  //
  // For a script path the question is *what is in that tree*, which a working
  // copy of HEAD cannot answer — hence `Undetermined` there. For a cwd the
  // question is only *does the directory exist when the step starts*, and
  // `actions/checkout` creates it. `feature-staging.yml` works in `pages/`
  // holding `gh-pages`: its contents are unknowable from here and completely
  // beside the point. Carrying the invocation rule across would have made a
  // correct workflow an unfixable permanent unknown — an exemption nobody
  // could ever retire, which is the shape this module refuses everywhere else.
  const foreign = layout.otherRef.find((c) => dir === c.path || dir.startsWith(`${c.path}/`));
  if (foreign && dir === foreign.path) return { ...base, verdict: Verdict.Resolves };
  if (foreign) {
    return {
      ...base,
      verdict: Verdict.Undetermined,
      note:
        `it is below \`${foreign.path}/\`, this repository at ` +
        `\`${foreign.ref}\` — the checkout makes that root, but whether it ` +
        `holds \`${dir}\` is a fact about a tree HEAD cannot read`,
    };
  }

  // Under a checkout of THIS commit, so the run-time directory is the tree
  // below that prefix. An empty remainder is the checkout root itself.
  const inTree = stripCheckout(dir, layout.paths);
  if (inTree === "") return { ...base, verdict: Verdict.Resolves };

  // Checked out somewhere else entirely, and this value is not under it: the
  // workspace root is empty at run time, so the step's cwd is a directory the
  // job never materialised. Bean `7iog`, in the cwd rather than the path.
  if (layout.any && !layout.atRoot && inTree === dir) {
    return {
      ...base,
      verdict: Verdict.Missing,
      note:
        `this job checks the repository out to ` +
        `${layout.paths.map((p) => `\`${p}/\``).join(", ")} and nothing to ` +
        `the workspace root, so \`${dir}/\` is empty when the step starts`,
    };
  }

  if (existsSync(resolve(ROOT, inTree))) return { ...base, verdict: Verdict.Resolves };

  const folio = FOLIO_WORKDIRS.find((f) => dir.startsWith(f.match));
  if (folio) return { ...base, verdict: Verdict.NeedsFolio, note: folio.reason };

  return { ...base, verdict: Verdict.Missing };
}

/** The ratchet file, beside this module — see {@link workDirBaseline}. */
const BASELINE_FILE = join(import.meta.dir, "workdir-baseline.json");

/**
 * Known-open `working-directory` declarations — a RATCHET, not an exemption.
 *
 * {@link FOLIO_WORKDIRS} says a directory is absent here on purpose and always
 * will be. This file says the opposite: somebody still owes an answer, and
 * until they give it the gate should not be red for everyone else. So it may
 * only SHRINK — an entry that stops matching FAILS the run rather than being
 * dropped, which is the same direction `gates.ts` and {@link FOLIO_PATHS}
 * ratchet in, and for the same reason: a stale allowance reads as coverage.
 *
 * Keyed `<workflow>: <value>` rather than by line, so an unrelated step added
 * above does not churn it. Each key carries its reasoning in `why`, checked
 * against `known` on load — a baseline entry with no stated reason is how a
 * temporary allowance becomes permanent.
 */
export function workDirBaseline(): Set<string> {
  // `import.meta.dir`, not a spelled-out path, and the same way
  // `check-lockfile-pinning.ts` reaches its own. The file sits BESIDE this
  // module, so it travels with it; composing `cat-harness/scripts/` here
  // would be a second place that knows where this script lives, and this
  // repository's `check:declared-paths` gate catches exactly that — it
  // caught this, at 0 → 2, before the change left the working tree.
  if (!existsSync(BASELINE_FILE)) return new Set();
  const raw = JSON.parse(readFileSync(BASELINE_FILE, "utf-8")) as {
    known?: string[];
    why?: Record<string, string>;
  };
  const known = raw.known ?? [];
  const unexplained = known.filter((k) => !raw.why?.[k]?.trim());
  if (unexplained.length > 0) {
    throw new Error(
      `workdir-baseline.json: ${unexplained.length} entr(ies) carry no reason ` +
        `in \`why\` — ${unexplained.join(", ")}. An allowance with no stated ` +
        `reason is one nobody can ever retire.`,
    );
  }
  return new Set(known);
}

/** How a {@link WorkDir} is keyed in the baseline. */
export const workDirKey = (w: WorkDir): string => `${w.file}: ${w.dir}`;

/** Every `working-directory` in one workflow, at all three levels. */
export function workDirsFrom(file: string, text: string): WorkDir[] {
  const doc = parse(text) as WorkflowDoc;
  const out: WorkDir[] = [];
  const fileCwd = doc.defaults?.run?.["working-directory"];
  /** Workflow-level verdicts, deduped — see the comment at its push site. */
  const fileLevel = new Map<string, WorkDir>();
  for (const [job, def] of Object.entries(doc.jobs ?? {})) {
    const layout = checkoutLayout(def.steps);
    const jobCwd = def.defaults?.run?.["working-directory"];
    if (fileCwd !== undefined) {
      // A workflow-level default is ONE declaration, however many jobs
      // inherit it — `snappea_wasm.yml` sets one covering four. Emitting it
      // per job would turn a single edit into four findings and make the
      // count read as a severity. It is still CLASSIFIED per job, because
      // each job has its own checkout layout and the same value can resolve
      // in one and not another; a second verdict is therefore a real second
      // finding, and only an identical repeat is folded away.
      const wd = classifyWorkDir({ file, job, step: "(workflow defaults)", dir: fileCwd }, layout);
      const seen = fileLevel.get(wd.verdict + (wd.note ?? ""));
      if (seen) seen.job += `, ${job}`;
      else fileLevel.set(wd.verdict + (wd.note ?? ""), wd);
    }
    if (jobCwd !== undefined) {
      out.push(classifyWorkDir({ file, job, step: "(job defaults)", dir: jobCwd }, layout));
    }
    for (const step of def.steps ?? []) {
      const own = step["working-directory"];
      if (own === undefined) continue;
      out.push(
        classifyWorkDir({ file, job, step: step.name ?? "(unnamed step)", dir: own }, layout),
      );
    }
  }
  return [...fileLevel.values(), ...out];
}

/** Every `working-directory` in every workflow, in file order. */
export function allWorkDirs(root = ROOT): WorkDir[] {
  const dir = join(root, WORKFLOW_DIR);
  const out: WorkDir[] = [];
  if (!existsSync(dir)) throw new NoInvocationsFound();
  for (const f of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    out.push(...workDirsFrom(f, readFileSync(join(dir, f), "utf-8")));
  }
  return out;
}

/** Thrown when the reader finds nothing — never reported as a clean run. */
export class NoInvocationsFound extends Error {
  constructor() {
    super(
      `${WORKFLOW_DIR}: no script invocations were extracted. That is not a ` +
        `clean sweep, it is a broken reader — a filter over nothing passes. ` +
        `Fix the extraction; do not treat this as green.`,
    );
    this.name = "NoInvocationsFound";
  }
}

/** Every invocation in every workflow, in file order. */
export function allInvocations(root = ROOT): Invocation[] {
  const dir = join(root, WORKFLOW_DIR);
  const out: Invocation[] = [];
  if (!existsSync(dir)) throw new NoInvocationsFound();
  for (const f of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    out.push(...invocationsFrom(f, readFileSync(join(dir, f), "utf-8")));
  }
  if (out.length === 0) throw new NoInvocationsFound();
  return out;
}

function main(): number {
  const list = process.argv.includes("--list");
  const invocations = allInvocations();
  const workDirs = allWorkDirs();

  if (list) {
    for (const i of invocations) {
      const where = i.cwd === "" ? "<root>" : i.cwd;
      console.log(`${i.verdict.padEnd(12)} ${i.path}  [${i.file} ${where}]`);
    }
    for (const w of workDirs) {
      console.log(`${w.verdict.padEnd(12)} cwd ${w.dir}  [${w.file} ${w.job}]`);
    }
  }

  const missing = invocations.filter((i) => i.verdict === Verdict.Missing);
  const undetermined = invocations.filter((i) => i.verdict === Verdict.Undetermined);
  const folio = invocations.filter((i) => i.verdict === Verdict.NeedsFolio);

  // An exemption matching nothing is a claim about the present that stopped
  // being true. Ratchet in the other direction, same as `gates.ts`.
  const unused = FOLIO_PATHS.filter(
    (f) => !invocations.some((i) => i.path.includes(f.match)),
  );

  console.log(
    `${invocations.length} invocation(s): ${invocations.length - missing.length - undetermined.length - folio.length} resolve, ` +
      `${folio.length} need a folio, ${missing.length} missing, ${undetermined.length} undetermined`,
  );

  for (const i of missing) {
    // A `note` means the invocation failed for a reason the generic sentence
    // would MISSTATE. The layout case resolves perfectly well from the
    // repository root — saying it does not is the misconception the check
    // exists to correct, printed by the check itself.
    console.error(
      i.note
        ? `✗ ${i.file} › ${i.step}: \`${i.path}\` — ${i.note}.`
        : `✗ ${i.file} › ${i.step}: \`${i.path}\` does not resolve from ` +
            `${i.cwd === "" ? "the repository root" : `\`${i.cwd}/\``}. ` +
            `If the script moved under \`cat-harness/\`, call the npm script ` +
            `instead so the path is written down once.`,
    );
  }
  for (const i of undetermined) {
    console.error(`? ${i.file} › ${i.step}: \`${i.path}\` — ${i.note}. Not treated as a pass.`);
  }
  for (const f of unused) {
    console.error(
      `✗ FOLIO_PATHS entry \`${f.match}\` matches no invocation — remove it. ` +
        `An exemption outliving its step reads as coverage.`,
    );
  }

  // ── The SECOND criterion: does the cwd itself exist? (bean `ai9u`) ──
  const baseline = workDirBaseline();
  const isKnown = (w: WorkDir): boolean => baseline.has(workDirKey(w));
  const badDirs = workDirs.filter((w) => w.verdict === Verdict.Missing && !isKnown(w));
  const openDirs = workDirs.filter((w) => w.verdict === Verdict.Undetermined && !isKnown(w));
  const heldDirs = workDirs.filter(
    (w) => w.verdict !== Verdict.Resolves && w.verdict !== Verdict.NeedsFolio && isKnown(w),
  );
  // Same direction as every other ratchet here: an allowance that no longer
  // matches anything is a claim about the present that stopped being true.
  const staleBaseline = [...baseline].filter(
    (k) => !workDirs.some((w) => workDirKey(w) === k && w.verdict !== Verdict.Resolves),
  );
  const folioDirs = workDirs.filter((w) => w.verdict === Verdict.NeedsFolio);
  const unusedDirs = FOLIO_WORKDIRS.filter(
    (f) => !workDirs.some((w) => w.dir.startsWith(f.match)),
  );

  console.log(
    `${workDirs.length} working-directory declaration(s): ` +
      `${workDirs.length - badDirs.length - openDirs.length - folioDirs.length - heldDirs.length} resolve, ` +
      `${folioDirs.length} need a folio, ${heldDirs.length} baselined, ` +
      `${badDirs.length} missing, ${openDirs.length} undetermined`,
  );

  // Printed on a GREEN run too. A baselined defect that nobody is reminded of
  // is one nobody retires, and this file exists to be emptied.
  for (const w of heldDirs) {
    console.log(
      `· held  ${w.file} › ${w.job} › ${w.step}: \`${w.dir}\` (${w.verdict}) — ` +
        `baselined, still owed`,
    );
  }
  for (const k of staleBaseline) {
    console.error(
      `✗ workdir-baseline.json entry \`${k}\` matches nothing open — remove it. ` +
        `A baseline may only shrink, and a stale one reads as coverage.`,
    );
  }

  for (const w of badDirs) {
    console.error(
      w.note
        ? `✗ ${w.file} › ${w.job} › ${w.step}: \`working-directory: ${w.dir}\` — ${w.note}.`
        : `✗ ${w.file} › ${w.job} › ${w.step}: \`working-directory: ${w.dir}\` does ` +
            `not exist. GitHub evaluates it BEFORE the step runs, so this step ` +
            `fails every time regardless of what it does.`,
    );
  }
  for (const w of openDirs) {
    console.error(
      `? ${w.file} › ${w.job} › ${w.step}: \`working-directory: ${w.dir}\` — ` +
        `${w.note}. Not treated as a pass.`,
    );
  }
  for (const f of unusedDirs) {
    console.error(
      `✗ FOLIO_WORKDIRS entry \`${f.match}\` matches no declaration — remove it. ` +
        `An exemption outliving its step reads as coverage.`,
    );
  }

  const bad =
    missing.length +
    undetermined.length +
    unused.length +
    badDirs.length +
    openDirs.length +
    unusedDirs.length +
    staleBaseline.length;
  if (bad === 0) {
    console.log(
      "✓ every workflow script path resolves, and every `working-directory` " +
        "exists — or is declared folio-only with a reason.",
    );
    return 0;
  }
  return 1;
}

if (import.meta.main) process.exit(main());
