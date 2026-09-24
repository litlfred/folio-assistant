/**
 * `audit-coverage` — the parses it depends on, and the three states it exists
 * to keep apart.
 *
 * Bean `folio-assistant-xutg`. The report's whole value is that a zero in one
 * column cannot be read as a gap, so most of what is asserted here is that
 * "no directory", "a directory with no files" and "files nothing audits" come
 * out as three different answers. A test that only checked the counts would
 * pass over the collapse this guards against.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { census, coverage, coversIn, gateCoverage, kindUniverse, scriptsFor } from "../audit-coverage.js";
import { KG_CRITERIA, KG_SUBJECT_GRAPH_KINDS } from "../../schemas/kg-qa.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

const INSTANCE = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const REPO = repoRootFor(INSTANCE);

describe("coversIn — the declaration a gate makes about itself", () => {
  test("a single kind", () => {
    expect(coversIn("/**\n * x\n * @covers tools\n */")).toEqual(["tools"]);
  });

  test("a comma-separated list", () => {
    expect(coversIn("/**\n * @covers bean-defs, beans\n */")).toEqual(["bean-defs", "beans"]);
  });

  test("an em-dash reason is not mistaken for a kind", () => {
    // The reason is the part a reader needs most and the part a naive split
    // would turn into four invented kinds.
    expect(coversIn("/**\n * @covers none — .github/workflows/ is not a declared graph kind\n */")).toEqual(["none"]);
  });

  test("a wrapped reason contributes nothing", () => {
    const block = "/**\n * @covers computed — it sweeps whichever kinds declare\n *   `nodeSchemas`, so a list goes stale\n */";
    expect(coversIn(block)).toEqual(["computed"]);
  });

  test("several lines accumulate, without duplicates", () => {
    expect(coversIn("/**\n * @covers processes\n * @covers processes, skills\n */")).toEqual(["processes", "skills"]);
  });

  test("an INDENTED @covers is a mention, not a declaration", () => {
    // This file's own docblock documents the syntax by showing it. A lenient
    // pattern read those samples as declarations and credited the coverage
    // report with auditing the bean store — caught by the self-test below,
    // which is the only reason it is not in the committed sidecar.
    const block = "/**\n * x\n *     @covers bean-defs, beans\n *     @covers none — an example\n */";
    expect(coversIn(block)).toBeUndefined();
  });

  test("a continuation line does not leak into the list", () => {
    const block = "/**\n * @covers tools — because it reads\n *   every Tool node and beans too\n */";
    expect(coversIn(block)).toEqual(["tools"]);
  });

  test("absent is UNDEFINED, not an empty list", () => {
    // The distinction the whole gate half rests on: `[]` is `@covers none`, a
    // decision; `undefined` is a gate that has not said. Collapsing them would
    // credit every unannotated gate with having decided it audits nothing.
    expect(coversIn("/**\n * a gate with no declaration\n */")).toBeUndefined();
    expect(coversIn("/**\n * @covers none\n */")).toEqual(["none"]);
  });
});

describe("scriptsFor — a gate command to the files it runs", () => {
  const scripts = {
    "check:x": "bun run cat-harness/scripts/check-x.ts",
    "check:x:check": "bun run check:x -- --check",
    lint: "eslint .",
  };

  test("a direct path", () => {
    expect(scriptsFor("bun run cat-harness/scripts/check-x.ts", scripts)).toEqual(["cat-harness/scripts/check-x.ts"]);
  });

  test("one hop through package.json", () => {
    expect(scriptsFor("bun run check:x", scripts)).toEqual(["cat-harness/scripts/check-x.ts"]);
  });

  test("two hops", () => {
    // `check:*:check` scripts delegate, and a gate that resolved to nothing
    // would be filed as "runs no script here" — silently uncoverable.
    expect(scriptsFor("bun run check:x:check", scripts)).toEqual(["cat-harness/scripts/check-x.ts"]);
  });

  test("a command with no script resolves to nothing, rather than guessing", () => {
    expect(scriptsFor("bun run lint", scripts)).toEqual([]);
    expect(scriptsFor("bunx tsc --noEmit -p tsconfig.json", scripts)).toEqual([]);
  });
});

describe("census — what counts as a file of a kind", () => {
  const dir = mkdtempSync(join(tmpdir(), "audit-coverage-"));

  test("a verdict ABOUT a node is not a node", () => {
    // Counting sidecars would make a directory look FULLER the more of it had
    // been audited, which inverts the measurement.
    writeFileSync(join(dir, "a.md"), "x");
    writeFileSync(join(dir, "a.kg-qa.json"), "{}");
    writeFileSync(join(dir, "b.qa.json"), "{}");
    const c = census(dir);
    expect(c.files).toBe(1);
    expect(c.sidecars).toBe(2);
  });

  test("dot-prefixed paths are skipped, at every segment", () => {
    mkdirSync(join(dir, ".cache"), { recursive: true });
    writeFileSync(join(dir, ".cache", "c.md"), "x");
    writeFileSync(join(dir, ".hidden"), "x");
    expect(census(dir).files).toBe(1);
  });

  test("an unreadable directory says so rather than reporting zero", () => {
    const c = census(join(dir, "does-not-exist"));
    expect(c.readable).toBe(false);
    expect(c.files).toBe(0);
  });
});

describe("the report over this repository", () => {
  const { rows, gates, universe } = coverage(REPO);

  test("it examined something — the vacuity guard's subject", () => {
    // A filter over nothing passes. This repository has paid for that three
    // times (`gates.ts` names them), so the denominators are asserted, not
    // assumed.
    expect(rows.length).toBeGreaterThan(0);
    expect(gates.length).toBeGreaterThan(0);
    expect(KG_CRITERIA.length).toBeGreaterThan(0);
  });

  test("every declared kind gets exactly one row", () => {
    const declared = universe.registered.length + universe.declaredOnly.length;
    expect(rows.length).toBe(declared);
    expect(new Set(rows.map((r) => r.kind)).size).toBe(rows.length);
  });

  test("the three states are distinguishable, and all three occur here", () => {
    // If any of these is empty the report has stopped discriminating and the
    // remaining states are carrying a meaning they were not given.
    const states = new Set(rows.map((r) => r.state));
    expect(states.has("no-directory")).toBe(true);
    expect(states.has("covered")).toBe(true);
    // `unaudited` is a fact about the corpus and may legitimately go to zero
    // once criteria are written; what must hold is that it is DERIVED and not
    // conflated with the other two.
    for (const r of rows) {
      if (r.state === "no-directory") expect(r.directories.length).toBe(0);
      if (r.state === "empty") expect(r.files).toBe(0);
      if (r.state === "unaudited") {
        expect(r.files).toBeGreaterThan(0);
        expect(r.criteria.length + r.gates.length).toBe(0);
      }
      if (r.state === "covered") expect(r.criteria.length + r.gates.length).toBeGreaterThan(0);
    }
  });

  test("a nested kind reads as no-directory, not as a gap", () => {
    // `bean-defs` is declared in `beans/beans.json`, one level inside the
    // `beans` graph, so no INSTANCE declares a directory of it. That must not
    // read as an unaudited kind — and it is the case that proves the first
    // state earns its name.
    const beanDefs = rows.find((r) => r.kind === "bean-defs");
    expect(beanDefs?.state).toBe("no-directory");
    expect(beanDefs?.gates.length).toBeGreaterThan(0);
  });

  test("the bean store is reported as audited — the defect that prompted this", () => {
    // 2026-09-23: an agent read zero `kg-qa` sidecars over the bean store and
    // reported beans "effectively unaudited". This is the assertion that the
    // command answers that question correctly.
    const beans = rows.find((r) => r.kind === "beans");
    expect(beans?.files).toBeGreaterThan(0);
    expect(beans?.gates.length).toBeGreaterThanOrEqual(5);
    expect(beans?.state).toBe("covered");
  });

  test("criteria are attributed through the declared bridge, not guessed", () => {
    // Each kind's criterion count must be exactly the criteria whose `applies`
    // maps here through `KG_SUBJECT_GRAPH_KINDS`.
    for (const r of rows) {
      const expected = KG_CRITERIA.filter((c) => c.applies.some((s) => KG_SUBJECT_GRAPH_KINDS[s] === r.kind));
      expect(r.criteria.sort()).toEqual([...new Set(expected.map((c) => c.id))].sort());
    }
  });

  test("a gate's every declared kind is a kind that has a row", () => {
    // A typo in an `@covers` line would otherwise credit a kind that does not
    // exist, and the gate would count as covering something while covering
    // nothing.
    const known = new Set(rows.map((r) => r.kind));
    for (const g of gates) {
      for (const k of g.covers) expect(known.has(k), `${g.command} declares "${k}", which is not a declared kind`).toBe(true);
    }
  });

  test("every gate lands in exactly one state, and none is left unclassified", () => {
    for (const g of gates) {
      expect(["declared", "none", "computed", "undeclared", "no-script"]).toContain(g.state);
      if (g.state === "declared") expect(g.covers.length).toBeGreaterThan(0);
      else expect(g.covers).toEqual([]);
      if (g.state !== "declared" && g.state !== "none" && g.state !== "computed") expect(g.why).toBeTruthy();
    }
  });
});

describe("kindUniverse", () => {
  test("the registry is the denominator, and an instance may add to it", () => {
    const u = kindUniverse(REPO);
    expect(u.registered.length).toBeGreaterThan(0);
    // The registry is OPEN, so a kind an instance declares and the registry
    // does not know is reported separately rather than dropped — dropping it
    // would shrink the denominator without saying so.
    for (const k of u.declaredOnly) expect(u.registered).not.toContain(k);
  });
});

describe("gateCoverage", () => {
  test("it reads the browser jobs too", () => {
    // `--all`. A coverage report that silently dropped the e2e gates would
    // under-count for a reason invisible in its own output.
    const g = gateCoverage(INSTANCE, REPO);
    expect(g.some((x) => x.command.includes("render:bpmn"))).toBe(true);
  });

  test("it declares its own coverage, so the report is not exempt from its own rule", () => {
    const g = gateCoverage(INSTANCE, REPO);
    const self = g.find((x) => x.command.includes("audit:coverage"));
    expect(self?.state).toBe("none");
  });
});
