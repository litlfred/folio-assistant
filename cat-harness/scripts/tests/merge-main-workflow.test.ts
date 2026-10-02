/**
 * The merge-main bot runs MAIN's `merge:main`, against a branch older than it
 * (issue #1832, bean `d33q`).
 *
 * ## The defect this pins
 *
 * `merge-main.yml` ran `bun run merge:main` inside the PR's checkout, so it ran
 * whatever the BRANCH carried. Every branch cut before the script reached
 * `main` (2026-10-01) carried nothing — `error: Script not found
 * "merge:main"` — and run 36970916099 posted "Could not run (exit 1)" on all
 * four PRs it selected. The branches that need the bot most are exactly the
 * old ones, so this was the bot failing at its whole job.
 *
 * ## Two halves
 *
 * - **Static** — the workflow is PARSED, as `staging-cleanup.test.ts` parses
 *   `feature-staging.yml`: which checkout the merge step runs from, at which
 *   ref, and the guarantees around the push and the comment.
 * - **Executed** — the merge step's own `run:` block, lifted out of the YAML,
 *   is run under bash against a fixture repository whose branch predates the
 *   script, laid out the way the workflow's checkouts lay it out. This is the
 *   half that fails on the old workflow for the reason the bot failed in CI,
 *   rather than for a spelling the static half happens to look for.
 *
 * @module scripts/tests/merge-main-workflow.test
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "bun:test";
import { parse } from "yaml";

import { repoRootFor } from "../../schemas/cat-harness.js";

const REPO = repoRootFor(resolve(import.meta.dir, "..", ".."));
const WORKFLOW = join(REPO, ".github/workflows/merge-main.yml");

interface Step {
  name?: string;
  id?: string;
  if?: string;
  run?: string;
  uses?: string;
  env?: Record<string, string>;
  with?: Record<string, unknown>;
}

const wf = parse(readFileSync(WORKFLOW, "utf-8")) as { jobs: Record<string, { steps: Step[] }> };
const steps = wf.jobs.merge!.steps;
const checkouts = steps.filter((s) => s.uses?.startsWith("actions/checkout"));
const prCheckout = checkouts.find((s) => String(s.with?.ref ?? "").includes("steps.pr.outputs.ref"));
const toolCheckout = checkouts.find((s) => s.with?.ref === "main");
const mergeStep = steps.find((s) => s.id === "merge");
const toolStep = steps.find((s) => s.id === "tool");
const pushStep = steps.find((s) => s.id === "push");
const commentStep = steps.find((s) => (s.name ?? "").startsWith("Comment"));
const dir = (s: Step | undefined): string => String(s?.with?.path ?? ".").replace(/\/+$/, "");

describe("merge-main.yml runs main's tool, not the branch's", () => {
  it("checks main out beside the PR, with the submodules the platform imports", () => {
    expect(prCheckout).toBeDefined();
    expect(toolCheckout).toBeDefined();
    // A checkout without submodules fails at module load (bootstrap-tools/) —
    // the defect PR #1828 fixed in feature-staging.yml.
    expect(toolCheckout!.with?.submodules).toBeTruthy();
    // Siblings, never nested: merge-base refuses an untracked file, and a
    // tool tree inside the PR's worktree would be one.
    const [p, t] = [dir(prCheckout), dir(toolCheckout)];
    expect(p).not.toBe(".");
    expect(t).not.toBe(".");
    expect(p.startsWith(`${t}/`) || t.startsWith(`${p}/`) || p === t).toBe(false);
  });

  it("invokes merge:main from the tool checkout, rooted at the PR checkout", () => {
    const run = mergeStep?.run ?? "";
    expect(run).toMatch(new RegExp(`bun run --cwd "\\$GITHUB_WORKSPACE/${dir(toolCheckout)}" merge:main\\b`));
    expect(run).toContain(`--root "$GITHUB_WORKSPACE/${dir(prCheckout)}"`);
    // ...and only once the tool is known to load.
    expect(mergeStep?.if).toContain("steps.tool.outputs.status == 'ok'");
  });

  it("keeps the guarantees: fast-forward push of a proved merge only", () => {
    expect(pushStep?.if).toBe("steps.merge.outputs.merged == 'true'");
    const code = (pushStep?.run ?? "").split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
    expect(code).not.toMatch(/--force|\s-f\s|\+HEAD/);
    expect(pushStep?.run).toContain(`git -C ${dir(prCheckout)} push origin "HEAD:refs/heads/$REF"`);
  });

  it("comments once, and says 'tool missing' apart from a merge or regen failure", () => {
    const run = commentStep?.run ?? "";
    expect(commentStep?.if).toContain("steps.tool.outcome != 'skipped'");
    expect(commentStep?.env?.TOOL).toBe("${{ steps.tool.outputs.status }}");
    // The tool branch comes FIRST: nothing was attempted, so no merge state applies.
    const toolAt = run.indexOf('if [ "$TOOL" != ok ]');
    expect(toolAt).toBeGreaterThan(-1);
    for (const later of ['"$MERGED" = true', "-n \"$refused\"", "-n \"$unrepaired\"", "Could not run"]) {
      expect(run.indexOf(later)).toBeGreaterThan(toolAt);
    }
    expect(run).toContain("merge tool is");
    expect(run).toContain("not in this branch");
    // Edited in place, found by its marker.
    expect(run).toContain("startswith(\\\"$MARKER\\\")");
    expect(run).toContain("gh api -X PATCH");
  });
});

/* ------------------------------------------------------------------------ */

const tmp = mkdtempSync(join(tmpdir(), "merge-main-bot-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/**
 * An origin whose branch `old` was cut before `main` gained the scripts —
 * the shape of #1777. The fixture's `main` gains `regen` (which merge-base
 * spawns in the merged tree) but deliberately NOT `merge:main`: the bot must
 * not depend on the PR's tree naming the tool at all.
 */
function fixture(): { origin: string } {
  const seed = join(tmp, "seed");
  mkdirSync(seed);
  git(seed, "init", "-q", "-b", "main");
  git(seed, "config", "user.email", "t@example.com");
  git(seed, "config", "user.name", "t");
  writeFileSync(join(seed, "package.json"), JSON.stringify({ name: "fixture", scripts: { test: "true" } }, null, 2) + "\n");
  writeFileSync(join(seed, "a.txt"), "a\n");
  git(seed, "add", "-A");
  git(seed, "commit", "-qm", "base");
  git(seed, "checkout", "-qb", "old");
  writeFileSync(join(seed, "branch.txt"), "the branch's own work\n");
  git(seed, "add", "-A");
  git(seed, "commit", "-qm", "branch work, before merge:main existed");
  git(seed, "checkout", "-q", "main");
  writeFileSync(
    join(seed, "package.json"),
    JSON.stringify({ name: "fixture", scripts: { test: "true", regen: "echo regen-ok" } }, null, 2) + "\n",
  );
  writeFileSync(join(seed, "main.txt"), "main moved\n");
  git(seed, "add", "-A");
  git(seed, "commit", "-qm", "main moves on");
  const origin = join(tmp, "origin.git");
  execFileSync("git", ["clone", "-q", "--bare", seed, origin]);
  return { origin };
}

describe("the merge step, executed against a branch older than the script", () => {
  it("merges main into the old branch and reports merged=true", () => {
    expect(mergeStep).toBeDefined();
    const run = mergeStep!.run!;
    // The block is run as written; an expression would need the runner.
    expect(run).not.toContain("${{");

    const { origin } = fixture();
    const ws = join(tmp, "workspace");
    mkdirSync(ws);
    // Lay the trees out where the workflow's checkouts put them.
    const prDir = join(ws, dir(prCheckout));
    execFileSync("git", ["clone", "-q", "-b", "old", origin, prDir]);
    expect(JSON.parse(readFileSync(join(prDir, "package.json"), "utf-8")).scripts["merge:main"]).toBeUndefined();
    if (toolCheckout) symlinkSync(REPO, join(ws, dir(toolCheckout)));

    const runnerTemp = join(tmp, "runner");
    mkdirSync(runnerTemp);
    const out = join(runnerTemp, "output");
    writeFileSync(out, "");
    const step = (script: string) =>
      spawnSync("bash", ["-e", "-c", script], {
        cwd: ws,
        encoding: "utf-8",
        env: { ...process.env, GITHUB_WORKSPACE: ws, RUNNER_TEMP: runnerTemp, GITHUB_OUTPUT: out },
        timeout: 120_000,
      });
    // The preflight, where the workflow has one, gates the merge step.
    if (toolStep?.run) {
      const pre = step(toolStep.run);
      expect(pre.status).toBe(0);
      expect(readFileSync(out, "utf-8")).toBe("status=ok\n");
      writeFileSync(out, "");
    }
    const res = step(run);
    if (res.status !== 0) console.error(res.stdout, res.stderr);
    const log = readFileSync(join(runnerTemp, "merge.log"), "utf-8");
    const outputs: Record<string, string> = Object.fromEntries(
      readFileSync(out, "utf-8").split("\n").filter(Boolean).map((l) => l.split("=", 2) as [string, string]),
    );
    // The CI symptom, named, so a regression says what it is.
    expect(log).not.toContain('Script not found "merge:main"');
    expect({ exit: res.status, ...outputs } as Record<string, unknown>).toEqual({ exit: 0, status: "0", merged: "true" });
    expect(log).toContain("regen-ok");
    // The branch now contains main, and kept its own work.
    git(prDir, "merge-base", "--is-ancestor", "origin/main", "HEAD");
    expect(readFileSync(join(prDir, "branch.txt"), "utf-8")).toContain("own work");
  }, 150_000);
});

describe("the preflight names a missing tool as missing", () => {
  it("reports status=missing, not a merge failure, when main names no merge:main", () => {
    expect(toolStep?.run).toBeDefined();
    const ws = join(tmp, "ws-missing");
    mkdirSync(join(ws, dir(toolCheckout)), { recursive: true });
    writeFileSync(join(ws, dir(toolCheckout), "package.json"), JSON.stringify({ scripts: { regen: "true" } }));
    const out = join(ws, "output");
    writeFileSync(out, "");
    const res = spawnSync("bash", ["-e", "-c", toolStep!.run!], {
      cwd: ws,
      encoding: "utf-8",
      env: { ...process.env, GITHUB_WORKSPACE: ws, RUNNER_TEMP: ws, GITHUB_OUTPUT: out },
    });
    expect(res.status).toBe(0); // recorded, so the comment step can say what happened
    expect(readFileSync(out, "utf-8")).toBe("status=missing\n");
    const fail = steps.find((s) => (s.name ?? "").startsWith("Fail when main's tool"));
    expect(fail?.if).toContain("steps.tool.outputs.status != 'ok'");
  });
});
