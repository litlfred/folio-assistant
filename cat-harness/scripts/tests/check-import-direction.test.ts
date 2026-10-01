/**
 * `check:import-direction` — tested with PLANTED violations, because a boundary
 * check never seen failing checks nothing (`4j3h`, `q2wn`, `p11x`).
 *
 * The fixture is a checkout of four instances: `low` needs nothing, `high`
 * needs `low`, `side` is a sibling of `low` (also needs nothing), and `odd`
 * declares no `needs` at all. Every edge kind the gate distinguishes is planted
 * once, alongside the look-alikes it must NOT count.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { analyse, type ImportDirectionReport } from "../check-import-direction.ts";

let tmp: string;
let r: ImportDirectionReport;

function put(rel: string, body: string): void {
  const p = join(tmp, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
}

function instance(name: string, needs?: string[]): void {
  put(`${name}/${name}.json`, JSON.stringify(needs === undefined ? { name } : { name, needs }));
}

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), "import-direction-"));
  instance("low", []);
  instance("side", []);
  instance("high", ["low"]);
  instance("odd");

  put("low/x.ts", "export const x = 1;\n");
  put("side/s.ts", "export const s = 1;\n");
  put("high/y.ts", "export const y = 1;\n");

  // Allowed: down the arrow, and within one instance.
  put("high/ok.ts", 'import { x } from "../low/x.ts";\nimport { y } from "./y.ts";\nexport { x, y };\n');
  // Wrong-direction: up the arrow, by static import and by re-export.
  put("low/up.ts", 'import { y } from "../high/y.ts";\nexport * from "../high/y.ts";\nexport { y };\n');
  // Wrong-direction: a sibling this instance does not declare needing.
  put("low/sibling.ts", 'import { s } from "../side/s.ts";\nexport { s };\n');
  // Wrong-direction: the `builtin-adapters.ts` shape — a module path handed to a variable import.
  put("low/src/table.ts", 'export const T = [{ module: "../high/y.ts" }];\nexport const load = (p: string) => import(p);\n');
  // NOT counted: a docblock quoting an import, and a `../` literal naming no instance.
  put("low/quiet.ts", '/** import { y } from "../high/y.ts"; */\n// require("../high/y.ts")\nexport const p = "../fixtures/x.ts";\n');
  // Undetermined: an importer whose instance declares no `needs`.
  put("odd/o.ts", 'import { x } from "../low/x.ts";\nexport { x };\n');

  r = analyse(tmp);
});

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("check:import-direction", () => {
  test("finds every planted wrong-direction edge, and only those", () => {
    const wrong = r.findings.filter((f) => f.verdict === "wrong-direction").map((f) => `${f.file} ${f.via} → ${f.toInstance}`);
    expect(wrong.sort()).toEqual(
      [
        "low/up.ts specifier → high",
        "low/sibling.ts specifier → side",
        "low/src/table.ts module-path-literal → high",
      ].sort(),
    );
  });

  test("a re-export of the same specifier is one finding, not two", () => {
    expect(r.findings.filter((f) => f.file === "low/up.ts")).toHaveLength(1);
  });

  test("down the arrow and within an instance is allowed", () => {
    expect(r.findings.some((f) => f.file === "high/ok.ts")).toBe(false);
  });

  test("an undeclared `needs` is UNDETERMINED — never clean, never wrong", () => {
    expect(r.undeclaredNeeds).toEqual(["odd"]);
    const odd = r.findings.filter((f) => f.fromInstance === "odd");
    expect(odd.map((f) => f.verdict)).toEqual(["undetermined"]);
  });

  test("a variable `import(expr)` is reported as could-not-determine", () => {
    expect(r.variableSpecifiers).toEqual([{ file: "low/src/table.ts", count: 1 }]);
  });

  test("comments and instance-less `../` literals are not imports", () => {
    expect(r.findings.some((f) => f.file === "low/quiet.ts")).toBe(false);
  });

  test("the planted edges disappear when `low` declares what it reaches", () => {
    // The allowed set is read from `needs`, never from a list in the gate:
    // declaring the sibling makes that edge legal without an edit to the check.
    instance("low", ["side"]);
    try {
      const again = analyse(tmp);
      expect(again.findings.some((f) => f.file === "low/sibling.ts")).toBe(false);
      expect(again.findings.some((f) => f.file === "low/up.ts")).toBe(true);
    } finally {
      instance("low", []);
    }
  });
});
