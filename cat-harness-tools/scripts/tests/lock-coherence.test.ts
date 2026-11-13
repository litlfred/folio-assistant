/**
 * lock:coherence:check — a lock's harness pins agree with the pinned
 * harnesses' own locks (owner, 2026-11-11, after who-iris main went red at
 * a43a4d27 on skewed pins).
 *
 * Two halves: the rule over fixtures (no git), and the git reader over local
 * repositories built here, so the whole path runs with no network.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Relation } from "../git-ancestry.ts";
import {
  LockReader,
  exitCodeOf,
  formatFreshness,
  formatReport,
  judgeFreshness,
  judgeLockCoherence,
  pinsOf,
  repoKey,
  type LowerLock,
  type MainHead,
  type Pin,
} from "../check-lock-coherence.ts";

const sha = (c: string) => c.repeat(40);

// A linear history per repository: t1 < t2 < t3, h1 < h2; `side` is off t1.
const ORDER: Record<string, string[]> = {
  "litlfred/tools": [sha("1"), sha("2"), sha("3")],
  "litlfred/harness": [sha("a"), sha("b")],
};
const SIDE = sha("9"); // a tools commit on another line, after t1

function relate(repository: string, a: string, b: string): Relation {
  if (a === b) return { rel: "same" };
  if (a === SIDE || b === SIDE) {
    const other = a === SIDE ? b : a;
    if (other === sha("1")) return a === SIDE ? { rel: "a-descends" } : { rel: "b-descends" };
    return { rel: "diverged" };
  }
  const o = ORDER[repoKey(repository)]!;
  const ia = o.indexOf(a);
  const ib = o.indexOf(b);
  if (ia < 0 || ib < 0) return { rel: "unknown", reason: "not in the fixture" };
  return ia > ib ? { rel: "a-descends" } : { rel: "b-descends" };
}

const pin = (harness: string, ref: string): Pin => ({ harness, repository: `litlfred/${harness}`, ref });

/** The lower locks: core pins tools and harness; harness pins only tools. */
function lowers(coreTools: string, coreHarness: string, harnessTools: string) {
  return (p: Pin): LowerLock => {
    if (p.harness === "core") return { state: "lock", pins: [pin("harness", coreHarness), pin("tools", coreTools)] };
    if (p.harness === "harness") return { state: "lock", pins: [pin("tools", harnessTools)] };
    return { state: "absent" };
  };
}

describe("the rule: this lock's pin of X contains every pinned harness's pin of X", () => {
  test("a matched lock passes: every pin equal to, or newer than, what the lower locks pin", () => {
    const root = [pin("core", sha("c")), pin("harness", sha("b")), pin("tools", sha("3"))];
    const r = judgeLockCoherence(root, lowers(sha("2"), sha("b"), sha("3")), relate);
    expect(r.disagreements).toEqual([]);
    expect(r.undetermined).toEqual([]);
    expect(r.compared).toBe(3);
    expect(r.agree).toBe(3);
    expect(r.noLock).toEqual(["tools"]);
    expect(exitCodeOf(r)).toBe(0);
  });

  test("a mismatched lock fails: tools pinned older than core's own lock pins it", () => {
    const root = [pin("core", sha("c")), pin("harness", sha("b")), pin("tools", sha("1"))];
    const r = judgeLockCoherence(root, lowers(sha("3"), sha("b"), sha("1")), relate);
    expect(exitCodeOf(r)).toBe(1);
    expect(r.disagreements).toHaveLength(1);
    const d = r.disagreements[0]!;
    expect(d).toMatchObject({ harness: "tools", layerRef: sha("1"), lowerRef: sha("3"), relation: "behind" });
    expect(d.via.harness).toBe("core");
    expect(d.fix).toContain(`re-pin tools to ${sha("3")} or a later commit`);
    const text = formatReport(r, "fixture");
    expect(text).toContain("FAILED");
    expect(text).toContain(sha("1"));
    expect(text).toContain(sha("3"));
  });

  test("diverged pins fail too: neither contains the other", () => {
    const root = [pin("core", sha("c")), pin("harness", sha("b")), pin("tools", SIDE)];
    const r = judgeLockCoherence(root, lowers(sha("2"), sha("b"), sha("1")), relate);
    expect(r.disagreements.map((d) => [d.via.harness, d.relation])).toEqual([["core", "diverged"]]);
    expect(exitCodeOf(r)).toBe(1);
  });

  test("every disagreeing pair is reported, each with both SHAs", () => {
    const root = [pin("core", sha("c")), pin("harness", sha("a")), pin("tools", sha("1"))];
    const r = judgeLockCoherence(root, lowers(sha("2"), sha("b"), sha("3")), relate);
    expect(r.disagreements.map((d) => [d.harness, d.via.harness, d.layerRef[0], d.lowerRef[0]])).toEqual([
      ["harness", "core", "a", "b"],
      ["tools", "core", "1", "2"],
      ["tools", "harness", "1", "3"],
    ]);
  });

  test("a lower lock that could not be read is undetermined, never agreement", () => {
    const root = [pin("core", sha("c")), pin("tools", sha("3"))];
    const r = judgeLockCoherence(root, () => ({ state: "could-not-determine", reason: "fetch failed" }), relate);
    expect(r.undetermined).toHaveLength(2);
    expect(exitCodeOf(r)).toBe(2);
  });

  test("an unknown ancestry is undetermined, never agreement", () => {
    const root = [pin("core", sha("c")), pin("tools", sha("7"))];
    const r = judgeLockCoherence(root, lowers(sha("2"), sha("b"), sha("3")), relate);
    expect(r.agree).toBe(0);
    expect(r.undetermined.map((u) => u.harness)).toEqual(["tools"]);
    expect(exitCodeOf(r)).toBe(2);
  });

  test("pins are matched by repository, so a renamed harness is still compared", () => {
    const root = [pin("core", sha("c")), { harness: "tools-renamed", repository: "https://github.com/LitlFred/tools.git", ref: sha("1") }];
    const r = judgeLockCoherence(root, lowers(sha("2"), sha("b"), sha("3")), relate);
    expect(r.disagreements.map((d) => d.harness)).toEqual(["tools-renamed"]);
  });

  test("pinsOf reads mounts[] and refuses a malformed entry", () => {
    expect(pinsOf({ mounts: [pin("tools", sha("1"))], instances: [] })).toEqual([pin("tools", sha("1"))]);
    expect(() => pinsOf({ instances: [] })).toThrow("mounts");
    expect(() => pinsOf({ mounts: [{ harness: "x" }] })).toThrow("mounts[]");
  });
});

describe("freshness: every pin at its repository's main, or ahead of it", () => {
  const mains = (m: Record<string, string>) => (p: Pin): MainHead => (m[p.harness] ? { sha: m[p.harness]! } : { reason: "fetch failed" });
  const agreeing = judgeLockCoherence([], () => ({ state: "absent" }), relate);

  test("pins at main, or descending from it, are fresh", () => {
    const f = judgeFreshness([pin("tools", sha("3")), pin("harness", sha("b"))], mains({ tools: sha("2"), harness: sha("b") }), relate);
    expect(f).toMatchObject({ checked: 2, fresh: 2, stale: [], undetermined: [] });
    expect(exitCodeOf(agreeing, f)).toBe(0);
  });

  test("a pin behind main fails, naming the harness, both SHAs and the re-pin", () => {
    const f = judgeFreshness([pin("tools", sha("3")), pin("harness", sha("a"))], mains({ tools: sha("3"), harness: sha("b") }), relate);
    expect(f.stale).toEqual([
      expect.objectContaining({ harness: "harness", ref: sha("a"), main: sha("b"), relation: "behind" }),
    ]);
    expect(f.stale[0]!.fix).toContain(`re-pin harness to main (${sha("b")})`);
    expect(exitCodeOf(agreeing, f)).toBe(1);
    const text = formatFreshness(f, "fixture");
    expect(text).toContain("FAILED");
    expect(text).toContain(sha("a"));
    expect(text).toContain(sha("b"));
  });

  test("the a43a4d27 shape: lower layers ahead of core's pins agree, but a stale core fails freshness", () => {
    // The layer pins tools at t3 and harness at b, ahead of what core's lock pins; core itself is old.
    const root = [pin("core", sha("c")), pin("harness", sha("b")), pin("tools", sha("3"))];
    const agree = judgeLockCoherence(root, lowers(sha("2"), sha("a"), sha("2")), relate);
    expect(agree.disagreements).toEqual([]);
    const coreRelate = (repo: string, a: string, b: string): Relation =>
      repoKey(repo) === "litlfred/core" ? (a === b ? { rel: "same" } : { rel: "b-descends" }) : relate(repo, a, b);
    const f = judgeFreshness(root, mains({ core: sha("d"), harness: sha("b"), tools: sha("3") }), coreRelate);
    expect(f.stale.map((s) => s.harness)).toEqual(["core"]);
    expect(exitCodeOf(agree, f)).toBe(1);
  });

  test("a pin diverged from main fails", () => {
    const f = judgeFreshness([pin("tools", SIDE)], mains({ tools: sha("3") }), relate);
    expect(f.stale.map((s) => s.relation)).toEqual(["diverged"]);
  });

  test("a main that cannot be read is undetermined (exit 2), never fresh", () => {
    const f = judgeFreshness([pin("tools", sha("3"))], mains({}), relate);
    expect(f.fresh).toBe(0);
    expect(f.undetermined).toHaveLength(1);
    expect(exitCodeOf(agreeing, f)).toBe(2);
  });

  test("an ancestry against main that cannot be evaluated is undetermined (exit 2)", () => {
    const f = judgeFreshness([pin("tools", sha("7"))], mains({ tools: sha("3") }), relate);
    expect(f.undetermined).toHaveLength(1);
    expect(exitCodeOf(agreeing, f)).toBe(2);
  });

  test("a disagreement still fails with every pin fresh", () => {
    const root = [pin("core", sha("c")), pin("tools", sha("1"))];
    const r = judgeLockCoherence(root, lowers(sha("3"), sha("b"), sha("1")), relate);
    const f = judgeFreshness(root, mains({ core: sha("c"), tools: sha("1") }), relate);
    expect(f.stale).toEqual([]);
    expect(exitCodeOf(r, f)).toBe(1);
  });
});

// ── The git reader, over local repositories ─────────────────────────────────

function g(dir: string, ...args: string[]): string {
  const r = spawnSync("git", ["-C", dir, ...args], {
    encoding: "utf-8",
    env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.org", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.org" },
  });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

function commit(dir: string, file: string, body: string): string {
  writeFileSync(join(dir, file), body);
  g(dir, "add", "-A");
  g(dir, "commit", "-q", "-m", file);
  return g(dir, "rev-parse", "HEAD");
}

const lockOf = (pins: Pin[]) => JSON.stringify({ $schema: "cat-harness-mount-lock/v1", mounts: pins, instances: [] }, null, 2);

describe("the git reader: real commits, real locks", () => {
  let root: string;
  const urls: Record<string, string> = {};
  let t1 = "";
  let t2 = "";
  let core1 = "";

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "lock-coherence-"));
    for (const name of ["tools", "core"]) {
      const dir = join(root, "src", name);
      spawnSync("mkdir", ["-p", dir]);
      g(dir, "init", "-q", "-b", "main");
      g(dir, "config", "uploadpack.allowFilter", "true");
      g(dir, "config", "uploadpack.allowAnySHA1InWant", "true");
      urls[`litlfred/${name}`] = `file://${dir}`;
    }
    const tools = join(root, "src", "tools");
    t1 = commit(tools, "a.txt", "1");
    t2 = commit(tools, "a.txt", "2");
    // core, at its pin, was built against tools t2.
    core1 = commit(join(root, "src", "core"), "index.lock.json", lockOf([pin("tools", t2)]));
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const reader = () => new LockReader(join(root, `cache-${Math.random().toString(36).slice(2)}`), (r) => urls[repoKey(r)]!);
  const judge = (toolsPin: string) => {
    const rd = reader();
    return judgeLockCoherence(
      [pin("core", core1), pin("tools", toolsPin)],
      (p) => rd.lockAt(p.repository, p.ref),
      (repo, a, b) => rd.relate(repo, a, b),
    );
  };

  test("matched: tools pinned where core's lock pins it passes", () => {
    const r = judge(t2);
    expect(r.disagreements).toEqual([]);
    expect(r.agree).toBe(1);
    expect(r.noLock).toEqual(["tools"]);
    expect(exitCodeOf(r)).toBe(0);
  });

  test("mismatched: tools pinned older than core's lock pins it fails, naming both SHAs", () => {
    const r = judge(t1);
    expect(exitCodeOf(r)).toBe(1);
    expect(r.disagreements).toEqual([
      expect.objectContaining({ harness: "tools", layerRef: t1, lowerRef: t2, relation: "behind" }),
    ]);
  });

  test("freshness: a pin at main passes, one behind main fails, naming main's SHA", () => {
    const rd = reader();
    const fresh = judgeFreshness([pin("tools", t2)], (p) => rd.mainOf(p.repository), (r, a, b) => rd.relate(r, a, b));
    expect(fresh).toMatchObject({ fresh: 1, stale: [], undetermined: [] });
    const rd2 = reader();
    const stale = judgeFreshness([pin("tools", t1)], (p) => rd2.mainOf(p.repository), (r, a, b) => rd2.relate(r, a, b));
    expect(stale.stale).toEqual([expect.objectContaining({ harness: "tools", ref: t1, main: t2, relation: "behind" })]);
  });

  test("freshness: a repository whose main cannot be fetched is undetermined", () => {
    const rd = new LockReader(join(root, "cache-missing"), () => `file://${join(root, "nope")}`);
    const f = judgeFreshness([pin("tools", t2)], (p) => rd.mainOf(p.repository), (r, a, b) => rd.relate(r, a, b));
    expect(f.undetermined).toHaveLength(1);
    expect(exitCodeOf(judgeLockCoherence([], () => ({ state: "absent" }), () => ({ rel: "same" })), f)).toBe(2);
  });

  test("a pin that cannot be fetched is undetermined", () => {
    const r = judge("f".repeat(40));
    expect(r.disagreements).toEqual([]);
    expect(exitCodeOf(r)).toBe(2);
  });
});
