#!/usr/bin/env bun
/**
 * A layer's tests run standing alone, judged against a committed baseline.
 *
 * @module cat-harness/scripts/check-standalone
 * @covers code — the layer's own tests, run where only its declared closure sits beside it
 *
 * Stage 2 of the split (bean `ho66`). `probeStandalone` (seed-ready.ts) does
 * the work: the tracked files of the layer and everything it `needs`, laid
 * out as sibling git repositories with no aggregate at the root, and `bun
 * test` run in the layer. This file only JUDGES what it measured. It is not
 * a third rehearsal; bootstrap-tools' `rehearse-standalone.ts` has a check
 * list hard-wired to bootstrap, and this one asks the generic probe.
 *
 * ## Why a baseline, and not "green"
 *
 * Measured 2026-10-03 on cat-harness: 463 tests fail standalone, most of them
 * correct tests in the wrong layer (bean `ho66`'s note). Relocating them waits
 * on the code split, so the gate cannot demand zero today. What it can demand
 * is that the number never GROWS: a failure not already in the baseline is a
 * new read of something only the monorepo has, and that is red.
 *
 * A baseline entry that now passes is REPORTED, not red. It was red at first,
 * and #1977's CI showed why that is the wrong trade: one listed test
 * (`kg-audit-root-instance … emits a report`) fails in a loaded local run and
 * passes on the runner, so a symmetric ratchet turns CI red at random over a
 * test that is not getting worse. The direction the gate exists for — a NEW
 * standalone failure — stays red. `bun run standalone:baseline` writes
 * `standalone-baseline.json`; a PR that fixes a test commits the shorter list,
 * and the report names the command whenever one could be shorter.
 *
 * ## The three states
 *
 * - **held** (0): nothing fails that the baseline does not list. Listed tests
 *   that now pass are printed, with the command that lowers the list.
 * - **grew** (1): a new failure, or more unnamed failures.
 * - **could not determine** (2): the probe could not produce a summary, or no
 *   baseline is committed. Never rendered as held.
 *
 * Usage: bun run cat-harness/scripts/check-standalone.ts --layer <instance> [--update]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { repoRootFor } from "../../cat-harness/schemas/cat-harness.js";
import { probeStandalone, readLayers, type Probe } from "./seed-ready.js";

export const STANDALONE_EXIT = { held: 0, grew: 1, undetermined: 2 } as const;

/**
 * The committed baseline, one entry per layer. Beside `declared-path-baseline.json`
 * and for the same reason: it is an ACCEPTED judgement a reviewer reads in a
 * diff, not a QA working copy — `test/results/` is ignored once results live
 * on `qa-reports` (bean `5hox`), and a baseline that is not committed is no
 * ratchet at all.
 */
export const BASELINE_PATH = resolve(import.meta.dir, "standalone-baseline.json");

export interface Baseline {
  /** `<test file> > <test>`, as `parseBunTest` keys them. */
  failing: string[];
  /** `bun test`'s own fail count, which also counts errors no name carries. */
  failed: number;
}

export interface Judgement {
  exit: number;
  lines: string[];
  /** What was measured, when anything was; what `--update` writes. */
  measured?: Baseline;
}

/** Pure: the probe's result against the committed baseline. */
export function judge(probe: Probe, baseline: Baseline | undefined): Judgement {
  if (probe.state !== "measured") {
    return { exit: STANDALONE_EXIT.undetermined, lines: [`could not determine: ${probe.note}`] };
  }
  const measured: Baseline = { failing: [...probe.findings].sort(), failed: probe.count };
  if (!baseline) {
    return {
      exit: STANDALONE_EXIT.undetermined,
      lines: [`could not determine: no baseline is committed (${measured.failed} failing). Run with --update to write one.`],
      measured,
    };
  }
  const before = new Set(baseline.failing);
  const now = new Set(measured.failing);
  const grew = measured.failing.filter((n) => !before.has(n));
  const fixed = baseline.failing.filter((n) => !now.has(n));
  const unnamedNow = measured.failed - measured.failing.length;
  const unnamedBefore = baseline.failed - baseline.failing.length;

  const lines: string[] = [];
  const shorter: string[] = [];
  if (fixed.length > 0) {
    shorter.push(`${fixed.length} listed test(s) now pass standalone — not a failure; \`bun run standalone:baseline\` lowers the list:`);
    for (const n of fixed) shorter.push(`  - ${n}`);
  }
  if (grew.length > 0) {
    lines.push(`${grew.length} test(s) fail standalone that the baseline does not list — each reads something only the monorepo has:`);
    for (const n of grew) lines.push(`  + ${n}`);
  }
  if (unnamedNow > unnamedBefore) {
    lines.push(`${unnamedNow - unnamedBefore} more failure(s) that carry no test name (errors between tests): ${unnamedBefore} → ${unnamedNow}.`);
  }
  if (lines.length === 0) {
    const head =
      fixed.length === 0
        ? `held: ${measured.failed} failing standalone, exactly the baseline.`
        : `held: ${measured.failed} failing standalone, none outside the baseline.`;
    return { exit: STANDALONE_EXIT.held, lines: [head, ...shorter], measured };
  }
  return { exit: STANDALONE_EXIT.grew, lines: [...lines, ...shorter], measured };
}

const BASELINE_COMMENT =
  "Tests that fail when a layer runs alone beside its declared closure (bean `ho66`), keyed `<test file> > <test>`, with `bun test`'s own fail count, which also counts errors between tests. A RATCHET: a failure not listed here is red; a listed one that now passes is reported, with this command, so the list only goes down. WRITTEN by `bun run standalone:baseline`; a longer list is a diff somebody reviews. See the module header of cat-harness/scripts/check-standalone.ts.";

interface BaselineFile {
  _comment: string;
  layers: Record<string, Baseline>;
}

function readBaselineFile(path: string): BaselineFile | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as BaselineFile;
  } catch {
    return undefined;
  }
}

/** A layer's committed baseline; `undefined` when absent or unreadable. */
export function readBaseline(layer: string, path: string = BASELINE_PATH): Baseline | undefined {
  const b = readBaselineFile(path)?.layers?.[layer];
  if (!b || !Array.isArray(b.failing) || typeof b.failed !== "number") return undefined;
  return { failing: b.failing.filter((x): x is string => typeof x === "string"), failed: b.failed };
}

/** Write one layer's entry, keeping every other layer's, sorted so a rerun is byte-stable. */
export function writeBaseline(layer: string, measured: Baseline, path: string = BASELINE_PATH): void {
  const layers = { ...(readBaselineFile(path)?.layers ?? {}), [layer]: { failed: measured.failed, failing: [...measured.failing].sort() } };
  const sorted = Object.fromEntries(Object.keys(layers).sort().map((k) => [k, layers[k]!]));
  writeFileSync(path, JSON.stringify({ _comment: BASELINE_COMMENT, layers: sorted }, null, 2) + "\n");
}

const arg = (name: string, argv: string[]): string | undefined => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

function main(argv: string[]): number {
  const name = arg("--layer", argv);
  if (!name) {
    console.error("usage: check-standalone --layer <instance> [--update]");
    return STANDALONE_EXIT.undetermined;
  }
  const repoRoot = repoRootFor(resolve(import.meta.dir, ".."));
  const decls = readLayers(repoRoot);
  if (!decls.some((d) => d.name === name)) {
    console.error(`no instance declaration names \`${name}\``);
    return STANDALONE_EXIT.undetermined;
  }

  const verdict = judge(probeStandalone(repoRoot, name, decls), readBaseline(name));
  if (argv.includes("--update") && verdict.measured) {
    writeBaseline(name, verdict.measured);
    console.log(`wrote ${relative(repoRoot, BASELINE_PATH)} for ${name}: ${verdict.measured.failed} failing standalone.`);
    return STANDALONE_EXIT.held;
  }
  for (const l of verdict.lines) console.log(l);
  return verdict.exit;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
