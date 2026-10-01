#!/usr/bin/env bun
/**
 * Merge the base branch in, resolving ONLY the conflicts a declared pattern
 * covers, and prove the result with the gate set (bean `y7b3`, issue #1707).
 *
 * @module scripts/merge-base
 * @graphNode none — a maintenance command over the working tree
 * @covers none — a merge step: it changes the tree and judges no declared graph
 *
 * The executable form of `processes/merge-base.bpmn`, which `Task_PrepareMerge`
 * in `code-change-review.bpmn` calls. The patterns, their strategies and why
 * each is safe are in `merge-conflict-patterns.ts` and the skill of that name.
 *
 * ## All or nothing
 *
 * Every conflicted path is classified BEFORE anything is changed. If one is
 * refused — authored, or named by no pattern — the merge is ABORTED and the
 * tree is left exactly as it was, with the refused paths listed. A half-resolved
 * merge reads as progress and is not.
 *
 * ## Proved, not assumed
 *
 * After resolving, `bun run regen` asks every check the CI workflow runs and
 * runs each stale one's writer until the tree settles. A non-zero exit
 * (`unrepaired`, or a check with no writer) aborts the merge too: a resolution
 * the gates cannot reproduce is not a resolution.
 *
 * Usage:
 *   bun run merge:main                 # merge origin/main, resolve, regenerate, commit
 *   bun run merge:main -- --dry-run    # classify the conflicts, change nothing
 *   bun run cat-harness/scripts/merge-base.ts --base origin/<branch>
 *   bun run cat-harness/scripts/merge-base.ts --root <worktree> --base <sha> --dry-run
 *
 * Exit 0 merged (or already up to date) · 1 refused or unproven, tree restored ·
 * 2 could not start (dirty tree, no such base).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";
import { classify, resolveGeneratedRegions, type Classified } from "./merge-conflict-patterns.js";

export interface Plan {
  resolvable: Classified[];
  refused: Classified[];
}

/** Split conflicted paths into what a pattern resolves and what it refuses. */
export function plan(paths: string[]): Plan {
  const all = paths.map((p) => classify(p));
  return {
    resolvable: all.filter((c) => c.strategy !== "refuse"),
    refused: all.filter((c) => c.strategy === "refuse"),
  };
}

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function describe(c: Classified): string {
  return c.pattern ? `${c.path}  [${c.pattern.id}: ${c.strategy}]` : `${c.path}  [no declared pattern]`;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const dryRun = args.includes("--dry-run");
  const base = opt("--base") ?? "origin/main";
  // `--root` lets the command run against another checkout (a worktree at an
  // old commit, for a replay of a historical merge) without copying itself in.
  const root = opt("--root") ?? repoRootFor(join(import.meta.dir, ".."));

  // Untracked files too: the final `git add -A` must stage only what the merge
  // and its regeneration wrote, never somebody's scratch file.
  if (git(root, "status", "--porcelain") !== "") {
    console.error("merge-base: the working tree is not clean (changes or untracked files); commit, stash or remove them first.");
    process.exit(2);
  }
  const remote = base.includes("/") ? base.split("/")[0]! : undefined;
  if (remote) spawnSync("git", ["-C", root, "fetch", "-q", remote, base.slice(remote.length + 1)], { stdio: "inherit" });
  try {
    git(root, "rev-parse", "--verify", `${base}^{commit}`);
  } catch {
    console.error(`merge-base: no such base ${base}`);
    process.exit(2);
  }

  const merged = spawnSync("git", ["-C", root, "merge", "--no-ff", "--no-commit", base], { encoding: "utf-8" });
  const conflicted = git(root, "diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
  if (merged.status === 0 && conflicted.length === 0) {
    const pending = git(root, "status", "--porcelain", "--untracked-files=no") !== "";
    if (!pending) {
      console.log(`merge-base: already up to date with ${base}`);
      process.exit(0);
    }
  }

  const p = plan(conflicted);
  console.log(`merge-base: ${conflicted.length} conflicted path(s) merging ${base}`);
  for (const c of p.resolvable) console.log(`  ✓ ${describe(c)}`);
  for (const c of p.refused) console.log(`  ✗ ${describe(c)}${c.pattern ? ` — ${c.pattern.why}` : ""}`);

  // `git merge --abort` refuses once regen has written unstaged changes
  // ("not uptodate. Cannot merge"), and this used to print "tree restored"
  // over a half-merged tree regardless. The restore is now CHECKED; when it
  // did not happen the person is told, and nothing destructive runs unasked.
  const abort: (why: string) => never = (why) => {
    spawnSync("git", ["-C", root, "merge", "--abort"], { stdio: "inherit" });
    const merging = spawnSync("git", ["-C", root, "rev-parse", "-q", "--verify", "MERGE_HEAD"]).status === 0;
    const restored = !merging && !git(root, "status", "--porcelain");
    console.error(restored
      ? `\nmerge-base: ABORTED, tree restored — ${why}`
      : `\nmerge-base: ABORTED, but the merge is still in progress and the tree is NOT restored — ${why}\n` +
        "  Everything changed since the clean start is this run's own: either finish the merge by hand,\n" +
        "  or discard it yourself with `git reset --merge` (check `git status` first).");
    process.exit(1);
  };

  if (dryRun) {
    if (conflicted.length || merged.status !== 0 || git(root, "status", "--porcelain", "--untracked-files=no")) {
      spawnSync("git", ["-C", root, "merge", "--abort"], { stdio: "ignore" });
    }
    console.log(p.refused.length ? "\n--dry-run: would REFUSE (see ✗ above); nothing changed." : "\n--dry-run: would resolve all of them; nothing changed.");
    process.exit(p.refused.length ? 1 : 0);
  }
  if (p.refused.length) abort(`${p.refused.length} conflict(s) need a person (✗ above)`);

  // qa sidecars first: that command reads git's stages and stages what it resolves.
  if (p.resolvable.some((c) => c.strategy === "qa-sidecar")) {
    const qa = spawnSync("bun", ["run", "qa:resolve-conflicts"], { cwd: root, stdio: "inherit" });
    const still = git(root, "diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
    const qaLeft = p.resolvable.filter((c) => c.strategy === "qa-sidecar" && still.includes(c.path));
    if (qa.status !== 0 || qaLeft.length) abort(`qa:resolve-conflicts left ${qaLeft.length} sidecar(s) conflicted`);
  }
  for (const c of p.resolvable) {
    if (c.strategy === "take-base") {
      git(root, "checkout", "--theirs", "--", c.path);
    } else if (c.strategy === "generated-regions") {
      const text = readFileSync(join(root, c.path), "utf-8");
      const resolved = resolveGeneratedRegions(text);
      if (resolved === undefined) abort(`${c.path}: a hunk lies outside a generated region (authored text conflicts)`);
      writeFileSync(join(root, c.path), resolved);
    } else continue;
    git(root, "add", "--", c.path);
  }

  console.log("\nmerge-base: regenerating, and asking every gate the CI workflow runs …");
  const regen = spawnSync("bun", ["run", "regen"], { cwd: root, stdio: "inherit" });
  if (regen.status !== 0) abort("the gate set could not reproduce the resolution (regen reported unrepaired checks)");
  git(root, "add", "-A");
  git(root, "commit", "-q", "--no-edit");
  console.log(`\nmerge-base: merged ${base}; ${p.resolvable.length} conflict(s) resolved by declared pattern, regenerated and proved.`);
}
