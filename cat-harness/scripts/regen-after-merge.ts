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
 *
 * **`unrepaired` is the one this command exists to surface honestly.** A check
 * can fail for reasons that are not staleness — a real defect — and a tool
 * that ran a generator and then reported success would be claiming a repair it
 * did not make. Both it and `no-writer` exit non-zero and name the check.
 *
 * Usage:
 *   bun run regen                # ask every fast gate; repair what is stale
 *   bun run regen --all          # ...including the browser workflows' gates
 *   bun run regen --dry-run      # report what is stale, change nothing
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { loadGates, type Gate } from "./gates.ts";
import { repoRootFor } from "../schemas/cat-harness.ts";

const ROOT = join(import.meta.dir, "..");
const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

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
};

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
  // `viewer:nav:audit` does write, but what it writes is the BASELINE the gate
  // compares against, and the gate fails only on a REGRESSION. Running it on a
  // failure would re-baseline, so the regression would vanish and be reported
  // as a repair. It is the one case where a writer exists and must not be run.
  "check:viewer-nav": "its writer re-baselines, which would hide the regression the gate exists to report",
};

export type Outcome = "current" | "regenerated" | "unrepaired" | "no-writer";

export interface Result {
  check: string;
  writer?: string;
  outcome: Outcome;
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

function run(root: string, script: string): boolean {
  const r = spawnSync("bun", ["run", script], { cwd: root, encoding: "utf-8" });
  return r.status === 0;
}

/** Runs one npm script and says whether it exited 0. Injected in tests. */
export type Runner = (script: string) => boolean;

/**
 * Ask every pair once: current, or stale and repaired, or not.
 *
 * `writerRan` is the set of writers this pass ran. The caller needs it to know
 * whether another pass could change anything.
 */
export function regenPass(
  pairs: readonly { check: string; writer: string | undefined }[],
  runner: Runner,
  dryRun = false,
): { results: Result[]; writerRan: string[] } {
  const results: Result[] = [];
  const writerRan: string[] = [];
  for (const { check, writer } of pairs) {
    if (runner(check)) {
      results.push({ check, writer, outcome: "current" });
      continue;
    }
    if (writer === undefined) {
      results.push({ check, outcome: "no-writer" });
      continue;
    }
    if (dryRun) {
      results.push({ check, writer, outcome: "regenerated" });
      continue;
    }
    runner(writer);
    writerRan.push(writer);
    // Ask AGAIN. A writer that ran is not a repair that worked, and reporting
    // it as one would be the false-clean this whole command is about.
    results.push({ check, writer, outcome: runner(check) ? "regenerated" : "unrepaired" });
  }
  return { results, writerRan };
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
 */
export function regenToFixpoint(
  pairs: readonly { check: string; writer: string | undefined }[],
  runner: Runner,
  maxPasses = 3,
): { results: Result[]; passes: number; settled: boolean } {
  const final = new Map<string, Result>();
  let passes = 0;
  let settled = false;
  while (passes < maxPasses) {
    passes++;
    const { results, writerRan } = regenPass(pairs, runner);
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

if (import.meta.main) {
  const repoRoot = repoRootFor(ROOT);
  const scripts = (JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8")) as {
    scripts?: Record<string, string>;
  }).scripts ?? {};

  const gates = loadGates(repoRoot, { all });
  const repairable = repairableGates(gates, scripts);
  console.log(
    `regen-after-merge — ${repairable.length} verify/write pair(s) in the ` +
      `${all ? "whole" : "fast"} gate set (of ${gates.length} gate(s))`,
  );

  const runner: Runner = (script) => run(repoRoot, script);
  let results: Result[];
  if (dryRun) {
    results = regenPass(repairable, runner, true).results;
  } else {
    const fx = regenToFixpoint(repairable, runner);
    results = fx.results;
    console.log(
      `  ${fx.passes} pass(es)` +
        (fx.settled ? "" : " — CAP REACHED: the last pass still ran a writer, so the tree may not be settled"),
    );
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
    }
  }
  const unasked = gates.map((g) => scriptOf(g.command)).filter((c): c is string => c !== undefined && NO_WRITER[c] !== undefined);
  if (unasked.length > 0) {
    console.log(`  (not asked — no writer, by declaration: ${[...new Set(unasked)].join(", ")})`);
  }

  const by = (o: Outcome): Result[] => results.filter((r) => r.outcome === o);
  console.log(
    `\n${by("current").length} current, ${by("regenerated").length} ` +
      `${dryRun ? "stale" : "regenerated"}, ${by("unrepaired").length} unrepaired, ` +
      `${by("no-writer").length} without a writer`,
  );
  if (dryRun) {
    console.log("--dry-run: nothing was changed.");
    process.exit(0);
  }
  const bad = by("unrepaired").length + by("no-writer").length;
  if (bad > 0) {
    console.error(
      `\n${bad} check(s) are NOT explained by staleness. Read them: a generator ` +
        "cannot fix a defect in what it is generating from.",
    );
    process.exit(1);
  }
  if (by("regenerated").length > 0) {
    console.log("\nReview `git diff`, then commit the regenerated artefacts with your merge.");
  }
}
