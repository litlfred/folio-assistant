/**
 * Which tests are closest to a timeout budget they never declared.
 *
 * Bean `sff8`. Four tests in this repository have timed out under load and every
 * one was found the same way: a red run on somebody's machine, with nothing in the
 * repository saying it was close. This names them instead.
 *
 * ## The distinction the whole tool rests on
 *
 * A test's budget is **not** uniformly bun's 5000 ms default, and assuming it is
 * makes the measurement worthless. Measured 2026-09-27 on two loaded full-suite
 * runs: **12 cases exceeded 5000 ms and only 3 failed**; 10 exceeded it and only 1
 * failed. So at least nine tests run past the default and are correct, because they
 * pass an explicit budget — `declared-directory-resolves.test.ts` spawns a process
 * per module and passes `modules.length * SPAWN_BUDGET_MS`, running 22 s green.
 *
 * So the population is not "slow tests". It is tests that are **expensive AND
 * silently inheriting the default**, and separating those two requires reading the
 * source, not just the timings.
 *
 * ## Why the budget is read from the AST rather than evaluated
 *
 * A declared budget is an arbitrary expression — `modules.length * 600` — so its
 * VALUE is not statically knowable. It does not need to be. The only question is
 * whether the author budgeted this test at all, which is a question about the
 * presence of a third argument, and that the AST answers exactly. Anything with a
 * declared budget is reported as `declared` and never given a share, because
 * dividing its cost by 5000 would invent a number about a budget that is not 5000.
 *
 * ## Why this writes no sidecar
 *
 * Every other auditing tool here commits one, for a reason this file accepts:
 * a printed verdict cannot tell "never measured" from "measured clean". It does not
 * apply, because **a timing is a fact about the machine, not about the
 * repository.** Committing the milliseconds would pin this container's numbers as
 * the corpus's, which is the `3vc1` defect — a local environment recorded as a
 * repository invariant — and they would be wrong on the next runner and staler on
 * every commit after.
 *
 * `check:ci-health` already carries the precedent and the same reasoning: a fact
 * *about* the repository rather than one the repository *holds* is "asked externally
 * every run and cached nowhere".
 *
 * ## Why it is a report and not a pass/fail gate
 *
 * ~50 tests sit at half the default under load. A threshold gate would need all of
 * them acknowledged on day one, and declaring 50 exemptions nobody has read is the
 * empty exemption such a check exists to refuse (`xd1g` removed a gate for exactly
 * this). Whether CI should fail on this is a decision to take WITH the numbers, and
 * it is deliberately left open rather than settled here by whoever wrote the tool.
 *
 * ## A share over 100 % does NOT predict a timeout, and that is measured
 *
 * The obvious reading of this report is wrong, so it is stated before the usage.
 * In the loaded run of 2026-09-27 that timed out three tests, **four**
 * default-budget cases exceeded 5000 ms. The fourth,
 * `tests/tools.test.ts:204` at **5.22 s**, declares no budget anywhere in its file
 * and **passed** — in that run and again at 4.23 s in the next.
 *
 * So junit's `time` and the quantity bun charges against the timeout are not the
 * same thing: `time` is the outer measurement and includes work the budget does not.
 * A share is therefore a **ranking of exposure**, not a prediction, and this tool
 * deliberately reports it as one. Treating >100 % as "will fail" would have made a
 * confident false claim about a passing test on the very run that motivated the
 * tool.
 *
 * What the ranking is still good for is the thing that was missing: the three
 * highest-share default-budget tests in that run were exactly the three that timed
 * out, and the next two names down the list are where the next failure comes from.
 *
 * Exit codes: **0** when a report was produced, **2** when it could not be — a
 * missing report, zero cases, or source that would not parse. Never 1: nothing here
 * is a defect in this repository's source (`nytj`). Zero cases is exit 2 rather than
 * a clean run over nothing (`6tkl`).
 *
 * Usage:
 *   bun test --reporter=junit --reporter-outfile=/tmp/junit.xml
 *   bun run check:test-budgets /tmp/junit.xml
 *
 * @covers none — its subject is a test run's timings, which no declared graph holds
 * @graphNode tool
 */
import { HARNESS_ROOT } from "./lib/roots.ts";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import ts from "typescript";

const INSTANCE_ROOT = HARNESS_ROOT;
const REPO_ROOT = resolve(INSTANCE_ROOT, "..");

/** bun's default per-test timeout. Only ever applied to a test that declares none. */
export const DEFAULT_BUDGET_MS = 5000;

/** The bands reported, as a share of `DEFAULT_BUDGET_MS`. */
export const BANDS = [1.0, 0.8, 0.6, 0.5, 0.4, 0.2] as const;

export interface Observed {
  /** Repo-relative path, as the report gives it. */
  file: string;
  /** 1-indexed line the runner attributed the case to. */
  line: number;
  name: string;
  /** Milliseconds this case took ON THE RUN THAT PRODUCED THE REPORT. */
  costMs: number;
  /** True when the source declares a budget, so no share is computed. */
  declared: boolean;
  /** `costMs / DEFAULT_BUDGET_MS`, or undefined when `declared`. */
  share?: number;
}

export interface Report {
  /** Cases read. Zero is exit 2, never a clean run. */
  cases: number;
  /** Cases whose source declares a budget. */
  declared: number;
  /** Files whose source could not be read or parsed — reported, never ignored. */
  unreadable: string[];
  /** Count of DEFAULT-budget cases at or above each band. */
  bands: Array<{ share: number; count: number }>;
  /** Default-budget cases, worst share first. */
  worst: Observed[];
  /** The run's own wall clock, so a reader can see how loaded it was. */
  suiteSeconds?: number;
}

/**
 * Line ranges of `test(...)` / `it(...)` calls that pass a third argument.
 *
 * Returns ranges rather than single lines because the runner attributes a case to
 * the line of the call or of its name, and a `test(` spanning thirty lines makes
 * those different — `declared-directory-resolves.test.ts` is exactly that shape, so
 * matching on an exact line would have missed the one test this tool most needs to
 * classify correctly.
 */
export function declaredBudgetRanges(source: string, fileName: string): Array<[number, number]> {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);
  const ranges: Array<[number, number]> = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      // `test(...)`, `it(...)`, and the modifier forms `test.only(...)` etc.
      const name = ts.isPropertyAccessExpression(callee)
        ? ts.isIdentifier(callee.expression)
          ? callee.expression.text
          : undefined
        : ts.isIdentifier(callee)
          ? callee.text
          : undefined;
      if ((name === "test" || name === "it") && node.arguments.length >= 3) {
        const start = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
        const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
        ranges.push([start, end]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return ranges;
}

/** Every `<testcase>` in a junit document, with the attributes this tool needs. */
export function testcases(xml: string): Array<{ file: string; line: number; name: string; costMs: number }> {
  const out: Array<{ file: string; line: number; name: string; costMs: number }> = [];
  for (const m of xml.matchAll(/<testcase\b([^>]*)\/?>/g)) {
    const attrs = m[1]!;
    const get = (k: string): string | undefined => {
      const a = new RegExp(`\\b${k}="([^"]*)"`).exec(attrs);
      return a ? a[1] : undefined;
    };
    const file = get("file");
    const time = get("time");
    if (file === undefined || time === undefined) continue;
    const secs = Number(time);
    if (!Number.isFinite(secs)) continue;
    out.push({
      file,
      line: Number(get("line") ?? "0"),
      name: get("name") ?? "(unnamed)",
      costMs: secs * 1000,
    });
  }
  return out;
}

/** Judge a junit document against the sources it names. */
export function budgets(xml: string, repoRoot: string, worstN = 20): Report {
  const cases = testcases(xml);
  const suite = /<testsuites\b[^>]*\btime="([\d.]+)"/.exec(xml);

  const rangesByFile = new Map<string, Array<[number, number]> | null>();
  const unreadable: string[] = [];

  const rangesFor = (file: string): Array<[number, number]> | null => {
    if (rangesByFile.has(file)) return rangesByFile.get(file)!;
    let ranges: Array<[number, number]> | null = null;
    const abs = join(repoRoot, file);
    if (existsSync(abs)) {
      try {
        ranges = declaredBudgetRanges(readFileSync(abs, "utf-8"), file);
      } catch {
        ranges = null;
      }
    }
    if (ranges === null) unreadable.push(file);
    rangesByFile.set(file, ranges);
    return ranges;
  };

  const observed: Observed[] = cases.map((c) => {
    const ranges = rangesFor(c.file);
    // An unreadable source is NOT "declares no budget": that would invent a share
    // for a test whose budget is unknown. It is reported in `unreadable` and given
    // no share, the same treatment as a declared one.
    const declared = ranges === null || ranges.some(([a, b]) => c.line >= a && c.line <= b);
    return {
      file: c.file,
      line: c.line,
      name: c.name,
      costMs: c.costMs,
      declared,
      share: declared ? undefined : c.costMs / DEFAULT_BUDGET_MS,
    };
  });

  const defaulted = observed.filter((o) => !o.declared);
  return {
    cases: observed.length,
    declared: observed.length - defaulted.length,
    unreadable: [...new Set(unreadable)],
    bands: BANDS.map((share) => ({
      share,
      count: defaulted.filter((o) => (o.share ?? 0) >= share).length,
    })),
    worst: defaulted.sort((a, b) => (b.share ?? 0) - (a.share ?? 0)).slice(0, worstN),
    suiteSeconds: suite ? Number(suite[1]) : undefined,
  };
}

export function format(r: Report): string {
  const lines: string[] = [];
  lines.push(
    `Test budgets — ${r.cases} case(s), ${r.declared} declaring their own budget, ` +
      `${r.cases - r.declared} on the ${DEFAULT_BUDGET_MS} ms default` +
      (r.suiteSeconds === undefined ? "" : `; suite wall clock ${r.suiteSeconds.toFixed(1)} s`),
  );
  lines.push("");
  lines.push("  Default-budget cases by share of budget, ON THIS RUN'S MACHINE:");
  for (const b of r.bands) {
    lines.push(`    >= ${String(Math.round(b.share * DEFAULT_BUDGET_MS)).padStart(5)} ms ` +
      `(${String(Math.round(b.share * 100)).padStart(3)} %): ${String(b.count).padStart(4)}`);
  }
  if (r.worst.length > 0) {
    lines.push("");
    lines.push("  Closest to a budget they never declared:");
    for (const o of r.worst) {
      lines.push(
        `    ${(o.costMs / 1000).toFixed(2).padStart(7)} s  ` +
          `${String(Math.round((o.share ?? 0) * 100)).padStart(4)} %  ` +
          `${o.file}:${o.line}  ${o.name.slice(0, 60)}`,
      );
    }
  }
  if (r.unreadable.length > 0) {
    lines.push("");
    lines.push(
      `  ${r.unreadable.length} file(s) could not be read, so their cases are reported as ` +
        "`declared` rather than given a share — an unknown budget is not a default one:",
    );
    for (const f of r.unreadable) lines.push(`    ${f}`);
  }
  lines.push("");
  lines.push(
    "  Timings are a fact about the MACHINE, not the repository, so nothing here is " +
      "committed and nothing here is a defect.",
  );
  lines.push(
    "  A share is a RANKING OF EXPOSURE, not a prediction: junit's `time` includes " +
      "work the timeout does not charge, and a default-budget case measured at 5.22 s " +
      "PASSED in a run that timed out three others. Read the order, not the threshold.",
  );
  return lines.join("\n");
}

if (import.meta.main) {
  const arg = process.argv[2];
  if (arg === undefined) {
    console.error(
      "Test budgets — no junit report given, so nothing was measured.\n\n" +
        "  bun test --reporter=junit --reporter-outfile=/tmp/junit.xml\n" +
        "  bun run check:test-budgets /tmp/junit.xml\n\n" +
        "Exit 2: could not determine, which is not the same as clean.",
    );
    process.exit(2);
  }
  if (!existsSync(arg)) {
    console.error(`Test budgets — no report at ${arg}. Exit 2: could not determine.`);
    process.exit(2);
  }

  let report: Report;
  try {
    report = budgets(readFileSync(arg, "utf-8"), REPO_ROOT);
  } catch (e) {
    console.error(`Test budgets — ${arg} would not parse as junit: ${String(e)}. Exit 2.`);
    process.exit(2);
  }

  if (report.cases === 0) {
    console.error(
      `Test budgets — ${arg} holds 0 test cases. Refusing to call that clean: a sweep ` +
        "over no subjects asserts nothing (bean `6tkl`). Exit 2.",
    );
    process.exit(2);
  }

  console.log(format(report));
}
