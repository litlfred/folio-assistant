#!/usr/bin/env bun
/**
 * Run the gates on the COMBINED state — this branch merged with the current
 * base — before a merge. Bean `nytj`.
 *
 * ## The state that breaks is the one neither party evaluates
 *
 * A pull request's CI tests the branch merged with the base AS IT WAS WHEN THE
 * BRANCH WAS PUSHED. Anything that lands on the base afterwards is tested in
 * combination by nobody. Three times on 2026-09-23 a generated measurement
 * (`kg:detangle`, `kg:audit`) was green on the branch, green on `main`, merged
 * without a textual conflict — and was stale on the result, because each side's
 * committed measurement counted only its own edits. `git merge-tree` said
 * "clean" every time: a clean TEXT merge is not a clean STATE.
 *
 * The structural fix is the merge queue (`merge_group:` on the gating
 * workflows), which tests exactly the commit that will land. This is the half
 * an agent can run itself, before asking anyone to merge: build the merge in a
 * throwaway worktree and run the full `bun run gates` there.
 *
 * ## Three outcomes, never two
 *
 * - exit 0 — the merged tree passes every gate;
 * - exit 1 — the merge conflicts (files listed), or a gate fails on the
 *   merged tree: this branch needs the base merged in and regenerated;
 * - exit 2 — COULD NOT DETERMINE (the base could not be fetched, the worktree
 *   could not be built, or the worktree's corpus is distorted — see the
 *   `node_modules` guard below, bean `qook`). Never reported as clean.
 *
 * The working copy is never touched: the merge happens in a temporary worktree
 * that is removed on every path out, including failure.
 *
 * Usage:
 *   bun run check:merged              # base = main
 *   bun run check:merged -- --base <branch>
 *   bun run check:merged -- --against <commit>   # a FIXED base, no fetch —
 *     for replaying a past pair, which is how this script was falsified
 *
 * @module scripts/check-merged
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..");

function git(args: string[], cwd = REPO): { ok: boolean; out: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8" });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
}

/** The base branch: `--base <name>`, else `main`. */
export function baseFrom(argv: readonly string[]): string {
  const i = argv.indexOf("--base");
  return i >= 0 && argv[i + 1] ? argv[i + 1]! : "main";
}

/** `--against <ref>`: a fixed base commit, used as-is and never fetched. */
export function againstFrom(argv: readonly string[]): string | undefined {
  const i = argv.indexOf("--against");
  return i >= 0 && argv[i + 1] ? argv[i + 1]! : undefined;
}

function main(): number {
  const against = againstFrom(process.argv);
  const base = baseFrom(process.argv);
  let target: string;
  if (against) {
    const r = git(["rev-parse", "--verify", `${against}^{commit}`]);
    if (!r.ok) {
      console.error(`::error::check:merged: --against ${against} is not a commit here — COULD NOT DETERMINE.`);
      return 2;
    }
    target = r.out;
  } else {
    const fetched = git(["fetch", "-q", "origin", base]);
    if (!fetched.ok) {
      console.error(`::error::check:merged: could not fetch origin/${base} — COULD NOT DETERMINE, not clean.\n${fetched.out}`);
      return 2;
    }
    target = `origin/${base}`;
  }

  const head = git(["rev-parse", "HEAD"]).out;
  const baseSha = git(["rev-parse", target]).out;
  const behind = git(["rev-list", "--count", `HEAD..${baseSha}`]).out;
  console.log(`check:merged — HEAD ${head.slice(0, 8)} with ${against ? "fixed base" : `origin/${base}`} ${baseSha.slice(0, 8)} (${behind} commit(s) not yet in this branch)`);

  // The worktree is named after THIS checkout's directory. Some tests assert
  // the repository directory's name (`folio-root.test.ts`: it must end in
  // `folio-assistant`), which CI satisfies because the runner clones into
  // `…/folio-assistant/folio-assistant`. A worktree called anything else fails
  // them on a clean tree — found by this script's own falsification run, where
  // two such failures stood beside the one real one. A false red is worse than
  // no check: it teaches everyone to ignore it.
  const dir = mkdtempSync(join(tmpdir(), "check-merged-"));
  const wt = join(dir, basename(REPO));
  try {
    const added = git(["worktree", "add", "-q", "--detach", wt, head]);
    if (!added.ok) {
      console.error(`::error::check:merged: could not build a worktree — COULD NOT DETERMINE.\n${added.out}`);
      return 2;
    }

    const merged = git(["merge", "-q", "--no-edit", "--no-verify", baseSha], wt);
    if (!merged.ok) {
      const conflicts = git(["diff", "--name-only", "--diff-filter=U"], wt).out;
      if (conflicts) {
        console.error(`\n✗ the merge CONFLICTS in:\n${conflicts.split("\n").map((f) => `  · ${f}`).join("\n")}`);
        console.error(`\nMerge the base into this branch, regenerate generated files with the repo's tooling, and re-run.`);
        return 1;
      }
      console.error(`::error::check:merged: the merge failed without a conflict — COULD NOT DETERMINE.\n${merged.out}`);
      return 2;
    }

    // Dependencies: reuse the checkout's when the merge leaves the lockfile
    // alone; install from the lockfile when it does not, because a stale
    // `node_modules` is the kind of green this script exists to refuse.
    const lockChanged = !git(["diff", "--quiet", head, "HEAD", "--", "bun.lock"], wt).ok;
    if (lockChanged || !existsSync(join(REPO, "node_modules"))) {
      console.log("  dependencies: the merge changes bun.lock — installing from it");
      const inst = spawnSync("bun", ["install", "--frozen-lockfile"], { cwd: wt, stdio: "inherit" });
      if (inst.status !== 0) {
        console.error("::error::check:merged: bun install failed on the merged tree");
        return 1;
      }
    } else {
      symlinkSync(join(REPO, "node_modules"), join(wt, "node_modules"), "dir");
      // The symlink must be INVISIBLE to git, and for five days it was not.
      //
      // Bean `qook`. `.gitignore` read `node_modules/`, and git's trailing
      // slash means DIRECTORY ONLY. A symlink is not a directory, so
      // `git ls-files --others --exclude-standard` returned it and
      // `gitCorpus` handed every consumer one phantom entry. On commit
      // `0d3c49c8` that was 13667 paths here against 13666 in a real
      // checkout — and `kg:detangle:check` went from "29 pinned current" to
      // five files STALE. This script then reported two unrelated branches'
      // merged trees defective when no real checkout of either was.
      //
      // So the environment is verified before the sweep, not assumed. A
      // distorted corpus is COULD NOT DETERMINE (exit 2), never a red: a
      // false refusal from a tool whose job is to refuse teaches everyone to
      // stop running it, and then it is not there for the merge it exists for.
      const ignored = git(["check-ignore", "-q", "node_modules"], wt);
      if (!ignored.ok) {
        console.error(
          "::error::check:merged: the `node_modules` symlink is NOT ignored in the worktree, " +
            "so every corpus-derived gate would measure one phantom entry — COULD NOT DETERMINE.\n" +
            "Bean `qook`: `.gitignore` must ignore `node_modules` with NO trailing slash, or git " +
            "treats the pattern as directory-only and the symlink leaks into `git ls-files --others`.",
        );
        return 2;
      }
    }

    console.log("  running `bun run gates` on the merged tree…\n");
    const gates = spawnSync("bun", ["run", "gates"], { cwd: wt, stdio: "inherit" });
    if (gates.status !== 0) {
      console.error(`\n✗ the MERGED tree fails the gates, though this branch may pass alone.`);
      console.error(`Merge the base into the branch, regenerate what the failing gates name, run \`bun run gates\`, push.`);
      return 1;
    }
    console.log(`\n✓ this branch merged with ${baseSha.slice(0, 8)} passes every gate`);
    return 0;
  } finally {
    git(["worktree", "remove", "--force", wt]);
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) process.exit(main());
