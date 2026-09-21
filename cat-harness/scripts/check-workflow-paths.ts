#!/usr/bin/env bun
/**
 * Every script path a workflow invokes must RESOLVE — from the directory the
 * step actually runs in.
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
 * Usage:
 *   bun run check:workflow-paths          # report and exit non-zero on a finding
 *   bun run check:workflow-paths --list   # print every invocation and its verdict
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
  // The rename has NOT reached `scripts/init-folio.ts`, which still
  // scaffolds `content/<slug>/` and `content/schema/`, nor these workflows.
  // That gap is bean `52dz`'s open half and the owner's call; it is not
  // settled by an exemption table.
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
    match: "pipeline/qa-sweep.ts",
    reason:
      "`cd content` plus a hardcoded folio argument " +
      "(`quantum-observable-universe`) — a retired root AND a named folio " +
      "this repository does not carry",
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
  // be made worse by the obvious fix.
  {
    match: "scripts/lean-build-all.sh",
    reason:
      "`lean-build-sidecar.yml` builds a FOLIO's papers — the same job names " +
      "`content/unital-groebner-bases/lean/lakefile.toml`, which is `qou`'s " +
      "tree — so `scripts/` is the folio's root. `cat-harness/scripts/" +
      "lean-build-all.sh` DOES exist here, a different file sharing the " +
      "basename, so repointing it would be the wrong fix that looks right — " +
      "the same trap `pipeline/build.ts` above records",
  },
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

  if (list) {
    for (const i of invocations) {
      const where = i.cwd === "" ? "<root>" : i.cwd;
      console.log(`${i.verdict.padEnd(12)} ${i.path}  [${i.file} ${where}]`);
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

  const bad = missing.length + undetermined.length + unused.length;
  if (bad === 0) {
    console.log("✓ every workflow script path resolves, or is declared folio-only with a reason.");
    return 0;
  }
  return 1;
}

if (import.meta.main) process.exit(main());
