import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { execFileSync, spawnSync } from "child_process";
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

/**
 * Run the script; never throws — returns status and output.
 *
 * `out` merges stdout AND stderr on every path. `execFileSync` hands back
 * stdout alone when the command succeeds, which silently dropped every
 * `warn` from a run that then exited 0 — so a test asserting on a warning
 * could only pass if the script also failed.
 */
function run(
  args: string[],
  cwd: string,
  env?: Record<string, string>,
): { code: number; out: string } {
  const r = spawnSync("bash", [SCRIPT, ...args], {
    cwd,
    encoding: "utf-8",
    timeout: 60_000,
    env: env ? { ...process.env, ...env } : process.env,
  });
  return { code: r.status ?? -1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function git(args: string[], cwd: string) {
  // `stdio: "pipe"` alone throws `Command failed: git push …` with git's own
  // stderr discarded, so a fixture failure tells you nothing about why — which
  // is exactly what happened when this suite went flaky under load. Capture it
  // and put it in the message.
  const r = spawnSync("git", args, { cwd, encoding: "utf-8" });
  if (r.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} (cwd ${cwd}) exited ${r.status}` +
      `${r.signal ? ` on ${r.signal}` : ""}\n${r.stderr ?? ""}${r.stdout ?? ""}`,
    );
  }
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
  // Was preceded by a stray `git init --bare -q` with cwd=root and NO path,
  // which turned the temp root itself into a bare repo — an unwanted repo
  // wrapping the working clone, created by a line that looks like setup.
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

/**
 * `install-toolchain` — fetch a toolchain straight from its GitHub
 * release, for hosts where elan's own download hosts are unreachable.
 *
 * Offline: $LEAN_RELEASE_BASE points at a `file://` tree holding a fake
 * toolchain archive of the real shape, so the whole
 * download -> extract -> verify -> publish path runs without network.
 */
const HAS_ZSTD = (() => {
  try { execFileSync("zstd", ["--version"], { stdio: "pipe" }); return true; }
  catch { return false; }
})();

const PIN = "leanprover/lean4:v4.24.0";
/** elan's encoding: `/` -> `--`, `:` -> `---`. */
const ELAN_NAME = "leanprover--lean4---v4.24.0";
/** What the old `tr '/:' '--'` produced — a path elan never uses. */
const WRONG_NAME = "leanprover-lean4-v4.24.0";

const PLAT =
  process.platform === "darwin"
    ? (process.arch === "arm64" ? "darwin_aarch64" : "darwin")
    : (process.arch === "arm64" ? "linux_aarch64" : "linux");

/**
 * A mirror tree holding `<tag>/lean-<ver>-<plat>.tar.zst`.
 * `withLibs: false` builds the DEFECTIVE shape the toolchain cache branch
 * actually carries — a `lean` that runs, and no static libraries.
 */
function makeMirror(withLibs = true): string {
  const mirror = mkdtempSync(join(tmpdir(), "lean-mirror-"));
  const stage = join(mirror, "stage", "lean-4.24.0-linux");
  mkdirSync(join(stage, "bin"), { recursive: true });
  mkdirSync(join(stage, "lib", "lean"), { recursive: true });
  writeFileSync(
    join(stage, "bin", "lean"),
    "#!/bin/sh\necho 'Lean (version 4.24.0, fake-for-tests)'\n",
    { mode: 0o755 },
  );
  if (withLibs) {
    for (const l of ["libleancpp.a", "libLean.a", "libLake.a"]) {
      writeFileSync(join(stage, "lib", "lean", l), "!<arch>\n");
    }
  }
  mkdirSync(join(mirror, "v4.24.0"), { recursive: true });
  execFileSync(
    "bash",
    ["-c",
     `tar --zstd -cf '${join(mirror, "v4.24.0", `lean-4.24.0-${PLAT}.tar.zst`)}' ` +
     `-C '${join(mirror, "stage")}' lean-4.24.0-linux`],
    { stdio: "pipe" },
  );
  return mirror;
}

describe("lake-cache.sh — install-toolchain (argument handling)", () => {
  test("declines a nightly rather than guessing an asset name", () => {
    const r = run(["install-toolchain", "--toolchain", "leanprover/lean4:nightly-2025-01-01"], lakeRoot);
    expect(r.code).toBe(2);
    expect(r.out).toContain("nightly");
    expect(r.out).toContain("elan toolchain install");
  });

  test("fails clearly when no pin can be resolved", () => {
    const bare = mkdtempSync(join(tmpdir(), "lakecache-nopin-"));
    git(["init", "-q"], bare);
    const r = run(["install-toolchain"], bare);
    expect(r.code).toBe(2);
    expect(r.out).toContain("--toolchain");
    rmSync(bare, { recursive: true, force: true });
  });
});

describe.skipIf(!HAS_ZSTD)("lake-cache.sh — install-toolchain (install path)", () => {
  test("installs under elan's real directory name, not the tr '/:' one", () => {
    // The regression: `tr '/:' '--'` yields `leanprover-lean4-v4.24.0`,
    // which matches no elan install — so the guard meant to catch a
    // non-linking toolchain tested a path that never exists.
    const mirror = makeMirror();
    const home = mkdtempSync(join(tmpdir(), "elan-home-"));
    const r = run(["install-toolchain", "--toolchain", PIN], lakeRoot,
                  { LEAN_RELEASE_BASE: `file://${mirror}`, ELAN_HOME: home });
    expect(r.code).toBe(0);
    expect(existsSync(join(home, "toolchains", ELAN_NAME, "bin", "lean"))).toBe(true);
    expect(existsSync(join(home, "toolchains", WRONG_NAME))).toBe(false);
    rmSync(mirror, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });

  test("reports the static libs it landed", () => {
    const mirror = makeMirror();
    const home = mkdtempSync(join(tmpdir(), "elan-home-"));
    const r = run(["install-toolchain", "--toolchain", PIN], lakeRoot,
                  { LEAN_RELEASE_BASE: `file://${mirror}`, ELAN_HOME: home });
    expect(r.out).toContain("static libs: 3");
    rmSync(mirror, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });

  test("is idempotent — a linkable toolchain is left alone", () => {
    const mirror = makeMirror();
    const home = mkdtempSync(join(tmpdir(), "elan-home-"));
    const env = { LEAN_RELEASE_BASE: `file://${mirror}`, ELAN_HOME: home };
    expect(run(["install-toolchain", "--toolchain", PIN], lakeRoot, env).code).toBe(0);
    const second = run(["install-toolchain", "--toolchain", PIN], lakeRoot, env);
    expect(second.code).toBe(0);
    expect(second.out).toContain("already installed and linkable");
    rmSync(mirror, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });

  test("--force reinstalls over a linkable toolchain", () => {
    const mirror = makeMirror();
    const home = mkdtempSync(join(tmpdir(), "elan-home-"));
    const env = { LEAN_RELEASE_BASE: `file://${mirror}`, ELAN_HOME: home };
    run(["install-toolchain", "--toolchain", PIN], lakeRoot, env);
    const forced = run(["install-toolchain", "--toolchain", PIN, "--force"], lakeRoot, env);
    expect(forced.code).toBe(0);
    expect(forced.out).toContain("reinstalling");
    rmSync(mirror, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });

  test("replaces a toolchain that has NO static libs — the ga7e trap", () => {
    // A tree at exactly the path elan expects makes elan (and every
    // staleness check) conclude a toolchain is installed and skip the
    // download, leaving a `lean` that elaborates but cannot link.
    const home = mkdtempSync(join(tmpdir(), "elan-home-"));
    const broken = join(home, "toolchains", ELAN_NAME);
    mkdirSync(join(broken, "lib", "lean"), { recursive: true });
    mkdirSync(join(broken, "bin"), { recursive: true });
    writeFileSync(join(broken, "lib", "lean", "libleancpp.a.trace"), "x"); // trace, no lib
    writeFileSync(join(broken, "bin", "lean"), "#!/bin/sh\necho fake\n", { mode: 0o755 });

    const mirror = makeMirror();
    const r = run(["install-toolchain", "--toolchain", PIN], lakeRoot,
                  { LEAN_RELEASE_BASE: `file://${mirror}`, ELAN_HOME: home });
    expect(r.code).toBe(0);
    expect(r.out).toContain("NO static libraries");
    expect(existsSync(join(broken, "lib", "lean", "libleancpp.a"))).toBe(true);
    rmSync(mirror, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });

  test("refuses to publish an archive with no static libs, leaving nothing behind", () => {
    // Verification happens in a staging dir: a toolchain that would not
    // link must never reach the path everything treats as installed.
    const mirror = makeMirror(false);
    const home = mkdtempSync(join(tmpdir(), "elan-home-"));
    const r = run(["install-toolchain", "--toolchain", PIN], lakeRoot,
                  { LEAN_RELEASE_BASE: `file://${mirror}`, ELAN_HOME: home });
    expect(r.code).toBe(3);
    expect(r.out).toContain("no static libraries");
    expect(existsSync(join(home, "toolchains", ELAN_NAME))).toBe(false);
    rmSync(mirror, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });

  test("a missing asset fails with exit 1 and installs nothing", () => {
    const empty = mkdtempSync(join(tmpdir(), "lean-mirror-empty-"));
    const home = mkdtempSync(join(tmpdir(), "elan-home-"));
    const r = run(["install-toolchain", "--toolchain", PIN], lakeRoot,
                  { LEAN_RELEASE_BASE: `file://${empty}`, ELAN_HOME: home });
    expect(r.code).toBe(1);
    expect(existsSync(join(home, "toolchains", ELAN_NAME))).toBe(false);
    rmSync(empty, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });
});

describe("lake-cache.sh — trace coverage is a real pairing, not a ratio of counts", () => {
  /** Lake tree with `n` module oleans, `traced` of them carrying a sibling. */
  function makeTraced(dir: string, n: number, traced: number, decoys = 0) {
    const lib = join(dir, ".lake", "build", "lib", "lean", "TestPkg");
    mkdirSync(lib, { recursive: true });
    for (let i = 0; i < n; i++) {
      writeFileSync(join(lib, `M${i}.olean`), "x");
      if (i < traced) writeFileSync(join(lib, `M${i}.trace`), "x");
    }
    // `.trace` files that belong to NON-olean artifacts. A real tree is
    // full of these: .c.o.export.trace, a binary's .trace, .tar.gz.trace,
    // package-lock.json.trace …
    const ir = join(dir, ".lake", "build", "ir", "TestPkg");
    mkdirSync(ir, { recursive: true });
    for (let i = 0; i < decoys; i++) writeFileSync(join(ir, `M${i}.c.o.export.trace`), "x");
  }

  function statusOf(dir: string) {
    writeFileSync(join(dir, "lakefile.toml"), `name = "${PKG}"\n`);
    writeFileSync(join(dir, "lean-toolchain"), "leanprover/lean4:v4.24.0\n");
    git(["init", "-q"], dir);
    return run(["status", "--package", PKG, "--lake-root", dir], dir);
  }

  test("decoy traces cannot push coverage above 100%", () => {
    // The regression: total .trace / oleans. A partially built qou tree
    // had 13 oleans and 25 traces and reported 192% coverage — which then
    // sailed past every >= 90% gate.
    const d = mkdtempSync(join(tmpdir(), "lakecache-cov-"));
    makeTraced(d, 5, 5, 20); // 5 oleans, all traced, 20 unrelated traces
    const r = statusOf(d);
    expect(r.out).toContain("traced:     5/5 oleans  (100%)");
    const pct = Number(r.out.match(/oleans\s+\((\d+)%\)/)?.[1]);
    expect(pct).toBeLessThanOrEqual(100); // 192% is what this pins
    rmSync(d, { recursive: true, force: true });
  });

  test("counts only oleans that carry their OWN trace", () => {
    const d = mkdtempSync(join(tmpdir(), "lakecache-cov-"));
    makeTraced(d, 10, 4, 30); // decoys must not make up the shortfall
    const r = statusOf(d);
    expect(r.out).toContain("traced:     4/10 oleans  (40%)");
    rmSync(d, { recursive: true, force: true });
  });

  test("an untraced tree reads 0%, not 'plenty of traces'", () => {
    // lake-cache/qou-v4-24-0's actual shape: oleans present, no traces,
    // so Lake rebuilds and evicts every one.
    const d = mkdtempSync(join(tmpdir(), "lakecache-cov-"));
    makeTraced(d, 8, 0, 12);
    const r = statusOf(d);
    expect(r.out).toContain("traced:     0/8 oleans  (0%)");
    rmSync(d, { recursive: true, force: true });
  });

  test("the lakefile.olean form (X.olean -> X.olean.trace) also counts", () => {
    const d = mkdtempSync(join(tmpdir(), "lakecache-cov-"));
    mkdirSync(join(d, ".lake"), { recursive: true });
    writeFileSync(join(d, ".lake", "lakefile.olean"), "x");
    writeFileSync(join(d, ".lake", "lakefile.olean.trace"), "x");
    const r = statusOf(d);
    expect(r.out).toContain("traced:     1/1 oleans  (100%)");
    rmSync(d, { recursive: true, force: true });
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
