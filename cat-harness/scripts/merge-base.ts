#!/usr/bin/env bun
/**
 * Merge the base branch in, resolving ONLY the conflicts a declared pattern
 * covers, and prove the result with the gate set (bean `y7b3`, issue #1707).
 *
 * @module scripts/merge-base
 * @graphNode none — a maintenance command over the working tree
 * @covers none — a merge step: it changes the tree and judges no declared graph
 *
 * The executable form of `processes/sdlc/merge-base.bpmn`, which `Task_PrepareMerge`
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
 *   bun run cat-harness/scripts/merge-base.ts --root <worktree> --base <sha> --no-regen  # a train member
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

// `maxBuffer` well above Node's 1 MB default: `ls-tree -r` / `ls-files` of this
// repository are over 2 MB, and the lost-file guard (bean `vsv7`) reads both
// parents' full lists. At the default it threw ENOBUFS on its first live run,
// 2026-10-04, after regen had finished — the merge was left uncommitted.
const GIT_MAX_BUFFER = 256 * 1024 * 1024;

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: GIT_MAX_BUFFER }).trim();
}

/** Check each submodule out at the commit the index pins. */
function syncSubmodules(root: string): void {
  spawnSync("git", ["-C", root, "submodule", "update", "--init", "--recursive"], { stdio: "inherit" });
}

/**
 * What a take-base resolution does with one conflicted path, from the stages
 * git holds for it (`ls-files -u`: 1 base, 2 ours, 3 theirs).
 *
 * Measured 2026-10-02 on #1805: main DELETED generated files (docs-auto pages
 * under a folded instance) that the branch had modified. There is no stage 3,
 * so `checkout --theirs` threw "does not have their version" and the run ended
 * in "Error". Taking the base's side of a deletion IS the deletion: generated
 * output the base removed stays removed, and regen recreates anything still
 * produced. The other direction (deleted on the branch, changed on the base)
 * has stage 3 and takes it, as before.
 */
export function takeBaseAction(stages: ReadonlySet<number>): "theirs" | "delete" | "resolved" {
  // No stages at all is NOT a deletion: the path was already resolved by an
  // earlier step (`qa:resolve-conflicts` runs first and stages what it
  // resolves). Reading "no stage 3" there as "the base deleted it" `git rm`ed
  // two generated kg-export sidecars on #1955, 2026-10-03, while the run still
  // reported proved (bean `vsv7`).
  if (stages.size === 0) return "resolved";
  return stages.has(3) ? "theirs" : "delete";
}

/** The stages git holds for an unmerged path. */
export function unmergedStages(root: string, path: string): Set<number> {
  const out = new Set<number>();
  for (const line of git(root, "ls-files", "-u", "--", path).split("\n")) {
    const stage = Number(line.split(/\s+/)[2]);
    if (stage) out.add(stage);
  }
  return out;
}

/** Take the base's side of `path`, deletion included; stages the result. */
export function takeBase(root: string, path: string): void {
  const action = takeBaseAction(unmergedStages(root, path));
  if (action === "resolved") return;
  if (action === "delete") {
    git(root, "rm", "-q", "--", path);
  } else {
    git(root, "checkout", "--theirs", "--", path);
    git(root, "add", "--", path);
  }
}

/**
 * Paths both parents hold that the merged result does not (bean `vsv7`, done-when 2).
 *
 * A merge may drop a file one side deleted; it never drops one BOTH sides
 * still have. On #1955 (2026-10-03) a resolver mis-step `git rm`ed two such
 * generated sidecars and the run still said "proved", because no gate asks
 * whether a file vanished. This is that question, asked of the index just
 * before the merge commit. Pure over three path lists.
 */
export function lostOnBothSides(ours: readonly string[], theirs: readonly string[], result: readonly string[]): string[] {
  const kept = new Set(result);
  const theirsSet = new Set(theirs);
  return ours.filter((f) => theirsSet.has(f) && !kept.has(f)).sort();
}

/** Abort (tree restored) when the staged merge lost a path both parents hold. */
function refuseLostFiles(root: string, abort: (why: string) => never): void {
  const list = (ref: string) => git(root, "ls-tree", "-r", "--name-only", ref).split("\n").filter(Boolean);
  const lost = lostOnBothSides(list("HEAD"), list("MERGE_HEAD"), git(root, "ls-files").split("\n").filter(Boolean));
  if (lost.length) {
    for (const f of lost) console.error(`  ✗ ${f}  [present on both sides, absent from the merge]`);
    abort(`${lost.length} file(s) both sides hold would be deleted by this merge (bean vsv7)`);
  }
}

function describe(c: Classified): string {
  return c.pattern ? `${c.path}  [${c.pattern.id}: ${c.strategy}]` : `${c.path}  [no declared pattern]`;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const dryRun = args.includes("--dry-run");
  // `--no-regen` is for a merge TRAIN: several branches merged one after
  // another, then ONE `bun run regen` over the result. Regenerating after each
  // member cost 5-13 min apiece (measured 2026-10-02), and every member's
  // generated files are rewritten by the final regen anyway. Each member's
  // merge commit is NOT proved on its own; the train is proved at its end.
  const noRegen = args.includes("--no-regen");
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
  //
  // Staging first is what makes the abort succeed: `merge --abort` is
  // `reset --merge`, which keeps (and so refuses over) index/worktree
  // differences, and resets everything that is staged. The run started from
  // a clean tree with no untracked files (checked above), so every change
  // present is this run's own and staging it loses nothing. Measured
  // 2026-10-01 on #1754: unstaged regen output left the merge in progress;
  // `add -A` then `merge --abort` restored the tree to 0 changes.
  const abort: (why: string) => never = (why) => {
    spawnSync("git", ["-C", root, "add", "-A"], { stdio: "inherit" });
    spawnSync("git", ["-C", root, "merge", "--abort"], { stdio: "inherit" });
    syncSubmodules(root); // back to the branch's pins, or the tree reads as dirty
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
    // A README one side deleted has no hunks to resolve: it is a take-base
    // case whichever pattern named it.
    const oneSided = c.strategy === "generated-regions" && unmergedStages(root, c.path).size < 3;
    if (c.strategy === "take-base" || oneSided) {
      takeBase(root, c.path);
      continue;
    } else if (c.strategy === "generated-regions") {
      const text = readFileSync(join(root, c.path), "utf-8");
      const resolved = resolveGeneratedRegions(text);
      if (resolved === undefined) abort(`${c.path}: a hunk lies outside a generated region (authored text conflicts)`);
      writeFileSync(join(root, c.path), resolved);
    } else continue;
    git(root, "add", "--", c.path);
  }

  if (noRegen) {
    git(root, "add", "-A");
    refuseLostFiles(root, abort);
    git(root, "commit", "-q", "--no-edit");
    console.log(`\nmerge-base: merged ${base}; ${p.resolvable.length} conflict(s) resolved by declared pattern. NOT regenerated (--no-regen): run \`bun run regen\` once over the train.`);
    process.exit(0);
  }

  // The merge moves the submodule GITLINKS but not their checkouts, so without
  // this regen judges the merged tree against the branch's old submodule
  // content. Measured 2026-10-01 on #1754: main had bumped `bootstrap` and
  // `bootstrap-tools`, and `kg:audit:all:check` and
  // `translate-bpmn:bootstrap:check` came back "unrepaired" — a defect in the
  // tool's view, not in the merge.
  syncSubmodules(root);
  // Likewise the dependencies: when the base changed `bun.lock`, regen must
  // run against the merged lockfile, not the branch's — otherwise a writer
  // that needs a dependency the base added reads as "unrepaired". Measured as
  // a risk when this command started running on old branches in CI
  // (`merge-main.yml`, 2026-10-02). `node_modules/` is ignored, so the tree
  // stays clean for the final `add -A`.
  if (spawnSync("git", ["-C", root, "diff", "--cached", "--quiet", "HEAD", "--", "bun.lock", "package.json"]).status !== 0) {
    const inst = spawnSync("bun", ["install", "--frozen-lockfile"], { cwd: root, stdio: "inherit" });
    if (inst.status !== 0) abort("bun install against the merged lockfile failed");
  }
  console.log("\nmerge-base: regenerating, and asking every gate the CI workflow runs …");
  const regen = spawnSync("bun", ["run", "regen"], { cwd: root, stdio: "inherit" });
  if (regen.status !== 0) abort("the gate set could not reproduce the resolution (regen reported unrepaired checks)");
  git(root, "add", "-A");
  refuseLostFiles(root, abort);
  git(root, "commit", "-q", "--no-edit");
  console.log(`\nmerge-base: merged ${base}; ${p.resolvable.length} conflict(s) resolved by declared pattern, regenerated and proved.`);
}
