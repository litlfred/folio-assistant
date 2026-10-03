/**
 * `merge:train` — the log parsers, the verdict, and the dry-run simulation on
 * a real history (bean `blgm`). The real run shells out to `merge-base.ts`
 * and `regen`, which have their own tests; what is tested here is what this
 * command decides from them.
 */
import { afterEach, describe, expect, test } from "bun:test";

import {
  classifyConflicts,
  parseAbortReason,
  parseConflicted,
  parseMergeTree,
  parseRefusedPaths,
  parseStaleSmartKgEntries,
  simulate,
  verdictOf,
  type TrainReport,
} from "../merge-train.ts";
import { makeRepo, type Repo } from "./merge-pipeline-fixture.ts";

const GEN = "cat-harness/docs/glossary/index.md";

/** The shape `merge-base.ts` prints, copied from its `describe` and abort lines. */
const REFUSED_LOG = `merge-base: 3 conflicted path(s) merging abc
  ✓ ${GEN}  [glossary: take-base]
  ✓ beans/README.md  [readme-generated-regions: generated-regions]
  ✗ cat-harness/scripts/x.ts  [no declared pattern]
  ✗ beans/defs/y.md  [beans: refuse] — bean definitions (44).

merge-base: ABORTED, tree restored — 2 conflict(s) need a person (✗ above)`;

describe("merge-base log parsing", () => {
  test("refused paths are the ✗ lines, with or without a pattern", () => {
    expect(parseRefusedPaths(REFUSED_LOG)).toEqual(["cat-harness/scripts/x.ts", "beans/defs/y.md"]);
  });

  test("every conflicted path is recovered with its pattern and strategy", () => {
    expect(parseConflicted(REFUSED_LOG)).toEqual([
      { path: GEN, pattern: "glossary", strategy: "take-base" },
      { path: "beans/README.md", pattern: "readme-generated-regions", strategy: "generated-regions" },
      { path: "cat-harness/scripts/x.ts", strategy: "refuse" },
      { path: "beans/defs/y.md", pattern: "beans", strategy: "refuse" },
    ]);
  });

  test("the abort reason is the ABORTED line's, else the last line", () => {
    expect(parseAbortReason(REFUSED_LOG)).toBe("2 conflict(s) need a person (✗ above)");
    expect(parseAbortReason("merge-base: no such base deadbeef\n")).toBe("merge-base: no such base deadbeef");
  });

  test("stale smart-kg entries are read from the --check output", () => {
    const log = "✓ a ok\n✗ smart-base/library/x/smart-kg-l1.json is stale — run with --entry smart-base/library/x\n✗ y is stale — run with --entry smart-base/library/y\n";
    expect(parseStaleSmartKgEntries(log)).toEqual(["smart-base/library/x", "smart-base/library/y"]);
  });

  test("merge-tree output: clean, conflicted, and a failure that is neither", () => {
    const t = "a".repeat(40);
    expect(parseMergeTree({ code: 0, out: t })).toEqual({ tree: t, conflicted: [] });
    expect(parseMergeTree({ code: 1, out: `${t}\nx\nx\ny` })).toEqual({ tree: t, conflicted: ["x", "y"] });
    expect(parseMergeTree({ code: 128, out: "" })).toBeUndefined();
  });

  test("conflicts are classified by the same patterns merge-base acts on", () => {
    const c = classifyConflicts([GEN, "src/a.ts"]);
    expect(c.refused).toEqual(["src/a.ts"]);
    expect(c.conflicted.find((x) => x.path === GEN)?.pattern).toBe("glossary");
  });
});

describe("verdictOf", () => {
  const ok: Pick<TrainReport, "members" | "checks" | "main"> = {
    members: [{ spec: "1", label: "#1", sha: "a", status: "merged" }],
    checks: [{ name: "regen", command: "bun run regen", status: "passed", exit: 0 }],
    main: { ref: "origin/main", sha: "b", status: "merged" },
  };
  test("built only when nothing needs a person", () => {
    expect(verdictOf(ok)).toBe("built");
    expect(verdictOf({ ...ok, members: [...ok.members, { spec: "2", label: "#2", sha: "c", status: "refused" }] })).toBe("needs-a-person");
    expect(verdictOf({ ...ok, checks: [{ name: "l1", command: "", status: "findings", exit: 1 }] })).toBe("needs-a-person");
    expect(verdictOf({ ...ok, main: { ...ok.main, status: "refused" } })).toBe("needs-a-person");
    expect(verdictOf({ ...ok, checks: [{ name: "kg", command: "", status: "repaired", exit: 0 }] })).toBe("built");
  });
});

describe("simulate — the dry run on a real history", () => {
  let repo: Repo | undefined;
  afterEach(() => { repo?.cleanup(); repo = undefined; });

  test("members merge onto the SIMULATED train; an authored conflict is refused; a generated one is not", () => {
    repo = makeRepo();
    const base = repo.commit({ "a.ts": "a\n", "b.ts": "b\n", [GEN]: "g\n" });
    const branch = (name: string, files: Record<string, string>): string => {
      repo!.git("checkout", "-q", "-b", name, base);
      return repo!.commit(files);
    };
    const one = branch("one", { "a.ts": "A1\n", [GEN]: "g1\n" });
    const two = branch("two", { "b.ts": "B2\n", [GEN]: "g2\n" }); // generated conflict with one only
    const three = branch("three", { "a.ts": "A3\n" }); // authored conflict with one
    repo.git("checkout", "-q", "main");
    const before = repo.git("for-each-ref");
    const r = simulate(repo.dir, base, [
      { label: "one", spec: "one", sha: one },
      { label: "two", spec: "two", sha: two },
      { label: "three", spec: "three", sha: three },
      { label: "one again", spec: "one", sha: one },
    ]);
    expect(r.members.map((m) => m.status)).toEqual(["would-merge", "would-merge", "would-refuse", "already-contained"]);
    expect(r.members[1]!.conflicted).toEqual([{ path: GEN, pattern: "glossary", strategy: "take-base" }]);
    expect(r.members[2]!.refused_paths).toEqual(["a.ts"]);
    // Nothing visible changed: no ref, no working-tree file.
    expect(repo.git("for-each-ref")).toBe(before);
    expect(repo.git("status", "--porcelain")).toBe("");
    expect(r.main.status).toBe("skipped");
  });

  test("main is merged last onto the simulated train", () => {
    repo = makeRepo();
    const base = repo.commit({ "a.ts": "a\n", [GEN]: "g\n" });
    repo.git("checkout", "-q", "-b", "one");
    const one = repo.commit({ [GEN]: "g1\n" });
    repo.git("checkout", "-q", "main");
    const main = repo.commit({ [GEN]: "gm\n" });
    const r = simulate(repo.dir, base, [{ label: "one", spec: "one", sha: one }], { ref: "main", sha: main });
    expect(r.main.status).toBe("would-merge");
    expect(r.main.conflicted?.[0]?.path).toBe(GEN);
  });
});
