/**
 * qa-store on REAL git repositories — a bare remote reached over `file://`,
 * a fresh private store per simulated container, and a work directory laid
 * out like a checkout. No mocks: the states that matter (a rejected push, a
 * lost race, a payload that does not match its manifest) are things a remote
 * does, and stubbing git would only test the stub. `520m`'s practice.
 *
 * Nothing here touches the network: the remote is a local bare repository
 * with `uploadpack.allowFilter` and `allowAnySHA1InWant` set, which is what
 * GitHub offers and what the reader's one-batch blob fetch needs.
 *
 * @module scripts/tests/qa-store
 */
import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  clearQaCache,
  fetchQa,
  githubPublishDecision,
  keyPath,
  parseQaKey,
  parseQaRef,
  pickQaBranch,
  planPrune,
  publishQa,
  pruneQa,
  QA_EXIT,
  qaBranchCandidates,
  QaUsageError,
  readQa,
  readQaManifest,
  readQaTree,
  type QaStoreOptions,
} from "../qa-store.js";

const SCRIPT = join(import.meta.dir, "..", "qa-store.ts");
const NOGPG = ["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@t"];
const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);
const SHA_C = "c".repeat(40);
const RESULTS = "cat-harness/test/results";

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", [...NOGPG, ...args], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.status}\n${r.stderr}`);
  return r.stdout;
}

const made: string[] = [];
afterEach(() => {
  clearQaCache();
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

interface Fixture {
  base: string;
  bare: string;
  url: string;
  work: string;
  /** Options for a fresh simulated container with its own private store. */
  container: (name: string, extra?: Partial<QaStoreOptions>) => QaStoreOptions;
  write: (rel: string, text: string) => void;
}

function fixture(): Fixture {
  const base = mkdtempSync(join(tmpdir(), "qa-store-t-"));
  made.push(base);
  const bare = join(base, "remote.git");
  git(base, "init", "-q", "--bare", "-b", "main", bare);
  git(bare, "config", "uploadpack.allowFilter", "true");
  git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");
  const url = `file://${bare}`;
  const work = join(base, "work");
  mkdirSync(work);
  git(work, "init", "-q", "-b", "main");
  const write = (rel: string, text: string) => {
    mkdirSync(dirname(join(work, rel)), { recursive: true });
    writeFileSync(join(work, rel), text);
  };
  write(`${RESULTS}/kg-qa/skills/a.kg-qa.json`, '{"verdict":"pass"}\n');
  write(`${RESULTS}/kg-qa/skills/b.kg-qa.json`, '{"verdict":"fail"}\n');
  write(`${RESULTS}/audit-coverage.qa-results.json`, '{"rows":3}\n');
  write("other/test/results/x.qa-results.json", '{"other":true}\n');
  return {
    base,
    bare,
    url,
    work,
    write,
    container: (name, extra = {}) => ({
      repoRoot: work,
      remote: url,
      branch: "cat/cat-harness/qa-reports",
      storeDir: join(base, `${name}.store.git`),
      sleep: () => {},
      log: () => {},
      ...extra,
    }),
  };
}

/** A full clone of the branch, edited and pushed — how a test damages the store. */
function tamper(f: Fixture, edit: (dir: string) => void): void {
  clearQaCache();
  const dir = join(f.base, `tamper-${Math.random().toString(36).slice(2)}`);
  git(f.base, "clone", "-q", "-b", "cat/cat-harness/qa-reports", f.url, dir);
  edit(dir);
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "tamper");
  git(dir, "push", "-q", "origin", "HEAD:refs/heads/cat/cat-harness/qa-reports");
}

function cli(args: string[], env: Record<string, string> = {}): { code: number; out: string; err: string } {
  const r = spawnSync("bun", [SCRIPT, ...args], { encoding: "utf-8", env: { ...process.env, ...env } });
  return { code: r.status ?? -1, out: r.stdout, err: r.stderr };
}

const T = 60_000;

describe("keys and refs", () => {
  test("a write key needs a full sha; a read ref may be newest-of or a prefix", () => {
    expect(keyPath(parseQaKey(`main/${SHA_A}`))).toBe(`main/${SHA_A}`);
    expect(keyPath(parseQaKey(`pr/12/${SHA_A}`))).toBe(`pr/12/${SHA_A}`);
    expect(() => parseQaKey("main/abc1234")).toThrow(QaUsageError);
    expect(() => parseQaKey(`pr/0/${SHA_A}`)).toThrow(QaUsageError);
    expect(parseQaRef("main")).toEqual({ kind: "main-latest" });
    expect(parseQaRef("abc1234")).toEqual({ kind: "main", sha: "abc1234" });
    expect(parseQaRef("pr/7")).toEqual({ kind: "pr-latest", pr: 7 });
    expect(parseQaRef(`pr/7/${SHA_B}`)).toEqual({ kind: "pr", pr: 7, sha: SHA_B });
    expect(() => parseQaRef("refs/heads/main")).toThrow(QaUsageError);
  });
});

describe("the four read states", () => {
  test("MISS: no branch on the remote is a determined absence, never an empty-clean tree", () => {
    const f = fixture();
    const o = f.container("reader");
    const r = readQa("main", `${RESULTS}/audit-coverage.qa-results.json`, o);
    expect(r.state).toBe("miss");
    const t = readQaTree("main", RESULTS, o);
    expect(t.state).toBe("miss");
    expect("files" in t).toBe(false);
    expect(fetchQa({ ref: "main", into: join(f.base, "into") }, o).state).toBe("miss");
    expect(existsSync(join(f.base, "into"))).toBe(false);
  }, T);

  test("HIT: a publish from one container is read, byte-identical, from another", () => {
    const f = fixture();
    const pub = publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS, "other/test/results"] }, f.container("ci"));
    expect(pub.state).toBe("published");
    expect(pub.attempts).toBe(1);

    const o = f.container("agent");
    const one = readQa(`main/${SHA_A}`, `${RESULTS}/kg-qa/skills/a.kg-qa.json`, o);
    expect(one.state).toBe("hit");
    if (one.state === "hit") expect(one.text).toBe('{"verdict":"pass"}\n');

    // An absolute path inside the checkout reads the same file.
    const abs = readQa("main", join(f.work, RESULTS, "audit-coverage.qa-results.json"), o);
    expect(abs.state === "hit" && abs.text).toBe('{"rows":3}\n');

    const tree = readQaTree(SHA_A.slice(0, 9), `${RESULTS}/kg-qa`, o);
    expect(tree.state).toBe("hit");
    if (tree.state === "hit") expect([...tree.files.keys()].sort()).toEqual([`${RESULTS}/kg-qa/skills/a.kg-qa.json`, `${RESULTS}/kg-qa/skills/b.kg-qa.json`]);

    const m = readQaManifest("main", o);
    expect(m.state === "hit" && m.manifest.files).toBe(4);
    expect(m.state === "hit" && m.manifest.roots).toEqual([RESULTS, "other/test/results"]);

    const into = join(f.base, "into");
    const fetched = fetchQa({ ref: "main", into }, o);
    expect(fetched).toMatchObject({ state: "hit", key: `main/${SHA_A}`, written: 4, extra: [] });
    expect(readFileSync(join(into, RESULTS, "kg-qa/skills/b.kg-qa.json"), "utf-8")).toBe('{"verdict":"fail"}\n');
    expect(existsSync(join(into, "manifest.json"))).toBe(false);
  }, T);

  test("MISS inside a hit entry: an absent file or prefix is a miss, not an empty result", () => {
    const f = fixture();
    publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci"));
    const o = f.container("agent");
    expect(readQa("main", `${RESULTS}/nope.json`, o).state).toBe("miss");
    expect(readQaTree("main", `${RESULTS}/lsi`, o).state).toBe("miss");
    expect(readQa(`main/${SHA_B}`, `${RESULTS}/audit-coverage.qa-results.json`, o).state).toBe("miss");
    expect(readQa("pr/5", `${RESULTS}/audit-coverage.qa-results.json`, o).state).toBe("miss");
  }, T);

  test("UNKNOWN: an unreachable remote is could-not-determine, never a miss", () => {
    const f = fixture();
    const o = f.container("agent", { remote: `file://${join(f.base, "no-such-remote.git")}` });
    const r = readQa("main", `${RESULTS}/audit-coverage.qa-results.json`, o);
    expect(r.state).toBe("unknown");
    expect(fetchQa({ ref: "main", into: join(f.base, "into") }, o).state).toBe("unknown");
  }, T);

  describe("CORRUPT", () => {
    test("a file that does not parse is corrupt, and so is the tree holding it", () => {
      const f = fixture();
      f.write(`${RESULTS}/kg-qa/skills/broken.kg-qa.json`, "<<<<<<< HEAD\n{}\n");
      publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci"));
      const o = f.container("agent");
      expect(readQa("main", `${RESULTS}/kg-qa/skills/broken.kg-qa.json`, o).state).toBe("corrupt");
      const t = readQaTree("main", `${RESULTS}/kg-qa`, o);
      expect(t.state).toBe("corrupt");
      expect("bad" in t && t.bad).toEqual([`${RESULTS}/kg-qa/skills/broken.kg-qa.json`]);
      // Its siblings are still readable one by one.
      expect(readQa("main", `${RESULTS}/kg-qa/skills/a.kg-qa.json`, o).state).toBe("hit");
    }, T);

    test("a payload that no longer matches its manifest is corrupt", () => {
      const f = fixture();
      publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci"));
      tamper(f, (d) => writeFileSync(join(d, "main", SHA_A, RESULTS, "audit-coverage.qa-results.json"), '{"rows":4}\n'));
      const r = readQa(`main/${SHA_A}`, `${RESULTS}/audit-coverage.qa-results.json`, f.container("agent"));
      expect(r.state).toBe("corrupt");
      expect(r.state !== "hit" && r.reason).toContain("payload tree");
    }, T);

    test("an entry with no manifest, and an index naming a missing entry, are corrupt", () => {
      const f = fixture();
      publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci"));
      tamper(f, (d) => rmSync(join(d, "main", SHA_A, "manifest.json")));
      expect(readQa(`main/${SHA_A}`, `${RESULTS}/audit-coverage.qa-results.json`, f.container("a1")).state).toBe("corrupt");

      const g = fixture();
      publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, g.container("ci"));
      tamper(g, (d) => {
        const idx = JSON.parse(readFileSync(join(d, "index.json"), "utf-8"));
        idx.main.sha = SHA_C;
        writeFileSync(join(d, "index.json"), JSON.stringify(idx));
      });
      expect(readQa("main", `${RESULTS}/audit-coverage.qa-results.json`, g.container("a2")).state).toBe("corrupt");
    }, T);
  });

  test("CLI exit codes follow lake-cache: 0 hit, 1 miss, 2 usage, 3 corrupt, 4 unknown", () => {
    const f = fixture();
    const common = ["--remote", f.url, "--branch", "cat/cat-harness/qa-reports"];
    const into = join(f.base, "into");
    expect(cli(["fetch", ...common, "--store", join(f.base, "s1.git"), "--into", into]).code).toBe(QA_EXIT.miss);
    publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci"));
    expect(cli(["fetch", ...common, "--store", join(f.base, "s2.git"), "--into", into]).code).toBe(QA_EXIT.hit);
    expect(cli(["fetch", ...common, "--store", join(f.base, "s3.git"), "--ref", "refs/x"]).code).toBe(QA_EXIT.usage);
    tamper(f, (d) => writeFileSync(join(d, "main", SHA_A, "manifest.json"), "{"));
    expect(cli(["fetch", ...common, "--store", join(f.base, "s4.git"), "--into", into]).code).toBe(QA_EXIT.corrupt);
    const gone = ["--remote", `file://${join(f.base, "absent.git")}`, "--branch", "cat/cat-harness/qa-reports"];
    expect(cli(["fetch", ...gone, "--store", join(f.base, "s5.git"), "--into", into]).code).toBe(QA_EXIT.unknown);
  }, T);
});

describe("writing", () => {
  test("never touches the checkout's index or work tree", () => {
    const f = fixture();
    git(f.work, "add", "-A");
    git(f.work, "commit", "-qm", "seed");
    const before = git(f.work, "status", "--porcelain");
    publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci"));
    expect(git(f.work, "status", "--porcelain")).toBe(before);
    // A filtered fetch makes the repository it runs in a promisor; the checkout must not become one.
    expect(spawnSync("git", ["config", "--get-regexp", "promisor"], { cwd: f.work, encoding: "utf-8" }).stdout.trim()).toBe("");
  }, T);

  test("an entry already present is not overwritten; the first write stands", () => {
    const f = fixture();
    const first = publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci"));
    const again = publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci2", { }));
    expect(again.state).toBe("present");
    expect(again.reason).toContain("identical");
    f.write(`${RESULTS}/audit-coverage.qa-results.json`, '{"rows":99}\n');
    const differs = publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci3"));
    expect(differs.state).toBe("present");
    expect(differs.reason).toContain("first write stands");
    const r = readQa(`main/${SHA_A}`, `${RESULTS}/audit-coverage.qa-results.json`, f.container("agent"));
    expect(r.state === "hit" && r.text).toBe('{"rows":3}\n');
    expect(first.commit).toBe(git(f.bare, "rev-parse", "refs/heads/cat/cat-harness/qa-reports").trim());
  }, T);

  test("no root present is `empty`, not a published nothing", () => {
    const f = fixture();
    const r = publishQa({ ref: `main/${SHA_A}`, roots: ["nowhere/test/results"] }, f.container("ci"));
    expect(r.state).toBe("empty");
    expect(spawnSync("git", ["ls-remote", "--heads", f.url], { encoding: "utf-8" }).stdout.trim()).toBe("");
  }, T);

  test("CONCURRENT WRITERS: the loser is rejected by the ref lock, rebuilds on the new tip, and both entries survive", () => {
    const f = fixture();
    publishQa({ ref: `main/${SHA_C}`, roots: [RESULTS] }, f.container("seed"));
    const seedTip = git(f.bare, "rev-parse", "refs/heads/cat/cat-harness/qa-reports").trim();
    let raced = false;
    const a = publishQa(
      { ref: `main/${SHA_A}`, roots: [RESULTS] },
      f.container("writer-a", {
        // Between A's fetch and A's push, B lands on the branch: the race is
        // made certain rather than lucky, as in spike step 3.
        beforePush: (attempt) => {
          if (attempt !== 1 || raced) return;
          raced = true;
          const b = publishQa({ ref: `pr/9999/${SHA_B}`, roots: ["other/test/results"] }, f.container("writer-b"));
          expect(b.state).toBe("published");
        },
      }),
    );
    expect(a.state).toBe("published");
    expect(a.attempts).toBe(2);

    const tip = git(f.bare, "rev-parse", "refs/heads/cat/cat-harness/qa-reports").trim();
    const listing = git(f.bare, "ls-tree", "-r", "--name-only", tip);
    expect(listing).toContain(`main/${SHA_C}/manifest.json`);
    expect(listing).toContain(`main/${SHA_A}/manifest.json`);
    expect(listing).toContain(`pr/9999/${SHA_B}/manifest.json`);
    // Linear history, no force: seed ← B ← A.
    const chain = git(f.bare, "rev-list", "--first-parent", tip).trim().split("\n");
    expect(chain).toHaveLength(3);
    expect(chain[2]).toBe(seedTip);

    const o = f.container("agent");
    expect(readQa("pr/9999", "other/test/results/x.qa-results.json", o).state).toBe("hit");
    const idx = JSON.parse(git(f.bare, "show", `${tip}:index.json`));
    expect(idx.main.sha).toBe(SHA_A);
    expect(idx.pr["9999"].sha).toBe(SHA_B);
  }, T);

  test("CONCURRENT PROCESSES: two CLI writers started together both land", async () => {
    const f = fixture();
    const env = { ...process.env, QA_STORE_REMOTE: f.url };
    const run = (sha: string, store: string) =>
      Bun.spawn(["bun", SCRIPT, "publish", "--ref", `main/${sha}`, "--root", RESULTS, "--branch", "cat/cat-harness/qa-reports", "--store", join(f.base, store)], {
        cwd: f.work,
        env,
        stdout: "pipe",
        stderr: "pipe",
      });
    const [p1, p2] = [run(SHA_A, "p1.git"), run(SHA_B, "p2.git")];
    const [c1, c2] = await Promise.all([p1.exited, p2.exited]);
    expect([c1, c2]).toEqual([0, 0]);
    const listing = git(f.bare, "ls-tree", "--name-only", "cat/cat-harness/qa-reports:main");
    expect(listing.trim().split("\n").sort()).toEqual([SHA_A, SHA_B]);
  }, 120_000);
});

describe("CI decision", () => {
  const repo = "litlfred/folio-assistant";
  test("push to main publishes main/<sha>", () => {
    expect(githubPublishDecision({ GITHUB_EVENT_NAME: "push", GITHUB_REF: "refs/heads/main", GITHUB_SHA: SHA_A, GITHUB_REPOSITORY: repo }, {})).toEqual({
      publish: true,
      ref: `main/${SHA_A}`,
      checkout: SHA_A,
    });
  });
  test("a same-repo PR publishes pr/<n>/<head-sha>, keyed by the head and not the merge commit", () => {
    const d = githubPublishDecision(
      { GITHUB_EVENT_NAME: "pull_request", GITHUB_SHA: SHA_C, GITHUB_REPOSITORY: repo },
      { pull_request: { number: 42, head: { sha: SHA_B, repo: { full_name: repo } } } },
    );
    expect(d).toEqual({ publish: true, ref: `pr/42/${SHA_B}`, checkout: SHA_C });
  });
  test("FORK SKIP: a fork PR is skipped with its reason, never attempted", () => {
    const d = githubPublishDecision(
      { GITHUB_EVENT_NAME: "pull_request", GITHUB_SHA: SHA_C, GITHUB_REPOSITORY: repo },
      { pull_request: { number: 43, head: { sha: SHA_B, repo: { full_name: "someone/folio-assistant" } } } },
    );
    expect(d.publish).toBe(false);
    expect(!d.publish && d.reason).toContain("read-only");
    expect(githubPublishDecision({ GITHUB_EVENT_NAME: "merge_group", GITHUB_REPOSITORY: repo }, {}).publish).toBe(false);
    expect(githubPublishDecision({ GITHUB_EVENT_NAME: "push", GITHUB_REF: "refs/heads/x", GITHUB_SHA: SHA_A }, {}).publish).toBe(false);
  });
  test("FORK SKIP through the CLI: exit 0, a ::notice, and nothing written to the remote", () => {
    const f = fixture();
    git(f.work, "add", "-A");
    git(f.work, "commit", "-qm", "seed");
    const event = join(f.base, "event.json");
    writeFileSync(event, JSON.stringify({ pull_request: { number: 43, head: { sha: SHA_B, repo: { full_name: "someone/fork" } } } }));
    const r = spawnSync("bun", [SCRIPT, "publish", "--github", "--branch", "cat/cat-harness/qa-reports", "--store", join(f.base, "s.git")], {
      cwd: f.work,
      encoding: "utf-8",
      env: { ...process.env, QA_STORE_REMOTE: f.url, GITHUB_EVENT_NAME: "pull_request", GITHUB_EVENT_PATH: event, GITHUB_REPOSITORY: "litlfred/folio-assistant", GITHUB_SHA: SHA_C },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("::notice title=qa:publish skipped::fork PR");
    expect(spawnSync("git", ["ls-remote", "--heads", f.url], { encoding: "utf-8" }).stdout.trim()).toBe("");
  }, T);
});

describe("prune", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  const daysAgo = (d: number, h = 0) => new Date(now.getTime() - d * 86_400_000 - h * 3_600_000).toISOString();

  test("the rule: 90 days kept whole, one per day after, PRs 7 days after close, unknown kept", () => {
    const plan = planPrune(
      [
        { sha: "1".repeat(40), writtenAt: daysAgo(10) },
        { sha: "2".repeat(40), writtenAt: daysAgo(100, 1) },
        { sha: "3".repeat(40), writtenAt: daysAgo(100, 3) },
        { sha: "4".repeat(40), writtenAt: daysAgo(200) },
        { sha: "5".repeat(40), writtenAt: "not a date" },
      ],
      [
        { pr: 1, entries: 2 },
        { pr: 2, entries: 1 },
        { pr: 3, entries: 1 },
        { pr: 4, entries: 1 },
      ],
      (pr) =>
        pr === 1 ? { state: "closed", closedAt: daysAgo(8) } : pr === 2 ? { state: "closed", closedAt: daysAgo(3) } : pr === 3 ? { state: "open" } : { state: "unknown" },
      now,
    );
    expect(plan.remove).toEqual([`main/${"3".repeat(40)}`, "pr/1"]);
    expect(plan.notes.some((n) => n.startsWith("pr/4"))).toBe(true);
    expect(plan.notes.some((n) => n.includes("5555"))).toBe(true);
  });

  test("dry run changes nothing; --apply commits on the tip (no history rewrite) and keeps the rest", () => {
    const f = fixture();
    publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS], writtenAt: daysAgo(120, 2) }, f.container("ci"));
    publishQa({ ref: `main/${SHA_B}`, roots: [RESULTS], writtenAt: daysAgo(120, 1) }, f.container("ci"));
    publishQa({ ref: `main/${SHA_C}`, roots: [RESULTS], writtenAt: daysAgo(1) }, f.container("ci"));
    publishQa({ ref: `pr/7/${SHA_A}`, roots: [RESULTS], writtenAt: daysAgo(30) }, f.container("ci"));
    const before = git(f.bare, "rev-parse", "refs/heads/cat/cat-harness/qa-reports").trim();
    const prState = (pr: number) => (pr === 7 ? ({ state: "closed", closedAt: daysAgo(10) } as const) : ({ state: "unknown" } as const));

    const dry = pruneQa({ now, prState }, f.container("pruner"));
    expect(dry.state).toBe("dry-run");
    expect(dry.plan?.remove).toEqual([`main/${SHA_A}`, "pr/7"]);
    expect(git(f.bare, "rev-parse", "refs/heads/cat/cat-harness/qa-reports").trim()).toBe(before);

    const done = pruneQa({ now, prState, apply: true }, f.container("pruner"));
    expect(done.state).toBe("pruned");
    const tip = git(f.bare, "rev-parse", "refs/heads/cat/cat-harness/qa-reports").trim();
    expect(git(f.bare, "rev-parse", `${tip}^`).trim()).toBe(before);
    const listing = git(f.bare, "ls-tree", "-r", "--name-only", tip);
    expect(listing).not.toContain(`main/${SHA_A}/`);
    expect(listing).not.toContain("pr/7/");
    expect(listing).toContain(`main/${SHA_B}/manifest.json`);
    expect(listing).toContain(`main/${SHA_C}/manifest.json`);
    expect(JSON.parse(git(f.bare, "show", `${tip}:index.json`)).pr?.["7"]).toBeUndefined();

    expect(pruneQa({ now, prState, apply: true }, f.container("pruner2")).state).toBe("nothing");
  }, T);
});

describe("every branch name (bean zlq9; renames 32f6, tlk2)", () => {
  const heads = (f: Fixture) =>
    git(f.bare, "for-each-ref", "--format=%(refname:short)", "refs/heads/").trim().split("\n").filter(Boolean).sort();

  test("candidates: any spelling of the QA branch yields all three, newest first; any other name stands alone", () => {
    const ALL = ["cat/cat-harness/qa-reports", "cat-qa-reports", "qa-reports"];
    for (const n of ALL) expect(qaBranchCandidates(n)).toEqual(ALL);
    expect(qaBranchCandidates("my-qa")).toEqual(["my-qa"]);
    expect(pickQaBranch(ALL, new Set())).toBe("cat/cat-harness/qa-reports");
    expect(pickQaBranch(ALL, new Set(["qa-reports"]))).toBe("qa-reports");
    expect(pickQaBranch(ALL, new Set(["qa-reports", "cat-qa-reports"]))).toBe("cat-qa-reports");
    expect(pickQaBranch(ALL, new Set(["qa-reports", "cat-qa-reports", "cat/cat-harness/qa-reports"]))).toBe("cat/cat-harness/qa-reports");
  });

  test("NEITHER exists: the writer creates cat/cat-harness/qa-reports", () => {
    const f = fixture();
    expect(publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("ci")).state).toBe("published");
    expect(heads(f)).toEqual(["cat/cat-harness/qa-reports"]);
  }, T);

  test("ONLY the legacy name: a reader finds it and a writer extends it, never creating cat/cat-harness/qa-reports beside it", () => {
    const f = fixture();
    publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("old", { branch: "my-legacy-only" }));
    git(f.bare, "branch", "-m", "my-legacy-only", "qa-reports");
    clearQaCache();
    // A declaration naming the OLD spelling and one naming the new both find it.
    for (const branch of ["qa-reports", "cat/cat-harness/qa-reports"]) {
      const r = readQa(`main/${SHA_A}`, `${RESULTS}/kg-qa/skills/a.kg-qa.json`, f.container(`r-${branch}`, { branch }));
      expect(r.state).toBe("hit");
    }
    expect(publishQa({ ref: `main/${SHA_B}`, roots: [RESULTS] }, f.container("ci")).state).toBe("published");
    expect(heads(f)).toEqual(["qa-reports"]);
    expect(git(f.bare, "ls-tree", "--name-only", "qa-reports:main").trim().split("\n").sort()).toEqual([SHA_A, SHA_B]);
  }, T);

  test("BOTH exist: the new name wins for readers and writers; the legacy branch is left as it was", () => {
    const f = fixture();
    publishQa({ ref: `main/${SHA_A}`, roots: [RESULTS] }, f.container("old", { branch: "my-old" }));
    git(f.bare, "branch", "-m", "my-old", "qa-reports");
    clearQaCache();
    publishQa({ ref: `main/${SHA_B}`, roots: [RESULTS] }, f.container("new", { branch: "my-new" }));
    git(f.bare, "branch", "-m", "my-new", "cat/cat-harness/qa-reports");
    clearQaCache();
    const legacyTip = git(f.bare, "rev-parse", "refs/heads/qa-reports").trim();
    expect(heads(f)).toEqual(["cat/cat-harness/qa-reports", "qa-reports"]);
    // SHA_A lives only on the legacy branch: a reader that falls back would hit it.
    expect(readQa(`main/${SHA_A}`, `${RESULTS}/kg-qa/skills/a.kg-qa.json`, f.container("r1")).state).toBe("miss");
    expect(readQa(`main/${SHA_B}`, `${RESULTS}/kg-qa/skills/a.kg-qa.json`, f.container("r2")).state).toBe("hit");
    expect(publishQa({ ref: `main/${SHA_C}`, roots: [RESULTS] }, f.container("ci")).state).toBe("published");
    expect(git(f.bare, "rev-parse", "refs/heads/qa-reports").trim()).toBe(legacyTip);
    expect(git(f.bare, "ls-tree", "--name-only", "cat/cat-harness/qa-reports:main").trim().split("\n").sort()).toEqual([SHA_B, SHA_C]);
  }, T);
});
