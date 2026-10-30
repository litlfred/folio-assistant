/**
 * The e2e shards run on a PR push unless every changed file is one they
 * cannot read (owner, 2026-10-23: cut CI time).
 *
 * Runs the `e2e-scope` job's own script, read out of the workflow, against a
 * stand-in `gh` that prints a chosen file listing, so what is asserted is the
 * step that ships rather than a copy of it. The skip direction is the one that
 * can hide a regression, so most cases below are ones that must RUN.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "yaml";

const WORKFLOW = resolve(import.meta.dir, "..", "..", ".github", "workflows", "code-quality-gates.yml");
const wf = parse(readFileSync(WORKFLOW, "utf8")) as {
  jobs: Record<string, { if?: string; needs?: string | string[]; steps: Array<{ id?: string; run?: string; env?: Record<string, string> }> }>;
};
const scopeJob = wf.jobs["e2e-scope"]!;
const step = scopeJob.steps.find((s) => s.id === "scope")!;

/** Run the step with `gh` answering `listing` (lines `F\tpath` / `P\tpath`), or failing when null. */
function scope(listing: string[] | null, changed?: number): { affected: string; summary: string } {
  const dir = mkdtempSync(join(tmpdir(), "e2e-scope-"));
  const gh = join(dir, "gh");
  writeFileSync(join(dir, "listing"), listing === null ? "" : listing.join("\n") + "\n");
  writeFileSync(gh, listing === null ? "#!/bin/sh\nexit 1\n" : `#!/bin/sh\ncat '${join(dir, "listing")}'\n`);
  chmodSync(gh, 0o755);
  const out = join(dir, "out");
  const summary = join(dir, "summary");
  writeFileSync(out, "");
  writeFileSync(summary, "");
  const files = (listing ?? []).filter((l) => l.startsWith("F\t")).length;
  const r = spawnSync("bash", ["-e", "-c", step.run!], {
    env: {
      PATH: `${dir}:${process.env.PATH}`,
      GITHUB_OUTPUT: out,
      GITHUB_STEP_SUMMARY: summary,
      REPO: "o/r",
      PR: "1",
      CHANGED: String(changed ?? files),
      INERT: step.env!.INERT!,
      ALWAYS: step.env!.ALWAYS!,
    },
    encoding: "utf8",
  });
  expect(r.status).toBe(0);
  return { affected: /^affected=(\S*)$/m.exec(readFileSync(out, "utf8"))?.[1] ?? "", summary: readFileSync(summary, "utf8") };
}

const F = (...paths: string[]) => paths.map((p) => `F\t${p}`);

describe("e2e-scope skips the shards only when every changed file is inert", () => {
  test("other workflows and their tests only: skipped", () => {
    expect(scope(F(".github/workflows/docs-site.yml", "test/workflows/merge-main-workflow.test.ts")).affected).toBe("false");
    expect(scope(F(".github/actions/lake-cache-restore/action.yml", ".github/dependabot.yml", ".mcp.json")).affected).toBe("false");
  });

  test.each([
    ["the pins", "index.lock.json"],
    ["the instance config", "index.config.json"],
    ["this workflow, which runs the shards", ".github/workflows/code-quality-gates.yml"],
    ["the mount script", ".github/mount-from-lock.sh"],
    ["the dependencies", "bun.lock"],
    ["the manifest", "package.json"],
    ["an upload the library pages read", "uploads/x/README.md"],
    ["a skill kg-export reads", ".claude/skills/local/todo-manager.md"],
    ["a root document", "README.md"],
    ["a path nobody listed", "src/new-thing.ts"],
    ["a file nested under test/workflows", "test/workflows/fixtures/x.json"],
  ])("%s runs them", (_why, path) => {
    expect(scope(F(".github/workflows/docs-site.yml", path)).affected).toBe("true");
  });

  test("a rename out of a path that matters runs them", () => {
    expect(scope([...F(".github/workflows/x.yml"), "P\tindex.lock.json"]).affected).toBe("true");
  });

  test("a listing that cannot be fetched, is empty, or is short of the PR's count runs them", () => {
    expect(scope(null).affected).toBe("true");
    expect(scope([]).affected).toBe("true");
    expect(scope(F(".github/workflows/docs-site.yml"), 3001).affected).toBe("true");
  });

  test("the answer is written to the job summary", () => {
    expect(scope(F("index.lock.json")).summary).toContain("index.lock.json");
  });
});

describe("the shards honour it, and everything else still runs them", () => {
  const shard = wf.jobs["e2e-shard"]!;

  test("only the exact answer `false` skips a shard, so a missing answer runs it", () => {
    expect(shard.needs).toContain("e2e-scope");
    expect(shard.if).toContain("needs.e2e-scope.outputs.affected != 'false'");
    expect(shard.if).toContain("!cancelled()");
  });

  test("the scope job runs on PR pushes only, never on ready_for_review or a draft", () => {
    expect(scopeJob.if).toContain("github.event_name == 'pull_request'");
    expect(scopeJob.if).toContain("github.event.action != 'ready_for_review'");
    expect(scopeJob.if).toContain("github.event.pull_request.draft != true");
  });
});
