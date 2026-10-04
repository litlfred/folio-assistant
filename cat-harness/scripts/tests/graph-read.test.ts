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
import { readBeanFiles, readBeanStore } from "../bean-store-read.ts";
import { fallbackStoreDir, listBeans, readStoreConfig } from "../beans-fallback.ts";
import { beanDefsDir, readBeans, resolveBeanDefs } from "../beans.ts";
import { graphReadPath, mustReadGraph } from "../graph-read.ts";
import { WORKFLOW_DIR, listInstances, workflowDir } from "../../src/workflow/store.ts";

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
    expect(graphReadPath("beans", root)).toEqual({ state: "ok", at: join(root, "beans"), from: "checkout", id: "beans", path: "beans" });
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
      path: "beans",
      notCutOver: true,
    });
  });

  test("AFTER: mounted — the marker's `into`, which need not be the declared path", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const into = join(root, "elsewhere");
    mount(root, "beans", into);
    expect(graphReadPath("beans", root)).toEqual({ state: "ok", at: into, from: "mount", id: "beans", path: "beans" });
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
    expect(graphReadPath("beans", root)).toEqual({ state: "ok", at: into, from: "mount", id: "beans", path: "beans" });
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

// ── The bean store through `graphReadPath` (bean `9ofm` row D) ──────────────
//
// `bean-store-read.ts` is where eight gates reach the work plan, so the states
// it can report are what each of them acts on. Asserted against a real
// repository and a real marker.
describe("readBeanStore relocates, and refuses", () => {
  /** A repository whose root instance declares `beans`, with a bean graph in it. */
  function beansRepo(storage?: Record<string, unknown>): string {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], ...(storage ? { storage } : {}) }]);
    mkdirSync(join(root, "beans", "defs"), { recursive: true });
    writeFileSync(
      join(root, "beans", "beans.json"),
      JSON.stringify({ name: "fixture", directories: [{ id: "defs", path: "defs", graphKinds: ["bean-defs"] }] }),
    );
    writeFileSync(join(root, "beans", "defs", "x.md"), "---\n# fx-1\ntitle: one\nstatus: todo\ntype: task\n---\nbody\n");
    return root;
  }

  test("not moved: reads the checkout, and finds the bean", () => {
    const root = beansRepo();
    const s = readBeanStore(root);
    expect(s.state).toBe("read");
    if (s.state !== "read") throw new Error("unreachable");
    expect(s.beans.map((b) => b.id)).toEqual(["fx-1"]);
  });

  test("declaration flipped, files still tracked: still reads the checkout", () => {
    const root = beansRepo(TIP);
    git(root, "add", "-A");
    const s = readBeanStore(root);
    expect(s.state).toBe("read");
    if (s.state !== "read") throw new Error("unreachable");
    expect(s.beans.map((b) => b.id)).toEqual(["fx-1"]);
  });

  test("cut over and mounted: reads the MOUNT, and `defs` resolves within it", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const into = join(root, "mounted-beans");
    mkdirSync(join(into, "defs"), { recursive: true });
    writeFileSync(
      join(into, "beans.json"),
      JSON.stringify({ name: "fixture", directories: [{ id: "defs", path: "defs", graphKinds: ["bean-defs"] }] }),
    );
    writeFileSync(join(into, "defs", "y.md"), "---\n# fx-2\ntitle: two\nstatus: todo\ntype: task\n---\nbody\n");
    mount(root, "beans", into);

    const s = readBeanStore(root);
    expect(s.state).toBe("read");
    if (s.state !== "read") throw new Error("unreachable");
    expect(s.dir).toBe(join(into, "defs"));
    expect(s.beans.map((b) => b.id)).toEqual(["fx-2"]);
  });

  test("cut over and NOT mounted: `unreachable`, which is NOT `declared-but-absent`", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const s = readBeanStore(root);
    expect(s.state).toBe("unreachable");
    if (s.state !== "unreachable") throw new Error("unreachable");
    // The remedy is the difference between the two states.
    expect(s.reason).toContain("state:mount");
  });

  test("readBeanFiles THROWS on `unreachable` — five gates read through it and `null` is a pass", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    expect(() => readBeanFiles(root)).toThrow(/cannot read the bean store.*state:mount/s);
    // ...while a repository that genuinely has no store still gets `null`.
    expect(readBeanFiles(repo([]))).toBeNull();
  });
});

// ── The readers that funnel through `resolveBeanDefs` (bean `9ofm` row D) ───
describe("resolveBeanDefs carries the third state, so ten call sites inherit it", () => {
  function beansRepo(storage?: Record<string, unknown>): string {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], ...(storage ? { storage } : {}) }]);
    mkdirSync(join(root, "beans", "defs"), { recursive: true });
    writeFileSync(
      join(root, "beans", "beans.json"),
      JSON.stringify({ name: "fixture", directories: [{ id: "defs", path: "defs", graphKinds: ["bean-defs"] }] }),
    );
    writeFileSync(join(root, "beans", "defs", "x.md"), "---\n# fx-1\ntitle: one\nstatus: todo\ntype: task\n---\nbody\n");
    return root;
  }

  test("not moved: `dir` resolves in the checkout and `unreachable` is unset", () => {
    const root = beansRepo();
    expect(resolveBeanDefs(root)).toEqual({ dir: join(root, "beans", "defs"), declared: true });
    expect(beanDefsDir(root)).toBe(join(root, "beans", "defs"));
  });

  test("mounted: `dir` resolves INSIDE the mount, so `defs` follows the graph", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const into = join(root, "mounted");
    mkdirSync(join(into, "defs"), { recursive: true });
    writeFileSync(join(into, "beans.json"), JSON.stringify({ name: "f", directories: [{ id: "defs", path: "defs", graphKinds: ["bean-defs"] }] }));
    mount(root, "beans", into);
    expect(resolveBeanDefs(root).dir).toBe(join(into, "defs"));
  });

  test("unreachable: `dir` is null but `declared` stays true — the declaration is CORRECT", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const r = resolveBeanDefs(root);
    expect(r.dir).toBeNull();
    expect(r.declared).toBe(true);
    expect(r.unreachable).toContain("state:mount");
  });

  test("beanDefsDir THROWS on unreachable: its `null` already means 'no store' to ten callers", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    expect(() => beanDefsDir(root)).toThrow(/cannot resolve the bean store.*state:mount/s);

    // ...while a repository with NO declaration at all still gets the
    // schema's default path, which is the documented behaviour: an unmigrated
    // folio has no `beans` entry, and that is fine rather than wrong.
    const bare = repo([]);
    expect(beanDefsDir(bare)).toBe(join(bare, "beans", "defs"));

    // `null` is for a bean graph that declares no `bean-defs` NODE — a
    // different question from either of the two above.
    const noNode = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"] }]);
    mkdirSync(join(noNode, "beans"), { recursive: true });
    // At least one directory (the schema requires it), of a kind that is NOT
    // `bean-defs` — that is what "declares no bean-defs node" means.
    writeFileSync(
      join(noNode, "beans", "beans.json"),
      JSON.stringify({ name: "f", directories: [{ id: "notes", path: "notes", graphKinds: ["bean-notes"] }] }),
    );
    expect(beanDefsDir(noNode)).toBeNull();
  });

  test("readBeans inherits it rather than reporting an empty roadmap", () => {
    const root = beansRepo();
    expect(readBeans(root)?.map((b) => b.id)).toEqual(["fx-1"]);
    const cut = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    expect(() => readBeans(cut)).toThrow(/cannot resolve the bean store/);
  });
});

describe("beans-fallback: the CLI-absent reader relocates, and refuses", () => {
  /** A repo declaring `beans`, with `.beans.yml` pointing at `beans/defs`. */
  function fallbackRepo(storage?: Record<string, unknown>): string {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], ...(storage ? { storage } : {}) }]);
    writeFileSync(join(root, ".beans.yml"), "path: beans/defs\nprefix: fx-\nid_length: 4\n");
    return root;
  }

  test("not moved: the `.beans.yml` path, unchanged", () => {
    const root = fallbackRepo();
    const cfg = readStoreConfig(root);
    expect(cfg.dir).toBe("beans/defs");
    expect(fallbackStoreDir(root, cfg)).toEqual({ at: join(root, "beans", "defs") });
  });

  test("mounted: the part inside the graph is REBASED onto the mount, the rest kept", () => {
    const root = fallbackRepo(TIP);
    const into = join(root, "elsewhere");
    mount(root, "beans", into);
    // `beans/defs` under a graph declared at `beans` -> `<mount>/defs`.
    expect(fallbackStoreDir(root, readStoreConfig(root))).toEqual({ at: join(into, "defs") });
  });

  test("unreachable: refused, and `listBeans` THROWS rather than returning []", () => {
    const root = fallbackRepo(TIP);
    const cfg = readStoreConfig(root);
    const w = fallbackStoreDir(root, cfg);
    expect("refused" in w).toBe(true);
    // `[]` here reads as "there is no work" — bean `35nj`'s measured cost.
    expect(() => listBeans(root, cfg)).toThrow(/cannot read the bean store/);
  });

  test("a `.beans.yml` path OUTSIDE the declared graph is left alone, not invented onto it", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    writeFileSync(join(root, ".beans.yml"), "path: somewhere/else\n");
    const cfg = readStoreConfig(root);
    expect(fallbackStoreDir(root, cfg)).toEqual({ at: join(root, "somewhere", "else") });
  });
});

// ── The ENGINE row: where a running process instance is (bean `9ofm` §4) ────
//
// `beans/workflows/` is the store whose whole purpose (bean `vlhk`) is to make
// a turn's position auditable, so "unreachable read as empty" costs more here
// than anywhere else: the session-start sweep's finding for an empty directory
// is **"no instance recorded"** — word for word what it would say if the
// process had never been recorded at all.
describe("the workflow store resolves through the declaration", () => {
  test("not moved: the compiled-in default, which is where the files are", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"] }]);
    mkdirSync(join(root, "beans", "workflows"), { recursive: true });
    expect(workflowDir(root)).toBe(join(root, WORKFLOW_DIR));
  });

  test("mounted: the instances follow the graph, not the repository root", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    const into = join(root, "mounted-wf");
    mkdirSync(join(into, "workflows"), { recursive: true });
    mount(root, "beans", into);
    expect(workflowDir(root)).toBe(join(into, "workflows"));
  });

  test("unreachable: THROWS, because `[]` here is reported as 'no instance recorded'", () => {
    const root = repo([{ id: "beans", path: "beans/", graphKinds: ["beans"], storage: TIP }]);
    expect(() => workflowDir(root)).toThrow(/cannot reach the workflow-state graph[\s\S]*state:mount/);
    expect(() => listInstances(root)).toThrow(/cannot reach the workflow-state graph/);
  });

  test("undeclared: an unmigrated folio keeps the compiled-in default", () => {
    const bare = repo([]);
    expect(workflowDir(bare)).toBe(join(bare, WORKFLOW_DIR));
    expect(listInstances(bare)).toEqual([]);
  });
});
