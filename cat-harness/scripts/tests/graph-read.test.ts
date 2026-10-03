/**
 * `graphReadPath` — the checkout, or the mount, or a refusal.
 *
 * Bean `9ofm` row D. Against real git and a real mount marker: the question
 * "what does this checkout know" is answered by git and the marker, and a stub
 * of either would assert the stub.
 *
 * @module scripts/tests/graph-read
 */
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MOUNT_MARKER_SCHEMA, markerPath } from "../branch-store.ts";
import { graphReadPath, mustReadGraph } from "../graph-read.ts";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

const TIP = { branch: "cat/cat-harness/beans", keyedBy: "tip" } as const;

function git(root: string, ...args: string[]): void {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf-8" });
  expect(`${args.join(" ")} -> ${r.status}`).toBe(`${args.join(" ")} -> 0`);
}

/** A git repository declaring exactly `dirs`. */
function repo(dirs: Array<Record<string, unknown>>): string {
  const root = mkdtempSync(join(tmpdir(), "graph-read-"));
  made.push(root);
  writeFileSync(join(root, "fixture.json"), JSON.stringify({ $schema: "folio-harness/v1", name: "fixture", directories: dirs }, null, 2));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "t@t");
  git(root, "config", "user.name", "t");
  return root;
}

function mount(root: string, id: string, into: string): void {
  mkdirSync(into, { recursive: true });
  const p = markerPath(root, id);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, JSON.stringify({ $schema: MOUNT_MARKER_SCHEMA, id, branch: TIP.branch, path: "beans", into, tip: "0".repeat(40), files: {} }));
}

describe("a directory that never moved", () => {
  test("reads from the checkout, and says so", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"] }]);
    mkdirSync(join(root, "beans"));
    expect(graphReadPath("beans", root)).toEqual({ state: "ok", at: join(root, "beans"), from: "checkout", id: "beans" });
  });

  test("a COMMIT-keyed branch directory still reads from the checkout: only a tip mount relocates a read", () => {
    const root = repo([{ id: "qa", path: "test/results/", graphKinds: ["qa"], storage: { branch: "cat/cat-harness/qa-reports", keyedBy: "commit" } }]);
    expect(graphReadPath("qa", root)).toMatchObject({ state: "ok", from: "checkout" });
  });
});

describe("a tip-keyed directory, through the cutover", () => {
  test("BEFORE: declaration flipped, files still tracked — the checkout IS the store", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    mkdirSync(join(root, "beans"));
    writeFileSync(join(root, "beans", "a.md"), "x\n");
    git(root, "add", "beans/a.md");

    expect(graphReadPath("beans", root)).toEqual({
      state: "ok",
      at: join(root, "beans"),
      from: "checkout",
      id: "beans",
      notCutOver: true,
    });
  });

  test("AFTER: mounted — the marker's `into`, which need not be the declared path", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const into = join(root, "elsewhere");
    mount(root, "beans", into);
    expect(graphReadPath("beans", root)).toEqual({ state: "ok", at: into, from: "mount", id: "beans" });
  });

  test("BETWEEN: cut over and NOT mounted — refused, never a plausible empty directory", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const r = graphReadPath("beans", root);
    expect(r.state).toBe("refused");
    if (r.state !== "refused") throw new Error("unreachable");
    // The remedy, and the reason a fallback would be wrong.
    expect(r.reason).toContain("bun run state:mount");
    expect(r.reason).toContain("EMPTY graph");
    expect(r.reason).not.toContain(join(root, "beans") + '"');
  });

  test("the SAME call serves before and after the cutover — the migration is not two migrations", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    mkdirSync(join(root, "beans"));
    writeFileSync(join(root, "beans", "a.md"), "x\n");
    git(root, "add", "beans/a.md");
    const before = graphReadPath("beans", root);

    // The cutover: the files leave the checkout and the mount arrives.
    git(root, "rm", "-q", "--cached", "beans/a.md");
    rmSync(join(root, "beans"), { recursive: true, force: true });
    mount(root, "beans", join(root, "beans"));
    const after = graphReadPath("beans", root);

    expect(before.state).toBe("ok");
    expect(after.state).toBe("ok");
    // Same path either side; only `from` and `notCutOver` move.
    expect((after as { at: string }).at).toBe((before as { at: string }).at);
    expect((before as { from: string }).from).toBe("checkout");
    expect((after as { from: string }).from).toBe("mount");
  });
});

describe("what it refuses to guess", () => {
  test("an unknown id is `undeclared`, not a composed path", () => {
    const root = repo([]);
    const r = graphReadPath("nope", root);
    expect(r.state).toBe("undeclared");
    expect((r as { reason: string }).reason).toContain('no declared directory has id "nope"');
  });

  test("a declaration carrying both `source` and `storage` is refused with the resolver's message", () => {
    const root = repo([
      { id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP, source: { kind: "branch", branch: TIP.branch, keyedBy: "tip" } },
    ]);
    const r = graphReadPath("beans", root);
    expect(r.state).toBe("refused");
    expect((r as { reason: string }).reason).toContain("two answers to where its content comes from");
  });

  test("the modern `source` spelling reaches the same answer as the legacy `storage`", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], source: { kind: "branch", branch: TIP.branch, keyedBy: "tip" } }]);
    const into = join(root, "beans");
    mount(root, "beans", into);
    expect(graphReadPath("beans", root)).toEqual({ state: "ok", at: into, from: "mount", id: "beans" });
  });
});

describe("mustReadGraph", () => {
  test("hands back the path when there is one", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"] }]);
    mkdirSync(join(root, "beans"));
    expect(mustReadGraph("beans", root)).toEqual({ at: join(root, "beans"), from: "checkout" });
  });

  test("throws carrying the remedy — a crash beats a clean run over an empty directory", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    expect(() => mustReadGraph("beans", root)).toThrow(/cannot read graph "beans".*state:mount/s);
  });
});
