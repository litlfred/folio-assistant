/**
 * The evidence gathering, against real git repositories built for the purpose.
 *
 * `checks.test.ts` proves each check fires when handed the right evidence.
 * This proves the evidence is gathered correctly — and, more importantly, that
 * each way of failing to gather it produces the RIGHT ONE of the three states.
 * Those are different tests: a probe that returned `{ state: "ok", value: [] }`
 * on an unreachable branch would pass every test in the other file.
 *
 * @module test/health/probes.test
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "bun:test";

import { frontMatter, frontMatterValue, probeRepoSize, probeStaging, probeTodos } from "./probes.ts";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

function run(cwd: string, cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed: ${r.stderr}`);
}

/** A throwaway repository with one commit. */
function repo(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "health-probe-"));
  made.push(dir);
  run(dir, "git", ["init", "-q", "-b", "main"]);
  run(dir, "git", ["config", "user.email", "t@example.invalid"]);
  run(dir, "git", ["config", "user.name", "T"]);
  for (const [rel, body] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body);
  }
  run(dir, "git", ["add", "-A"]);
  run(dir, "git", ["commit", "-qm", "fixture"]);
  return dir;
}

describe("probeStaging", () => {
  it("reads the previews and sums their blob sizes", () => {
    const dir = repo({
      "STAGING/claude-one/index.html": "x".repeat(1000),
      "STAGING/claude-one/assets/a.css": "y".repeat(500),
      "STAGING/claude-two/index.html": "z".repeat(2000),
      "index.html": "not a preview",
    });
    const p = probeStaging({ repoRoot: dir, remote: "origin", branch: "gh-pages", prefix: "STAGING", localRev: "HEAD" });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.previews.map((x) => x.slug)).toEqual(["claude-one", "claude-two"]);
    expect(p.value.previews[0].bytes).toBe(1500);
    expect(p.value.previews[0].files).toBe(2);
    expect(p.value.previews[1].bytes).toBe(2000);
  });

  it("a branch with no STAGING directory is a DETERMINED empty, not an unknown", () => {
    const dir = repo({ "index.html": "the main site" });
    const p = probeStaging({ repoRoot: dir, remote: "origin", branch: "gh-pages", prefix: "STAGING", localRev: "HEAD" });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.branch).toBe("present");
    expect(p.value.previews).toEqual([]);
  });

  it("a publish branch that positively does not exist is `ok`/`absent` — the first-deploy case", () => {
    const remote = repo({ "index.html": "main" });
    run(remote, "git", ["config", "--bool", "core.bare", "true"]);
    const dir = repo({ "a.txt": "a" });
    run(dir, "git", ["remote", "add", "origin", remote]);
    const p = probeStaging({ repoRoot: dir, remote: "origin", branch: "gh-pages", prefix: "STAGING" });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.branch).toBe("absent");
    expect(p.value.previews).toEqual([]);
  });

  it("a remote that cannot be reached is `unknown`, and says which command failed", () => {
    const dir = repo({ "a.txt": "a" });
    run(dir, "git", ["remote", "add", "origin", join(dir, "no-such-remote-directory")]);
    const p = probeStaging({ repoRoot: dir, remote: "origin", branch: "gh-pages", prefix: "STAGING" });
    // THE test in this file. An unreachable remote must not look like a branch
    // with no previews: the first is "I could not ask", the second is an
    // answer, and `restore-staging.ts` exists because they were once the same.
    expect(p.state).toBe("unknown");
    if (p.state !== "unknown") return;
    expect(p.reason).toContain("git ls-remote");
  });
});

describe("probeRepoSize", () => {
  it("measures tracked blobs at HEAD, not the working tree", () => {
    const dir = repo({ "a.txt": "x".repeat(4096), "b/c.txt": "y".repeat(2048) });
    // An untracked file is not repository content and must not be counted.
    writeFileSync(join(dir, "untracked.bin"), "z".repeat(1_000_000));
    const p = probeRepoSize(dir);
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.trackedBytes).toBe(4096 + 2048);
    expect(p.value.gitDirBytes).toBeGreaterThan(0);
  });

  it("is `unknown` outside a repository rather than reporting a zero-byte one", () => {
    const dir = mkdtempSync(join(tmpdir(), "health-not-a-repo-"));
    made.push(dir);
    const p = probeRepoSize(dir);
    expect(p.state).toBe("unknown");
  });
});

describe("probeTodos", () => {
  it("reads the declared store, following todos.json rather than a hardcoded path", () => {
    const dir = repo({
      // The node is declared as `elsewhere`, NOT `items`. A probe that
      // hardcoded `todos/items` would read nothing here and report a clean,
      // empty store — the `dh4f` shape.
      "todos/todos.json": JSON.stringify({
        name: "fixture",
        directories: [{ id: "elsewhere", path: "elsewhere", graphs: ["todo-items"] }],
      }),
      "todos/elsewhere/one.md": "---\n$schema: folio-todo/v1\nid: one\nstatus: open\ncreatedAt: 2026-01-01\n---\nbody\n",
      "todos/items/decoy.md": "---\nid: decoy\nstatus: open\n---\n",
    });
    const p = probeTodos(dir);
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.map((t) => t.id)).toEqual(["one"]);
  });

  it("a PRESENT but unreadable declaration is `unknown`, never a fallback to the default path", () => {
    const dir = repo({
      "todos/todos.json": "{ this is not json",
      "todos/items/one.md": "---\nid: one\nstatus: open\n---\n",
    });
    const p = probeTodos(dir);
    expect(p.state).toBe("unknown");
    if (p.state !== "unknown") return;
    expect(p.reason).toContain("todos.json");
  });
});

describe("front matter", () => {
  it("reads a quoted title, which `beans` writes whenever the value holds a colon", () => {
    const fm = frontMatter("---\n# folio-assistant-3vge\ntitle: 'Workflow failure: invisible'\nstatus: todo\n---\nbody");
    expect(fm).toBeDefined();
    expect(frontMatterValue(fm!, "title")).toBe("Workflow failure: invisible");
    expect(frontMatterValue(fm!, "status")).toBe("todo");
    expect(frontMatterValue(fm!, "updated_at")).toBeUndefined();
  });

  it("returns undefined for a file with no front matter at all", () => {
    expect(frontMatter("# just a heading\n")).toBeUndefined();
  });
});
