/**
 * The tests of this file that read the whole checkout (reads every instance
 * this checkout stages and the repository each declares) live in
 * `test/instance-repositories-checkout.test.ts` (bean `7zz1`): standing alone,
 * cat-harness has none of it.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { CatHarnessDeclarationSchema } from "./cat-harness";
import { instanceRepositories } from "./instance-repositories";

const CHECKOUT = resolve(import.meta.dir, "../..");

describe("instance references are owner/repo and resolve (bean 6rmv, phase 2)", () => {
  const map = instanceRepositories(CHECKOUT);
  // Every committed voice and instance declaration, as git lists them — the
  // files whose `instance` fields name another instance.
  const files = execFileSync("git", ["ls-files", "*voice.json", "*/*.json"], { cwd: CHECKOUT, encoding: "utf8" })
    .split("\n")
    .filter((f) => f.endsWith("voice.json") || /^([^/]+)\/\1\.json$/.test(f));
  const refs: Array<{ file: string; ref: string }> = [];
  for (const file of files) {
    for (const m of readFileSync(join(CHECKOUT, file), "utf8").matchAll(/"instance":\s*"([^"]+)"/g)) {
      refs.push({ file, ref: m[1]! });
    }
  }

  test("there are references to check", () => {
    expect(refs.length).toBeGreaterThan(100);
  });

  test("every one resolves through the derived map, by owner/repo", () => {
    expect(refs.filter(({ ref }) => !map.byRepository.has(ref))).toEqual([]);
  });
});

describe("instance repositories — the schema and the refusals", () => {
  const base = { name: "x", title: "X", version: "0.1.0", directories: [] };

  test("repository must be owner/name; livesAt path may not climb", () => {
    expect(CatHarnessDeclarationSchema.safeParse({ ...base, repository: "x" }).success).toBe(false);
    expect(
      CatHarnessDeclarationSchema.safeParse({ ...base, livesAt: { repository: "a/b", path: "../x" } }).success,
    ).toBe(false);
    expect(
      CatHarnessDeclarationSchema.safeParse({ ...base, repository: "a/x", livesAt: { repository: "a/b", path: "x" } })
        .success,
    ).toBe(true);
  });

  test("two instances claiming one repository is refused", () => {
    const dir = mkdtempSync(join(tmpdir(), "inst-repo-"));
    for (const n of ["one", "two"]) {
      mkdirSync(join(dir, n));
      writeFileSync(
        join(dir, n, `${n}.json`),
        JSON.stringify({ name: n, version: "0.1.0", repository: "o/same", directories: [] }),
      );
    }
    expect(() => instanceRepositories(dir)).toThrow(/o\/same is declared by both/);
  });
});
