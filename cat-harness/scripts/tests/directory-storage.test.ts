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
 * `keyedBy` is `commit`, `tip` or `route`; `tip` is refused on a `qa`
 * directory. No real declaration sets the field yet; flipping one is a later bean.
 *
 * ## The two keyings are NOT the same question (bean `9ofm`)
 *
 * The table above is the **commit**-keyed behaviour, and it stays. For a
 * branch TIP the mount is deterministic, so "not in the checkout" has a right
 * answer and skipping the directory would report a clean run over nothing:
 *
 * | consumer | commit-keyed | tip-keyed |
 * |---|---|---|
 * | `check:declared-dirs` | absent → nothing | `not-cut-over` / `unmounted` / mounted → nothing |
 * | `audit:coverage` | skipped, kind reads `stored` | censused at the mount, or kind reads `undetermined` |
 *
 * These cases need a REAL git repository, because the answer is read from
 * `git ls-files` and the mount marker — never from the branch, so the gates
 * stay offline.
 *
 * @module scripts/tests/directory-storage
 */
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MOUNT_MARKER_SCHEMA, markerPath } from "../branch-store.ts";

import { ContentDirectorySchema, DirectoryStorageSchema, materialiseDirectories, resolveDirectories } from "../../schemas/cat-harness.js";
import { censusDirectories } from "../audit-coverage.js";
import { auditInstance } from "../check-declared-dirs.ts";
import { QaUsageError, resolveQaLocation } from "../qa-store.js";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

const STORED = { branch: "qa-reports", keyedBy: "commit" } as const;
const TIP = { branch: "cat/cat-harness/beans", keyedBy: "tip" } as const;

/** `instance()`, in a real (empty) git repository — what the tip cases need. */
function gitInstance(dirs: Array<Record<string, unknown>>): string {
  const root = instance(dirs);
  for (const args of [["init", "-q", "-b", "main"], ["config", "user.email", "t@t"], ["config", "user.name", "t"]]) {
    const r = spawnSync("git", args, { cwd: root, encoding: "utf-8" });
    expect(r.status).toBe(0);
  }
  return root;
}

function git(root: string, ...args: string[]): void {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf-8" });
  expect(r.stderr + String(r.status)).toBe("0");
}

/** A mount of `id` at `into`, as `mountTip` would leave it. */
function marker(root: string, id: string, into: string): void {
  mkdirSync(into, { recursive: true });
  const p = markerPath(root, id);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(
    p,
    JSON.stringify({ $schema: MOUNT_MARKER_SCHEMA, id, branch: TIP.branch, path: "beans", into, tip: "0".repeat(40), files: {} }),
  );
}

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
    expect(r).toEqual({ files: 0, sidecars: 0, stored: 2, undetermined: 0 });
  });
});

// Bean `9ofm`. Each case is the state the machinery can actually be left in,
// asserted through the gate rather than through a hand-built object, because
// the question "what does this checkout know" is answered by git and the
// marker and a stub of either would assert nothing.
describe("a tip-keyed directory is three-valued, and only one value is a pass", () => {
  test("not-cut-over: the declaration names the branch and the checkout still tracks the files", () => {
    const root = gitInstance([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    mkdirSync(join(root, "beans"));
    writeFileSync(join(root, "beans", "a.md"), "x\n");
    git(root, "add", "beans/a.md");

    const f = auditInstance(root, root);
    expect(f.map((x) => x.kind)).toEqual(["not-cut-over"]);
    // The remedy is the part a reader acts on: the two halves are ONE change.
    expect(f[0]!.detail).toContain("ONE change");
    expect(f[0]!.detail).toContain("still tracks 1 file(s)");
  });

  test("unmounted: cut over, nothing mounted — an EMPTY graph, not an unreachable one", () => {
    const root = gitInstance([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const f = auditInstance(root, root);
    expect(f.map((x) => x.kind)).toEqual(["unmounted"]);
    expect(f[0]!.detail).toContain("nothing is mounted here");
  });

  test("mounted is the pass, and a marker whose mount is GONE is not", () => {
    const root = gitInstance([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const into = join(root, "beans");
    marker(root, "beans", into);
    expect(auditInstance(root, root)).toEqual([]);

    rmSync(into, { recursive: true, force: true });
    expect(auditInstance(root, root).map((x) => x.kind)).toEqual(["unmounted"]);
  });

  test("a COMMIT-keyed directory in the same repository is still skipped — the distinction is the keying", () => {
    const root = gitInstance([
      { id: "qa", path: "test/results/", graphKinds: ["qa"], storage: STORED },
      { id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP },
    ]);
    // Only the tip-keyed one is answered; `qa` contributes no finding either way.
    expect(auditInstance(root, root).map((x) => x.id)).toEqual(["beans"]);
  });

  test("audit:coverage counts a mount's real files, and will not fold `undetermined` into `stored`", () => {
    const root = gitInstance([]);
    const into = join(root, "mounted");
    marker(root, "beans", into);
    writeFileSync(join(into, "a.md"), "x\n");
    writeFileSync(join(into, "b.md"), "y\n");

    // Mounted: censused AT THE MARKER's `into`, which is not the declared path.
    expect(censusDirectories([{ id: "beans", absPath: join(root, "beans"), storage: TIP }], undefined, root)).toEqual({
      files: 2,
      sidecars: 0,
      stored: 0,
      undetermined: 0,
    });

    // Unmounted: `undetermined`, and NOT `stored` — "could not read the files"
    // and "not where the files are, by design" are different answers.
    expect(censusDirectories([{ id: "todos", absPath: join(root, "todos"), storage: TIP }], undefined, root)).toEqual({
      files: 0,
      sidecars: 0,
      stored: 0,
      undetermined: 1,
    });
  });

  // The MODERN spelling (#1987, bean `l4ay`). `storage` is its legacy form and
  // the resolver maps one onto the other, so both must reach the same verdict
  // — otherwise the answer depends on which field a declaration happened to
  // use, which is the defect `subgraph-source` exists to remove.
  test("`source: { kind: branch, keyedBy: tip }` reaches the same verdict as the legacy `storage`", () => {
    const src = { kind: "branch", branch: TIP.branch, keyedBy: "tip" } as const;
    const root = gitInstance([{ id: "beans", path: "beans/", graphKinds: ["beans"], source: src }]);
    expect(auditInstance(root, root).map((x) => x.kind)).toEqual(["unmounted"]);

    marker(root, "beans", join(root, "beans"));
    expect(auditInstance(root, root)).toEqual([]);
    expect(censusDirectories([{ id: "beans", absPath: join(root, "beans"), source: src }], undefined, root).undetermined).toBe(0);
  });

  test("`source: { kind: branch, keyedBy: commit }` is skipped, like the legacy commit-keyed form", () => {
    const src = { kind: "branch", branch: "cat/cat-harness/qa-reports", keyedBy: "commit" } as const;
    const root = gitInstance([{ id: "qa", path: "test/results/", graphKinds: ["qa"], source: src }]);
    expect(auditInstance(root, root)).toEqual([]);
    expect(censusDirectories([{ id: "qa", absPath: join(root, "test", "results"), source: src }], undefined, root)).toEqual({
      files: 0,
      sidecars: 0,
      stored: 1,
      undetermined: 0,
    });
  });

  test("an entry declaring BOTH is a finding carrying the resolver's message, not a crash", () => {
    const root = gitInstance([
      { id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP, source: { kind: "branch", branch: TIP.branch, keyedBy: "tip" } },
    ]);
    const f = auditInstance(root, root);
    expect(f.map((x) => x.kind)).toEqual(["unmounted"]);
    expect(f[0]!.detail).toContain("two answers to where its content comes from");
  });

  test("no git repository is `undetermined`, never a pass: a gate that could not ask has not asked", () => {
    const root = instance([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const f = auditInstance(root, root);
    expect(f.map((x) => x.kind)).toEqual(["unmounted"]);
    expect(f[0]!.detail).toContain("Not a pass");
    expect(censusDirectories([{ id: "beans", absPath: join(root, "beans"), storage: TIP }], undefined, root).undetermined).toBe(1);
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
