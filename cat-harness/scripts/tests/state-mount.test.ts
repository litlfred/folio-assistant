/**
 * state-mount on REAL repositories: a `file://` remote, a real worktree, no
 * mocks. The failure this module exists for is a FETCH that does not happen,
 * so a stubbed fetch would test the stub.
 *
 * @module scripts/tests/state-mount
 */
import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { MOUNT_DIR, mountState, report, type MountResult } from "../state-mount.js";

/**
 * The tip of a single-worktree mount. The narrowing is explicit because the
 * result type only carries a tip on a graph whose own state is `mounted` —
 * which is the point: nothing can read a tip off a graph that has none.
 */
function soleTip(r: MountResult): string {
  if (r.state !== "mounted") throw new Error(`not mounted: ${r.reason}`);
  const g = r.graphs[0];
  if (!g || g.state !== "mounted") throw new Error(`the sole graph is not mounted: ${g?.reason ?? "(no graph)"}`);
  return g.tip;
}

const NOGPG = ["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@t"];
const BRANCH = "cat/cat-harness/state";
const MANIFEST = JSON.stringify({ $schema: "state-manifest/v1", status: "seed", authoritative: false, keyedBy: "tip" });

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", [...NOGPG, ...args], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.status}\n${r.stderr}`);
  return r.stdout;
}

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

function fixture(files: Record<string, string> | null = { "manifest.json": MANIFEST, "beans/defs/a.md": "A\n" }) {
  const base = mkdtempSync(join(tmpdir(), "state-mount-t-"));
  made.push(base);
  const bare = join(base, "remote.git");
  git(base, "init", "-q", "--bare", "-b", "main", bare);
  const url = `file://${bare}`;
  const work = join(base, "work");
  mkdirSync(work);
  git(work, "init", "-q", "-b", "main");
  writeFileSync(join(work, "README.md"), "root\n");
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "root");
  git(work, "remote", "add", "origin", url);
  if (files) {
    const seed = join(base, "seed");
    mkdirSync(seed);
    git(seed, "init", "-q", "-b", "seed");
    for (const [p, t] of Object.entries(files)) {
      mkdirSync(dirname(join(seed, p)), { recursive: true });
      writeFileSync(join(seed, p), t);
    }
    git(seed, "add", "-A");
    git(seed, "commit", "-q", "-m", "seed");
    git(seed, "push", "-q", url, `HEAD:refs/heads/${BRANCH}`);
  }
  return { base, bare, url, work };
}

describe("inert until the cutover", () => {
  test("no tip-keyed declaration is `not-enabled`, not a failure", () => {
    const f = fixture();
    const r = mountState({ repoRoot: f.work });
    expect(r.state).toBe("not-enabled");
    expect(existsSync(join(f.work, MOUNT_DIR))).toBe(false);
    // The report must NOT shout: crying wolf here is what teaches an agent to ignore the loud case.
    expect(report(r)).not.toContain("🛑");
    expect(report(r)).toContain("read from the checkout");
  });
});

describe("mounting", () => {
  test("--force mounts the branch DETACHED, so there is no branch to push from", () => {
    const f = fixture();
    const r = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(r.state).toBe("mounted");
    const path = join(f.work, MOUNT_DIR);
    expect(readFileSync(join(path, "beans/defs/a.md"), "utf-8")).toBe("A\n");
    // Detached: no symbolic HEAD.
    expect(spawnSync("git", ["symbolic-ref", "-q", "HEAD"], { cwd: path }).status).not.toBe(0);
    // The tip is reported PER GRAPH, where it is required — there is no
    // top-level one, because a fan-out over several branches has no single tip.
    expect(git(path, "rev-parse", "HEAD").trim()).toBe(soleTip(r));
  });

  test("a second mount at the same tip is a no-op", () => {
    const f = fixture();
    expect(mountState({ repoRoot: f.work, force: true, branch: BRANCH }).state).toBe("mounted");
    const again = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(again.state).toBe("mounted");
    if (again.state === "mounted") expect(again.reason).toContain("already at");
  });

  test("a clean mount behind the branch is moved forward", () => {
    const f = fixture();
    const first = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    if (first.state !== "mounted") throw new Error("first mount failed");
    // The branch moves on the remote.
    const seed2 = join(f.base, "seed2");
    mkdirSync(seed2);
    git(seed2, "clone", "-q", f.url, "--branch", BRANCH, seed2);
    writeFileSync(join(seed2, "beans/defs/b.md"), "B\n");
    git(seed2, "add", "-A");
    git(seed2, "commit", "-q", "-m", "more");
    git(seed2, "push", "-q", "origin", `HEAD:refs/heads/${BRANCH}`);

    const moved = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(moved.state).toBe("mounted");
    expect(soleTip(moved)).not.toBe(soleTip(first));
    expect(existsSync(join(f.work, MOUNT_DIR, "beans/defs/b.md"))).toBe(true);
  });
});

describe("it never discards work", () => {
  test("a dirty mount is reported and left exactly as it is", () => {
    const f = fixture();
    expect(mountState({ repoRoot: f.work, force: true, branch: BRANCH }).state).toBe("mounted");
    const edited = join(f.work, MOUNT_DIR, "beans/defs/a.md");
    writeFileSync(edited, "EDITED IN FLIGHT\n");

    const r = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(r.state).toBe("dirty");
    // The edit survives — `worktree remove --force` here would be silent data loss.
    expect(readFileSync(edited, "utf-8")).toBe("EDITED IN FLIGHT\n");
    expect(report(r)).toContain("Nothing was discarded");
  });
});

describe("failure is LOUD, and says what not to believe", () => {
  test("an absent branch fails, and the report warns against trusting an empty work-plan", () => {
    const f = fixture(null); // nothing pushed: the branch does not exist
    const r = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(r.state).toBe("failed");
    const text = report(r);
    expect(text).toContain("🛑");
    expect(text).toContain("do not trust an empty work-plan");
    expect(text).toContain("not** evidence that there is no work");
  });

  test("a branch without the manifest is not a state branch", () => {
    const f = fixture({ "beans/defs/a.md": "A\n" }); // no manifest.json
    const r = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(r.state).toBe("failed");
    if (r.state === "failed") expect(r.reason).toContain("no root manifest.json");
    expect(existsSync(join(f.work, MOUNT_DIR))).toBe(false);
  });

  test("a commit-keyed manifest is refused — the keying is the contract, not the name", () => {
    const f = fixture({ "manifest.json": JSON.stringify({ $schema: "state-manifest/v1", keyedBy: "commit" }), "x.md": "x" });
    const r = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(r.state).toBe("failed");
    if (r.state === "failed") expect(r.reason).toContain("keyed by commit");
  });

  test("a foreign manifest schema is refused", () => {
    const f = fixture({ "manifest.json": JSON.stringify({ $schema: "qa-reports-manifest/v1", keyedBy: "tip" }), "x.md": "x" });
    const r = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(r.state).toBe("failed");
    if (r.state === "failed") expect(r.reason).toContain("not state-manifest/v1");
  });

  test("unparseable JSON is a failure, not an empty mount", () => {
    const f = fixture({ "manifest.json": "{ not json", "x.md": "x" });
    const r = mountState({ repoRoot: f.work, force: true, branch: BRANCH });
    expect(r.state).toBe("failed");
    if (r.state === "failed") expect(r.reason).toContain("does not parse");
  });
});
