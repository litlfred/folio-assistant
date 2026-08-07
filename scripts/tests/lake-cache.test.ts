import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { execFileSync } from "child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

/**
 * End-to-end tests for `scripts/lake-cache.sh` against a LOCAL git
 * remote, so the real fetch/extract path is exercised without network.
 *
 * Every bug this script has had was found by hand — a cwd-relative
 * `git ls-tree` that reported a good cache as empty, a toolchain
 * extracted one directory too high, a seed that published a cache with
 * no own-package oleans. Each is pinned below.
 */

const SCRIPT = resolve(import.meta.dir, "..", "lake-cache.sh");
const SLUG = "v4-24-0";
const PKG = "testpkg";
const BRANCH = `lake-cache/${PKG}-${SLUG}`;

let root = "";
let lakeRoot = "";

/** Run the script; never throws — returns status and output. */
function run(
  args: string[],
  cwd: string,
): { code: number; out: string } {
  try {
    const out = execFileSync("bash", [SCRIPT, ...args], {
      cwd,
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 60_000,
    });
    return { code: 0, out };
  } catch (e: any) {
    return {
      code: e.status ?? -1,
      out: `${e.stdout ?? ""}${e.stderr ?? ""}`,
    };
  }
}

function git(args: string[], cwd: string) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

/** A `.lake` tree with `count` dependency oleans and `own` package oleans. */
function makeLake(dir: string, count: number, own: number) {
  const dep = join(dir, ".lake", "packages", "mathlib", ".lake", "build", "lib", "lean", "Mathlib");
  mkdirSync(dep, { recursive: true });
  for (let i = 0; i < count; i++) writeFileSync(join(dep, `Dep${i}.olean`), "x");
  if (own > 0) {
    const o = join(dir, ".lake", "build", "lib", "lean", "TestPkg");
    mkdirSync(o, { recursive: true });
    for (let i = 0; i < own; i++) writeFileSync(join(o, `Own${i}.olean`), "x");
  }
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "lakecache-"));

  // Bare remote.
  const bare = join(root, "origin.git");
  mkdirSync(bare);
  git(["init", "--bare", "-q"], root);
  execFileSync("git", ["init", "--bare", "-q", bare], { stdio: "pipe" });

  // Working repo with a Lake package nested two levels down — the
  // layout that exposed the cwd-relative `git ls-tree` bug.
  const work = join(root, "work");
  mkdirSync(work);
  git(["init", "-q", "-b", "main"], work);
  git(["config", "user.email", "t@t"], work);
  git(["config", "user.name", "t"], work);
  git(["remote", "add", "origin", bare], work);
  mkdirSync(join(work, "content"), { recursive: true });
  writeFileSync(join(work, "README.md"), "x");
  git(["add", "-A"], work);
  git(["commit", "-qm", "init"], work);
  git(["push", "-q", "origin", "main"], work);

  lakeRoot = join(work, "content", "pkg", "lean");
  mkdirSync(lakeRoot, { recursive: true });
  writeFileSync(join(lakeRoot, "lakefile.toml"), `name = "${PKG}"\n`);
  writeFileSync(join(lakeRoot, "lean-toolchain"), "leanprover/lean4:v4.24.0\n");

  // Seed a cache branch by hand, in the real on-disk format: a whole
  // `.lake` tarred and split into parts.
  const staging = join(root, "staging");
  mkdirSync(staging);
  makeLake(staging, 5, 3);
  execFileSync("bash", [
    "-c",
    `tar czf - -C '${staging}' .lake | split -b 90m - '${staging}/lake-oleans.tgz.part'`,
  ], { stdio: "pipe" });

  const cacheWt = join(root, "cachewt");
  mkdirSync(cacheWt);
  git(["init", "-q", "-b", BRANCH], cacheWt);
  git(["config", "user.email", "t@t"], cacheWt);
  git(["config", "user.name", "t"], cacheWt);
  execFileSync("bash", ["-c", `cp '${staging}'/lake-oleans.tgz.part* '${cacheWt}/'`], { stdio: "pipe" });
  git(["add", "-A"], cacheWt);
  git(["commit", "-qm", "cache"], cacheWt);
  git(["remote", "add", "origin", bare], cacheWt);
  git(["push", "-q", "origin", BRANCH], cacheWt);
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe("lake-cache.sh — resolution", () => {
  test("finds the Lake root by walking up from a subdirectory", () => {
    const sub = join(lakeRoot, "TestPkg", "Deep");
    mkdirSync(sub, { recursive: true });
    const r = run(["status", "--package", PKG], sub);
    expect(r.out).toContain(lakeRoot);
  });

  test("derives the toolchain slug from lean-toolchain", () => {
    const r = run(["status", "--package", PKG], lakeRoot);
    expect(r.out).toContain(SLUG);
    expect(r.out).toContain(BRANCH);
  });

  test("unknown command exits 2", () => {
    expect(run(["nonsense"], lakeRoot).code).toBe(2);
  });
});

describe("lake-cache.sh — status", () => {
  test("exits 1 when no cache is present", () => {
    const r = run(["status", "--package", PKG], lakeRoot);
    expect(r.code).toBe(1);
    expect(r.out).toContain("cache ABSENT");
  });
});

describe("lake-cache.sh — restore", () => {
  test("restores from a split-tarball branch, run from the Lake root", () => {
    // Pins the cwd-relative `git ls-tree` bug: without --full-tree this
    // listed a path the orphan branch does not contain and returned
    // nothing, reporting a perfectly good cache as carrying neither
    // parts nor a tree.
    const r = run(["restore", "--package", PKG], lakeRoot);
    expect(r.code).toBe(0);
    expect(r.out).toContain("restored");
    expect(existsSync(join(lakeRoot, ".lake"))).toBe(true);
  });

  test("reports own-package oleans separately from dependencies", () => {
    const r = run(["status", "--package", PKG], lakeRoot);
    expect(r.code).toBe(0);
    expect(r.out).toContain("own pkg:    3");
    expect(r.out).toContain("cache PRESENT");
  });

  test("is idempotent — a second restore no-ops", () => {
    const r = run(["restore", "--package", PKG], lakeRoot);
    expect(r.code).toBe(0);
    expect(r.out).toContain("already present");
  });

  test("a missing branch exits 1, not 0", () => {
    // Must run against a CLEAN Lake root. With a cache already on disk,
    // `restore` correctly no-ops (exit 0) before it ever consults the
    // branch — so testing this against the restored root would assert
    // the wrong thing.
    const fresh = join(root, "fresh", "content", "pkg", "lean");
    mkdirSync(fresh, { recursive: true });
    writeFileSync(join(fresh, "lakefile.toml"), `name = "${PKG}"\n`);
    writeFileSync(join(fresh, "lean-toolchain"), "leanprover/lean4:v4.24.0\n");
    const r = run(
      ["restore", "--package", PKG, "--branch", "lake-cache/nope-v9-9-9", "--lake-root", fresh],
      lakeRoot,
    );
    expect(r.code).toBe(1);
    expect(r.out).toContain("not found");
  });
});

describe("lake-cache.sh — gutted detection", () => {
  test("a shortfall against the restore stamp reports GUTTED with exit 3", () => {
    // Sibling-session behaviour (#67): `lake build` can evict most of a
    // restored tree, leaving a nonzero count that any `> 0` test passes.
    const dep = join(lakeRoot, ".lake", "packages", "mathlib", ".lake", "build", "lib", "lean", "Mathlib");
    rmSync(join(dep, "Dep0.olean"), { force: true });
    rmSync(join(dep, "Dep1.olean"), { force: true });
    const r = run(["status", "--package", PKG], lakeRoot);
    expect(r.code).toBe(3);
    expect(r.out).toContain("GUTTED");
  });

  test("restore repairs a gutted tree", () => {
    const r = run(["restore", "--package", PKG], lakeRoot);
    expect(r.code).toBe(0);
    expect(run(["status", "--package", PKG], lakeRoot).code).toBe(0);
  });
});

describe("lake-cache.sh — seed guard", () => {
  test("refuses to seed when the package's own oleans are absent", () => {
    // The defect that shipped on lake-cache/qou-v4-24-0: thousands of
    // dependency oleans, zero from the package. Total looked healthy.
    const bad = mkdtempSync(join(tmpdir(), "lakecache-bad-"));
    execFileSync("bash", ["-c", `cp -r '${lakeRoot}'/lakefile.toml '${lakeRoot}'/lean-toolchain '${bad}/'`], { stdio: "pipe" });
    makeLake(bad, 5, 0); // deps only
    git(["init", "-q"], bad);
    const r = run(["seed", "--package", PKG, "--lake-root", bad], bad);
    expect(r.code).toBe(2);
    expect(r.out).toContain("ZERO belong to");
    rmSync(bad, { recursive: true, force: true });
  });

  test("exempts mathlib, whose dependencies ARE the payload", () => {
    const ml = mkdtempSync(join(tmpdir(), "lakecache-ml-"));
    execFileSync("bash", ["-c", `cp -r '${lakeRoot}'/lakefile.toml '${lakeRoot}'/lean-toolchain '${ml}/'`], { stdio: "pipe" });
    makeLake(ml, 5, 0);
    git(["init", "-q"], ml);
    const r = run(["seed", "--package", "mathlib", "--lake-root", ml], ml);
    expect(r.out).not.toContain("ZERO belong to");
    rmSync(ml, { recursive: true, force: true });
  });

  test("refuses to seed an empty tree", () => {
    const empty = mkdtempSync(join(tmpdir(), "lakecache-empty-"));
    execFileSync("bash", ["-c", `cp -r '${lakeRoot}'/lakefile.toml '${lakeRoot}'/lean-toolchain '${empty}/'`], { stdio: "pipe" });
    git(["init", "-q"], empty);
    const r = run(["seed", "--package", PKG, "--lake-root", empty], empty);
    expect(r.code).toBe(2);
    expect(r.out).toContain("build before seeding");
    rmSync(empty, { recursive: true, force: true });
  });
});

describe("lake-cache.sh — contribute (agentic loop)", () => {
  test("contribute is a recognised command", () => {
    // The loop's last step: restore -> draft -> build -> contribute.
    const r = run(["contribute", "--package", PKG], lakeRoot);
    expect(r.out).not.toContain("unknown command");
  });

  test("contribute inherits the seed guards", () => {
    // A session that compiled nothing must not be able to publish. Same
    // guard as `seed`, reached through the loop's verb.
    const bare = mkdtempSync(join(tmpdir(), "lakecache-contrib-"));
    execFileSync("bash", [
      "-c",
      `cp '${lakeRoot}'/lakefile.toml '${lakeRoot}'/lean-toolchain '${bare}/'`,
    ], { stdio: "pipe" });
    git(["init", "-q"], bare);
    const r = run(["contribute", "--package", PKG, "--lake-root", bare], bare);
    expect(r.code).toBe(2);
    expect(r.out).toContain("build before seeding");
    rmSync(bare, { recursive: true, force: true });
  });
});
