#!/usr/bin/env bun
/**
 * Time one merge round — the yardstick every regen/gates speed-up reports
 * against (bean `xpcu`, umbrella of `f017`, `v3nf`, `7how`).
 *
 * @module scripts/measure-merge-round
 * @graphNode none — a measurement command over a scratch worktree
 * @covers none — it times commands and judges nothing
 *
 * ## Why a script and not a paragraph
 *
 * Three sessions are cutting the same ~13-minute round from three sides, and
 * a wall time is only comparable to another taken with the same steps, the
 * same two commits and the box's load written beside it. Measured by hand on
 * 2026-10-06 the numbers already disagreed by recipe: "regen" meant one run
 * to one session and the six-step recipe to another. This fixes the steps.
 *
 * ## What it does
 *
 * In a NEW worktree (never the caller's), checked out at `--base`:
 *
 * 1. **warm**: `state:mount`, then the recipe once — so caches are what a PR
 *    branch that has already run it once holds;
 * 2. commits whatever that wrote (in the scratch worktree only);
 * 3. **merge**: merges `--target` and runs the recipe again, timing each step.
 *
 * Two recipes, so a change can be measured against today's:
 *
 * - `manual` — the six steps PRs ran on 2026-10-06:
 *   `git merge`, `state:mount`, `regen`, `qa:working-copy`, `kg:detangle`, `regen`;
 * - `merge-main` — `bun run merge:main` against `--target` (it mounts,
 *   resolves declared conflicts and runs `regen --changed <fork point>`).
 *
 * Each line printed is `<step> rc=<exit> wall=<s> load=<1-min before>→<after>`,
 * and a closing line sums the merge round. The worktree is left in place for
 * inspection and its path printed; nothing outside it is written.
 *
 * Usage:
 *   bun run cat-harness/scripts/measure-merge-round.ts --base <sha> --target <sha> [--recipe manual|merge-main] [--dir <path>]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export type Recipe = "manual" | "merge-main";

/** The steps of one recipe, as argv lists run from the worktree root. `{target}` is substituted. */
export function recipeSteps(recipe: Recipe, phase: "warm" | "merge"): { name: string; argv: string[] }[] {
  const bun = (...a: string[]) => ["bun", "run", ...a];
  if (recipe === "manual") {
    return [
      ...(phase === "merge" ? [{ name: "git-merge", argv: ["git", "-c", "user.email=m@x", "-c", "user.name=m", "merge", "--no-edit", "{target}"] }] : []),
      { name: "state-mount", argv: bun("state:mount") },
      { name: "regen", argv: bun("regen") },
      { name: "qa-working-copy", argv: bun("qa:working-copy") },
      { name: "kg-detangle", argv: bun("kg:detangle") },
      { name: "regen-again", argv: bun("regen") },
    ];
  }
  return phase === "warm"
    ? [
        { name: "state-mount", argv: bun("state:mount") },
        { name: "regen", argv: bun("regen") },
      ]
    : [{ name: "merge-main", argv: bun("cat-harness/scripts/merge-base.ts", "--base", "{target}") }];
}

function load(): string {
  try {
    return readFileSync("/proc/loadavg", "utf-8").split(" ")[0]!;
  } catch {
    return "?";
  }
}

function sh(cwd: string, argv: string[], quiet = true): number {
  const r = spawnSync(argv[0]!, argv.slice(1), { cwd, stdio: quiet ? "ignore" : "inherit" });
  return r.status ?? 1;
}

function main(argv: string[]): number {
  const opt = (n: string) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const base = opt("base");
  const target = opt("target");
  const recipe = (opt("recipe") ?? "manual") as Recipe;
  if (!base || !target || (recipe !== "manual" && recipe !== "merge-main")) {
    console.error("usage: measure-merge-round.ts --base <sha> --target <sha> [--recipe manual|merge-main] [--dir <path>]");
    return 2;
  }
  const repo = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf-8" }).stdout.trim();
  const dir = resolve(opt("dir") ?? join(tmpdir(), `merge-round-${recipe}-${base.slice(0, 8)}-${Date.now()}`));
  if (existsSync(dir)) {
    console.error(`${dir} exists — pass a new --dir`);
    return 2;
  }
  if (sh(repo, ["git", "worktree", "add", "--detach", dir, base]) !== 0) return 2;
  // Submodules from the caller's clone, so a measurement does not time the network.
  for (const sub of ["bootstrap", "bootstrap-tools"]) {
    sh(dir, ["git", "submodule", "update", "--init", "--reference", join(repo, sub), sub]);
  }
  if (sh(dir, ["bun", "install", "--frozen-lockfile"]) !== 0) return 2;
  console.log(`measure-merge-round: recipe ${recipe}, base ${base}, target ${target}, worktree ${dir}, bun ${Bun.version}`);
  let mergeTotal = 0;
  for (const phase of ["warm", "merge"] as const) {
    console.log(`== ${phase}`);
    for (const s of recipeSteps(recipe, phase)) {
      const l0 = load();
      const t0 = performance.now();
      const rc = sh(dir, s.argv.map((a) => (a === "{target}" ? target : a)));
      const wall = Math.round((performance.now() - t0) / 1000);
      if (phase === "merge") mergeTotal += wall;
      console.log(`${s.name} rc=${rc} wall=${wall}s load=${l0}→${load()}`);
      if (rc !== 0 && s.name !== "regen" && s.name !== "regen-again") {
        console.error(`  ${s.name} failed; the round is not comparable. Worktree kept: ${dir}`);
        return 1;
      }
    }
    if (phase === "warm") {
      sh(dir, ["git", "add", "-A"]);
      sh(dir, ["git", "-c", "user.email=m@x", "-c", "user.name=m", "commit", "-qm", "measure: warm round"]);
    }
  }
  console.log(`merge round total: ${mergeTotal}s (recipe ${recipe}). Worktree kept: ${dir}`);
  return 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
