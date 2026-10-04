/**
 * `bun run regen` — repair the artefacts a merge left wrong, by asking the gates.
 *
 * Bean `lxpq`. The command's whole value is that it distinguishes STALENESS
 * from a real defect, so the assertions that matter are the ones about the
 * states it reports, not the happy path.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_MAX_PASSES,
  NO_WRITER,
  UNGATED_INPUTS,
  WRITER_OVERRIDES,
  exitCodeFor,
  maxPassesFromArgv,
  regenToFixpoint,
  repairableGates,
  scriptOf,
  writerFor,
  type Result,
  type Runner,
} from "../regen-after-merge.ts";
import { loadGates } from "../gates.ts";
import { repoRootFor } from "../../schemas/cat-harness.ts";

const INSTANCE = join(import.meta.dir, "..", "..");
const REPO = repoRootFor(INSTANCE);
const SCRIPTS = (JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as {
  scripts: Record<string, string>;
}).scripts;

describe("the pair is READ, never assumed", () => {
  test("`X:check` pairs with `X` when `X` exists", () => {
    expect(writerFor(SCRIPTS, "voices:viz:check")).toBe("voices:viz");
    expect(writerFor(SCRIPTS, "kg:audit:check")).toBe("kg:audit");
  });

  test("a check whose writer does NOT exist returns undefined, not a guess", () => {
    // The failure mode this prevents: a writer renamed out from under its
    // check, where composing the name by convention would produce a command
    // that runs nothing and a report that claims a repair.
    expect(writerFor({ "thing:check": "x" }, "thing:check")).toBeUndefined();
  });

  test("a script that is not a `:check` has no writer", () => {
    expect(writerFor(SCRIPTS, "lint")).toBeUndefined();
  });
});

describe("only a gate that runs EXACTLY one script is repairable", () => {
  test("a plain `bun run X` yields X", () => {
    expect(scriptOf("bun run voices:viz:check")).toBe("voices:viz:check");
    expect(scriptOf("  bun run kg:audit:check  ")).toBe("kg:audit:check");
  });

  test("anything else yields undefined rather than a partial match", () => {
    // A compound or argument-carrying command cannot be paired with a writer
    // by name, and pretending otherwise would run the wrong thing.
    expect(scriptOf("bun run a && bun run b")).toBeUndefined();
    expect(scriptOf("bun test")).toBeUndefined();
    expect(scriptOf("bunx tsc --noEmit -p tsconfig.json")).toBeUndefined();
    expect(scriptOf("bun run gen-voices-viz.ts --check")).toBeUndefined();
  });
});

describe("the set comes from the WORKFLOW, not from package.json", () => {
  // `gates.ts` measured that 21 of this repository's `:check` scripts appear
  // in no workflow at all. Deriving the set from package.json would run
  // generators CI does not gate — a guess that reads as coverage.
  const gates = loadGates(REPO, {});
  const pairs = repairableGates(gates, SCRIPTS);

  test("it finds a real, non-empty set", () => {
    expect(pairs.length).toBeGreaterThan(10);
  });

  test("...and a STRICT subset of package.json's check scripts", () => {
    const allChecks = Object.keys(SCRIPTS).filter((s) => s.endsWith(":check") || WRITER_OVERRIDES[s] !== undefined);
    expect(pairs.length).toBeLessThan(allChecks.length);
    for (const p of pairs) expect(allChecks).toContain(p.check);
  });

  test("every pair it reports as repairable has a writer that exists", () => {
    for (const p of pairs) {
      if (p.writer === undefined) continue;
      expect(SCRIPTS[p.writer]).toBeDefined();
    }
  });

  test("the voices check — the one that broke main — is in the set", () => {
    // The regression. `lxpq` reached main through exactly this check, so a
    // repair command that did not cover it would be answering a different
    // question from the one it was written for.
    expect(pairs.map((p) => p.check)).toContain("voices:viz:check");
    expect(pairs.find((p) => p.check === "voices:viz:check")?.writer).toBe("voices:viz");
  });

  test("a gate listed twice is offered once", () => {
    const names = pairs.map((p) => p.check);
    expect(names.length).toBe(new Set(names).size);
  });
});

describe("a check with no writer is REPORTED, never skipped", () => {
  test("it is carried through as a pair with an undefined writer", () => {
    // Not filtered out: "this check failed and nothing can regenerate it" is
    // a finding, and dropping it would leave a red check invisible to the one
    // command a person runs after a merge.
    const fake = [
      { job: "j", step: "s", command: "bun run orphan:check" },
      { job: "j", step: "s", command: "bun run voices:viz:check" },
    ];
    const pairs = repairableGates(fake, SCRIPTS);
    expect(pairs.map((p) => p.check)).toEqual(["orphan:check", "voices:viz:check"]);
    expect(pairs[0]!.writer).toBeUndefined();
    expect(pairs[1]!.writer).toBe("voices:viz");
  });
});

describe("a writer that is not <check minus :check> is DECLARED (bean eowd)", () => {
  test("translate-bpmn:check is repaired by the script that writes, not the one that reports", () => {
    expect(writerFor(SCRIPTS, "translate-bpmn:check")).toBe("translate-bpmn:extract");
    expect(SCRIPTS["translate-bpmn:extract"]).toContain("--extract");
  });
  test("the audit-coverage gates are offered, with audit:coverage as their writer", () => {
    const pairs = repairableGates(loadGates(REPO, {}), SCRIPTS);
    for (const gate of ["audit:coverage:strict", "audit:coverage:require-all"]) {
      expect(pairs.find((p) => p.check === gate)?.writer).toBe("audit:coverage");
    }
  });
  test("every override names a writer that exists — a renamed writer is a finding, not a guess", () => {
    for (const w of Object.values(WRITER_OVERRIDES)) expect(SCRIPTS[w]).toBeDefined();
  });
});

describe("a `check:X` gate is paired only by DECLARATION — bean `uju6`", () => {
  test("`check:prov-qaqc` is repaired by `prov:qaqc`", () => {
    // #1550 went red on it while regen said "63 current, 0 regenerated": the
    // gate is `check:`-prefixed, so the `X:check` convention never offered it.
    expect(writerFor(SCRIPTS, "check:prov-qaqc")).toBe("prov:qaqc");
    const pairs = repairableGates([{ job: "j", step: "s", command: "bun run check:prov-qaqc" }], SCRIPTS);
    expect(pairs).toEqual([{ check: "check:prov-qaqc", writer: "prov:qaqc" }]);
  });

  test("every `check:X` that is some script's command plus ` --check` is decided — paired or recorded", () => {
    // The measurement that found `check:glossary` (main red at 7bdda74) after
    // uju6 had listed four. Composing the pair from the COMMAND, not the name,
    // is how a fifth and sixth were found; this keeps a seventh from hiding.
    const byCmd = new Map(Object.entries(SCRIPTS).map(([k, v]) => [String(v).trim(), k]));
    // The WHOLE gate set, not the fast one (bean `g5kt`). `regen --all` asks
    // the browser jobs' and other workflows' pairs too, so a `check:X` gate
    // that lives only there was derived by exactly the convention this test
    // exists to police and no assertion reached it.
    const gates = loadGates(REPO, { all: true });
    for (const g of gates) {
      const c = scriptOf(g.command);
      if (c === undefined || !c.startsWith("check:") || c.endsWith(":check")) continue;
      const cmd = String(SCRIPTS[c] ?? "").trim();
      if (!cmd.endsWith(" --check")) continue;
      if (!byCmd.has(cmd.slice(0, -" --check".length).trim())) continue;
      expect(WRITER_OVERRIDES[c] !== undefined || NO_WRITER[c] !== undefined, `${c} is undecided`).toBe(true);
    }
  });

  test("the recorded non-writers are real scripts, and none is also paired", () => {
    for (const check of Object.keys(NO_WRITER)) {
      expect(SCRIPTS[check]).toBeDefined();
      expect(WRITER_OVERRIDES[check]).toBeUndefined();
      // Not guessed from the name either: `check:subgraphs` has a `subgraphs`
      // script, and it only reports.
      expect(writerFor(SCRIPTS, check)).toBeUndefined();
    }
  });
});

describe("regen runs to a FIXPOINT, not one pass — bean `14ve`", () => {
  /**
   * A tiny tree: writer B's output is an INPUT to check A, and A is asked
   * first. Staleness is modelled as version numbers, so the test says exactly
   * which write made which check current.
   */
  function tree() {
    const v = { bInput: 1, bOut: 0, aOut: 0 };
    const scripts: Record<string, () => boolean> = {
      "a:check": () => v.aOut === v.bOut, // A is derived from B's output
      a: () => ((v.aOut = v.bOut), true),
      "b:check": () => v.bOut === v.bInput,
      b: () => ((v.bOut = v.bInput), true),
    };
    const runner: Runner = (s) => scripts[s]!();
    return { v, runner };
  }
  const pairs = [
    { check: "a:check", writer: "a" },
    { check: "b:check", writer: "b" },
  ];

  test("one pass leaves A stale; the fixpoint leaves every check current", async () => {
    const { v, runner } = tree();
    const r = await regenToFixpoint(pairs, runner);
    expect(r.settled).toBe(true);
    // Pass 1: A current (0 === 0), B stale → B writes 1. Pass 2: A stale →
    // repaired. Pass 3: nothing ran.
    expect(r.passes).toBe(3);
    expect(v.aOut).toBe(v.bOut);
    expect(r.results.map((x) => x.outcome)).toEqual(["regenerated", "regenerated"]);
  });

  test("a single pass really does leave it stale — the control", async () => {
    const { v, runner } = tree();
    const r = await regenToFixpoint(pairs, runner, 1);
    expect(r.settled).toBe(false);
    expect(v.aOut).not.toBe(v.bOut);
  });

  test("two writers that undo each other stop at the cap and say so", async () => {
    let x = 0;
    const flip: Runner = (s) => (s.endsWith(":check") ? false : ((x = 1 - x), true));
    const r = await regenToFixpoint([{ check: "p:check", writer: "p" }], flip, 3);
    expect(r.passes).toBe(3);
    expect(r.settled).toBe(false);
    expect(x === 0 || x === 1).toBe(true);
  });
});

describe("UNGATED_INPUTS — writers regen runs without making them gates (bean 5qq3)", () => {
  const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as { scripts: Record<string, string> };

  test("every pair names two scripts that exist", () => {
    for (const { check, writer } of UNGATED_INPUTS) {
      expect(pkg.scripts[check], `${check} is not a script`).toBeDefined();
      expect(pkg.scripts[writer], `${writer} is not a script`).toBeDefined();
    }
  });

  test("none of them is a gate — the owner's 2026-09-20 ruling keeps them ungated", () => {
    // If one of these BECOMES a gate, it belongs in the gated set and this list
    // must drop it, or regen asks it twice under two different reasons.
    const gated = new Set(repairableGates(loadGates(REPO, { all: true }), pkg.scripts).map((p) => p.check));
    for (const { check } of UNGATED_INPUTS) expect(gated.has(check), `${check} is gated now`).toBe(false);
  });

  test("an ungated input asked FIRST lets a dependent check settle in one pass", async () => {
    // library:viz writes what methodologies:viz reads. Asked first, the
    // dependent sees the fresh input in the same pass: no second pass needed.
    let libraryFresh = false;
    const runner: Runner = (s) => {
      if (s === "library:viz") { libraryFresh = true; return true; }
      if (s === "library:viz:check") return libraryFresh;
      if (s === "methodologies:viz:check") return libraryFresh;
      return true;
    };
    const pairs = [{ check: "library:viz:check", writer: "library:viz" }, { check: "methodologies:viz:check", writer: "methodologies:viz" }];
    const fx = await regenToFixpoint(pairs, runner);
    expect(fx.results.map((r) => r.outcome)).toEqual(["regenerated", "current"]);
  });
});

describe("the derivation finds the writers a merge stales — bean `g5kt`", () => {
  /**
   * The THREE reds of 2026-10-04, each of which cost a CI cycle because the
   * contributor ran the writers from memory instead of `bun run regen`.
   *
   * The brief for that session read *"the regeneration loop has no
   * derivation"*. It has one, and these are the measurements that say so, so
   * the next agent re-derives the answer instead of rebuilding the tool: a
   * second derived list would be a second answer to "what must I re-run",
   * free to disagree with this one.
   */
  const MEASURED: readonly [check: string, writer: string][] = [
    ["readme:subgraphs:check", "readme:subgraphs"],
    ["check:term-mapping", "term:mapping"],
    ["docs:harness:check", "docs:harness"],
    // The pair whose chain needed a third writer pass, which is what raised
    // DEFAULT_MAX_PASSES off 3.
    ["skill:register:check", "skill:register"],
  ];

  const pairs = repairableGates(loadGates(REPO, { all: true }), SCRIPTS);

  test.each(MEASURED)("%s is derived, with %s as its writer", (check, writer) => {
    const p = pairs.find((x) => x.check === check);
    expect(p, `${check} is not in the derived set`).toBeDefined();
    expect(p!.writer).toBe(writer);
  });

  test("a writer added to package.json appears with NO list to edit", () => {
    // The property the whole command rests on, asserted against a synthetic
    // gate rather than by waiting for somebody to add one: nothing in
    // `regen-after-merge.ts` names `brand:new`, and the pair still forms.
    const scripts = { ...SCRIPTS, "brand:new": "bun run x.ts", "brand:new:check": "bun run x.ts --check" };
    const gate = { job: "typescript", step: "s", command: "bun run brand:new:check" };
    expect(repairableGates([gate], scripts)).toEqual([{ check: "brand:new:check", writer: "brand:new" }]);
    // ...and the SAME gate against the unmodified scripts is reported as a gap
    // rather than silently dropped, which is what makes the first half safe.
    expect(repairableGates([gate], SCRIPTS)).toEqual([{ check: "brand:new:check", writer: undefined }]);
  });

  test("a derived name that resolves to no script is a GAP, never a guess", () => {
    // The trap of the 2026-10-04 sweep: stripping `:check` off `check:glossary`
    // gives `glossary`, which is not a script at all (`glossary:page` is). A
    // derivation that ran its candidates unresolved would have run nothing and
    // called it a repair.
    expect(SCRIPTS["glossary"]).toBeUndefined();
    expect(SCRIPTS["glossary:page"]).toBeDefined();
    expect(writerFor(SCRIPTS, "check:glossary")).toBe("glossary:page");
    // And the general case: every candidate is resolved against package.json.
    expect(writerFor(SCRIPTS, "nothing-like-this:check")).toBeUndefined();
  });
});

describe("a run that did not settle is NOT clean — bean `g5kt`", () => {
  const ok: Result[] = [{ check: "a:check", writer: "a", outcome: "current" }];

  test("settled and clean exits 0", () => {
    expect(exitCodeFor({ results: ok, settled: true })).toEqual({ code: 0, reason: "clean" });
  });

  test("NOT settled exits non-zero, even with nothing unrepaired", () => {
    // The false clean this bean is about: `settled` was printed and dropped,
    // so this exact run exited 0.
    const v = exitCodeFor({ results: ok, settled: false, passes: 6 });
    expect(v.code).toBe(2);
    expect(v.reason).toBe("not-settled");
    expect(v.message).toContain("COULD NOT DETERMINE");
    // The number of passes it gave up after is ON the line, so "did not
    // settle in 6" is distinguishable from "did not settle in 1".
    expect(v.message).toContain("6 pass(es)");
  });

  test("a real defect outranks non-convergence, because it names checks to read", () => {
    const results: Result[] = [...ok, { check: "b:check", writer: "b", outcome: "unrepaired" }];
    expect(exitCodeFor({ results, settled: false }).reason).toBe("not-staleness");
    expect(exitCodeFor({ results, settled: true }).code).toBe(1);
  });

  test("no-writer is a defect too, not a shrug", () => {
    const results: Result[] = [{ check: "c:check", outcome: "no-writer" }];
    expect(exitCodeFor({ results, settled: true }).code).toBe(1);
  });

  test("--dry-run ran no writer, so it is not judged on settling", () => {
    const v = exitCodeFor({ results: ok, settled: false, dryRun: true });
    expect(v).toEqual({ code: 0, reason: "dry-run" });
  });

  test("every reason maps to exactly one code — the states cannot collapse", () => {
    const seen = new Map<string, number>();
    for (const run of [
      { results: ok, settled: true },
      { results: ok, settled: false },
      { results: [{ check: "x", outcome: "unrepaired" as const }], settled: true },
      { results: ok, settled: false, dryRun: true },
    ]) {
      const v = exitCodeFor(run);
      const prev = seen.get(v.reason);
      if (prev !== undefined) expect(v.code).toBe(prev);
      seen.set(v.reason, v.code);
    }
    expect([...seen.keys()].sort()).toEqual(["clean", "dry-run", "not-settled", "not-staleness"]);
  });
});

describe("the fixpoint bound is above the measured need — bean `g5kt`", () => {
  /**
   * A chain three writers deep: C's output feeds B, B's feeds A, and they are
   * asked A, B, C — the worst order. This is the `skill:register` shape the
   * 2026-10-04 sweep measured, where a third writer pass was needed.
   */
  function chain() {
    const v = { c: 1, cOut: 0, bOut: 0, aOut: 0 };
    const scripts: Record<string, () => boolean> = {
      "a:check": () => v.aOut === v.bOut,
      a: () => ((v.aOut = v.bOut), true),
      "b:check": () => v.bOut === v.cOut,
      b: () => ((v.bOut = v.cOut), true),
      "c:check": () => v.cOut === v.c,
      c: () => ((v.cOut = v.c), true),
    };
    return { v, runner: ((s) => scripts[s]!()) as Runner };
  }
  const pairs = [
    { check: "a:check", writer: "a" },
    { check: "b:check", writer: "b" },
    { check: "c:check", writer: "c" },
  ];

  test("the default settles it", async () => {
    const { v, runner } = chain();
    const r = await regenToFixpoint(pairs, runner);
    expect(r.settled).toBe(true);
    expect(v.aOut).toBe(v.c);
    expect(v.bOut).toBe(v.c);
  });

  test("the OLD default of 3 does not — the control that justifies the raise", async () => {
    const { runner } = chain();
    const r = await regenToFixpoint(pairs, runner, 3);
    expect(r.passes).toBe(3);
    expect(r.settled).toBe(false);
    // ...and under the old CLI, which dropped `settled`, this exited 0.
    expect(exitCodeFor({ results: r.results, settled: r.settled, passes: 3 }).code).toBe(2);
  });

  test("`not settled` means UNVERIFIED, which is why it cannot be read as stale either", async () => {
    // Asserted because it is the easy thing to get backwards, including in
    // this test file on the first try. At the cap the third pass had just
    // repaired A, so the tree happens to be correct — but no pass confirmed
    // it, and the pairs were last read while a writer was running. The tool
    // therefore reports "could not determine" and NOT "stale": claiming
    // either would be a verdict it has no evidence for.
    const { v, runner } = chain();
    const r = await regenToFixpoint(pairs, runner, 3);
    expect(v.aOut).toBe(v.c); // in fact repaired
    expect(r.settled).toBe(false); // and in fact unconfirmed
    expect(exitCodeFor({ results: r.results, settled: r.settled, passes: 3 }).reason).toBe("not-settled");
  });

  test("a chain one deeper than the measurement is genuinely stale at the old cap", async () => {
    // The same shape with a fourth link, so the cap bites before the last
    // writer runs: here the tree really is wrong when it gives up.
    const v = { d: 1, dOut: 0, cOut: 0, bOut: 0, aOut: 0 };
    const s: Record<string, () => boolean> = {
      "a:check": () => v.aOut === v.bOut,
      a: () => ((v.aOut = v.bOut), true),
      "b:check": () => v.bOut === v.cOut,
      b: () => ((v.bOut = v.cOut), true),
      "c:check": () => v.cOut === v.dOut,
      c: () => ((v.cOut = v.dOut), true),
      "d:check": () => v.dOut === v.d,
      d: () => ((v.dOut = v.d), true),
    };
    const deep = ["a", "b", "c", "d"].map((n) => ({ check: `${n}:check`, writer: n }));
    const r = await regenToFixpoint(deep, ((x) => s[x]!()) as Runner, 3);
    expect(r.settled).toBe(false);
    expect(v.aOut).not.toBe(v.d); // still stale, and the old CLI exited 0
    const better = await regenToFixpoint(deep, ((x) => s[x]!()) as Runner);
    expect(better.settled).toBe(true);
    expect(v.aOut).toBe(v.d);
  });

  test("DEFAULT_MAX_PASSES admits more writer passes than the deepest chain measured", () => {
    // A pass is settled only when it ran NO writer, so a cap of N admits N-1
    // writer passes. The measured need was 3.
    expect(DEFAULT_MAX_PASSES - 1).toBeGreaterThan(3);
  });

  test("--max-passes is read from argv, and a bad value is refused rather than defaulted", () => {
    expect(maxPassesFromArgv(["--max-passes", "9"])).toBe(9);
    expect(maxPassesFromArgv(["--max-passes=9"])).toBe(9);
    expect(maxPassesFromArgv([])).toBe(DEFAULT_MAX_PASSES);
    // A silent fallback here would re-create the defect one level up: the run
    // would use a bound nobody asked for and report its result as settled.
    for (const bad of ["0", "-1", "two", undefined]) {
      expect(() => maxPassesFromArgv(["--max-passes", ...(bad === undefined ? [] : [bad])])).toThrow("--max-passes");
    }
  });
});
