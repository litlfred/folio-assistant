import { describe, test, expect } from "bun:test";
import {
  CHAPTER_EXPECTED_REGIMES,
  CATEGORICAL_CHAPTERS,
  ARCHIMEDEAN_CHAPTERS,
} from "../../content/pipeline/qa-checkers-q-usage.ts";

/**
 * `q-usage-narrative-chapter-mismatch` flags a block whose detected q-regime
 * is disjoint from its chapter's expected set — the block is then "a candidate
 * for being moved or explicitly tagged as a specialisation".
 *
 * The archimedean chapters listed only archimedean regimes, so every purely
 * structural block in them tripped. Measured against the qou corpus that was
 * **694 findings — 40-57% of eight separate chapters**, and 632 of them
 * detected nothing but `symbolic` / `generic-R`. A criterion that flags half a
 * chapter is describing its own table, not the content.
 *
 * It is also the wrong direction. Under §7c the algebraic substrate is the
 * DEFAULT and archimedean specialisation is the declared exception, so a
 * purely symbolic block is on the safe side of the wall wherever it sits — and
 * a symbolic *definition* inside `mass-theory` is not a candidate for being
 * moved, it is just a definition. The dangerous direction (archimedean leaking
 * into a categorical chapter) is a separate criterion, and it reports 8.
 *
 * Note the existing `qa-checkers-q-usage.test.ts` fixes an EARLIER
 * false-positive in this same criterion, in the same chapters — this is a
 * recurring failure mode for it, which is why the invariant is pinned rather
 * than left to the table.
 */

describe("chapter regime expectations", () => {
  test("every chapter accepts the substrate regimes", () => {
    // `symbolic` and `generic-R` are the base ring. No chapter should treat
    // them as out of place; that is what produced 632 of the 694 findings.
    const offenders = Object.entries(CHAPTER_EXPECTED_REGIMES)
      .filter(([, set]) => !set.has("symbolic") || !set.has("generic-R"))
      .map(([chapter]) => chapter);
    expect(offenders).toEqual([]);
  });

  test("archimedean chapters still expect their archimedean regimes", () => {
    // The fix must not have weakened the table into "anything goes": these
    // chapters are where `fixed-q0` and real regimes legitimately live.
    for (const chapter of ARCHIMEDEAN_CHAPTERS) {
      const set = CHAPTER_EXPECTED_REGIMES[chapter];
      if (!set) continue; // not every listed chapter carries a table entry
      expect(set.has("real-positive")).toBe(true);
      expect(set.has("fixed-q0")).toBe(true);
    }
  });

  test("categorical chapters do NOT expect fixed-q0", () => {
    // The dangerous direction stays guarded: a pinned numerical q_0 has no
    // business in a categorical chapter, and that must remain detectable.
    for (const chapter of CATEGORICAL_CHAPTERS) {
      const set = CHAPTER_EXPECTED_REGIMES[chapter];
      if (!set) continue;
      expect(set.has("fixed-q0")).toBe(false);
    }
  });

  test("every table entry is non-empty and includes `na`", () => {
    for (const [chapter, set] of Object.entries(CHAPTER_EXPECTED_REGIMES)) {
      expect(set.size, `${chapter} has an empty expectation set`).toBeGreaterThan(0);
      expect(set.has("na"), `${chapter} does not accept a q-free block`).toBe(true);
    }
  });
});
