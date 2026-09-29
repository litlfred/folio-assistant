/**
 * The engine checked against the method's own worked example, not against
 * itself. Deerwester et al. (1990), Table 2 and Appendix
 * (`library/deerwester-1990-indexing-by-lsa`, pages 11 and 26–27): nine
 * Bellcore memo titles, twelve index terms, raw frequencies, and the nine
 * singular values the paper prints to two decimals.
 */
import { describe, expect, test } from "bun:test";
import { buildLsi, neighboursOf, query } from "./lsi";

// Table 2, the term × document matrix, rows in the paper's order.
const TERMS = ["human", "interface", "computer", "user", "system", "response", "time", "eps", "survey", "trees", "graph", "minors"];
const DOCS = ["c1", "c2", "c3", "c4", "c5", "m1", "m2", "m3", "m4"];
const X = [
  [1, 0, 0, 1, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 1, 0, 0, 0, 0],
  [0, 1, 1, 2, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 1, 0, 0, 0, 0],
  [0, 1, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1],
];
/** Appendix, S0 — printed to two decimals. */
const S0 = [3.34, 2.54, 2.35, 1.64, 1.5, 1.31, 0.85, 0.56, 0.36];

/** Each document as text whose token counts ARE its column of X. */
const units = DOCS.map((id, j) => ({
  id,
  text: TERMS.flatMap((t, i) => Array(X[i][j]).fill(t)).join(" "),
}));

describe("LSI engine against Deerwester et al. (1990)", () => {
  // MIN_TOKENS is a CLI concern; the engine takes the units as given.
  const ix = buildLsi(units, { k: 8, weighting: "raw", minDf: 1, maxDfShare: 1, seed: 1990 });

  test("reads the paper's 12 × 9 matrix", () => {
    expect([...ix.terms].sort()).toEqual([...TERMS].sort());
    expect(ix.unitIds).toEqual(DOCS);
  });

  test("the singular values match the Appendix to the two decimals printed", () => {
    // k = 8 of 9: the ninth is dropped by the min(m, n) − 1 cap.
    ix.singularValues.forEach((s, c) => expect(Math.abs(s - S0[c])).toBeLessThan(0.006));
  });

  test("the paper's query retrieves c3 and c5, which share no term with it", () => {
    // §4.1 and Figure 1: "human computer interaction" in the 2-dimensional
    // space; c1–c5 are near q, m1–m4 are not, and c3/c5 contain neither word.
    const two = buildLsi(units, { k: 2, weighting: "raw", minDf: 1, maxDfShare: 1, seed: 1990 });
    const hits = query(two, "human computer interaction", 9);
    const top5 = hits.slice(0, 5).map((h) => h.id).sort();
    expect(top5).toEqual(["c1", "c2", "c3", "c4", "c5"]);
    for (const m of ["m1", "m2", "m3", "m4"]) expect(hits.find((h) => h.id === m)!.cosine).toBeLessThan(0.5);
  });

  test("is deterministic: the same inputs give the same index", () => {
    const again = buildLsi(units, { k: 8, weighting: "raw", minDf: 1, maxDfShare: 1, seed: 1990 });
    expect(again.singularValues).toEqual(ix.singularValues);
    expect(neighboursOf(again, "c3", 3)).toEqual(neighboursOf(ix, "c3", 3));
  });
});
