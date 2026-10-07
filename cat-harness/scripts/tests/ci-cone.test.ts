/**
 * The CI cone (bean `4rbc`). A PR skips a check only when every path that
 * check's green run on main READ, and its `f017` fingerprint, are unchanged.
 *
 * Two halves:
 * - the trace parser, on synthetic `strace` text, so it runs everywhere;
 * - the falsifiers, end to end in a fixture repository under a real `strace`.
 *   Editing a traced file, the script, an imported module or the baseline
 *   must make the check RUN, and so must a file that a data-dependent read
 *   now reaches. Those tests need `strace` and say so when it is absent.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decideRun, excluded, gitReplayable, loadRecords, parseTrace, recordRun, splitArgs, unquote } from "../ci-cone.ts";
import { BUILD_OUTPUT_DIRS, TRACKED, type BaselineResolver, type PairIO } from "../input-hash.ts";
import { NOT_INSTANCE_DIRS } from "../../schemas/instance-roots.ts";
import { statementPin } from "../input-sites.ts";

const ROOT = "/work/repo";

describe("parseTrace — what a traced run read, or why that cannot be enumerated", () => {
  const read = (text: string) => parseTrace(text, ROOT);

  test("a read, a listing and an absent probe are all in the read set; paths outside the checkout are not", () => {
    const r = read(
      [
        `10 openat(AT_FDCWD</work/repo>, "data/a.json", O_RDONLY|O_CLOEXEC) = 3</work/repo/data/a.json>`,
        `10 openat(AT_FDCWD</work/repo>, "/work/repo/data", O_RDONLY|O_CLOEXEC|O_DIRECTORY) = 4</work/repo/data>`,
        `10 newfstatat(AT_FDCWD</work/repo>, "data/maybe.json", 0x7ffc, 0) = -1 ENOENT (No such file or directory)`,
        `10 openat(AT_FDCWD</work/repo>, "/usr/lib/libc.so.6", O_RDONLY|O_CLOEXEC) = 3</usr/lib/libc.so.6>`,
        `10 openat(AT_FDCWD</work/repo>, "/tmp/scratch", O_WRONLY|O_CREAT, 0644) = 5</tmp/scratch>`,
      ].join("\n"),
    );
    expect(r).toEqual({ paths: ["data", "data/a.json", "data/maybe.json"], git: [] });
  });

  test("a write inside the checkout is undetermined, never a read set", () => {
    const r = read(`10 openat(AT_FDCWD</work/repo>, "out.json", O_WRONLY|O_CREAT|O_TRUNC, 0644) = 3</work/repo/out.json>`);
    expect("undetermined" in r && r.undetermined).toContain("writes inside the checkout");
    expect("undetermined" in read(`10 unlink("/work/repo/x") = 0`)).toBe(true);
    expect("undetermined" in read(`10 mkdirat(AT_FDCWD</work/repo>, "d", 0755) = 0`)).toBe(true);
  });

  test("an unclassified path syscall is undetermined — never assumed harmless", () => {
    const r = read(`10 fanotify_mark(3, FAN_MARK_ADD, FAN_OPEN, AT_FDCWD</work/repo>, "x") = 0`);
    expect("undetermined" in r && r.undetermined).toContain("unclassified syscall fanotify_mark");
  });

  test("a relative path with no known directory is undetermined", () => {
    const r = read(`11 stat("data/a.json", 0x7ffc) = 0`);
    expect("undetermined" in r && r.undetermined).toContain("relative to a directory the trace does not name");
  });

  test("a relative path resolves against the cwd the trace showed, and a child inherits it", () => {
    const r = read(
      [
        `10 getcwd("/work/repo", 4096) = 11`,
        `10 vfork( <unfinished ...>`,
        `11 chdir("sub") = 0`,
        `10 <... vfork resumed>) = 11`,
        `11 stat("x.json", 0x7ffc) = 0`,
        `10 stat("y.json", 0x7ffc) = 0`,
      ].join("\n"),
    );
    expect(r).toEqual({ paths: ["sub", "sub/x.json", "y.json"], git: [] });
  });

  test("an unfinished call is joined to its resumption, and an fd-relative path resolves through -y", () => {
    const r = read(
      [
        `10 openat(5</work/repo/skills>, "a.md", O_RDONLY <unfinished ...>`,
        `12 openat(AT_FDCWD</work/repo>, "b.md", O_RDONLY) = 3</work/repo/b.md>`,
        `10 <... openat resumed>) = 6</work/repo/skills/a.md>`,
      ].join("\n"),
    );
    expect(r).toEqual({ paths: ["b.md", "skills/a.md"], git: [] });
  });

  test("a path strace truncated is undetermined", () => {
    const r = read(`10 stat("/work/repo/very-long"..., 0x7ffc) = 0`);
    expect("undetermined" in r).toBe(true);
  });

  test("git's own reads of .git are left out; the script's are kept", () => {
    const r = read(
      [
        `20 getcwd("/work/repo", 4096) = 11`,
        `20 execve("/usr/bin/git", ["git", "rev-parse", "--show-toplevel"], 0x1 /* 3 vars */) = 0`,
        `20 openat(AT_FDCWD</work/repo>, ".git/HEAD", O_RDONLY) = 3</work/repo/.git/HEAD>`,
        `10 openat(AT_FDCWD</work/repo>, ".git/config", O_RDONLY) = 3</work/repo/.git/config>`,
      ].join("\n"),
    );
    expect(r).toEqual({ paths: [".git/config"], git: [{ cwd: "", args: ["rev-parse", "--show-toplevel"] }] });
  });

  test("a git command is recorded for REPLAY only when it is read-only and takes no stdin", () => {
    expect(gitReplayable("", ["-C", "sub", "ls-files", "-z"])).toEqual({ cwd: "sub", args: ["ls-files", "-z"] });
    expect(gitReplayable("", ["--no-pager", "log", "-1"])).toEqual({ cwd: "", args: ["--no-pager", "log", "-1"] });
    for (const argv of [
      ["fetch", "origin"],
      ["add", "-A"],
      ["status", "--porcelain"],
      ["hash-object", "--stdin-paths"],
      ["cat-file", "--batch"],
      ["check-ignore", "--stdin"],
      ["config", "user.name", "x"],
      ["--git-dir=/elsewhere", "ls-files"],
      ["-C", "../other", "ls-files"],
    ]) {
      expect("undetermined" in gitReplayable("", argv)).toBe(true);
    }
  });

  test("a git command that cannot be replayed makes the whole read set undetermined", () => {
    const r = read([`20 getcwd("/work/repo", 4096) = 11`, `20 execve("/usr/bin/git", ["git", "fetch", "origin"], 0x1 /* 3 vars */) = 0`].join("\n"));
    expect("undetermined" in r && r.undetermined).toContain("git fetch");
  });

  test("the top-level node_modules is left out (bun.lock pins it); a nested one is kept (bean xd1g)", () => {
    expect(excluded("node_modules/zod/index.js", false)).toBe(true);
    expect(excluded("pkg/node_modules/x/index.js", false)).toBe(false);
    expect(excluded("build/ci-cone/records.json", false)).toBe(true);
    expect(excluded("build/regen-cache/traces/1.log", false)).toBe(true);
    expect(excluded("build/other.json", false)).toBe(false);
  });

  test("instance discovery skips exactly the build-output directories the tree digest leaves out", () => {
    expect([...NOT_INSTANCE_DIRS].sort()).toEqual([...BUILD_OUTPUT_DIRS].sort());
  });

  test("argument splitting respects quotes and brackets; escapes decode", () => {
    expect(splitArgs(`AT_FDCWD</a, b>, "x,y", {a=1, b=2}, 0`)).toEqual(["AT_FDCWD</a, b>", `"x,y"`, "{a=1, b=2}", "0"]);
    expect(unquote(`"a\\"b\\\\c"`)).toBe('a"b\\c');
    expect(unquote(`"abc"...`)).toBeUndefined();
  });
});

// ── End to end, under a real strace ────────────────────────────────────────

const HAS_STRACE = Bun.spawnSync(["strace", "-f", "-qq", "-o", "/dev/null", "true"], { stdout: "ignore", stderr: "ignore" }).exitCode === 0;

describe.skipIf(!HAS_STRACE)("the falsifiers, under a real strace (skipped where strace cannot run)", () => {
  let root: string;
  const scripts = {
    "x:check": "bun scripts/x.ts",
    "b:check": "bun scripts/x.ts --against main",
    "w:check": "bun scripts/w.ts",
    "red:check": "bun scripts/red.ts",
    "g:check": "bun scripts/g.ts",
  };
  const io: PairIO = { inputs: [TRACKED], outputs: [] };
  let baselineId = "entry-1";
  const baseline: BaselineResolver = () => ({ id: baselineId });
  const record = (script = "x:check") => recordRun({ root, scripts, script, io, baseline, sha: "mainsha", stdio: "ignore", runner: ["bun", "run"] });
  const decide = (script = "x:check") => decideRun({ root, scripts, script, io, baseline });
  const write = (rel: string, text: string) => writeFileSync(join(root, rel), text);

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "ci-cone-"));
    baselineId = "entry-1";
    for (const d of ["scripts", "data", "elsewhere"]) mkdirSync(join(root, d));
    write("package.json", JSON.stringify({ name: "fixture", scripts }));
    write("scripts/y.ts", "export const y = 1;\n");
    // Reads data/a.json, follows the file it names (a DATA-DEPENDENT read),
    // lists data/, and probes a path that does not exist.
    write(
      "scripts/x.ts",
      [
        'import { existsSync, readdirSync, readFileSync } from "node:fs";',
        'import { y } from "./y.ts";',
        'const a = JSON.parse(readFileSync("data/a.json", "utf-8"));',
        'readFileSync(a.next, "utf-8");',
        'readdirSync("data");',
        'existsSync("data/maybe.json");',
        "console.log(y);",
      ].join("\n") + "\n",
    );
    write("scripts/w.ts", 'import { writeFileSync } from "node:fs";\nwriteFileSync("data/out.txt", "x");\n');
    write("scripts/red.ts", "process.exit(1);\n");
    // Asks git for the tracked files under data/ (a `tree` site), annotated as the audit requires.
    write(
      "scripts/g.ts",
      [
        "// input-site: tree #PIN — ls-files: the index",
        'const r = Bun.spawnSync(["git", "ls-files", "data"], { stdout: "pipe" });',
        "console.log(r.stdout.toString());",
      ].join("\n") + "\n",
    );
    write("data/a.json", '{"next":"data/c.json"}\n');
    write("data/c.json", "c\n");
    write("data/d.json", "d\n");
    write("elsewhere/b.json", "{}\n");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const git = (...args: string[]) => Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  /** Pin the annotation in scripts/g.ts the way a reviewer would, then commit the fixture. */
  const gitFixture = () => {
    const lines = readFileSync(join(root, "scripts/g.ts"), "utf-8").split("\n");
    const pin = statementPin(lines, lines.findIndex((l) => l.includes("Bun.spawnSync")));
    write("scripts/g.ts", readFileSync(join(root, "scripts/g.ts"), "utf-8").replace("#PIN", `#${pin}`));
    git("init", "-q");
    git("add", "-A");
    git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "fixture");
  };

  test("a `tree` site: git's answer is replayed — a tracked file added under its pathspec makes it RUN, one elsewhere does not", () => {
    gitFixture();
    const r = record("g:check");
    expect(r.note).toStartWith("recorded");
    expect(Object.keys(loadRecords(root)!.checks["g:check"]!.git)).toEqual([JSON.stringify(["", "ls-files", "data"])]);
    expect(decide("g:check").skip).toBe(true);
    write("elsewhere/new.json", "{}\n");
    git("add", "elsewhere/new.json");
    expect(decide("g:check").skip).toBe(true);
    write("data/new.json", "{}\n");
    git("add", "data/new.json");
    expect(decide("g:check").skip).toBe(false);
  });

  test("a green run is recorded with what it read, and an untouched tree SKIPS", () => {
    const r = record();
    expect(r.code).toBe(0);
    expect(r.note).toStartWith("recorded");
    const reads = Object.keys(loadRecords(root)!.checks["x:check"]!.reads);
    for (const p of ["data/a.json", "data/c.json", "data", "data/maybe.json", "scripts/x.ts", "scripts/y.ts", "package.json"]) {
      expect(reads).toContain(p);
    }
    expect(reads).not.toContain("elsewhere/b.json");
    const d = decide();
    expect(d.skip).toBe(true);
    expect(d.skip && d.sha).toBe("mainsha");
  });

  test("THE CONE: a change to a file the check never read does not make it run", () => {
    record();
    write("elsewhere/b.json", '{"changed":true}\n');
    write("elsewhere/new.json", "{}\n");
    expect(decide().skip).toBe(true);
  });

  test.each([
    ["a traced file edited", () => write("data/c.json", "changed\n")],
    ["a file a data-dependent read now reaches", () => write("data/a.json", '{"next":"data/d.json"}\n')],
    ["a probed absent path created", () => write("data/maybe.json", "{}\n")],
    ["a new file in a listed directory", () => write("data/e.json", "{}\n")],
    ["the script itself edited", () => write("scripts/x.ts", readFileSync(join(root, "scripts/x.ts"), "utf-8") + "\n// edit\n")],
    ["a module it IMPORTS edited", () => write("scripts/y.ts", "export const y = 2;\n")],
    ["package.json edited (bun reads it to run the check)", () => write("package.json", JSON.stringify({ name: "fixture2", scripts }))],
  ])("%s → it RUNS", (_name, change) => {
    record();
    expect(decide().skip).toBe(true);
    change();
    expect(decide().skip).toBe(false);
  });

  test("a moved --against baseline makes it run, though no file changed", () => {
    expect(record("b:check").note).toStartWith("recorded");
    expect(decide("b:check").skip).toBe(true);
    baselineId = "entry-2";
    expect(decide("b:check").skip).toBe(false);
  });

  test("a check that writes inside the checkout records nothing, so it always runs", () => {
    const r = record("w:check");
    expect(r.note).toContain("writes inside the checkout");
    expect(decide("w:check").skip).toBe(false);
  });

  test("a red run records nothing, keeps its own exit code, and forgets an earlier pass", () => {
    const r = record("red:check");
    expect(r.code).toBe(1);
    expect(r.note).toContain("re-run untraced, which exited 1");
    expect(decide("red:check").skip).toBe(false);
  });

  test("not {tracked} in task-io: not a candidate, so it runs untraced and never skips", () => {
    const r = recordRun({ root, scripts, script: "x:check", io: { outputs: [] }, baseline, sha: "s", stdio: "ignore", runner: ["bun", "run"] });
    expect(r.code).toBe(0);
    expect(r.note).toContain("not a candidate");
    expect(decideRun({ root, scripts, script: "x:check", io: { outputs: [] }, baseline }).skip).toBe(false);
  });

  test("no record, or a record from another tracer version, means run", () => {
    expect(decide().skip).toBe(false);
    record();
    const path = join(root, "build", "ci-cone", "records.json");
    const rec = JSON.parse(readFileSync(path, "utf-8"));
    writeFileSync(path, JSON.stringify({ ...rec, version: -1 }));
    expect(decide().skip).toBe(false);
  });
});

test("strace availability is reported, not hidden", () => {
  // The falsifier block above is skipped where strace cannot run. Say which
  // happened here, so a green run without strace is not read as one with it.
  console.log(`ci-cone.test: strace ${HAS_STRACE ? "available, falsifiers ran" : "NOT available, falsifiers skipped"}`);
  expect(typeof HAS_STRACE).toBe("boolean");
});
