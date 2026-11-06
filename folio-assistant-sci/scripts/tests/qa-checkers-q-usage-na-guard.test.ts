/**
 * Unit tests for the q-usage regime detector's `\bq\b` na-guard
 * false-positive fix.
 *
 * A genuinely q-free block whose `.ts` manifest references a kebab-case
 * cross-reference label containing a standalone "q" (e.g.
 * `uses: ["rem:toffoli-q-and"]`) must NOT be classified `symbolic`: the
 * loose `\bq\b` na-guard treats hyphens as word boundaries, so `-q-`
 * matched, skipping the `na` regime and tripping
 * `q-usage-narrative-chapter-mismatch` in archimedean chapters. The
 * na-guard now scans only the math sources (`.md` + `.lean`), not the
 * `.ts` manifest; the precise `MENTIONS_Q_RE` still scans all sources.
 *
 * Run via `bun test`.
 *
 * Moved from `cat-harness-tools/scripts/tests/qa-checkers-q-usage.test.ts`
 * with the checker (bean `saqd`, 2026-10-30). The tests that need sci's
 * contributions (chapter profiles, the `lean-lexer` plugin) are in
 * `qa-checkers-q-usage.test.ts` beside this file.
 */
import { describe, test, expect, afterAll } from "bun:test";
import { writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { detectRegimes } from "../../pipeline/qa-checkers-q-usage.ts";

const DIR = mkdtempSync(join(tmpdir(), "qa-q-usage-"));
afterAll(() => {
  try {
    rmSync(DIR, { recursive: true, force: true });
  } catch {}
});
let seq = 0;
function tmp(name: string, contents: string): string {
  const p = join(DIR, `${seq++}-${name}`);
  writeFileSync(p, contents);
  return p;
}

describe("detectRegimes — `\\bq\\b` na-guard ignores `.ts` label metadata", () => {
  test("q-free block whose only 'q' is a uses[] label → na (not symbolic)", () => {
    const md = tmp("t.md", "An observation inserts a new crossing into the braid word.");
    const ts = tmp(
      "t.ts",
      `export default remark({ label: "rem:observation-braid", uses: ["rem:toffoli-q-and"] });`,
    );
    const { regimes } = detectRegimes(md, ts, undefined);
    expect([...regimes]).toEqual(["na"]);
  });

  test("real q-math in the .md is still detected (na-guard does not over-strip)", () => {
    const md = tmp("t2.md", "The Hecke relation $(\\sigma_i - q)(\\sigma_i + q^{-1}) = 0$ holds.");
    const ts = tmp("t2.ts", `export default remark({ label: "rem:hecke" });`);
    const { regimes } = detectRegimes(md, ts, undefined);
    expect(regimes.has("na")).toBe(false);
    expect(regimes.has("symbolic")).toBe(true);
  });

  test("real q-math in a .ts title is still detected via MENTIONS_Q_RE", () => {
    const md = tmp("t3.md", "See the deformation below.");
    const ts = tmp("t3.ts", `export default remark({ title: "The $q$-deformation" });`);
    const { regimes } = detectRegimes(md, ts, undefined);
    expect(regimes.has("na")).toBe(false);
  });
});

describe("no shipped chapter-profile default", () => {
  test("loading the checker configures nothing", async () => {
    // Moved from cat-harness-tools' chapter-profile-registry-di.test.ts with
    // the checker (bean `saqd`): chapter profiles are a folio's own data.
    const di = await import("../../../cat-harness-tools/pipeline/chapter-profile-registry-di.ts");
    di.resetChapterProfiles();
    await import("../../pipeline/qa-checkers-q-usage.ts");
    expect(di.chapterProfilesConfigured()).toBe(false);
    expect(di.getChapterProfiles().archimedeanChapters.size).toBe(0);
  });
});
