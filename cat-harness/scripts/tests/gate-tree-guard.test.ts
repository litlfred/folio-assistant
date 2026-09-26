/**
 * Tests for the between-gates tree guard (bean `ymsu`).
 *
 * ## These tests are written against the thing that makes the guard USEFUL
 *
 * The defect being guarded is a check that passed over a state it had never
 * looked at. So a test here that could pass whether or not the guard works
 * would be the same defect one level up — and this repository has paid for that
 * exact mistake: four tests in bean `g196`/`06kg` all asserted what two things
 * SHARE rather than what distinguishes them (`toContain("build details
 * unavailable")` matched the OTHER message; `toContain("fa-build-stamp")`
 * matched the definition rather than the call).
 *
 * So each test below states what it would fail on, and the anti-vacuity pair at
 * the end asserts that the diff is non-empty for a real change AND empty for
 * none — a guard that reports everything is as useless as one that reports
 * nothing, and only checking one direction cannot tell them apart.
 */

import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import {
  diffReadings,
  formatMutations,
  formatUndetermined,
  isUntracked,
  parsePorcelain,
  readTree,
  type GateMutation,
} from "../gate-tree-guard.js";

describe("parsePorcelain", () => {
  it("keys on the line after the fixed-width status, and reads the code from the first two chars", () => {
    const m = parsePorcelain(" M cat-harness/a.ts\n?? new.txt\nMM both.ts\n");
    expect(m.get("cat-harness/a.ts")).toBe(" M");
    expect(m.get("new.txt")).toBe("??");
    expect(m.get("both.ts")).toBe("MM");
    expect(m.size).toBe(3);
  });

  it("keeps a rename's whole `old -> new` as the key rather than splitting on an arrow a filename may contain", () => {
    // The arrow is not a delimiter this code is entitled to trust: `a -> b` is a
    // legal filename. Keeping the remainder verbatim is what makes the parser
    // unable to be wrong about it.
    const m = parsePorcelain("R  old/path.ts -> new/path.ts\n");
    expect(m.get("old/path.ts -> new/path.ts")).toBe("R ");
  });

  it("keeps a quoted path quoted, and does not try to unescape it", () => {
    const m = parsePorcelain(' M "cat-harness/a\\tb.ts"\n');
    expect([...m.keys()]).toEqual(['"cat-harness/a\\tb.ts"']);
  });

  it("skips blank and too-short lines instead of minting an empty key they would all share", () => {
    // Were these to produce `""`, several malformed lines would collide on one
    // key and N defects would report as 1.
    const m = parsePorcelain("\n\nx\n M ok.ts\n");
    expect([...m.keys()]).toEqual(["ok.ts"]);
  });

  it("tolerates CRLF, which a checkout on Windows produces", () => {
    const m = parsePorcelain(" M a.ts\r\n");
    expect(m.get("a.ts")).toBe(" M");
  });
});

describe("isUntracked", () => {
  it("is true only for `??`", () => {
    expect(isUntracked("??")).toBe(true);
    expect(isUntracked(" M")).toBe(false);
    expect(isUntracked("MM")).toBe(false);
    expect(isUntracked("R ")).toBe(false);
    // Would catch a prefix test (`code.startsWith("?")`) treating `?` alone,
    // or a merge-conflict code, as untracked.
    expect(isUntracked("?")).toBe(false);
  });
});

describe("diffReadings — all three directions, because a `got dirtier?` check misses one", () => {
  it("reports an entry that APPEARED, with no `before`", () => {
    const d = diffReadings(new Map(), new Map([["a.ts", " M"]]));
    expect(d).toEqual([{ key: "a.ts", after: " M" }]);
  });

  it("reports an entry whose status CHANGED as one change, not an add plus a delete", () => {
    const d = diffReadings(new Map([["a.ts", " M"]]), new Map([["a.ts", "MM"]]));
    expect(d).toEqual([{ key: "a.ts", before: " M", after: "MM" }]);
    // The point of keying by entry. A set-of-lines diff would give 2 here.
    expect(d.length).toBe(1);
  });

  it("reports an entry that DISAPPEARED — a gate that reverted an author's edit", () => {
    // The direction a "did anything get dirtier?" guard cannot see, and the
    // worse one: writing a file wastes a commit, reverting one destroys work.
    const d = diffReadings(new Map([["a.ts", " M"]]), new Map());
    expect(d).toEqual([{ key: "a.ts", before: " M" }]);
  });

  it("is EMPTY when the author's own uncommitted work is unchanged — the normal case", () => {
    // If this ever fails, the guard fires on every developer running `gates`
    // before a push, and it gets switched off the same day.
    const mine = new Map([
      ["cat-harness/scripts/gates.ts", " M"],
      ["untracked-note.md", "??"],
    ]);
    expect(diffReadings(mine, new Map(mine))).toEqual([]);
  });

  it("sorts, so two runs over one defect produce byte-identical reports", () => {
    const d = diffReadings(new Map(), new Map([["z.ts", " M"], ["a.ts", " M"], ["m.ts", " M"]]));
    expect(d.map((c) => c.key)).toEqual(["a.ts", "m.ts", "z.ts"]);
  });

  it("anti-vacuity: the same inputs that yield [] for no change yield a finding for one", () => {
    // One assertion pair, deliberately together: a differ that always returns []
    // passes the "normal case" test above, and a differ that always returns
    // something passes the "appeared" test. Neither passes both.
    const before = new Map([["a.ts", " M"]]);
    expect(diffReadings(before, new Map(before))).toEqual([]);
    expect(diffReadings(before, new Map([["a.ts", " M"], ["b.ts", " M"]])).length).toBe(1);
  });
});

describe("formatMutations", () => {
  const one: GateMutation[] = [
    { gate: "bun test", changes: [{ key: "x/a.detangle.json", before: undefined, after: " M" }] },
  ];

  it("is SILENT for a clean run, so there is no self-congratulating line to skip past", () => {
    expect(formatMutations([])).toEqual([]);
  });

  it("names the gate that did it, which is the whole reason snapshots are per-gate", () => {
    const out = formatMutations(one).join("\n");
    expect(out).toContain("bun test");
    expect(out).toContain("x/a.detangle.json");
  });

  it("distinguishes wrote / changed / reverted rather than calling all three `modified`", () => {
    const out = formatMutations([
      {
        gate: "g",
        changes: [
          { key: "wrote.ts", after: " M" },
          { key: "changed.ts", before: " M", after: "MM" },
          { key: "reverted.ts", before: " M" },
        ],
      },
    ]).join("\n");
    expect(out).toMatch(/wrote\s+\(" M"\)\s+wrote\.ts/);
    expect(out).toMatch(/changed\s+\(" M" -> "MM"\)\s+changed\.ts/);
    expect(out).toMatch(/reverted\s+\(was " M"\)\s+reverted\.ts/);
  });

  it("counts previously-untracked paths separately, and says so only when there are some", () => {
    const withUntracked = formatMutations([
      { gate: "g", changes: [{ key: "new.json", after: "??" }] },
    ]).join("\n");
    expect(withUntracked).toContain("1 of them previously untracked");
    // The negative half: a tracked-only mutation must NOT carry the phrase.
    expect(formatMutations(one).join("\n")).not.toContain("previously untracked");
  });

  it("states the elision rather than silently truncating — `5 of 218` is not `5`", () => {
    const many: GateMutation[] = [
      {
        gate: "g",
        changes: Array.from({ length: 12 }, (_, i) => ({ key: `f${i}.json`, after: " M" })),
      },
    ];
    const out = formatMutations(many, 8).join("\n");
    expect(out).toContain("…and 4 more path(s) not listed");
    // And the count is still the true one, not the capped one.
    expect(out).toContain("12 path(s)");
  });

  it("explains the consequence, not just the fact — a later gate read a repaired copy", () => {
    // Scoped to the explanatory block rather than `toContain("ymsu")`, which the
    // bean id in any line would satisfy.
    const out = formatMutations(one).join("\n");
    expect(out).toContain("makes every LATER gate");
    expect(out).toContain("Regenerate and COMMIT what is stale");
  });
});

describe("formatUndetermined", () => {
  it("carries the reason, and says an unanswered question is not a clean answer", () => {
    const out = formatUndetermined("git status exited 128").join("\n");
    expect(out).toContain("git status exited 128");
    expect(out).toContain("not a clean answer");
    // It must not look like a pass: no ✓ anywhere in it.
    expect(out).not.toContain("✓");
  });
});

describe("readTree — against real git, not a stub", () => {
  // A stub would prove the parser and nothing about the porcelain format this
  // depends on. These use a throwaway repository so nothing here can touch the
  // checkout the suite is running in.
  const repos: string[] = [];
  const mkrepo = (): string => {
    const dir = mkdtempSync(join(tmpdir(), "gate-tree-guard-"));
    repos.push(dir);
    const git = (...a: string[]) => spawnSync("git", a, { cwd: dir, encoding: "utf-8" });
    git("init", "-q");
    git("config", "user.email", "t@example.invalid");
    git("config", "user.name", "t");
    git("config", "commit.gpgsign", "false");
    writeFileSync(join(dir, "tracked.txt"), "one\n");
    git("add", "-A");
    git("commit", "-qm", "init");
    return dir;
  };

  it("reads a clean repository as ok and empty", () => {
    const r = readTree(mkrepo());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.entries.size).toBe(0);
  });

  it("sees a modification to a tracked file, and a new untracked file, with git's own codes", () => {
    const dir = mkrepo();
    writeFileSync(join(dir, "tracked.txt"), "two\n");
    writeFileSync(join(dir, "fresh.txt"), "new\n");
    const r = readTree(dir);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.entries.get("tracked.txt")).toBe(" M");
    expect(r.entries.get("fresh.txt")).toBe("??");
  });

  it("honours .gitignore, which is what lets a gate write its own scratch files", () => {
    const dir = mkrepo();
    writeFileSync(join(dir, ".gitignore"), "scratch/\n");
    spawnSync("git", ["add", "-A"], { cwd: dir });
    spawnSync("git", ["commit", "-qm", "ignore"], { cwd: dir });
    mkdirSync(join(dir, "scratch"));
    writeFileSync(join(dir, "scratch", "tmp.json"), "{}\n");
    const r = readTree(dir);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.entries.size).toBe(0);
  });

  it("returns ok:false with a reason outside a repository, rather than throwing or reporting clean", () => {
    const outside = mkdtempSync(join(tmpdir(), "gate-tree-guard-bare-"));
    repos.push(outside);
    const r = readTree(outside);
    // Guarded: if some ancestor of the OS temp dir is itself a git repo, git
    // answers about that instead, and this environment cannot exercise the
    // third state. Saying so beats asserting something untrue of the machine.
    if (r.ok) {
      expect(r.entries).toBeDefined();
      return;
    }
    expect(r.why).toMatch(/git/);
  });

  it("END TO END: a write between two readings is what diffReadings reports", () => {
    // The falsification, both ways, against real git and a real file — the
    // mechanism the guard exists for, in miniature.
    const dir = mkrepo();
    const before = readTree(dir);
    expect(before.ok).toBe(true);
    if (!before.ok) return;

    // Nothing happened: the diff must be empty.
    const unchanged = readTree(dir);
    expect(unchanged.ok).toBe(true);
    if (unchanged.ok) expect(diffReadings(before.entries, unchanged.entries)).toEqual([]);

    // A "gate" rewrites a committed file with DIFFERENT bytes.
    writeFileSync(join(dir, "tracked.txt"), "repaired\n");
    const after = readTree(dir);
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(diffReadings(before.entries, after.entries)).toEqual([
      { key: "tracked.txt", after: " M" },
    ]);
  });

  it("END TO END: rewriting IDENTICAL bytes is invisible — the property that makes this shippable", () => {
    // This is the measurement the whole design rests on. If a generator writing
    // the same bytes showed up here, the guard would fire on every healthy run
    // and could not be a hard failure at all.
    const dir = mkrepo();
    const before = readTree(dir);
    expect(before.ok).toBe(true);
    if (!before.ok) return;
    writeFileSync(join(dir, "tracked.txt"), "one\n"); // same content as the commit
    const after = readTree(dir);
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(diffReadings(before.entries, after.entries)).toEqual([]);
  });

  // Cleanup is in an `it` rather than afterAll so a failure to remove a temp
  // directory is reported as a test rather than swallowed.
  it("cleans up its throwaway repositories", () => {
    for (const d of repos) rmSync(d, { recursive: true, force: true });
    expect(repos.length).toBeGreaterThan(0);
  });
});
