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
 * directory. No real declaration sets the field yet; flipping one is a later bean.
 *
 * @module scripts/tests/directory-storage
 */
import { afterAll, describe, expect, test } from "bun:test";
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
  ])("accepts keyedBy %s (bean 2h76)", (keyedBy, dir) => {
    const storage = { branch: "cat/cat-harness/beans", keyedBy };
    expect(DirectoryStorageSchema.safeParse(storage).success).toBe(true);
    expect(ContentDirectorySchema.safeParse({ ...dir, storage }).success).toBe(true);
  });

  test("refuses keyedBy tip on a qa directory: qa is commit-keyed by construction", () => {
    const r = ContentDirectorySchema.safeParse({ id: "qa", path: "test/results/", graphKinds: ["qa"], storage: { branch: "x", keyedBy: "tip" } });
    expect(r.success).toBe(false);
  });

  test.each([
    [{ branch: "qa-reports", keyedBy: "path" }, "an unimplemented keying"],
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
    expect(r).toEqual({ files: 0, sidecars: 0, stored: 2 });
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
    expect(resolveQaLocation(plain)).toMatchObject({ branch: "qa-reports", declared: false });
  });

  test("two qa directories naming different branches are refused, not resolved by order", () => {
    const root = instance([
      { id: "qa", path: "test/results/", graphKinds: ["qa"], storage: { branch: "one", keyedBy: "commit" } },
      { id: "qa2", path: "more/results/", graphKinds: ["qa"], storage: { branch: "two", keyedBy: "commit" } },
    ]);
    expect(() => resolveQaLocation(root)).toThrow(QaUsageError);
  });
});
