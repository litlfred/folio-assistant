/**
 * The closure gate, tested with PLANTED violations: a boundary check that has
 * never been seen failing is not known to check anything (`4j3h`, `q2wn`).
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkClosure, specifiersOf } from "./check-closure.ts";

function pkg(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "bt-closure-"));
  const root = join(dir, "bootstrap-tools");
  mkdirSync(join(root, "schemas"), { recursive: true });
  mkdirSync(join(dir, "cat-harness"), { recursive: true });
  writeFileSync(join(dir, "cat-harness", "x.ts"), "export const x = 1;\n");
  for (const [p, src] of Object.entries(files)) writeFileSync(join(root, p), src);
  return root;
}

describe("check-closure", () => {
  test("its own files, zod and node: builtins pass", () => {
    const root = pkg({
      "schemas/a.ts": 'import { z } from "zod";\nimport { join } from "node:path";\nexport const a = z.string();\n',
      "schemas/b.ts": 'import { a } from "./a.ts";\nexport { a };\n',
    });
    expect(checkClosure(root)).toEqual([]);
  });

  test("a relative import out of the package fails", () => {
    const root = pkg({ "schemas/a.ts": 'import { x } from "../../cat-harness/x.ts";\n' });
    expect(checkClosure(root).map((f) => f.why)).toEqual(["leaves bootstrap-tools (../cat-harness/x.ts)"]);
  });

  test("any other package fails, and a test may add only bun:test and ajv", () => {
    const root = pkg({
      "schemas/a.ts": 'import { Liquid } from "liquidjs";\n',
      "schemas/a.test.ts": 'import { test } from "bun:test";\nimport Ajv from "ajv";\nimport x from "playwright";\n',
    });
    expect(checkClosure(root).map((f) => `${f.file} ${f.specifier}`).sort()).toEqual([
      "schemas/a.test.ts playwright",
      "schemas/a.ts liquidjs",
    ]);
  });

  test("an import quoted in a comment is not an import; dynamic and re-exports are", () => {
    expect(specifiersOf('/** import { x } from "../../cat-harness/x.ts"; */\n// import "y";\nexport const q = 1;\n')).toEqual([]);
    expect(specifiersOf('export { a } from "./a.ts";\nconst m = await import("./b.ts");\n').sort()).toEqual(["./a.ts", "./b.ts"]);
  });
});

describe("strings are data, not imports", () => {
  test("a fixture that builds an import inside a string is not read as one", () => {
    expect(specifiersOf('const src = \'import { x } from "../../cat-harness/x.ts";\';\nconst t = `await import("./b.ts")`;\n')).toEqual([]);
  });
});
