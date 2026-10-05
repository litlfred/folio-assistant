/**
 * The structure-accessor gate (bean rkqp, owner 2026-09-30): it must FAIL on
 * the thing it exists for, not only pass on today's tree.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { ALLOWED, scan } from "../check-structure-accessor.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");

describe("what the gate matches", () => {
  const files: Record<string, string> = {
    "a.ts": 'const p = join(dir, "structure.json");',
    "b.ts": "const p = join(dir, 'structure.json');",
    "c.ts": " * reads `structure.json` through the accessor",
    "d.ts": "// the old path was structure.json",
    "e.ts": "throw new Error(`${dir}: no structure.json — this is not a staged entry`);",
    "f.ts": "const p = join(dir, STRUCTURE_FILENAME);",
  };
  const hits = scan(Object.keys(files), (f) => files[f]!);

  test("a path built from the quoted token is caught, in either quote style", () => {
    expect(hits.has("a.ts")).toBe(true);
    expect(hits.has("b.ts")).toBe(true);
  });

  test("prose is not: doc comments, line comments and the name inside a message", () => {
    for (const f of ["c.ts", "d.ts", "e.ts"]) expect(hits.has(f)).toBe(false);
  });

  test("the constant is the way through", () => {
    expect(hits.has("f.ts")).toBe(false);
  });
});

describe("the real corpus", () => {
  test("passes, and every allowlist entry still earns its place", () => {
    const r = spawnSync("bun", ["run", "cat-harness-tools/scripts/check-structure-accessor.ts"], { cwd: REPO, encoding: "utf-8" });
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
  });

  test("every allowlist entry carries a reason", () => {
    for (const [f, why] of Object.entries(ALLOWED)) expect(why.length > 20 ? "" : f).toBe("");
  });
});
