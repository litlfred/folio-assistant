/**
 * qa-refresh and the publish's completeness guard — bean `3hk4`, a blocker of
 * `5hox` (arc `3fva`).
 *
 * What is pinned:
 *
 * - the declaration: every writer names a runnable script, writes only under
 *   a declared `qa` directory, and one representative path per family (from
 *   the 2026-10-02 inventory) is claimed by exactly one writer;
 * - the completeness rule: an unclaimed file, an empty family, a failed writer
 *   or an empty tree is INCOMPLETE, and an exit a writer declares as normal is
 *   not a failure;
 * - the mode: a checkout that tracks files under a `qa` directory is `tracked`
 *   (nothing runs), one that does not is `computed`;
 * - the publish: an incomplete report, a missing one under `--github`, and a
 *   tree that changed after it was accounted for are each refused with nothing
 *   written to the branch.
 *
 * The publish half runs against a real bare repository over `file://`, as
 * `qa-store.test.ts` does. Nothing here reads the checkout's `test/results/`,
 * so it runs the same with the results present or absent.
 *
 * @module scripts/tests/qa-refresh
 */
import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { QA_WRITERS, assess, claimants, globToRegExp, trackedQaFiles, type QaWriter } from "../qa-refresh.ts";
import { clearQaCache, publishQa, readQaManifest, refreshReportComplete, REFRESH_SCHEMA, type QaStoreOptions } from "../../../cat-harness/scripts/qa-store.ts";
import { movedRoots, type MovedInventory } from "../../../cat-harness/scripts/qa-verify-moved.ts";
import { HARNESS_ROOT } from "../lib/roots.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const STORE_CLI = join(HARNESS_ROOT, "scripts", "qa-store.ts");
const NOGPG = ["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@t"];
const SHA = "d".repeat(40);
const T = 60_000;

const made: string[] = [];
afterEach(() => {
  clearQaCache();
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

function tmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), `qa-refresh-${prefix}-`));
  made.push(d);
  return d;
}

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", [...NOGPG, ...args], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.status}\n${r.stderr}`);
  return r.stdout;
}

function inventory(paths: string[]): MovedInventory {
  return { directories: [{ path: "x", files: paths.map((p) => ({ path: p, bytes: 1 })) }], files: paths.length, bytes: paths.length };
}

describe("the declaration", () => {
  test("ids are unique, and every writer names a script package.json or the tree has", () => {
    const ids = QA_WRITERS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    const scripts = (JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as { scripts: Record<string, string> }).scripts;
    for (const w of QA_WRITERS) {
      if (w.run === "external") continue;
      const head = w.run[0]!;
      expect(scripts[head] !== undefined || existsSync(join(REPO, head)), `${w.id}: \`${head}\` is neither an npm script nor a file`).toBe(true);
    }
  });

  test("every family is under a declared qa directory — a writer cannot claim outside the record", () => {
    const roots = movedRoots(REPO);
    expect(roots.length).toBeGreaterThan(0);
    for (const w of QA_WRITERS) {
      for (const g of w.writes) {
        const fixed = g.split("*")[0]!;
        const underOne = roots.some((r) => fixed.startsWith(`${r}/`)) || /^\*\/test\/results\//.test(g);
        expect(underOne, `${w.id}: ${g}`).toBe(true);
      }
    }
  });

  test("one path per family of the 2026-10-02 inventory is claimed by exactly one writer", () => {
    // Measured from `qa:verify-moved --inventory` on the files-present tree.
    const sample: Record<string, string> = {
      "cat-harness/test/results/kg-qa/skills/editor/SKILL.kg-qa.json": "kg:audit:all",
      "smart-base/test/results/kg-qa/scenarios/kg.kg-qa.json": "kg:audit:all",
      "who-iris/test/results/kg-qa.manifest.json": "kg:audit:all",
      "cat-harness/test/results/bootstrap/kg-qa.manifest.json": "kg:audit:all",
      "cat-harness/test/results/bootstrap-tools/kg-qa/skills/x.kg-qa.json": "kg:audit:all",
      "cat-harness/test/results/cat-harness-tools/kg-qa/scenarios/kg.kg-qa.json": "kg:audit:all",
      "cat-harness/test/results/detangle/cat-harness/schemas.detangle.json": "kg:detangle",
      "cat-harness/test/results/translation-qa/content/docs/x/overview.fr.translation-qa.json": "translation:block-qa",
      "cat-harness/test/results/block-qa/content/docs/agentic-harness/overview.qa.json": "qa-sweep:docs",
      "cat-harness/test/results/library-qa/9789240010567-eng.qa-results.json": "check:l1-complete",
      "cat-harness/test/results/lsi/cat-harness/skills.lsi.json": "lsi:index:cat-harness:skills",
      "cat-harness/test/results/tool-runs/lsi-index/who-iris/library.tool-run.json": "lsi:index:who-iris:library",
      "cat-harness/test/results/lsi-need-an-index.qa-results.json": "lsi:audit",
      "cat-harness/test/results/witnesses/skills/index.json": "docs:pages",
      "cat-harness/test/results/viewer-nav/viewer-nav.qa.json": "viewer:nav:audit",
      "cat-harness/test/results/crdm-detect-eval.test-run.json": "eval:crdm-detect",
      "cat-harness/test/results/skill-register.qa-results.json": "skill:register",
      "cat-harness/test/results/reference-direction.qa-results.json": "check:reference-direction",
      "cat-harness/test/results/kg-export.bootstrap.qa-results.json": "kg-export:bootstrap",
      "cat-harness/test/results/kg-export.qa-results.json": "kg:export",
      "cat-harness/test/results/audit-coverage.qa-results.json": "audit:coverage",
      "cat-harness/test/results/subgraph-readmes.qa-results.json": "readme:subgraphs",
    };
    for (const [path, id] of Object.entries(sample)) expect(claimants(path), path).toEqual([id]);
  });

  test("no writer claims a README inside a `qa` directory any more (bean `f3bh`)", () => {
    // `readme:subgraphs` skips a stored directory, so a README there would be
    // a file nobody produces — and `qa:refresh` must say so, not store it.
    expect(claimants("smart-dak/test/results/README.md")).toEqual([]);
    expect(claimants("cat-harness/test/results/README.md")).toEqual([]);
  });

  test("the two folded instances' orphans are claimed by nobody — the record loses them, and says so", () => {
    expect(claimants("cat-harness/test/results/agent-skills/kg-qa/scenarios/kg.kg-qa.json")).toEqual([]);
    expect(claimants("cat-harness/test/results/large-datasets/kg-qa.manifest.json")).toEqual([]);
  });

  test("globs: `*` is one segment, `**` any depth, and dots are literal", () => {
    expect(globToRegExp("*/test/results/README.md").test("smart-l1/test/results/README.md")).toBe(true);
    expect(globToRegExp("*/test/results/README.md").test("a/b/test/results/README.md")).toBe(false);
    expect(globToRegExp("a/**").test("a/b/c/d.json")).toBe(true);
    expect(globToRegExp("a/x.json").test("a/xxjson")).toBe(false);
  });
});

describe("completeness", () => {
  const W: QaWriter[] = [
    { id: "one", run: ["one"], writes: ["r/one/**"], because: "t" },
    { id: "two", run: ["two"], writes: ["r/two.json"], okExits: [0, 1], because: "t" },
  ];
  const ok = [
    { id: "one", exit: 0, seconds: 1 },
    { id: "two", exit: 1, seconds: 1 },
  ];

  test("every family written, every file claimed, every exit declared: COMPLETE", () => {
    const r = assess({ mode: "computed", inventory: inventory(["r/one/a.json", "r/one/b/c.json", "r/two.json"]), runs: ok, writers: W });
    expect(r.complete).toBe(true);
    expect(r.families).toEqual({ one: 2, two: 1 });
    expect(r.reasons).toEqual([]);
    expect(refreshReportComplete(r).ok).toBe(true);
  });

  test("a file no writer claims is INCOMPLETE — the declaration is out of date", () => {
    const r = assess({ mode: "computed", inventory: inventory(["r/one/a.json", "r/two.json", "r/stray.json"]), runs: ok, writers: W });
    expect(r.complete).toBe(false);
    expect(r.unclaimed).toEqual(["r/stray.json"]);
  });

  test("a writer that produced nothing is INCOMPLETE, even when it exited 0", () => {
    const r = assess({ mode: "computed", inventory: inventory(["r/one/a.json"]), runs: ok, writers: W });
    expect(r.complete).toBe(false);
    expect(r.empty).toEqual(["two"]);
  });

  test("a writer that exited outside its okExits is INCOMPLETE, and a killed one (null) too", () => {
    const files = inventory(["r/one/a.json", "r/two.json"]);
    expect(assess({ mode: "computed", inventory: files, runs: [{ id: "one", exit: 2, seconds: 1 }, ok[1]!], writers: W }).failed).toEqual(["one"]);
    expect(assess({ mode: "computed", inventory: files, runs: [ok[0]!, { id: "two", exit: null, seconds: 1 }], writers: W }).failed).toEqual(["two"]);
  });

  test("an empty tree is never complete, in either mode", () => {
    expect(assess({ mode: "tracked", inventory: inventory([]), runs: [], writers: W }).complete).toBe(false);
    expect(assess({ mode: "computed", inventory: inventory([]), runs: ok, writers: W }).complete).toBe(false);
  });

  test("tracked: the commit's own copy is the record — no family is required of it", () => {
    const r = assess({ mode: "tracked", inventory: inventory(["anything/at/all.json"]), runs: [], writers: W });
    expect(r.complete).toBe(true);
    expect(r.families).toEqual({});
  });

  test("the publish's reading: foreign or incomplete reports are refused with their reason", () => {
    expect(refreshReportComplete(undefined).ok).toBe(false);
    expect(refreshReportComplete({ $schema: "other" }).ok).toBe(false);
    const bad = refreshReportComplete({ $schema: REFRESH_SCHEMA, files: 3, reasons: ["1 writer(s) failed: one"], complete: false });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toContain("failed: one");
  });
});

describe("mode, from what version control tracks", () => {
  test("tracked files under a root → tracked; an ignored working copy alone → computed", () => {
    const work = tmp("mode");
    git(work, "init", "-q", "-b", "main");
    mkdirSync(join(work, "i/test/results"), { recursive: true });
    writeFileSync(join(work, "i/test/results/a.json"), "{}\n");
    expect(trackedQaFiles(work, ["i/test/results"])).toEqual([]);
    git(work, "add", "i/test/results/a.json");
    expect(trackedQaFiles(work, ["i/test/results"])).toEqual(["i/test/results/a.json"]);
  });
});

// ── The publish refuses what is not complete ───────────────────────────────

function storeFixture(): { work: string; container: (n: string) => QaStoreOptions; bare: string } {
  const base = tmp("store");
  const bare = join(base, "remote.git");
  git(base, "init", "-q", "--bare", "-b", "main", bare);
  git(bare, "config", "uploadpack.allowFilter", "true");
  git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");
  const work = join(base, "work");
  mkdirSync(join(work, "inst/test/results"), { recursive: true });
  git(work, "init", "-q", "-b", "main");
  for (const f of ["a.json", "b.json"]) writeFileSync(join(work, "inst/test/results", f), `{"f":"${f}"}\n`);
  return {
    work,
    bare,
    container: (n) => ({ repoRoot: work, remote: `file://${bare}`, branch: "qa-reports", storeDir: join(base, `${n}.store.git`), sleep: () => {}, log: () => {} }),
  };
}

function branchExists(bare: string): boolean {
  return spawnSync("git", ["rev-parse", "--verify", "-q", "refs/heads/qa-reports"], { cwd: bare }).status === 0;
}

describe("qa:publish --completeness", () => {
  test(
    "a report that accounts for the tree is carried into the manifest",
    () => {
      const f = storeFixture();
      const completeness = { mode: "computed", files: 2, families: { one: 2 } };
      const r = publishQa({ ref: `main/${SHA}`, roots: ["inst/test/results"], completeness }, f.container("w"));
      expect(r.state).toBe("published");
      clearQaCache();
      const m = readQaManifest(`main/${SHA}`, f.container("r"));
      expect(m.state).toBe("hit");
      if (m.state === "hit") expect(m.manifest.completeness).toEqual(completeness);
    },
    T,
  );

  test(
    "a tree that changed after it was accounted for is INCOMPLETE, and nothing is written",
    () => {
      const f = storeFixture();
      const r = publishQa({ ref: `main/${SHA}`, roots: ["inst/test/results"], completeness: { mode: "computed", files: 3, families: {} } }, f.container("w"));
      expect(r.state).toBe("incomplete");
      expect(branchExists(f.bare)).toBe(false);
    },
    T,
  );

  test(
    "CLI: an INCOMPLETE report is refused (exit 4) and the branch is untouched",
    () => {
      const f = storeFixture();
      const report = join(f.work, "..", "report.json");
      writeFileSync(report, JSON.stringify({ $schema: REFRESH_SCHEMA, mode: "computed", files: 2, families: {}, reasons: ["1 writer(s) produced nothing: two"], complete: false }));
      const env = { ...process.env, QA_STORE_DIR: join(f.work, "..", "cli.store.git") };
      const r = spawnSync("bun", [STORE_CLI, "publish", "--ref", `main/${SHA}`, "--root", "inst/test/results", "--remote", `file://${f.bare}`, "--branch", "qa-reports", "--completeness", report], { cwd: f.work, encoding: "utf-8", env });
      expect(r.status).toBe(4);
      expect(r.stderr).toContain("INCOMPLETE");
      expect(r.stderr).toContain("produced nothing");
      expect(branchExists(f.bare)).toBe(false);
    },
    T,
  );

  test(
    "CLI: --github with no report is refused — a CI publish states what produced its tree",
    () => {
      const f = storeFixture();
      const event = join(f.work, "..", "event.json");
      writeFileSync(event, "{}");
      const env = {
        ...process.env,
        QA_STORE_DIR: join(f.work, "..", "cli.store.git"),
        GITHUB_EVENT_NAME: "push",
        GITHUB_REF: "refs/heads/main",
        GITHUB_SHA: SHA,
        GITHUB_EVENT_PATH: event,
      };
      const r = spawnSync("bun", [STORE_CLI, "publish", "--github", "--root", "inst/test/results", "--remote", `file://${f.bare}`, "--branch", "qa-reports"], { cwd: f.work, encoding: "utf-8", env });
      expect(r.status).toBe(4);
      expect(r.stderr).toContain("--completeness");
      expect(branchExists(f.bare)).toBe(false);
    },
    T,
  );
});
