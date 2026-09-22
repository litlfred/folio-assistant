/**
 * The layout norm, and proof that its ratchet bites.
 *
 * The owner, 2026-09-22: *"follow established norms on layout. qa to
 * enforce."* A check whose only test is that the current corpus passes is a
 * check nobody has shown can fail — the shape this repository keeps naming,
 * most recently in the CRDM relocation guard that filtered on an id the move
 * had deleted and would have passed over nothing forever.
 *
 * So the load-bearing test here is the NEGATIVE one: a synthetic instance that
 * nests a declared directory must be reported and must fail.
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkLayoutNorms, pairKey, readBaseline } from "../check-layout-norms.ts";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = resolve(INSTANCE_ROOT, "..");

/** A throwaway repository with one instance declaring `dirs`. */
function fixture(dirs: Array<{ id: string; path: string }>): string {
  const repo = mkdtempSync(join(tmpdir(), "layout-norms-"));
  const inst = join(repo, "thing");
  for (const d of dirs) mkdirSync(join(inst, d.path), { recursive: true });
  writeFileSync(
    join(inst, "thing.json"),
    JSON.stringify({
      name: "thing",
      description: "fixture",
      directories: dirs.map((d) => ({
        ...d,
        dependents: "skip",
        graphKinds: ["cat-harness"],
        description: "fixture",
      })),
    }),
  );
  return repo;
}

describe("the ratchet bites — the test that matters", () => {
  it("REPORTS and FAILS a nested declaration that is not baselined", () => {
    const repo = fixture([
      { id: "outer", path: "skills/" },
      { id: "inner", path: "skills/voices/" },
    ]);
    try {
      // An empty baseline: nothing is known, so the pair is unexpected.
      const r = checkLayoutNorms(repo, join(repo, "no-such-baseline.json"));
      expect(r.undetermined).toBe(false);
      expect(r.found).toEqual([pairKey("thing", "skills/", "skills/voices/")]);
      expect(r.unexpected).toEqual(r.found);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("does NOT fail a pair that is in the baseline — outstanding work is not a wolf", () => {
    const repo = fixture([
      { id: "outer", path: "skills/" },
      { id: "inner", path: "skills/voices/" },
    ]);
    const baseline = join(repo, "baseline.json");
    writeFileSync(baseline, JSON.stringify({ pairs: [pairKey("thing", "skills/", "skills/voices/")] }));
    try {
      const r = checkLayoutNorms(repo, baseline);
      expect(r.found).toHaveLength(1);
      expect(r.unexpected).toEqual([]);
      expect(r.fixed).toEqual([]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("reports a baselined pair that is GONE as fixed, never as a failure", () => {
    // Removing a nesting is the outcome this check exists to encourage. A
    // guard that failed on it would punish the fix — the inversion bean
    // `rl3h` produced in `subgraphs.test.ts`, where a `> 0` assertion started
    // failing the moment the corpus was cleaned.
    const repo = fixture([{ id: "outer", path: "skills/" }]);
    const baseline = join(repo, "baseline.json");
    writeFileSync(baseline, JSON.stringify({ pairs: [pairKey("thing", "skills/", "skills/voices/")] }));
    try {
      const r = checkLayoutNorms(repo, baseline);
      expect(r.found).toEqual([]);
      expect(r.unexpected).toEqual([]);
      expect(r.fixed).toEqual([pairKey("thing", "skills/", "skills/voices/")]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("an instance with no nesting is clean, which is what `<stub>/<asset>` looks like", () => {
    const repo = fixture([
      { id: "skills", path: "skills/" },
      { id: "processes", path: "processes/" },
      { id: "library", path: "library/" },
    ]);
    try {
      expect(checkLayoutNorms(repo, join(repo, "none.json")).found).toEqual([]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("an empty repository is UNDETERMINED, not clean", () => {
    // Third state. An empty sweep and a clean sweep must not share a
    // spelling — `dh4f`, which is about exactly this.
    const repo = mkdtempSync(join(tmpdir(), "layout-norms-empty-"));
    try {
      expect(checkLayoutNorms(repo, join(repo, "none.json")).undetermined).toBe(true);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe("the real corpus", () => {
  const r = checkLayoutNorms();

  it("read more than one instance — otherwise everything below is vacuous", () => {
    expect(r.undetermined).toBe(false);
    expect(r.instances).toBeGreaterThan(5);
  });

  it("has no unexpected nesting — every pair found is baselined", () => {
    expect(r.unexpected).toEqual([]);
  });

  it("CAT-HARNESS ITSELF IS AT ZERO, and the baseline holds none of its pairs", () => {
    // The point of the 2026-09-22 move. Stated as its own assertion rather
    // than left implicit in "no unexpected nesting", because a baseline entry
    // for cat-harness would make that pass while the instance regressed.
    expect(r.found.filter((p) => p.startsWith("cat-harness:"))).toEqual([]);
    expect(readBaseline().filter((p) => p.startsWith("cat-harness:"))).toEqual([]);
  });

  it("the baseline names only pairs that are really there", () => {
    // A stale baseline entry silently widens the exemption. Anything listed
    // and not found is reported as `fixed`, and the list should be shrunk.
    expect(r.fixed, "baseline lists a pair that no longer exists — run --update").toEqual([]);
  });

  it("the known pairs are the `skills/voices` ones, in instances that are not this one", () => {
    expect(r.found.every((p) => p.endsWith("skills contains skills/voices"))).toBe(true);
    expect(r.found.length).toBeGreaterThan(0);
  });

  it("each nesting is counted ONCE, however many ids resolve to it", () => {
    // `resolveDirectories` merges declared and conventional directories, so
    // one physical nesting can surface under several ids. A fixture's single
    // nesting was reported four times before `pairKey` moved onto paths.
    expect(new Set(r.found).size).toBe(r.found.length);
  });
});

describe("it asks the schema rather than computing geometry", () => {
  it("does not flag a two-segment path that is not inside a declared directory", () => {
    // `test/results/` is two segments from its instance root and is correct:
    // `test/` is not a graph. Depth is the wrong test, and this pins that the
    // check does not use it.
    const repo = fixture([
      { id: "skills", path: "skills/" },
      { id: "qa", path: "test/results/" },
    ]);
    try {
      expect(checkLayoutNorms(repo, join(repo, "none.json")).found).toEqual([]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("the repository root it defaults to is this checkout", () => {
    expect(REPO_ROOT).toBe(resolve(INSTANCE_ROOT, ".."));
  });
});
