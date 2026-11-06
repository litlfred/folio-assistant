/**
 * `.github/scripts/pr-test-scope.ts` and `pr-bun-test.sh`: a pull request runs
 * only the `bun test` files its change can affect, and an unaffected shard says
 * "skipped — not affected", never a pass.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { parse } from "yaml";

import { computeScope, expand, judgeRefusesScopedReuse, lockChanges, nameOf, scopeFor, shareOf, testsNaming } from "../../.github/scripts/pr-test-scope.ts";

const ROOT = resolve(import.meta.dir, "../..");

const inst = (name: string, sha: string, dirs: { path: string; upstreamPath: string; treeDigest: string }[], extra: object = {}) => ({
  instance: name,
  repository: `o/${name}`,
  sha,
  upstreamRoot: "",
  path: name,
  declaration: { file: `${name}.json`, sha256: "d0" },
  directories: dirs,
  ...extra,
});

describe("lockChanges", () => {
  const whole = (sha: string, dg: string) => inst("a", sha, [{ path: "a", upstreamPath: ".", treeDigest: dg }]);
  const partial = (sha: string, dg: string) => inst("b", sha, [{ path: "b/lib", upstreamPath: "library", treeDigest: dg }]);

  test("maps the upstream diff of a re-pinned whole mount under its path", () => {
    const diff = () => ["scripts/x.ts", "README.md"];
    expect(lockChanges({ instances: [whole("s1", "g1")] }, { instances: [whole("s2", "g2")] }, diff)).toEqual(["a/scripts/x.ts", "a/README.md"]);
  });

  test("maps a partial mount's upstreamPath to its mounted path, and drops files outside it", () => {
    const diff = () => ["library/y.ts", "other/z.ts"];
    expect(lockChanges({ instances: [partial("s1", "g1")] }, { instances: [partial("s2", "g2")] }, diff)).toEqual(["b/lib/y.ts"]);
  });

  test("an unchanged digest is not a change, whatever the sha", () => {
    const diff = () => ["scripts/x.ts"];
    expect(lockChanges({ instances: [whole("s1", "g1")] }, { instances: [whole("s2", "g1")] }, diff)).toEqual([]);
  });

  test("an unreadable upstream diff counts the whole directory", () => {
    expect(lockChanges({ instances: [whole("s1", "g1")] }, { instances: [whole("s2", "g2")] }, () => undefined)).toEqual(["a/"]);
  });

  test("a different instance set selects everything", () => {
    expect(lockChanges({ instances: [whole("s1", "g1")] }, { instances: [whole("s1", "g1"), partial("s1", "g1")] }, () => [])).toEqual({
      all: "the lock mounts a different set of instances",
    });
  });

  test("a changed declaration or asset is a changed file", () => {
    const b = { ...whole("s1", "g1"), assets: [{ src: "AGENTS.md", sha256: "1" }] };
    const h = { ...whole("s1", "g1"), declaration: { file: "a.json", sha256: "d1" }, assets: [{ src: "AGENTS.md", sha256: "2" }] };
    expect(lockChanges({ instances: [b] }, { instances: [h] }, () => [])).toEqual(["a/a.json", "a/AGENTS.md"]);
  });
});

describe("selection", () => {
  const tree = () => {
    const root = mkdtempSync(join(tmpdir(), "pr-scope-test-"));
    mkdirSync(join(root, "lib"));
    writeFileSync(join(root, "lib/x.ts"), "export const x = 1;\n");
    writeFileSync(join(root, "a.test.ts"), 'import { x } from "./lib/x.ts";\n');
    writeFileSync(join(root, "b.test.ts"), 'const f = "fixtures/pick-me.yml";\n');
    writeFileSync(join(root, "c.test.ts"), "// unrelated\n");
    return root;
  };
  const mod = {
    testFilesUnder: () => ["a.test.ts", "b.test.ts", "c.test.ts"],
    affectedTests: (_r: string, changed: readonly string[]) =>
      changed.some((c) => c === "bun.lock")
        ? ({ kind: "all", why: "bun.lock" } as const)
        : ({ kind: "some", files: changed.includes("lib/x.ts") ? ["a.test.ts"] : [], why: changed.includes("lib/x.ts") ? { "a.test.ts": "imports lib/x.ts" } : {} } as const),
  };

  test("a test that names a changed fixture is selected beside the import closure", () => {
    const s = scopeFor(tree(), ["lib/x.ts", "fixtures/pick-me.yml"], mod);
    expect(s.kind === "some" && s.files).toEqual(["a.test.ts", "b.test.ts"]);
  });

  test("a directory prefix expands to the files under it", () => {
    const root = tree();
    expect(expand(root, ["lib/", "gone.ts"])).toEqual(["gone.ts", "lib/x.ts"]);
    const s = scopeFor(root, ["lib/"], mod);
    expect(s.kind === "some" && s.files).toEqual(["a.test.ts"]);
  });

  test("index.config.json and the selector's own 'all' select everything", () => {
    expect(scopeFor(tree(), ["index.config.json"], mod).kind).toBe("all");
    expect(scopeFor(tree(), ["bun.lock"], mod).kind).toBe("all");
  });

  test("a generic basename is matched with its parent", () => {
    expect(nameOf("smart-base/README.md")).toBe("smart-base/README.md");
    expect(nameOf(".github/workflows/code-quality-gates.yml")).toBe("code-quality-gates.yml");
    expect(testsNaming(tree(), ["x/README.md"], ["c.test.ts"])).toEqual({});
  });

  test("the shards split the selection with nothing lost or doubled", () => {
    const files = ["e", "a", "d", "c", "b"];
    const shares = [1, 2, 3, 4].map((k) => shareOf(files, k, 4));
    expect(shares.flat().sort()).toEqual([...files].sort());
    expect(shares[3]).toEqual(["d"]);
    expect(shareOf(["a"], 2, 4)).toEqual([]);
  });
});

describe("the selection waits for the judge that refuses to reuse it (#2963)", () => {
  test("a judge without SCOPED_STEP selects everything, whatever else is present", async () => {
    const root = mkdtempSync(join(tmpdir(), "pr-scope-judge-"));
    mkdirSync(join(root, ".github/scripts"), { recursive: true });
    writeFileSync(join(root, ".github/scripts/cqg_judge.py"), "RUNS_SCANNED = 30\n");
    expect(judgeRefusesScopedReuse(root)).toBe(false);
    const s = await computeScope(root, () => []);
    expect(s.kind).toBe("all");
    expect(s.kind === "all" && s.why).toContain("#2963");
  });
  test("a judge with SCOPED_STEP lets the selection proceed", () => {
    const root = mkdtempSync(join(tmpdir(), "pr-scope-judge-"));
    mkdirSync(join(root, ".github/scripts"), { recursive: true });
    writeFileSync(join(root, ".github/scripts/cqg_judge.py"), 'SCOPED_STEP = "bash .github/scripts/pr-bun-test.sh"\n');
    expect(judgeRefusesScopedReuse(root)).toBe(true);
  });
});

describe("pr-bun-test.sh", () => {
  const run = (scope: object | undefined, shard: number) => {
    const dir = mkdtempSync(join(tmpdir(), "pr-bun-test-"));
    const summary = join(dir, "summary.md");
    writeFileSync(summary, "");
    // A `bun` shim that records `bun test`'s arguments instead of running it:
    // nothing under test may spawn `bun test` itself (see the shard job's
    // comment in code-quality-gates.yml), and every other `bun` passes through.
    const bin = join(dir, "bin");
    mkdirSync(bin);
    writeFileSync(join(bin, "bun"), `#!/usr/bin/env bash\nif [ "$1" = test ]; then shift; echo "BUN_OPTIONS=[$BUN_OPTIONS] bun test $*"; exit 0; fi\nexec "${process.execPath}" "$@"\n`, { mode: 0o755 });
    const env: Record<string, string> = { ...process.env, PATH: `${bin}:${process.env.PATH}`, BUN_OPTIONS: "--shard=1/4 --reporter=junit", GITHUB_STEP_SUMMARY: summary } as Record<string, string>;
    // In CI this test itself runs inside the selection step, whose own
    // CQG_TEST_SCOPE would otherwise leak into the "no scope" case.
    delete env.CQG_TEST_SCOPE;
    if (scope) {
      writeFileSync(join(dir, "scope.json"), JSON.stringify(scope));
      env.CQG_TEST_SCOPE = join(dir, "scope.json");
    }
    const r = spawnSync("bash", [join(ROOT, ".github/scripts/pr-bun-test.sh"), String(shard), "4"], { cwd: ROOT, env, encoding: "utf-8" });
    return { status: r.status, out: r.stdout + r.stderr, summary: readFileSync(summary, "utf-8") };
  };

  test("an empty share runs nothing and says 'skipped — not affected', not a pass", () => {
    const r = run({ kind: "some", files: ["test/workflows/bun-pin.test.ts"], why: {}, changed: [] }, 2);
    expect(r.status).toBe(0);
    expect(r.summary).toContain("skipped — not affected");
    expect(r.summary).toContain("This is not a pass");
  });

  test("a share runs only its files, with --shard dropped and the reporter kept", () => {
    const files = ["t/a.test.ts", "t/b.test.ts", "t/c.test.ts", "t/d.test.ts", "t/e.test.ts"];
    const r = run({ kind: "some", files, why: { "t/a.test.ts": "the test file itself changed" }, changed: [] }, 1);
    expect(r.status).toBe(0);
    expect(r.out).toContain("BUN_OPTIONS=[ --reporter=junit] bun test ./t/a.test.ts ./t/e.test.ts");
    expect(r.summary).toContain("2 of 5 affected test file(s)");
  });

  test("no scope, or 'all', runs the whole suite sharded as before", () => {
    expect(run(undefined, 3).out).toContain("BUN_OPTIONS=[--shard=1/4 --reporter=junit] bun test \n");
    const r = run({ kind: "all", why: "bun.lock is part of what every test runs under" }, 3);
    expect(r.out).toContain("bun test \n");
    expect(r.summary).toContain("the whole suite (bun.lock is part of what every test runs under)");
  });

  test("--scope never fails and reports 'all' when it cannot select", () => {
    const dir = mkdtempSync(join(tmpdir(), "pr-scope-cli-"));
    const out = join(dir, "out");
    writeFileSync(out, "");
    // An empty directory: no checkout, no affected-tests module.
    const r = spawnSync("bash", [join(ROOT, ".github/scripts/pr-bun-test.sh"), "--scope"], {
      cwd: dir,
      env: { ...process.env, CQG_TEST_SCOPE: join(dir, "scope.json"), GITHUB_OUTPUT: out, GITHUB_STEP_SUMMARY: join(dir, "s.md") },
      encoding: "utf-8",
    });
    expect(r.status).toBe(0);
    expect(readFileSync(out, "utf-8")).toBe("kind=all\n");
  });

  test("the shard job selects on a pull request, and exactly one bun-test step gives the verdict", () => {
    const wf = parse(readFileSync(join(ROOT, ".github/workflows/code-quality-gates.yml"), "utf-8")) as {
      jobs: Record<string, { steps: { id?: string; name?: string; if?: string; run?: string; env?: Record<string, string> }[] }>;
    };
    const steps = wf.jobs["typescript-test"]!.steps;
    const scope = steps.find((s) => s.id === "scope")!;
    expect(scope.if).toContain("github.event_name == 'pull_request'");
    // A train PR is the only CI its members get before landing: it runs the
    // whole suite, and a skipped scope step leaves `kind` empty, which the
    // last step reads as "the whole suite".
    expect(scope.if).toContain("!startsWith(github.head_ref, 'merge-train/')");
    expect(scope.if).toContain("!startsWith(github.head_ref, 'repin-train/')");
    expect(scope.run).toBe("bash .github/scripts/pr-bun-test.sh --scope");
    const some = steps.find((s) => s.run === "bash .github/scripts/pr-bun-test.sh ${{ matrix.shard }} 4")!;
    const all = steps.at(-1)!;
    expect(all.run).toBe("bun test");
    expect(some.if).toBe("${{ steps.scope.outputs.kind == 'some' }}");
    expect(all.if).toBe("${{ steps.scope.outputs.kind != 'some' }}");
    expect(some.env?.CQG_VERDICT).toBe("true");
    expect(all.env?.CQG_VERDICT).toBe("true");
    expect(some.env?.BUN_OPTIONS).not.toContain("--shard");
    // folio-assistant#2963's contract: cqg_judge marks this step's record as
    // "scoped" from CQG_TESTS + CQG_TEST_SCOPE and refuses to reuse a run whose
    // label starts with `bash .github/scripts/pr-bun-test.sh`, so a push to main
    // never skips the full suite on a PR's partial run.
    expect(some.env?.CQG_TESTS).toBe("bun");
    expect(some.env?.CQG_TEST_SCOPE).toBe("${{ runner.temp }}/test-scope.json");
    expect(some.run!.startsWith("bash .github/scripts/pr-bun-test.sh")).toBe(true);
  });
});
