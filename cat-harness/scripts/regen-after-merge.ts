#!/usr/bin/env bun
/**
 * Repair the generated artefacts a merge left wrong — by ASKING each gate.
 *
 * @module scripts/regen-after-merge
 * @graphNode none — a maintenance command over the gate set
 *
 * ## The failure this exists for
 *
 * Bean `lxpq`, measured on `main` at `3341108a`, 2026-09-22. Two branches
 * changed one committed generated file in NON-OVERLAPPING places:
 *
 *   main (`tis1`)  added `tile.voices.count` — a projection declares its count
 *   #827 (`26tu`)  added a sixth voice, `agent-skill-authoring`
 *
 * One touched the header, the other the array. Git merged them with **no
 * conflict** and produced a projection declaring `count: 5` while listing 6
 * voices — an artefact **neither side would ever emit**.
 *
 * **A conflict is a question; a clean merge is an assertion that the result is
 * correct.** That is why this is not bean `520m` and why
 * `qa:resolve-conflicts` cannot help: that command only ever inspects UNMERGED
 * paths, and here there were none.
 *
 * The general shape, which is not specific to voices:
 *
 * > A committed generated artefact can merge into a state no generator would
 * > produce, whenever two branches touch different parts of it. The only
 * > reliable check is to RE-RUN THE GENERATOR, never to read the diff — the
 * > merged file looks plausible from either side, which is exactly what let
 * > this one through.
 *
 * ## Why it asks the gates rather than regenerating everything
 *
 * "Regenerate everything declared" was the obvious repair and is the wrong
 * one twice over.
 *
 * **It would need a list, and the list is the defect.** `gates.ts` already
 * settled where the authority lives — *"the workflow is the authority, and
 * `package.json` is not"* — having measured that of the repository's `:check`
 * scripts, **21 appeared in no workflow at all**. A second list here, derived
 * from `package.json`, would run generators CI does not gate and would be a
 * guess that reads as coverage. So the gate set is loaded from the workflow,
 * through `loadGates`, and a `:check` CI does not run is not this command's
 * business.
 *
 * **And a blanket regeneration cannot tell repair from damage.** Running every
 * writer rewrites artefacts that were already correct, so the diff afterwards
 * says nothing about what the merge broke. Asking each check FIRST means the
 * output is exactly the set of artefacts the merge left wrong, which is the
 * question a person actually has after a merge.
 *
 * ## The three states, and the fourth that matters most
 *
 * | state | what happened |
 * |---|---|
 * | `current` | the check passed; nothing was run |
 * | `regenerated` | the check failed, its writer ran, the check now passes |
 * | **`unrepaired`** | the check failed, its writer ran, **and it still fails** |
 * | `no-writer` | the check failed and has no writer counterpart |
 * | `writer-failed` | the check failed, its writer EXITED NON-ZERO, and the check still fails |
 * | `no-browser` | as `unrepaired`/`writer-failed`, for a browser-job check on a machine with no Chromium |
 *
 * **`unrepaired` is the one this command exists to surface honestly.** A check
 * can fail for reasons that are not staleness — a real defect — and a tool
 * that ran a generator and then reported success would be claiming a repair it
 * did not make. Both it and `no-writer` exit non-zero and name the check.
 *
 * **`writer-failed` is a verdict about the TOOL, not the tree** — bean `i1q7`.
 * `translate-bpmn:bootstrap` printed "Nothing to do" and exited 2, and regen
 * reported `translate-bpmn:bootstrap:check` as "a real defect, not staleness"
 * while `--extract` fixed it in a second. A writer that refuses to run is not a
 * repair that failed; it is a writer that is not a writer, and saying so points
 * the reader at `package.json` rather than at the artefact.
 *
 * ## The whole gate set by default — bean `i1q7`, item 3
 *
 * This command asked only the FAST set (the jobs that install no browser),
 * borrowing `bun run gates`' inner-loop boundary. That boundary is about the
 * cost of `playwright test`, which regen never runs: it asks only verify/write
 * PAIRS, and outside the fast set there were exactly two — `render:bpmn:check`
 * (3.7 s) and `bat:sync:check` (0.1 s, and it needs no browser at all; it sits
 * in the e2e job by placement). `render:bpmn:check` was stale after every
 * merge that brought a process change, measured four times on 2026-10-01, and
 * every time the line saying so was the "NOT covered" footnote. So the default
 * is the whole set now, and `--fast` keeps the old scope for a machine that
 * wants it. A browser-job check that cannot be repaired on a machine with no
 * Chromium is reported `no-browser` — could-not-determine, never green, and
 * never a claim that the tree is wrong.
 *
 * ## Speed — bean `xpcu`
 *
 * Asked serially this took ~25 minutes on a shared 4-CPU box. Two things now
 * cut that, and neither changes a verdict:
 *
 * - **Input-hash skipping** (`input-hash.ts`). A pair whose declared inputs,
 *   outputs and script sources hash to what was recorded at its last green run
 *   is not asked again — it cannot answer differently. A pair with no
 *   declaration, or whose inputs cannot be determined, is ALWAYS asked. The
 *   cache is local (`build/regen-cache/`, ignored by version control) and is
 *   off under `CI`, so CI asks every pair exactly as before.
 * - **A worker pool** (`task-pool.ts`). A pair whose CHECK declares
 *   `outputs: []` (it only reads) is asked beside other such pairs. Every
 *   WRITER runs alone — no check reading and no other writer writing — and
 *   writers run in pair order. A pair whose check has no declaration is a
 *   barrier: it runs alone and in order, exactly as before. Per-pair lines
 *   (`--explain`) print in the original order.
 *
 * Why concurrency cannot change a verdict: a pass that ran a writer is always
 * followed by another, and the run is reported settled only after a pass in
 * which NO writer ran — so the final verdicts were all read from a tree no
 * writer was touching (bean `14ve`'s fixpoint does the work).
 *
 * Usage:
 *   bun run regen                # ask every gate; repair what is stale
 *   bun run regen --fast         # ...only the fast set (no browser-job pairs)
 *   bun run regen --dry-run      # report what is stale, change nothing
 *   bun run regen --jobs 3       # pool size (default: CPUs - 1)
 *   bun run regen --no-cache     # ask every pair; neither read nor update the hash cache
 *   bun run regen --explain      # say, per pair, why it ran or was skipped
 *   bun run regen --max-passes 8 # raise the fixpoint bound (default: DEFAULT_MAX_PASSES)
 *
 * `--all` is accepted and is the default.
 *
 * Exit (one decision, in {@link exitCodeFor}):
 *   0  every pair is current or was regenerated, and the run SETTLED
 *   1  at least one check is `unrepaired` or `no-writer` — not staleness
 *   2  the run did not reach a fixed point: COULD NOT DETERMINE, never clean
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { loadGates, type Gate } from "./gates.ts";
import {
  FileDigests,
  cacheEnabled,
  decide,
  fingerprint,
  loadCache,
  saveCache,
  type HashCache,
  type PairIO,
  type SkipDecision,
} from "./input-hash.ts";
import { ReadWriteGate, jobsFromArgv, orderedEmitter, runCaptured, runPool } from "./task-pool.ts";
import { pairIO } from "./task-io.ts";
import { repoRootFor } from "../schemas/cat-harness.ts";

const ROOT = join(import.meta.dir, "..");
const dryRun = process.argv.includes("--dry-run");
const fast = process.argv.includes("--fast");
const all = !fast;
const explain = process.argv.includes("--explain");

/** The npm script a gate command runs, when it runs exactly one. */
export function scriptOf(command: string): string | undefined {
  const m = /^bun run ([A-Za-z0-9:_-]+)\s*$/.exec(command.trim());
  return m?.[1];
}

/**
 * The writer for a `:check` script, when the pair exists.
 *
 * The convention this repository already follows everywhere: `X` writes and
 * `X:check` verifies. Read from `package.json` rather than assumed, because a
 * check whose writer was renamed must come back as `no-writer` — a reported
 * gap — and not as a command that silently runs nothing.
 */
export function writerFor(scripts: Record<string, string>, check: string): string | undefined {
  const override = WRITER_OVERRIDES[check];
  if (override !== undefined) return scripts[override] === undefined ? undefined : override;
  if (!check.endsWith(":check")) return undefined;
  const base = check.slice(0, -":check".length);
  return scripts[base] === undefined ? undefined : base;
}

/**
 * The checks whose writer is NOT `<check minus ":check">` — bean `eowd`.
 *
 * Declared, one line each, rather than inferred: the convention holds for
 * nearly every pair, and for these it is measurably wrong. Without this table
 * `regen` reported each as "a real defect, not staleness" while one command
 * fixed it — a false verdict on the one line meant to be trusted.
 *
 * - `translate-bpmn` with no flag only REPORTS; the writing mode is
 *   `--extract`, exposed as its own script so the writer stays a name read
 *   from `package.json` (a writer renamed away still comes back `no-writer`).
 * - the two audit-coverage gates are not `:check`-named at all, so the
 *   convention never offered them; `audit:coverage` rewrites the sidecar both
 *   compare against.
 */
export const WRITER_OVERRIDES: Readonly<Record<string, string>> = {
  "translate-bpmn:check": "translate-bpmn:extract",
  "audit:coverage:strict": "audit:coverage",
  "audit:coverage:require-all": "audit:coverage",
  // Bean `uju6`: a `check:X` gate is `check:`-PREFIXED, so the convention never
  // offered it and regen skipped it outright. It did not even count it as
  // `no-writer`. #1550 went red on this one while regen reported "63 current,
  // 0 regenerated". `prov-qaqc.ts` without `--check` rewrites the page.
  "check:prov-qaqc": "prov:qaqc",
  // Same bean, one gate later: `check:term-mapping` arrived with #1633 and is
  // a genuine pair — `check-term-mapping.ts` without `--check` REWRITES
  // `test/results/term-mapping.qa-results.json`, which the `--check` form
  // compares against. Declared here rather than inferred from the name,
  // because the writer is spelled `term:mapping` where the check is spelled
  // `check:term-mapping`, and because inference is what got `check:raci` and
  // `check:subgraphs` wrong: an earlier version of this fix on #1633 paired
  // both by name, ran commands that repair nothing, and reported `unrepaired`
  // — the verdict about the tool that `NO_WRITER` below exists to prevent.
  "check:term-mapping": "term:mapping",
  // Found by MEASURING, not from uju6's list of four (2026-09-30): every
  // `check:X` whose command is some writer's command plus ` --check`. Main went
  // red on `check:glossary` at 7bdda74 while regen, not knowing this pair,
  // could not repair it. `glossary-page.ts` regenerates from its sources.
  "check:glossary": "glossary:page",
  // Re-materialises a remote package's skills at its PINNED commit, so it is
  // deterministic and is exactly the repair for a stale copy.
  "check:remote-skills": "sync:remote-skills",
  // Bean `i1q7` / `0utt`. The gate COMPARES the committed
  // `kg-export.bootstrap.qa-results.json` with a fresh re-export (bean `ymsu`
  // stopped it rewriting the file on its way past), so a stale sidecar is red
  // here and nothing in regen knew the writer: it had to be run by hand after
  // every merge that changed `kg-export.ts` or the bootstrap instance.
  // `kg-export.ts --instance ./bootstrap` rewrites exactly that sidecar. A red
  // that is NOT staleness (the export itself failing) comes back `unrepaired`.
  "check:published-instance-exports": "kg:export:bootstrap",
  // Bean `v556`: the convention's `kg:export` writes the HOST's document and
  // sidecar only, so a stale `kg-export.<stub>` sidecar would come back
  // `unrepaired`. `--sidecars` rewrites exactly the set `--check` compares.
  "kg:export:check": "kg:export:sidecars",
  // Bean `wczm` item 1: two gates regen could not repair, so a merge train's
  // single `regen` called the tree current and CI then went red (trains 2 and
  // 3, #1876, #1883). `check:l1-complete -- --check` was not a bare script,
  // so regen never saw it; it is now the named `check:l1-complete:check`,
  // whose writer is `--write`. `smart-kg-l1`'s only writer took one
  // `--entry` at a time; `--all` rewrites every entry `--check` examines.
  "check:l1-complete:check": "l1-complete:write",
  "smart-base:smart-kg-l1:check": "smart-base:smart-kg-l1:all",
};

/**
 * Verify/write pairs that are NOT gates but whose artefacts something gated
 * READS — bean `5qq3`, owner's option 1 (2026-10-01).
 *
 * `library:viz`, `schema:viz` and `uploads:viz` are ungated by the owner's 2026-09-20 ruling
 * (they derive from the whole repository, so a red would mean "somebody else
 * merged"; see the NOT GATED comment in code-quality-gates.yml). That ruling
 * stands: they are still not gates. But their OUTPUT is an input to things that
 * are — `methodologies:viz` reads the library index, and
 * `library-viewer-scope.e2e.ts` reads it in CI. Measured on PR #1769: regen
 * reported a clean fixed point, `library:viz` was 18 artefacts stale, and CI
 * failed twice on what read it. Running the writer here keeps the artefact
 * fresh without making staleness a gate.
 *
 * Asked FIRST, so a fast-set check that reads their output is asked after the
 * write in the same pass rather than one pass late.
 */
export const UNGATED_INPUTS: readonly { check: string; writer: string }[] = [
  { check: "library:viz:check", writer: "library:viz" },
  { check: "schema:viz:check", writer: "schema:viz" },
  // uploads:viz is ungated for library:viz's reason (it renders the same
  // projection), but every page it writes carries the viewer RAIL, and
  // `check:nav-names:check` — a gate — reads railed pages. Without it here a
  // merge that changes a rail label leaves /cat-harness/uploads/ stale, and
  // regen reports check:nav-names as "a real defect, not staleness".
  // Measured 2026-10-03: merge-main refused #1804 and #1958 on exactly that,
  // and `bun run uploads:viz` alone turned the check green.
  { check: "uploads:viz:check", writer: "uploads:viz" },
];

/**
 * `check:`-prefixed gates whose same-named script exists but is NOT a writer —
 * bean `uju6`, each read before being listed. Pairing them by name would run a
 * command that repairs nothing and then report `unrepaired`, a verdict about
 * the tool rather than the tree. So they are recorded here, and not asked.
 *
 * - `raci-chart.ts` without `--check` only PRINTS the chart.
 * - `check-subgraphs.ts` without `--check` only changes the exit code.
 * - `harness-dirs.ts` materialises declared DIRECTORIES; `check-harness-dirs`
 *   compares two config files and has nothing to regenerate.
 */
export const NO_WRITER: Readonly<Record<string, string>> = {
  "check:raci": "raci-chart.ts only prints; it writes nothing",
  "check:subgraphs": "check-subgraphs.ts only reports",
  "check:harness-dirs": "compares two config files; harness:dirs makes directories, not what it compares",
  // THE BASELINE CASES: a writer exists and must NOT be run. What it writes is
  // the baseline the gate compares against, and the gate fails only on a
  // REGRESSION, so running it on a failure re-baselines — the regression
  // vanishes and is reported as a repair. There are two, and the second is why
  // this comment no longer says "the one case":
  //
  // - `viewer:nav:audit` writes the viewer-nav baseline.
  // - `check:state-on-main --update` writes the state-on-main baseline, which
  //   may only SHRINK. regen repairing it would be regen RAISING a ratchet,
  //   which is the whole thing the ratchet exists to prevent. Its `--update`
  //   refuses growth without `--allow-growth` as a second line of defence, but
  //   the first is not asking it at all.
  "check:viewer-nav": "its writer re-baselines, which would hide the regression the gate exists to report",
  "check:state-on-main": "its --update writes the ratchet the gate reads; repairing it would RAISE a baseline that may only shrink",
};

/**
 * How many passes a fixpoint run may take before it gives up — bean `g5kt`.
 *
 * ## Why it is not 3, which is what it was
 *
 * A pass is reported settled only when it ran NO writer, so a cap of N admits
 * at most **N − 1** writer-running passes. 3 therefore allowed two, and that
 * is below the measured need: the merge sweep of 2026-10-04 found
 * `skill:register` wanting a THIRD writer pass before its chain settled —
 * `skill:register` writes artefacts that other writers read, and
 * `skill-registration.md` records the chain being three deep. Under the old
 * default that run could not converge, and (bean `g5kt` defect 1) said so
 * while exiting 0.
 *
 * ## Why it is a bound at all, rather than "until it settles"
 *
 * Two writers can undo each other — `regen-after-merge.test.ts` has the case
 * — and an unbounded loop over that pair never returns. The bound is what
 * turns a hang into a reported refusal.
 *
 * ## Why this number
 *
 * It is a SANE BOUND, not a derived one, and saying so is the honest version.
 * The derivable bound is the longest chain of writer-reads-writer among the
 * pairs, which this tool cannot compute: `task-io.ts` declarations are
 * partial by design (a pair with no declaration is always asked), so a
 * computed depth would be an underestimate presented as a limit. 6 admits
 * five writer passes — twice the deepest chain ever measured here — and
 * `--max-passes` raises it for anyone who hits it. A run that needs more says
 * so and fails, which is the state this is allowed to leave behind.
 */
export const DEFAULT_MAX_PASSES = 6;

/** `--max-passes N` / `--max-passes=N`, defaulting to {@link DEFAULT_MAX_PASSES}. */
export function maxPassesFromArgv(argv: readonly string[], fallback = DEFAULT_MAX_PASSES): number {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    let v: string | undefined;
    if (a === "--max-passes") v = argv[i + 1];
    else if (a.startsWith("--max-passes=")) v = a.slice("--max-passes=".length);
    else continue;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1) {
      throw new Error(`--max-passes needs a positive integer, got ${JSON.stringify(v)}`);
    }
    return n;
  }
  return fallback;
}

export type Outcome = "current" | "regenerated" | "unrepaired" | "no-writer" | "writer-failed" | "no-browser";

export interface Result {
  check: string;
  writer?: string;
  outcome: Outcome;
  /** `current` because its inputs hash to its last green run, not because it was asked. */
  skipped?: boolean;
}

/** One verify/write pair, with what it declares about its files (`task-io.ts`). */
export interface Pair {
  check: string;
  writer: string | undefined;
  /**
   * The CHECK's declaration. Undefined: nothing declared — the pair runs alone
   * and is never skipped. `outputs: []` lets it share the pool; `inputs` lets
   * it be skipped.
   */
  io?: PairIO | undefined;
}

/** Every repairable gate in the set, in workflow order, deduplicated. */
export function repairableGates(gates: readonly Gate[], scripts: Record<string, string>): {
  check: string;
  writer: string | undefined;
}[] {
  const seen = new Set<string>();
  const out: { check: string; writer: string | undefined }[] = [];
  for (const g of gates) {
    const script = scriptOf(g.command);
    if (script === undefined || (!script.endsWith(":check") && WRITER_OVERRIDES[script] === undefined)) continue;
    // `check:X` gates have `:check` nowhere at the end, so only a DECLARED
    // writer brings one in. NO_WRITER records the rest, with reasons.
    if (seen.has(script)) continue;
    seen.add(script);
    out.push({ check: script, writer: writerFor(scripts, script) });
  }
  return out;
}

/**
 * Runs one npm script and says whether it exited 0. Injected in tests.
 *
 * May be synchronous or asynchronous; the pass awaits either.
 */
export type Runner = (script: string) => boolean | Promise<boolean>;

/** What a pass may be told beyond the pairs and the runner. */
export interface PassOptions {
  /** Report what is stale without running any writer. */
  dryRun?: boolean;
  /** Pool size. 1 reproduces the serial order exactly. */
  jobs?: number;
  /**
   * Whether this pair may be skipped this pass. Asked once per pair per pass —
   * a writer earlier in the run can change a later pair's inputs, so a
   * decision from pass 1 is never reused in pass 2.
   */
  skip?: (pair: Pair) => SkipDecision;
  /** Called IN PAIR ORDER with each pair's result and why it ran or was skipped. */
  report?: (pair: Pair, result: Result, why: string | undefined, ms: number) => void;
}

/** Whether a pair's check is declared read-only, so it may share the pool. */
export function pairShares(pair: Pair): boolean {
  return pair.io?.outputs !== undefined && pair.io.outputs.length === 0;
}

/**
 * Ask every pair once: current, or stale and repaired, or not.
 *
 * `writerRan` is the set of writers this pass ran. The caller needs it to know
 * whether another pass could change anything.
 *
 * Pairs are scheduled through {@link runPool}: checks declared read-only share
 * the pool, every writer (with the re-ask that follows it) holds the WRITE
 * side of a {@link ReadWriteGate} so nothing else runs beside it, and a pair
 * without a declaration runs alone and in order — so a run in which nothing is
 * declared is the serial run it always was.
 */
export async function regenPass(
  pairs: readonly Pair[],
  runner: Runner,
  opts: PassOptions | boolean = {},
): Promise<{ results: Result[]; writerRan: string[] }> {
  const o: PassOptions = typeof opts === "boolean" ? { dryRun: opts } : opts;
  const writerRan: string[] = [];
  const emitter = orderedEmitter<{ result: Result; why: string | undefined; ms: number }>((i, v) =>
    o.report?.(pairs[i]!, v.result, v.why, v.ms),
  );

  // Checks that only read share; writers (and the re-ask after one) run alone.
  const gate = new ReadWriteGate();
  const askOne = async (pair: Pair, index: number): Promise<{ result: Result; why: string | undefined; ms: number }> => {
    const { check, writer } = pair;
    const t0 = performance.now();
    const decision = o.skip?.(pair);
    if (decision?.skip === true) {
      return { result: { check, writer, outcome: "current", skipped: true }, why: decision.why, ms: 0 };
    }
    const why = decision?.why;
    const done = (result: Result) => ({ result, why, ms: performance.now() - t0 });
    if (await gate.read(async () => runner(check))) return done({ check, writer, outcome: "current" });
    if (writer === undefined) return done({ check, outcome: "no-writer" });
    if (o.dryRun) return done({ check, writer, outcome: "regenerated" });
    return gate.write(index, async () => {
      const wrote = await runner(writer);
      writerRan.push(writer);
      // Ask AGAIN. A writer that ran is not a repair that worked, and reporting
      // it as one would be the false-clean this whole command is about.
      // And a writer that EXITED NON-ZERO is named as such (bean `i1q7`): the
      // defect is in the declared writer, not in what it generates from.
      const outcome: Outcome = (await runner(check)) ? "regenerated" : wrote ? "unrepaired" : "writer-failed";
      return done({ check, writer, outcome });
    });
  };

  const done = await runPool(
    pairs.map((pair, i) => ({
      id: pair.check,
      // A pair runs beside others only when its CHECK declares it writes
      // nothing. Anything else — undeclared, or a check that writes — is a
      // barrier, exactly as serial.
      outputs: pairShares(pair) ? [] : undefined,
      run: () => askOne(pair, i),
    })),
    o.jobs ?? 1,
    (i, v) => emitter.push(i, v),
  );
  // Writers in PAIR order, not completion order, so the record is deterministic.
  const order = new Map(pairs.map((p, i) => [p.writer, i]));
  writerRan.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  return { results: done.map((d) => d.result), writerRan };
}

/**
 * Passes until one runs NO writer, at most `maxPasses` — bean `14ve`.
 *
 * One pass asks each check once, in workflow order. When writer B's output is
 * an INPUT to check A and A comes first, A reads current before B runs, B then
 * changes A's input, and A is stale when regen exits. Measured on #1530:
 * "60 current, 2 regenerated, 0 unrepaired", then `audit:coverage:require-all`
 * failed in CI.
 *
 * So a pass that ran any writer is followed by another. Each check's FINAL
 * outcome is its last pass's, except that `regenerated` in an earlier pass is
 * kept over a later `current`, because the repair happened. The cap keeps two
 * writers that undo each other from looping for ever. The last pass still ran a
 * writer, so its results are reported as they are, not as settled.
 *
 * The same argument is what makes the worker pool safe: the settling pass ran
 * no writer, so every verdict it reports was read from a tree nobody was
 * writing.
 *
 * The cap is {@link DEFAULT_MAX_PASSES}; `--max-passes` raises it. A run that
 * reaches it returns `settled: false`, and that is a REFUSAL, not a pass —
 * see {@link exitCodeFor}.
 */
export async function regenToFixpoint(
  pairs: readonly Pair[],
  runner: Runner,
  maxPasses = DEFAULT_MAX_PASSES,
  opts: Omit<PassOptions, "dryRun"> & { onPass?: (pass: number) => void } = {},
): Promise<{ results: Result[]; passes: number; settled: boolean }> {
  const final = new Map<string, Result>();
  let passes = 0;
  let settled = false;
  while (passes < maxPasses) {
    passes++;
    opts.onPass?.(passes);
    const { results, writerRan } = await regenPass(pairs, runner, opts);
    for (const r of results) {
      const prev = final.get(r.check);
      final.set(r.check, prev?.outcome === "regenerated" && r.outcome === "current" ? prev : r);
    }
    if (writerRan.length === 0) {
      settled = true;
      break;
    }
  }
  return { results: pairs.map((p) => final.get(p.check)!), passes, settled };
}

/** Why a run exited as it did — one of these, never a bare number. */
export type ExitReason = "dry-run" | "clean" | "not-settled" | "not-staleness";

/**
 * The outcomes that are not staleness, so a run carrying one is not clean.
 *
 * Derived from {@link Outcome} by exclusion rather than listed independently:
 * `current` and `regenerated` are the only two a clean run may hold, so a
 * NEW outcome joins this set by default and has to be deliberately excluded.
 * The merge that brought in `writer-failed` and `no-browser` (2026-10-04) is
 * why — a hand-kept list of failures is a list that forgets the next one, and
 * forgetting here means exiting 0.
 */
const CLEAN_OUTCOMES = new Set<Outcome>(["current", "regenerated"]);
const NOT_STALENESS: ReadonlySet<Outcome> = new Set<Outcome>(
  (["current", "regenerated", "unrepaired", "no-writer", "writer-failed", "no-browser"] as const).filter(
    (o) => !CLEAN_OUTCOMES.has(o),
  ),
);

/** {@link exitCodeFor}'s verdict: the code, which reason earned it, and the line to print. */
export interface ExitVerdict {
  code: number;
  reason: ExitReason;
  message?: string;
}

/**
 * The run's exit code — bean `g5kt` defect 1.
 *
 * ## The false clean this replaces
 *
 * This was inline in the CLI and consulted `unrepaired` and `no-writer` only.
 * `settled` was computed, printed as *"CAP REACHED: the last pass still ran a
 * writer, so the tree may not be settled"*, and then **dropped** — so a run
 * that could not reach a fixed point exited 0. Every reader of an exit code
 * (a pre-push sweep, `prepare-merge`, a CI step, an agent) was told the tree
 * was regenerated when the tool's own last line said it did not know.
 *
 * That is the standing could-not-determine rule — *"a sweep blind on one
 * check has not cleared the others"* — broken by one of the tools that
 * reports it, which is why it is a function with a name and a test rather
 * than three lines at the bottom of a script.
 *
 * ## Why not-settled outranks a clean count
 *
 * An unsettled run's verdicts were read from a tree a writer was still
 * changing, so `0 unrepaired` over it is not a finding of zero — it is a
 * count nobody can stand behind. The order below is therefore deliberate:
 * `not-staleness` first because it names specific checks a person must read,
 * then `not-settled`, and `clean` only when neither holds.
 *
 * `--dry-run` ran no writer by construction, so it cannot settle anything and
 * is not judged on it.
 */
export function exitCodeFor(run: {
  results: readonly Result[];
  settled: boolean;
  dryRun?: boolean;
  passes?: number;
}): ExitVerdict {
  if (run.dryRun === true) return { code: 0, reason: "dry-run" };
  const bad = run.results.filter((r) => NOT_STALENESS.has(r.outcome));
  if (bad.length > 0) {
    // `no-browser` is in the set because bean `i1q7` put it there, and it stays
    // exit 1 for the reason that set exists: it is not staleness, so it must
    // not read as a clean regeneration. But it is a could-not-determine
    // rather than a defect in the tree, and the one-size message called every
    // one of them something "a generator cannot fix" — which misdescribes a
    // machine that simply has no Chromium. So the count is main's and the
    // wording is split.
    const blind = bad.filter((r) => r.outcome === "no-browser");
    const real = bad.length - blind.length;
    const parts: string[] = [];
    if (real > 0) {
      parts.push(
        `${real} check(s) are NOT explained by staleness. Read them: a generator ` +
          "cannot fix a defect in what it is generating from.",
      );
    }
    if (blind.length > 0) {
      parts.push(
        `${blind.length} check(s) COULD NOT BE DETERMINED here: they repair through a ` +
          `browser and this machine has none (${blind.map((r) => r.check).join(", ")}). ` +
          "That is not a finding about the tree, and it is not a pass either — " +
          "run them where a browser exists.",
      );
    }
    return { code: 1, reason: "not-staleness", message: parts.join("\n\n") };
  }
  if (!run.settled) {
    return {
      code: 2,
      reason: "not-settled",
      message:
        `COULD NOT DETERMINE: the run did not reach a fixed point within ` +
        `${run.passes ?? DEFAULT_MAX_PASSES} pass(es) — the last one still ran a writer. ` +
        "Every verdict above was read from a tree a writer was still changing, so this " +
        "is NOT a clean regeneration. Re-run with `--max-passes` raised; if it still will " +
        "not settle, two writers are undoing each other and that is the defect to fix.",
    };
  }
  return { code: 0, reason: "clean" };
}

/**
 * Re-label a failure that only a browser could repair, on a machine with none.
 *
 * `render:bpmn:check` renders through Chromium. Without one, the check and its
 * writer both fail, and `unrepaired` would assert "a real defect" that nothing
 * measured. Only checks OUTSIDE the fast set are candidates, because the fast
 * set is by derivation the jobs that install no browser; inside it, a failure
 * is the tree's or the tool's and keeps its verdict.
 */
export function relabelForMissingBrowser(
  results: readonly Result[],
  fastChecks: ReadonlySet<string>,
  browserPresent: boolean,
): Result[] {
  if (browserPresent) return [...results];
  return results.map((r) =>
    (r.outcome === "unrepaired" || r.outcome === "writer-failed") && !fastChecks.has(r.check)
      ? { ...r, outcome: "no-browser" as const }
      : r,
  );
}

/** Is there a Chromium playwright can launch? Probed, never assumed. */
async function browserPresent(): Promise<boolean> {
  try {
    const { chromiumExecutable } = await import("./bpmn-render.ts");
    if (chromiumExecutable() !== undefined) return true;
    const { chromium } = await import("playwright");
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

/** The cache key of a pair: both script names, so a re-paired check starts fresh. */
export function cacheKey(pair: Pair): string {
  return `${pair.check} -> ${pair.writer ?? "(none)"}`;
}

/** The npm scripts a pair runs, check first. */
function scriptsOf(pair: Pair): string[] {
  return pair.writer === undefined ? [pair.check] : [pair.check, pair.writer];
}

/**
 * The hashes to record after a run: only for pairs that ended `current` or
 * `regenerated` (and were actually asked, or were skipped against a hash that
 * still holds), only when the run SETTLED, and only where the fingerprint
 * could be computed. Everything else is dropped from the cache, so it is
 * asked next time.
 */
export function hashesToRecord(
  pairs: readonly Pair[],
  results: readonly Result[],
  settled: boolean,
  fp: (pair: Pair) => ReturnType<typeof fingerprint>,
  previous: HashCache,
): HashCache {
  const next: HashCache = { version: previous.version, pairs: { ...previous.pairs } };
  pairs.forEach((pair, i) => {
    const key = cacheKey(pair);
    const r = results[i];
    const green = r !== undefined && (r.outcome === "current" || r.outcome === "regenerated");
    if (!settled || !green) {
      delete next.pairs[key];
      return;
    }
    const f = fp(pair);
    if ("undetermined" in f) delete next.pairs[key];
    else next.pairs[key] = f.hash;
  });
  return next;
}

if (import.meta.main) {
  const repoRoot = repoRootFor(ROOT);
  const scripts = (JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8")) as {
    scripts?: Record<string, string>;
  }).scripts ?? {};
  const jobs = jobsFromArgv(process.argv);
  const maxPasses = maxPassesFromArgv(process.argv);
  const useCache = cacheEnabled(process.argv, process.env);
  const t0 = performance.now();

  const gates = loadGates(repoRoot, { all });
  const gated = repairableGates(gates, scripts);
  const extra = UNGATED_INPUTS.filter((p) => !gated.some((g) => g.check === p.check));
  // The ungated inputs stay BARRIERS whatever their checks declare: they are
  // asked first precisely so their writes land before any gated check reads
  // (bean `5qq3`), and sharing the pool would let a dependent check read first.
  const repairable: Pair[] = [
    ...extra.map((p) => ({ ...p, io: { inputs: pairIO(p.check)?.inputs } })),
    ...gated.map((p) => ({ ...p, io: pairIO(p.check) })),
  ];
  console.log(
    `regen-after-merge — ${gated.length} verify/write pair(s) in the ` +
      `${all ? "whole" : "fast"} gate set (of ${gates.length} gate(s))` +
      (extra.length > 0 ? `, plus ${extra.length} ungated input(s): ${extra.map((p) => p.writer).join(", ")}` : ""),
  );
  const declared = repairable.filter((p) => p.io?.inputs !== undefined).length;
  const sharing = repairable.filter(pairShares).length;
  console.log(
    `  ${jobs} worker(s); input-hash cache ${useCache ? "ON" : "OFF (--no-cache or CI)"}; ` +
      `${declared} of ${repairable.length} pair(s) declare inputs and may be skipped; ` +
      `${sharing} have read-only checks and may share the pool`,
  );

  const cache = useCache ? loadCache(repoRoot) : undefined;
  // A fresh digest table per pass: a writer in pass N changes files that pass
  // N+1 must hash again, and a reused table could serve a stale digest when an
  // mtime does not move within one clock tick.
  let digests = new FileDigests(repoRoot);
  const fp = (pair: Pair) => fingerprint(repoRoot, scripts, scriptsOf(pair), pair.io, digests);
  const skip = (pair: Pair): SkipDecision => decide(cache, cacheKey(pair), fp(pair));

  const checks = new Set(repairable.map((p) => p.check));
  const asyncRun = async (script: string): Promise<boolean> => {
    const ok = (await runCaptured(["bun", "run", script], repoRoot)).code === 0;
    // A writer changed files: digests computed before it are of a tree that
    // no longer exists. (The fixpoint would catch a stale skip one pass later;
    // this makes the pass after the write see it at once.)
    if (!checks.has(script)) digests.clear();
    return ok;
  };
  const report: PassOptions["report"] = explain
    ? (pair, r, why, ms) => {
        const verb = r.skipped ? "skip" : "ran ";
        const time = r.skipped ? "" : ` (${(ms / 1000).toFixed(1)}s, ${r.outcome})`;
        console.log(`    ${verb} ${pair.check}${time} — ${why ?? "cache disabled (--no-cache or CI)"}`);
      }
    : undefined;

  let results: Result[];
  let settled = false;
  if (dryRun) {
    results = (await regenPass(repairable, asyncRun, { dryRun: true, jobs, skip, report })).results;
  } else {
    const fx = await regenToFixpoint(repairable, asyncRun, maxPasses, {
      jobs,
      skip,
      report,
      onPass: (n) => {
        digests = new FileDigests(repoRoot);
        if (explain) console.log(`  pass ${n}:`);
      },
    });
    // Bean `i1q7`: a browser-job check that could not be repaired on a machine
    // with no Chromium is `no-browser` — could-not-determine, never a defect.
    const fastChecks = new Set(repairableGates(loadGates(repoRoot, { all: false }), scripts).map((p) => p.check));
    results = relabelForMissingBrowser(fx.results, fastChecks, await browserPresent());
    settled = fx.settled;
    console.log(
      `  ${fx.passes} pass(es)` +
        (fx.settled
          ? ""
          : ` of ${maxPasses} — CAP REACHED: the last pass still ran a writer, so the tree is NOT settled`),
    );
  }
  if (cache !== undefined && !dryRun) {
    digests = new FileDigests(repoRoot);
    saveCache(repoRoot, hashesToRecord(repairable, results, settled, fp, cache));
  }
  for (const r of results) {
    if (r.outcome === "regenerated") {
      console.log(
        dryRun
          ? `  · ${r.check} is stale — would run \`bun run ${r.writer}\``
          : `  ✓ ${r.check} was stale — regenerated with \`bun run ${r.writer}\``,
      );
    } else if (r.outcome === "unrepaired") {
      console.log(`  ✗ ${r.check} STILL fails after \`bun run ${r.writer}\` — a real defect, not staleness`);
    } else if (r.outcome === "no-writer") {
      console.error(`  ✗ ${r.check} fails and has NO writer counterpart — not staleness`);
    } else if (r.outcome === "writer-failed") {
      console.error(
        `  ✗ ${r.check} still fails, and its writer \`bun run ${r.writer}\` EXITED NON-ZERO — ` +
          "the declared writer is not a writer; fix the pairing, not the artefact",
      );
    } else if (r.outcome === "no-browser") {
      console.error(
        `  ? ${r.check} could NOT be asked: it needs Chromium and none is installed ` +
          "(`npx playwright install chromium`, or `--fast` to leave it out). Not a pass",
      );
    }
  }
  const unasked = gates.map((g) => scriptOf(g.command)).filter((c): c is string => c !== undefined && NO_WRITER[c] !== undefined);
  if (unasked.length > 0) {
    console.log(`  (not asked — no writer, by declaration: ${[...new Set(unasked)].join(", ")})`);
  }

  const by = (o: Outcome): Result[] => results.filter((r) => r.outcome === o);
  const skippedCount = results.filter((r) => r.skipped).length;
  console.log(
    `\n${by("current").length} current${skippedCount > 0 ? ` (${skippedCount} skipped: inputs unchanged since their last green run)` : ""}, ` +
      `${by("regenerated").length} ` +
      `${dryRun ? "stale" : "regenerated"}, ${by("unrepaired").length} unrepaired, ` +
      `${by("no-writer").length} without a writer, ${by("writer-failed").length} with a failing writer, ` +
      `${by("no-browser").length} needing a browser — ${((performance.now() - t0) / 1000).toFixed(0)}s wall`,
  );
  // THE DENOMINATOR, on the line people read — bean `5qq3`. "0 regenerated"
  // over the fast set is not "the tree is current", and a qualifier that lives
  // only on the FIRST line gets read past. Counted against the whole gate set.
  if (!all) {
    const everywhere = repairableGates(loadGates(repoRoot, { all: true }), scripts);
    const asked = new Set(repairable.map((p) => p.check));
    const outside = everywhere.filter((p) => !asked.has(p.check));
    if (outside.length > 0) {
      console.log(
        `NOT covered: ${outside.length} verify/write pair(s) outside this --fast run (browser jobs, other workflows) — ` +
          `\`bun run regen\` asks them too: ${outside.map((p) => p.check).join(", ")}`,
      );
    }
  }
  if (dryRun) console.log("--dry-run: nothing was changed.");
  // One decision, in one tested place — bean `g5kt`. `settled` used to be
  // printed and then dropped, so a run that could not reach a fixed point
  // exited 0.
  const verdict = exitCodeFor({ results, settled, dryRun, passes: maxPasses });
  if (verdict.message !== undefined) console.error(`\n${verdict.message}`);
  if (verdict.code !== 0) process.exit(verdict.code);
  // `--dry-run` changed nothing, so there is nothing to review or commit.
  if (!dryRun && by("regenerated").length > 0) {
    console.log("\nReview `git diff`, then commit the regenerated artefacts with your merge.");
  }
}
