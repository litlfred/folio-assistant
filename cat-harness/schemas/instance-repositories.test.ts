import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { CatHarnessDeclarationSchema } from "./cat-harness";
import { instanceRepositories, locationMismatch, resolveInstance } from "./instance-repositories";

const CHECKOUT = resolve(import.meta.dir, "../..");

describe("instance repositories — this checkout (bean 6rmv)", () => {
  const map = instanceRepositories(CHECKOUT);

  test("every instance declares the repository it is", () => {
    expect(map.undeclared).toEqual([]);
    expect(map.entries.length).toBeGreaterThan(1);
  });

  test("livesAt matches where each instance actually sits", () => {
    expect(map.entries.map((e) => locationMismatch(e, CHECKOUT)).filter(Boolean)).toEqual([]);
  });

  test("every livesAt names the checkout's own repository as host", () => {
    const host = map.entries.find((e) => e.livesAt === undefined);
    expect(host).toBeDefined();
    const hosts = new Set(map.entries.flatMap((e) => (e.livesAt ? [e.livesAt.repository] : [])));
    expect([...hosts]).toEqual([host!.repository]);
  });

  test("a reference resolves by owner/repo and, transitionally, by name", () => {
    const e = map.byName.get("cat-harness")!;
    expect(resolveInstance(map, e.repository)?.root).toBe(e.root);
    expect(resolveInstance(map, "cat-harness")?.repository).toBe(e.repository);
    expect(resolveInstance(map, "nobody/nothing")).toBeUndefined();
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
