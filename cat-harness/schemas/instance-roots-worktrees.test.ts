/**
 * Instance discovery with git worktrees present (bean `g43f`).
 *
 * A Claude Code session dispatches agents into `<checkout>/.claude/worktrees/<id>/`,
 * each a full checkout that declares the root instance. Two ways a sweep could
 * read one of them as an instance of THIS repository:
 *
 * 1. **Nested** — scanning the checkout and descending into `.claude/`. The
 *    dot-prefix guard already stops this; pinned here so it stays stopped.
 * 2. **Escaped** — `repoRootFor` is `dirname`, so for the ROOT instance of a
 *    worktree it lands on `.claude/worktrees/`, whose every child is a sibling
 *    worktree. Measured 2026-10-03: ten siblings returned as instances.
 *
 * Built from a real `git worktree add` in a temp repository rather than a
 * hand-made `.git` file, so the fixture is the shape git actually produces.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { checkoutRootFor, isForeignCheckout, instanceRootsIn, repoRootFor, rootForScope, siblingScopeFor } from "./cat-harness.js";
import { declareInstance } from "../test/support/instance-fixture.js";
import { skillMdDirs } from "../scripts/known-skills.js";
import { findPublishWorkflows } from "../scripts/pages-bootstrap.js";
import { scan as retiredScan } from "../scripts/check-retired-front-matter.js";
import { auditInstance } from "../scripts/check-subgraph-coverage.js";
import { readSchemaGraph } from "../scripts/schema-graph.js";

/** Whether `p` lies inside `dir` (or is it). */
function inside(p: string, dir: string): boolean {
  const a = resolve(p);
  const d = resolve(dir);
  return a === d || a.startsWith(`${d}/`);
}

let base: string;
let checkout: string;
let wtA: string;
let wtB: string;

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
}

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "g43f-"));
  checkout = join(base, "checkout");
  mkdirSync(join(checkout, "core"), { recursive: true });
  declareInstance(checkout, "root");
  declareInstance(join(checkout, "core"), "core");
  writeFileSync(join(checkout, ".gitignore"), ".claude/worktrees/\n");
  // Repository-level furniture the readers fixed under g43f look for, committed
  // so every worktree carries its own copy.
  mkdirSync(join(checkout, ".github", "workflows"), { recursive: true });
  writeFileSync(join(checkout, ".github", "workflows", "pages.yml"), "steps:\n  - uses: actions/deploy-pages@v4\n");
  mkdirSync(join(checkout, ".claude", "skills", "local"), { recursive: true });
  writeFileSync(join(checkout, ".claude", "skills", "local", "probe-skill.md"), "---\nname: probe-skill\n---\n");
  git(checkout, "init", "-q");
  git(checkout, "add", "-A");
  git(checkout, "commit", "-q", "-m", "fixture");
  wtA = join(checkout, ".claude", "worktrees", "agent-a");
  wtB = join(checkout, ".claude", "worktrees", "agent-b");
  git(checkout, "worktree", "add", "-q", "--detach", wtA);
  git(checkout, "worktree", "add", "-q", "--detach", wtB);
  // A file only the sibling has — the shape of `gen-slice-sqlite.ts` on 2026-10-03.
  mkdirSync(join(wtB, "only-in-sibling"));
  declareInstance(join(wtB, "only-in-sibling"), "only-in-sibling");
});

afterAll(() => {
  rmSync(base, { recursive: true, force: true });
});

describe("instanceRootsIn with git worktrees present", () => {
  test("the main checkout does not see its nested worktrees", () => {
    const found = instanceRootsIn(checkout);
    expect(found).toEqual([checkout, join(checkout, "core")]);
    expect(found.some((p) => p.includes(".claude"))).toBe(false);
  });

  test("a worktree sees its own instances and nothing of its sibling", () => {
    expect(instanceRootsIn(wtA)).toEqual([wtA, join(wtA, "core")]);
  });

  test("the escape: scanning `repoRootFor(<worktree root>)` lists no sibling worktree", () => {
    // `.claude/worktrees/` — every child is a separate checkout.
    expect(repoRootFor(wtA)).toBe(join(checkout, ".claude", "worktrees"));
    expect(instanceRootsIn(repoRootFor(wtA))).toEqual([]);
  });

  test("peer clones with NO repository above them are all instances — the post-split layout", () => {
    // The shape `check:cat-harness-standalone` rehearses: each layer its own
    // `git init`, side by side in a plain directory. There is no enclosing
    // tree for either to be foreign to, so the worktree rule must not fire;
    // when it did (#1955), every reader standing alone found no instance and
    // the standalone gate grew by 85 failures.
    const peers = join(base, "peers");
    for (const name of ["layer-a", "layer-b"]) {
      mkdirSync(join(peers, name), { recursive: true });
      declareInstance(join(peers, name), name);
      git(join(peers, name), "init", "-q");
    }
    expect(instanceRootsIn(peers)).toEqual([join(peers, "layer-a"), join(peers, "layer-b")]);
    expect(siblingScopeFor(join(peers, "layer-a"))).toBe(peers);
    // ...while the same two clones inside a checkout stay foreign, as above.
    expect(instanceRootsIn(join(checkout, ".claude", "worktrees"))).toEqual([]);
  });

  test("siblingScopeFor keeps the root instance inside its own checkout", () => {
    expect(siblingScopeFor(wtA)).toBe(wtA);
    expect(instanceRootsIn(siblingScopeFor(wtA)).some((p) => p.startsWith(wtB))).toBe(false);
  });

  test("a worktree's `.git` is a FILE and marks it foreign; a declared submodule is not", () => {
    expect(isForeignCheckout(wtB)).toBe(true);
    expect(isForeignCheckout(join(checkout, "core"))).toBe(false);

    const sup = join(base, "super");
    mkdirSync(join(sup, "sub"), { recursive: true });
    declareInstance(sup, "super");
    declareInstance(join(sup, "sub"), "sub");
    writeFileSync(join(sup, "sub", ".git"), "gitdir: ../.git/modules/sub\n");
    writeFileSync(join(sup, ".gitmodules"), '[submodule "sub"]\n\tpath = sub\n\turl = https://example.invalid/sub\n');
    expect(isForeignCheckout(join(sup, "sub"))).toBe(false);
    expect(instanceRootsIn(sup)).toEqual([sup, join(sup, "sub")]);
  });
});

describe("checkoutRootFor — repository-level reads stay inside the checkout (g43f)", () => {
  test("THIS checkout — the main one or a nested agent worktree — answers itself", () => {
    const here = resolve(import.meta.dir, "..", "..");
    const harness = join(here, "cat-harness");
    expect(checkoutRootFor(here)).toBe(here);
    // In the monorepo cat-harness is a plain subdirectory, so its checkout is
    // the aggregate. Standing alone (`check:cat-harness-standalone`, or after
    // the split) it is a clone of its own beside its peers, and it IS its
    // checkout — the same `.git` marker the function reads, so both layouts
    // are asserted rather than the monorepo's alone.
    const ownClone = existsSync(join(harness, ".git"));
    expect(checkoutRootFor(harness)).toBe(ownClone ? harness : here);
  });

  test("the root instance of a worktree, of the main checkout, and a nested instance", () => {
    expect(checkoutRootFor(wtA)).toBe(wtA);
    expect(checkoutRootFor(checkout)).toBe(checkout);
    expect(checkoutRootFor(join(wtA, "core"))).toBe(wtA);
    expect(checkoutRootFor(join(checkout, "core"))).toBe(checkout);
  });

  test("a declared submodule's repository is its superproject; a non-git tree keeps `dirname`", () => {
    const sup = join(base, "super2");
    mkdirSync(join(sup, "sub"), { recursive: true });
    mkdirSync(join(sup, ".git"));
    writeFileSync(join(sup, "sub", ".git"), "gitdir: ../.git/modules/sub\n");
    writeFileSync(join(sup, ".gitmodules"), '[submodule "sub"]\n\tpath = sub\n\turl = https://example.invalid/sub\n');
    expect(checkoutRootFor(join(sup, "sub"))).toBe(sup);

    const plain = join(base, "plain");
    mkdirSync(join(plain, "inst"), { recursive: true });
    expect(checkoutRootFor(join(plain, "inst"))).toBe(repoRootFor(join(plain, "inst")));
  });

  test("a submodule whose superproject holds no `.git` is REPORTED, not guessed", () => {
    const broken = join(base, "broken");
    mkdirSync(join(broken, "sub"), { recursive: true });
    writeFileSync(join(broken, "sub", ".git"), "gitdir: ../.git/modules/sub\n");
    writeFileSync(join(broken, ".gitmodules"), '[submodule "sub"]\n\tpath = sub\n');
    expect(() => checkoutRootFor(join(broken, "sub"))).toThrow(/cannot determine the checkout/);
  });

  test("rootForScope: a `scope: \"repository\"` path on the root instance resolves inside it", () => {
    expect(rootForScope(wtA, "repository")).toBe(wtA);
    expect(rootForScope(join(wtA, "core"), "repository")).toBe(wtA);
  });

  test("pages-bootstrap reads the worktree's own `.github/workflows`", () => {
    expect(findPublishWorkflows(wtA)).toEqual(["pages.yml"]);
  });

  test("known-skills never reads `.claude/skills` from outside the checkout", () => {
    // The ROOT instance reads its OWN checkout's `.claude/skills` (owner,
    // 2026-10-04, bean g43f); a sibling's `.claude/skills` must never appear.
    const seed = join(checkout, ".claude", "worktrees", ".claude", "skills", "leak");
    mkdirSync(seed, { recursive: true });
    writeFileSync(join(seed, "leak.md"), "---\nname: leak\n---\n");
    try {
      expect(skillMdDirs(wtA).some((p) => p.includes("leak"))).toBe(false);
      for (const p of skillMdDirs(join(wtA, "core"))) expect(inside(join(wtA, "core", ...p), wtA)).toBe(true);
    } finally {
      rmSync(join(checkout, ".claude", "worktrees", ".claude"), { recursive: true, force: true });
    }
  });

  test("the root instance reads its own `.claude/skills`, and a loader-stub group is not a group of skills (g43f)", () => {
    const own = join(wtA, ".claude", "skills");
    mkdirSync(join(own, "real"), { recursive: true });
    writeFileSync(join(own, "real", "a-real-skill.md"), "---\nname: a-real-skill\n---\n");
    mkdirSync(join(own, "stub-only"), { recursive: true });
    writeFileSync(join(own, "stub-only", "SKILL.md"), "---\nname: stub-only\n---\n");
    try {
      const dirs = skillMdDirs(wtA).map((p) => p.join("/"));
      expect(dirs).toContain(".claude/skills/real");
      expect(dirs).not.toContain(".claude/skills/stub-only");
    } finally {
      rmSync(join(own, "real"), { recursive: true, force: true });
      rmSync(join(own, "stub-only"), { recursive: true, force: true });
    }
  });

  test("check-retired-front-matter sweeps only inside the worktree", () => {
    const { roots } = retiredScan(wtA);
    expect(roots).toContain(join(wtA, ".claude", "skills"));
    for (const r of roots) expect(inside(r, wtA)).toBe(true);
  });

  test("check-subgraph-coverage recognises the worktree's root instance AS the root", () => {
    // Its default `repoRoot` is what decides `isRoot`; `dirname` made it false
    // for the one instance the guard exists for. Observable as no readme
    // finding being raised against the repository root's own README rule.
    expect(() => auditInstance(wtA)).not.toThrow();
    expect(auditInstance(wtA)).toEqual(auditInstance(wtA, wtA));
  });

  test("schema-graph relativises against the worktree, never `.claude/worktrees/`", () => {
    mkdirSync(join(wtA, "schemas"), { recursive: true });
    writeFileSync(join(wtA, "schemas", "probe.ts"), "export interface Probe { a: string }\n");
    const g = readSchemaGraph(wtA);
    expect(g).not.toBeNull();
    // `dirname` made this `agent-a/schemas/probe.ts` — a path into `.claude/worktrees/`.
    expect(g!.modules.map((m) => m.module)).toContain("schemas/probe.ts");
  });
});
