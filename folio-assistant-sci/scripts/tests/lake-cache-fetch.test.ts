/**
 * lake-cache-fetch.sh resolves its candidate branches from the folio's own
 * declaration first (bean rva2), on a real folio layout: the script copied
 * into `<folio>/scripts/`, a `<instance>.json` beside it, and a bare remote
 * that holds no cache branch — so each run prints the candidates it tries,
 * in order, and the order is what is asserted.
 *
 * @module scripts/tests/lake-cache-fetch
 */
import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(import.meta.dir, "..", "lake-cache-fetch.sh");
const BUILT_IN = "cat/folio-assistant-sci/lake-cache/qou-v4-24-0";
let roots: string[] = [];
afterEach(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots = [];
});

function folio(declaredPrefix?: string): string {
  const root = mkdtempSync(join(tmpdir(), "lakecache-fetch-"));
  roots.push(root);
  const sh = (args: string[], cwd: string) => spawnSync("git", args, { cwd, encoding: "utf-8" });
  sh(["init", "-q", "--bare", join(root, "o.git")], root);
  const f = join(root, "f");
  mkdirSync(join(f, "scripts"), { recursive: true });
  copyFileSync(SCRIPT, join(f, "scripts", "lake-cache-fetch.sh"));
  sh(["init", "-q", "-b", "main"], f);
  sh(["remote", "add", "origin", join(root, "o.git")], f);
  writeFileSync(join(f, "lean-toolchain"), "leanprover/lean4:v4.24.0\n");
  if (declaredPrefix) {
    const entry = { id: "lake-cache", path: "lake-cache/", graphTypologies: ["lake-cache"], storage: { branchPrefix: declaredPrefix, keyedBy: "family" } };
    writeFileSync(join(f, "f.json"), JSON.stringify({ name: "f", directories: [entry] }));
  }
  return f;
}

function tried(f: string): string[] {
  const r = spawnSync("bash", [join(f, "scripts", "lake-cache-fetch.sh")], { cwd: f, encoding: "utf-8" });
  return [...`${r.stdout}${r.stderr}`.matchAll(/fetching orphan branch '([^']+)'/g)].map((m) => m[1]!);
}

describe("lake-cache-fetch.sh candidate order (bean rva2)", () => {
  test("the folio's declared family is tried first, then the built-in name", () => {
    const order = tried(folio("my/lake-cache/"));
    expect(order[0]).toBe("my/lake-cache/qou-v4-24-0");
    expect(order[1]).toBe(BUILT_IN);
  });

  test("with no declaration the built-in name is tried first", () => {
    expect(tried(folio())[0]).toBe(BUILT_IN);
  });

  test("a declaration naming the built-in family adds no duplicate", () => {
    const order = tried(folio("cat/folio-assistant-sci/lake-cache/"));
    expect(order.filter((b) => b === BUILT_IN)).toHaveLength(1);
  });
});

// The two Python mirrors, loaded as modules (their `main` is guarded) from a
// copy in `<folio>/scripts/`, so REPO_ROOT is the folio exactly as in use.
describe("the Python mirrors read the same declaration (bean rva2)", () => {
  const BUILT_INS = ["cat/folio-assistant-sci/lake-cache/"];
  const prefixes = (f: string, script: string): string[] => {
    copyFileSync(resolve(import.meta.dir, "..", script), join(f, "scripts", script));
    const py =
      "import importlib.util, json, sys\n" +
      "s = importlib.util.spec_from_file_location('m', sys.argv[1])\n" +
      "m = importlib.util.module_from_spec(s); s.loader.exec_module(m)\n" +
      "print(json.dumps(list(m.CACHE_PREFIXES)))\n";
    const r = spawnSync("python3", ["-c", py, join(f, "scripts", script)], { encoding: "utf-8" });
    expect(r.status, r.stderr).toBe(0);
    return JSON.parse(r.stdout) as string[];
  };

  for (const script of ["lake-cache-fetch-multi.py", "lake-cache-produce.py"]) {
    test(`${script}: the declared family first, then the built-in names`, () => {
      expect(prefixes(folio("my/lake-cache/"), script)).toEqual(["my/lake-cache/", ...BUILT_INS]);
    });

    test(`${script}: no declaration leaves the built-in names`, () => {
      expect(prefixes(folio(), script)).toEqual(BUILT_INS);
    });
  }
});

describe("lake-cache archive member-type whitelist (bean folio-assistant-8eyy)", () => {
  test("lake-cache-fetch.sh refuses a cache tarball containing a symlink", () => {
    const f = folio();
    const root = resolve(f, "..");
    const bare = join(root, "o.git");

    // Build a tarball containing .lake/ with a symlink member.
    const stage = join(root, "stage");
    mkdirSync(join(stage, ".lake", "packages", "mathlib", ".lake", "build", "lib"), { recursive: true });
    writeFileSync(join(stage, ".lake", "packages", "mathlib", ".lake", "build", "lib", "Foo.olean"), "x");
    spawnSync("ln", ["-s", "/etc/passwd", join(stage, ".lake", "evil-link")]);

    const wt = join(root, "cache-wt");
    mkdirSync(wt);
    spawnSync("git", ["init", "-q", "-b", BUILT_IN], { cwd: wt });
    spawnSync("git", ["config", "user.email", "t@t"], { cwd: wt });
    spawnSync("git", ["config", "user.name", "t"], { cwd: wt });
    spawnSync("tar", ["-czf", join(wt, "lake-oleans.tgz.part00"), "-C", stage, ".lake"]);
    spawnSync("git", ["add", "-A"], { cwd: wt });
    spawnSync("git", ["commit", "-qm", "symlink-cache"], { cwd: wt });
    spawnSync("git", ["remote", "add", "origin", bare], { cwd: wt });
    spawnSync("git", ["push", "-q", "origin", BUILT_IN], { cwd: wt });

    const r = spawnSync("bash", [join(f, "scripts", "lake-cache-fetch.sh")], { cwd: f, encoding: "utf-8" });
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("non-regular/non-directory entries");
  });

  test("lake-cache.sh refuses a split-tarball cache branch containing a symlink", () => {
    const f = folio();
    const root = resolve(f, "..");
    const bare = join(root, "o.git");
    const branch = "cat/folio-assistant-sci/lake-cache/testpkg-v4-24-0";

    writeFileSync(join(f, "lakefile.toml"), 'name = "testpkg"\n');

    const stage = join(root, "stage-lc");
    mkdirSync(join(stage, ".lake", "build", "lib", "lean", "TestPkg"), { recursive: true });
    writeFileSync(join(stage, ".lake", "build", "lib", "lean", "TestPkg", "Own0.olean"), "x");
    spawnSync("ln", ["-s", "/etc/passwd", join(stage, ".lake", "evil-link")]);

    const wt = join(root, "cache-wt-lc");
    mkdirSync(wt);
    spawnSync("git", ["init", "-q", "-b", branch], { cwd: wt });
    spawnSync("git", ["config", "user.email", "t@t"], { cwd: wt });
    spawnSync("git", ["config", "user.name", "t"], { cwd: wt });
    spawnSync("tar", ["-czf", join(wt, "lake-oleans.tgz.part00"), "-C", stage, ".lake"]);
    spawnSync("git", ["add", "-A"], { cwd: wt });
    spawnSync("git", ["commit", "-qm", "symlink-cache"], { cwd: wt });
    spawnSync("git", ["remote", "add", "origin", bare], { cwd: wt });
    spawnSync("git", ["push", "-q", "origin", branch], { cwd: wt });

    const lcScript = resolve(import.meta.dir, "..", "lake-cache.sh");
    const r = spawnSync("bash", [lcScript, "restore", "--package", "testpkg"], { cwd: f, encoding: "utf-8" });
    expect(r.status).toBe(3);
    expect(`${r.stdout}${r.stderr}`).toContain("non-regular/non-directory member");
  });

  test("lake-cache-fetch-multi.py refuses an archive containing a symlink or unsafe path", () => {
    const f = folio();
    const multiScript = resolve(import.meta.dir, "..", "lake-cache-fetch-multi.py");
    copyFileSync(multiScript, join(f, "scripts", "lake-cache-fetch-multi.py"));

    const stage = join(f, "stage-multi");
    mkdirSync(join(stage, ".lake", "packages", "mathlib"), { recursive: true });
    writeFileSync(join(stage, ".lake", "packages", "mathlib", "Foo.olean"), "x");
    spawnSync("ln", ["-s", "/etc/passwd", join(stage, ".lake", "evil-link")]);
    const evilTar = join(f, "evil.tar");
    spawnSync("tar", ["-cf", evilTar, "-C", stage, ".lake"]);

    const dest = join(f, "dest");
    mkdirSync(dest);
    const py =
      "import importlib.util, json, sys\n" +
      "from pathlib import Path\n" +
      "s = importlib.util.spec_from_file_location('m', sys.argv[1])\n" +
      "m = importlib.util.module_from_spec(s); s.loader.exec_module(m)\n" +
      "bad = m.validate_tar_archive(Path(sys.argv[2]))\n" +
      "ok = m.extract_tar_checked(Path(sys.argv[2]), Path(sys.argv[3]))\n" +
      "print(json.dumps({'bad': bad, 'ok': ok, 'extracted': (Path(sys.argv[3]) / '.lake').exists()}))\n";
    const r = spawnSync("python3", ["-c", py, join(f, "scripts", "lake-cache-fetch-multi.py"), evilTar, dest], { encoding: "utf-8" });
    expect(r.status, r.stderr).toBe(0);
    const res = JSON.parse(r.stdout) as { bad: string[]; ok: boolean; extracted: boolean };
    expect(res.ok).toBe(false);
    expect(res.extracted).toBe(false);
    expect(res.bad.some((b) => b.includes("non-regular/non-directory member"))).toBe(true);
  });
});
