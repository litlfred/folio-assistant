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
 */
import { describe, test, expect, afterAll } from "bun:test";
import { writeFileSync, mkdtempSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  detectRegimes,
  checkQUsageArchimedeanInCategoricalChapter,
} from "../../content/pipeline/qa-checkers-q-usage.ts";

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

/** Write a file under a path `chapterFromPath` reads as `<chapter>`. */
function inChapter(chapter: string, name: string, contents: string): string {
  const dir = join(DIR, `${seq++}`, "content", "paper", chapter);
  mkdirSync(dir, { recursive: true });
  const p = join(dir, name);
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

/**
 * `q-usage-archimedean-in-categorical-chapter` reports the DANGEROUS
 * direction of the §7c wall: archimedean evaluation leaking into a chapter
 * whose substrate is meant to stay algebraic. It is the criterion that has
 * to stay believable, so its two known over-reach modes are pinned here.
 */
describe("checkQUsageArchimedeanInCategoricalChapter — precision", () => {
  test("Real.* inside a Lean comment is prose, not a wall crossing", () => {
    // Live example: five `appendix-surreals` conjectures all failed on the
    // same three lines of `Conjectures.lean`, every one of them inside a
    // `/- … -/` block explaining that `surrealExp` is a standard-part
    // PLACEHOLDER and what it loses. Documenting a limitation is not
    // committing it. The tactic scan already skipped comments; the `Real.*`
    // scan beside it did not.
    const lean = inChapter(
      "appendix-surreals",
      "c.lean",
      [
        "/-- Placeholder: this would be `Real.exp (standardPart x)`,",
        "which loses infinitesimal structure. -/",
        "def surrealExp (q : K) : K := q",
        "-- also not `Real.log q`",
      ].join("\n"),
    );
    const r = checkQUsageArchimedeanInCategoricalChapter(undefined, undefined, lean);
    expect(r.result).toBe("pass");
    expect(r.hits).toEqual([]);
  });

  test("Real.* in real code is still reported", () => {
    // The strip must not become a blanket exemption.
    const lean = inChapter(
      "appendix-surreals",
      "c2.lean",
      "def f (q : ℝ) : ℝ := Real.exp q\n",
    );
    const r = checkQUsageArchimedeanInCategoricalChapter(undefined, undefined, lean);
    expect(r.result).toBe("fail");
    expect(r.hits.length).toBeGreaterThan(0);
  });

  test("a Lean file that never mentions q is out of this criterion's scope", () => {
    // Live example: `CoxeterGeometricRepresentationFull.lean` failed on
    // `Real.sin` / `Real.cos` and mentions `q` ZERO times. It is the classical
    // geometric representation of a Coxeter group, *defined* over ℝ via
    // cos(π/m) — nothing to do with the substrate parameter.
    const lean = inChapter(
      "braids-and-knots",
      "coxeter.lean",
      "def c (m : ℕ) : ℝ := -Real.cos (Real.pi / m)\n",
    );
    const r = checkQUsageArchimedeanInCategoricalChapter(undefined, undefined, lean);
    expect(r.result).toBe("pass");
  });

  test("the q-gate does NOT suppress the prose scan", () => {
    // The gate is about what the Lean file does to `q`. A block whose
    // NARRATIVE quotes a ppm-level empirical comparison is flagged on its own
    // evidence, whatever its Lean sibling happens to contain.
    const lean = inChapter("braids-and-knots", "plain.lean", "def n : Nat := 3\n");
    const md = inChapter(
      "braids-and-knots",
      "plain.md",
      "The closed form gives a 203 ppm correction to the observed value.\n",
    );
    const r = checkQUsageArchimedeanInCategoricalChapter(md, undefined, lean);
    expect(r.result).toBe("fail");
    expect(r.hits.some((h) => h.file === md)).toBe(true);
  });
});

describe("checkQUsageArchimedeanInCategoricalChapter — `noncomputable` is not archimedean", () => {
  test("linarith over ℚ in a file with no ℝ is not a wall crossing", () => {
    // `noncomputable` means Lean cannot generate executable code — classical
    // choice, quotients, `finrank`, abstract-field inverses. Live example:
    // `knot-eigenbasis-complete.lean` has zero `ℝ` outside docstrings, and its
    // two `noncomputable def`s were the entire reason its partition-size
    // `positivity` / `linarith` calls were reported.
    const lean = inChapter(
      "braids-and-knots",
      "parts.lean",
      [
        "noncomputable def dim (q : R) : Nat := 0",
        "theorem spin_nonneg (a : ℕ) : (0 : ℚ) ≤ (a : ℚ) / 2 := by positivity",
        "theorem le_n (a b n : ℕ) (h : a + b = n) : (a : ℚ) - b ≤ n := by linarith",
      ].join("\n"),
    );
    const r = checkQUsageArchimedeanInCategoricalChapter(undefined, undefined, lean);
    expect(r.result).toBe("pass");
  });

  test("but linarith beside a genuine `q : ℝ` still fires", () => {
    const lean = inChapter(
      "braids-and-knots",
      "realq.lean",
      [
        "noncomputable def trace (q : ℝ) : ℝ := q + 1",
        "theorem t {q : ℝ} (h : 0 < q) : 0 < trace q := by unfold trace; linarith",
      ].join("\n"),
    );
    const r = checkQUsageArchimedeanInCategoricalChapter(undefined, undefined, lean);
    expect(r.result).toBe("fail");
  });
});
