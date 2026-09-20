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
  {
    match: "pipeline/build.ts",
    reason:
      "runs from `content/` after `cd content`, so it names the FOLIO's own " +
      "pipeline — `content/` is where a folio's sources live and the platform " +
      "carries no folio. `cat-harness/content/pipeline/build.ts` is a " +
      "different file with the same basename; resolving to it would be wrong, " +
      "not a fix",
  },
  {
    match: "pipeline/export-bibtex.ts",
    reason: "same `cd content` shape as build.ts — a folio's bibliography, not the platform's",
  },
  {
    match: "pipeline/latex-preflight.ts",
    reason: "same `cd content` shape — preflights a folio's main.tex",
  },
  {
    match: "pipeline/validate.ts",
    reason: "same `cd content` shape — validates a folio's content tree",
  },
  {
    match: "pipeline/trivial-skeleton-audit.ts",
    reason: "invoked with `--cwd content`, so it audits a folio's blocks",
  },
  {
    match: "pipeline/qa-sweep.ts",
    reason:
      "`cd content` then a folio argument (`quantum-observable-universe`) — " +
      "the QA axes run over a folio's blocks, and the platform has none",
  },
  {
    match: "pipeline/codemod-leanval.ts",
    reason: "rewrites Lean validation calls in a folio's blocks",
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
 * `bun run <path>` and `bun <path>`, where the path looks like a file rather
 * than an npm script name. `bun run check:ci-health` is a script NAME and is
 * deliberately not a path — which is also the fix this check recommends,
 * since it puts the path in `package.json` once instead of in every caller.
 */
export function invokedPath(line: string): string | undefined {
  const m = /^(?:bun|bunx)\s+(?:run\s+)?(?:--cwd\s+\S+\s+)?(\S+)/.exec(line.trim());
  if (!m) return undefined;
  const candidate = m[1];
  if (!/\.(ts|js|mjs)$/.test(candidate)) return undefined; // an npm script name
  if (candidate.startsWith("-")) return undefined;
  return candidate;
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
  jobs?: Record<
    string,
    {
      defaults?: { run?: { "working-directory"?: string } };
      steps?: {
        name?: string;
        run?: string;
        uses?: string;
        with?: { path?: string; repository?: string };
        "working-directory"?: string;
      }[];
    }
  >;
}

/**
 * Directories a job materialises by checking THIS repository into them.
 *
 * `actions/checkout` with a `path:` puts the repo somewhere other than the
 * workspace root, and a step working there spells its paths from that
 * directory — correctly. Locally that directory does not exist, so without
 * this the check would call a working workflow broken, which is the failure
 * mode that teaches people to skim its output.
 *
 * A checkout naming a DIFFERENT `repository:` is deliberately not collected:
 * its contents are not this repo's and nothing here can say whether a path
 * in it resolves.
 */
function checkoutPaths(steps: NonNullable<WorkflowDoc["jobs"]>[string]["steps"]): string[] {
  const out: string[] = [];
  for (const step of steps ?? []) {
    if (!step.uses?.startsWith("actions/checkout")) continue;
    if (step.with?.repository) continue; // someone else's tree
    const path = step.with?.path;
    if (path && !/[$*?`]/.test(path)) out.push(path.replace(/\/+$/, ""));
  }
  return out;
}

/** Strip a checkout prefix, so `source/cat-harness/x.ts` resolves as `cat-harness/x.ts`. */
function stripCheckout(cwd: string, checkouts: string[]): string {
  for (const c of checkouts) {
    if (cwd === c) return "";
    if (cwd.startsWith(`${c}/`)) return cwd.slice(c.length + 1);
  }
  return cwd;
}

/** Every script invocation in one workflow, with the cwd each runs in. */
export function invocationsFrom(file: string, text: string): Invocation[] {
  const doc = parse(text) as WorkflowDoc;
  const out: Invocation[] = [];
  for (const [job, def] of Object.entries(doc.jobs ?? {})) {
    const jobCwd = def.defaults?.run?.["working-directory"] ?? "";
    const checkouts = checkoutPaths(def.steps);
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
          const effective =
            cwd === null ? null : stripCheckout(flag ? applyCd(cwd, flag) : cwd, checkouts);
          out.push(classify({ file, job, step: step.name ?? "(unnamed step)", path, cwd: effective }));
        }
      }
    }
  }
  return out;
}

function classify(inv: {
  file: string;
  job: string;
  step: string;
  path: string;
  cwd: string | null;
}): Invocation {
  const base = { file: inv.file, job: inv.job, step: inv.step, path: inv.path };
  if (inv.cwd === null) {
    return {
      ...base,
      cwd: "(unresolved)",
      verdict: Verdict.Undetermined,
      note: "a `cd` in this block names a variable, glob or substitution",
    };
  }
  if (existsSync(resolve(ROOT, inv.cwd, inv.path))) {
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
    console.error(
      `✗ ${i.file} › ${i.step}: \`${i.path}\` does not resolve from ` +
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
