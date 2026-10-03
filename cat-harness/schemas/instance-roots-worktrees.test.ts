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
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { isForeignCheckout, instanceRootsIn, repoRootFor, siblingScopeFor } from "./cat-harness.js";
import { declareInstance } from "../test/support/instance-fixture.js";

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
