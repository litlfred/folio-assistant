import { describe, expect, test, beforeEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  criterionSourceHash,
  _resetCriterionHashCache,
} from "../../content/pipeline/qa-criterion-hash";

// Each case writes a throwaway checker module. Hashes are memoized by absolute
// path, so every fixture gets a fresh temp dir as well as a cache reset.
function writeModule(source: string): string {
  const dir = mkdtempSync(join(tmpdir(), "crithash-"));
  const path = join(dir, "checkers.ts");
  writeFileSync(path, source);
  return path;
}

/**
 * `critA` reaches `helperA` -> `SHARED`; `critB` reaches only `helperB`.
 * `body` lets a case perturb one declaration while holding the rest fixed.
 */
function fixture(
  parts: { shared?: string; helperA?: string; helperB?: string } = {},
): string {
  const shared = parts.shared ?? "/alpha/";
  const helperA = parts.helperA ?? "return SHARED.test(s);";
  const helperB = parts.helperB ?? "return s.length > 0;";
  return `
const SHARED = ${shared};

function helperA(s: string) { ${helperA} }

function helperB(s: string) { ${helperB} }

export const FIXTURE_AUTOMATED_CHECKERS: Record<string, (p: any) => unknown> = {
  "crit-a": (p) => helperA(p.md),
  "crit-b": (p) => helperB(p.md),
};
`;
}

describe("criterionSourceHash", () => {
  beforeEach(() => _resetCriterionHashCache());

  test("criteria sharing a module hash independently", () => {
    const p = writeModule(fixture());
    const a = criterionSourceHash(p, "crit-a");
    const b = criterionSourceHash(p, "crit-b");
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
    rmSync(p, { force: true });
  });

  test("hashing is deterministic", () => {
    const p = writeModule(fixture());
    const first = criterionSourceHash(p, "crit-a");
    _resetCriterionHashCache();
    expect(criterionSourceHash(p, "crit-a")).toBe(first);
  });

  test("editing one checker leaves its siblings' hashes alone", () => {
    // This is the whole point: under the previous whole-file hash BOTH moved,
    // which invalidated every criterion in the module across every block.
    const before = writeModule(fixture());
    const aBefore = criterionSourceHash(before, "crit-a");
    const bBefore = criterionSourceHash(before, "crit-b");

    _resetCriterionHashCache();
    const after = writeModule(fixture({ helperA: "return !SHARED.test(s);" }));
    expect(criterionSourceHash(after, "crit-a")).not.toBe(aBefore);
    expect(criterionSourceHash(after, "crit-b")).toBe(bBefore);
  });

  test("a shared declaration invalidates exactly its dependents", () => {
    // The safety direction. Under-invalidating here would silently keep a
    // stale verdict after the checker's behaviour changed.
    const before = writeModule(fixture());
    const aBefore = criterionSourceHash(before, "crit-a");
    const bBefore = criterionSourceHash(before, "crit-b");

    _resetCriterionHashCache();
    const after = writeModule(fixture({ shared: "/beta/" }));
    expect(criterionSourceHash(after, "crit-a")).not.toBe(aBefore);
    // `crit-b` never reaches SHARED, so it must not be invalidated.
    expect(criterionSourceHash(after, "crit-b")).toBe(bBefore);
  });

  test("unrelated edits elsewhere in the module change nothing", () => {
    const before = writeModule(fixture());
    const aBefore = criterionSourceHash(before, "crit-a");

    _resetCriterionHashCache();
    const after = writeModule(
      fixture() + "\nexport function unrelated() { return 42; }\n",
    );
    expect(criterionSourceHash(after, "crit-a")).toBe(aBefore);
  });

  test("returns null for a criterion the module does not dispatch", () => {
    // null is the caller's signal to fall back to the whole-file hash.
    const p = writeModule(fixture());
    expect(criterionSourceHash(p, "crit-missing")).toBeNull();
  });

  test("returns null for an unreadable file", () => {
    expect(criterionSourceHash("/nonexistent/checkers.ts", "crit-a")).toBeNull();
  });

  test("resolves criteria in the real voice checker module", () => {
    // Guards the fixture shape against drifting from how checkers are really
    // written (an exported `*_AUTOMATED_CHECKERS` record of arrow dispatchers).
    const real = join(
      process.cwd(),
      "content/pipeline/qa-checkers-voice.ts",
    );
    const scholarly = criterionSourceHash(real, "voice-scholarly-default");
    const wall = criterionSourceHash(real, "wall-side-correct");
    expect(scholarly).toBeTruthy();
    expect(wall).toBeTruthy();
    expect(scholarly).not.toBe(wall);
  });
});
