import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { CatHarnessDeclarationSchema } from "./cat-harness";
import { instanceRepositories, locationMismatch, repositoryNamespaces, resolveInstance } from "./instance-repositories";
import { ownNamespace } from "./namespaces";

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

describe("the owner/repo → namespace map is derived and agrees with the list (bean 6rmv, phase 3)", () => {
  const ns = repositoryNamespaces(CHECKOUT);

  test("every declared instance has a namespace", () => {
    expect(ns.size).toBe(instanceRepositories(CHECKOUT).entries.length);
  });

  // The code list still NAMES each vocabulary namespace, because code reads
  // them by code; what it may no longer do is SPELL one differently from the
  // declaration it belongs to. Code → the repository whose namespace it is.
  const LISTED: Array<[code: string, repository: string]> = [
    ["cat-bootstrap", "litlfred/bootstrap"],
    ["cat-harness", "litlfred/cat-harness"],
    ["folio-assistant-core", "litlfred/folio-assistant-core"],
  ];
  test.each(LISTED)("own-namespaces %s is what %s's declaration derives", (code, repository) => {
    expect(ns.get(repository)).toBe(ownNamespace(code));
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
