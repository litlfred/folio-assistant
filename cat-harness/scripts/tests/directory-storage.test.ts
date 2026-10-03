/**
 * `ContentDirectory.storage` — a directory kept on a branch, keyed by commit.
 *
 * Bean `16ei`, proposal §2.4. The field changes what three presence checks may
 * conclude from an absent directory, so each is pinned here against a REAL
 * fixture declaration rather than a hand-built object:
 *
 * | consumer | without `storage` | with `storage` |
 * |---|---|---|
 * | `check:declared-dirs` | absent → finding | absent → nothing (it is on its branch) |
 * | `harness:dirs` | absent → created | absent → NOT created (an empty working copy reads as clean) |
 * | `audit:coverage` | censused | skipped, and the kind reads `stored` |
 *
 * `keyedBy` is `commit` or `tip` (bean `2h76`); `tip` is refused on a `qa`
 * directory. Every real `qa` directory declares it since bean `5hox`, and the
 * last describe block pins the one consequence a fixture cannot: each stored
 * directory's working copy is ignored by version control, so a writer's output
 * is never committed by accident and the removal stays removed.
 *
 * @module scripts/tests/directory-storage
 */
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ContentDirectorySchema, DirectoryStorageSchema, materialiseDirectories, resolveDirectories } from "../../schemas/cat-harness.js";
import { censusDirectories } from "../audit-coverage.js";
import { auditInstance } from "../check-declared-dirs.ts";
import { QaUsageError, resolveQaLocation } from "../qa-store.js";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

const STORED = { branch: "qa-reports", keyedBy: "commit" } as const;

/** An instance (at a fresh repository root) declaring exactly `dirs`. */
function instance(dirs: Array<Record<string, unknown>>): string {
  const root = mkdtempSync(join(tmpdir(), "dir-storage-"));
  made.push(root);
  writeFileSync(join(root, "fixture.json"), JSON.stringify({ $schema: "folio-harness/v1", name: "fixture", directories: dirs }, null, 2));
  return root;
}

describe("the schema", () => {
  test("accepts { branch, keyedBy: commit } and leaves it optional", () => {
    expect(ContentDirectorySchema.safeParse({ id: "qa", path: "test/results/", graphKinds: ["qa"], storage: STORED }).success).toBe(true);
    expect(ContentDirectorySchema.safeParse({ id: "qa", path: "test/results/", graphKinds: ["qa"] }).success).toBe(true);
  });

  test.each([
    ["commit", { id: "qa", path: "test/results/", graphKinds: ["qa"] }],
    ["tip", { id: "beans-defs", path: "beans/defs/", graphKinds: ["bean-defs"] }],
    ["route", { id: "docs-auto", path: "docs/cat-harness/docs-auto/", graphKinds: ["docs"] }],
  ])("accepts keyedBy %s (beans 2h76, 1j3q)", (keyedBy, dir) => {
    const storage = { branch: "cat/cat-harness/beans", keyedBy };
    expect(DirectoryStorageSchema.safeParse(storage).success).toBe(true);
    expect(ContentDirectorySchema.safeParse({ ...dir, storage }).success).toBe(true);
  });

  // Both non-commit keyings, not just `tip`. A guard that named one value
  // would admit every value added after it — which is exactly how `route`
  // would have slipped past the check written for `tip` (bean `1j3q`).
  test.each(["tip", "route"])("refuses keyedBy %s on a qa directory: qa is commit-keyed by construction", (keyedBy) => {
    const r = ContentDirectorySchema.safeParse({ id: "qa", path: "test/results/", graphKinds: ["qa"], storage: { branch: "x", keyedBy } });
    expect(r.success).toBe(false);
  });

  test.each([
    [{ branch: "qa-reports", keyedBy: "path" }, "an unimplemented keying"],
    [{ branch: "qa-reports", keyedBy: "routes" }, "a near-miss of an implemented keying"],
    [{ branch: "refs/heads/qa-reports", keyedBy: "commit" }, "a full ref rather than a branch"],
    [{ branch: "-qa", keyedBy: "commit" }, "a leading dash (an option to git)"],
    [{ branch: "qa..reports", keyedBy: "commit" }, "a `..`"],
    [{ branch: "qa reports", keyedBy: "commit" }, "whitespace"],
    [{ branch: "qa-reports", keyedBy: "commit", force: true }, "an unknown key"],
    [{ keyedBy: "commit" }, "no branch"],
  ])("refuses %j — %s", (storage) => {
    expect(DirectoryStorageSchema.safeParse(storage).success).toBe(false);
    expect(ContentDirectorySchema.safeParse({ id: "qa", path: "test/results/", graphKinds: ["qa"], storage }).success).toBe(false);
  });
});

describe("presence checks honour it", () => {
  test("check:declared-dirs: an absent STORED directory is not a finding; the same without storage is", () => {
    const stored = instance([{ id: "qa", path: "test/results/", graphKinds: ["qa"], storage: STORED }]);
    expect(auditInstance(stored, stored)).toEqual([]);
    const plain = instance([{ id: "qa", path: "test/results/", graphKinds: ["qa"] }]);
    expect(auditInstance(plain, plain).map((f) => f.kind)).toEqual(["absent"]);
  });

  test("check:declared-dirs: a fetched working copy of a stored directory is not a stale exemption", () => {
    const root = instance([{ id: "qa", path: "test/results/", graphKinds: ["qa"], storage: STORED }]);
    mkdirSync(join(root, "test", "results"), { recursive: true });
    expect(auditInstance(root, root)).toEqual([]);
  });

  test("harness:dirs does not create a stored directory empty, and does not list it as missing", () => {
    const root = instance([
      { id: "qa", path: "test/results/", graphKinds: ["qa"], storage: STORED },
      { id: "health", path: "test/health/results/", graphKinds: ["health"] },
    ]);
    const dirs = resolveDirectories([{ name: "fixture", root, own: true }]);
    expect(dirs.find((d) => d.id === "qa")?.storage).toEqual(STORED);
    const out = materialiseDirectories(dirs, root);
    expect(out.map((r) => r.id)).not.toContain("qa");
    expect(existsSync(join(root, "test", "results"))).toBe(false);
    expect(existsSync(join(root, "test", "health", "results"))).toBe(true);
  });

  test("audit:coverage skips a stored directory's working copy and says how many it skipped", () => {
    const root = instance([]);
    const a = join(root, "a");
    const b = join(root, "b");
    mkdirSync(a);
    mkdirSync(b);
    const r = censusDirectories([
      { absPath: a, storage: STORED },
      { absPath: b, storage: STORED },
    ]);
    expect(r).toEqual({ files: 0, sidecars: 0, stored: 2, uncounted: 0 });
  });

  test("a directory neither stored nor present is UNCOUNTED, never a census of zero (bean 0dav, C8)", () => {
    const root = instance([]);
    const here = join(root, "here");
    mkdirSync(here);
    writeFileSync(join(here, "x.json"), "{}");
    const r = censusDirectories([{ absPath: here }, { absPath: join(root, "gone") }]);
    expect(r).toEqual({ files: 1, sidecars: 0, stored: 0, uncounted: 1 });
  });
});

describe("resolveQaLocation", () => {
  test("reads the branch from the declaration; with none declared it is the default, and says so", () => {
    const root = instance([{ id: "qa", path: "test/results/", graphKinds: ["qa"], storage: { branch: "qa-elsewhere", keyedBy: "commit" } }]);
    const loc = resolveQaLocation(root);
    expect(loc).toMatchObject({ branch: "qa-elsewhere", declared: true, keyedBy: "commit" });
    expect(loc.directories).toEqual([
      expect.objectContaining({ id: "qa", path: "test/results", present: false, storage: { branch: "qa-elsewhere", keyedBy: "commit" } }),
    ]);

    const plain = instance([{ id: "qa", path: "test/results/", graphKinds: ["qa"] }]);
    expect(resolveQaLocation(plain)).toMatchObject({ branch: "cat/cat-harness/qa-reports", declared: false });
  });

  test("two qa directories naming different branches are refused, not resolved by order", () => {
    const root = instance([
      { id: "qa", path: "test/results/", graphKinds: ["qa"], storage: { branch: "one", keyedBy: "commit" } },
      { id: "qa2", path: "more/results/", graphKinds: ["qa"], storage: { branch: "two", keyedBy: "commit" } },
    ]);
    expect(() => resolveQaLocation(root)).toThrow(QaUsageError);
  });
});

describe("the real declarations (bean 5hox)", () => {
  const repoRoot = join(import.meta.dir, "..", "..", "..");

  test("every declared qa directory is stored, and every stored working copy is ignored", () => {
    const loc = resolveQaLocation(repoRoot);
    expect(loc.directories.length).toBeGreaterThan(0);
    expect(loc.declared).toBe(true);
    expect(loc.directories.filter((d) => !d.storage).map((d) => d.path)).toEqual([]);
    const probes = loc.directories.map((d) => `${d.path}/probe.json`);
    const r = spawnSync("git", ["check-ignore", "--no-index", "--stdin"], { cwd: repoRoot, input: probes.join("\n") + "\n", encoding: "utf-8" });
    const ignored = new Set(r.stdout.split("\n").filter(Boolean));
    expect(probes.filter((p) => !ignored.has(p))).toEqual([]);
  });

  test("attestations are never ignored: they stay on main (ruling D2 (a))", () => {
    const r = spawnSync("git", ["check-ignore", "--no-index", "-q", "cat-harness/test/attestations/kg-qa/probe.attestations.json"], { cwd: repoRoot });
    expect(r.status).toBe(1);
  });
});
