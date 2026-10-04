/**
 * The site's QA evidence: where it came from, and whether all of it landed.
 *
 * Bean `tfqf`, defect C10: the publishing workflows copied whatever the
 * results tree held, so an absent corpus published a smaller set and the step
 * stayed green. Each branch of the decision is pinned here over constructed
 * trees — the real corpus is never moved inside `bun test` (bean `ymsu`).
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  AVAILABILITY_SCHEMA,
  STATE_SCHEMA,
  countPublished,
  countResults,
  decideSource,
  holdsCorpus,
  judgePublished,
  type QaFetchState,
} from "../qa-site-assets.ts";

function tree(files: string[]): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "qa-site-assets-"));
  for (const f of files) {
    mkdirSync(join(dir, f, ".."), { recursive: true });
    writeFileSync(join(dir, f), "{}\n");
  }
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const NONE = { witnesses: 0, results: 0, files: 0 };
const NO_CORPUS = { ...NONE, corpus: false };

function state(over: Partial<QaFetchState>): QaFetchState {
  return {
    $schema: STATE_SCHEMA,
    source: "checkout",
    requested: ["main/abc"],
    reason: "r",
    expected: { witnesses: 3, results: 2, files: 10 },
    attempts: [],
    ...over,
  };
}

describe("countResults / countPublished", () => {
  test("counts the two published shapes, and an absent tree is zeros", () => {
    const { dir, cleanup } = tree([
      "witnesses/page-a/n1.block.json",
      "witnesses/page-a/qa-index.json",
      "witnesses/page-b/n2.kg.json",
      "a.qa-results.json",
      "b.qa-results.json",
      "kg-qa/x.kg-qa.json",
    ]);
    expect(countResults(dir)).toEqual({ witnesses: 3, results: 2, files: 6 });
    expect(countResults(join(dir, "nope"))).toEqual(NONE);
    cleanup();
  });

  test("a site's top-level index.json and availability.json are not evidence", () => {
    const { dir, cleanup } = tree([
      "assets/qa/index.json",
      "assets/qa/availability.json",
      "assets/qa/a.qa-results.json",
      "assets/qa/page-a/n1.block.json",
    ]);
    expect(countPublished(dir)).toEqual({ witnesses: 1, results: 1 });
    expect(countPublished(join(dir, "nope"))).toEqual({ witnesses: 0, results: 0 });
    cleanup();
  });

  test("a top-level file the witness tree carries is counted on both sides (4l4d's translation-qa-pages.json)", () => {
    // Measured on PR #1801 staging: the tree held 170, the site 169, because
    // `gen-docs-pages` writes `witnesses/translation-qa-pages.json` at the top.
    const { dir, cleanup } = tree([
      "witnesses/translation-qa-pages.json",
      "witnesses/page-a/n1.block.json",
      "assets/qa/translation-qa-pages.json",
      "assets/qa/index.json",
      "assets/qa/availability.json",
      "assets/qa/page-a/n1.block.json",
    ]);
    expect(countResults(dir).witnesses).toBe(2);
    expect(countPublished(dir)).toEqual({ witnesses: 2, results: 0 });
    cleanup();
  });
});

describe("decideSource", () => {
  const counts = { witnesses: 5, results: 4, files: 30 };

  test("a checkout holding the corpus publishes it as checked out, even when the store has an entry", () => {
    const d = decideSource({ ...counts, corpus: true }, { index: 0, key: "pr/1/abc", counts: { witnesses: 9, results: 9, files: 99 } });
    expect(d.source).toBe("checkout");
    expect(d.expected).toEqual(counts);
  });

  test("an absent corpus with an exact hit is `fetched`, judged against the ENTRY's counts", () => {
    const d = decideSource(NO_CORPUS, { index: 0, key: "main/abc", counts });
    expect(d).toMatchObject({ source: "fetched", expected: counts });
  });

  test("a hit on a fallback ref is labelled as another commit's evidence", () => {
    const d = decideSource(NO_CORPUS, { index: 1, key: "main/older", counts });
    expect(d.source).toBe("fetched-fallback");
    expect(d.reason).toContain("ANOTHER commit");
  });

  test("no corpus and no hit is `unavailable`, never an empty success", () => {
    const d = decideSource(NO_CORPUS, undefined);
    expect(d.source).toBe("unavailable");
    expect(d.reason).toContain("QA not available for this ref");
  });
});

describe("holdsCorpus — a build's own leftovers are not a corpus", () => {
  test("one build-written result is NOT a corpus; a verdict family is", () => {
    // Measured: a preview run left `kg-export.qa-results.json` behind in an
    // otherwise absent tree, and the next fetch called the checkout present.
    const { dir, cleanup } = tree(["kg-export.qa-results.json"]);
    expect(holdsCorpus(dir)).toBe(false);
    const decided = decideSource({ ...countResults(dir), corpus: holdsCorpus(dir) }, undefined);
    expect(decided.source).toBe("unavailable");
    mkdirSync(join(dir, "kg-qa"));
    expect(holdsCorpus(dir)).toBe(true);
    cleanup();
  });
});

describe("judgePublished — the C10 shrink fails the step", () => {
  test("everything landed: no error, and the availability document says where it came from", () => {
    const j = judgePublished(state({ key: "main/abc" }), { witnesses: 3, results: 2, files: 10 }, { witnesses: 3, results: 2 });
    expect(j.errors).toEqual([]);
    expect(j.availability).toMatchObject({ $schema: AVAILABILITY_SCHEMA, source: "checkout", key: "main/abc" });
  });

  test("results that existed at the start and did not publish are a SHRINK", () => {
    // The measured case: 20 results committed, one written by the build, one published.
    const j = judgePublished(state({ expected: { witnesses: 0, results: 20, files: 20 } }), { witnesses: 0, results: 1, files: 1 }, { witnesses: 0, results: 1 });
    expect(j.errors.join("\n")).toContain("SHRINK");
  });

  test("a copy that dropped files present NOW is an error whatever the source", () => {
    const j = judgePublished(state({ source: "unavailable", expected: NONE }), { witnesses: 2, results: 1, files: 3 }, { witnesses: 0, results: 0 });
    expect(j.errors.length).toBe(2);
  });

  test("`unavailable` is a warning and a published state, not an error", () => {
    const j = judgePublished(state({ source: "unavailable", expected: NONE, reason: "QA not available for this ref" }), NONE, { witnesses: 0, results: 0 });
    expect(j.errors).toEqual([]);
    expect(j.warnings).toEqual(["QA not available for this ref"]);
    expect(j.availability.source).toBe("unavailable");
  });

  test("a fallback entry's witness shortfall warns rather than fails; its results shortfall still fails", () => {
    const s = state({ source: "fetched-fallback", expected: { witnesses: 10, results: 2, files: 12 } });
    const w = judgePublished(s, { witnesses: 8, results: 2, files: 10 }, { witnesses: 8, results: 2 });
    expect(w.errors).toEqual([]);
    expect(w.warnings.length).toBe(1);
    const r = judgePublished(s, { witnesses: 10, results: 1, files: 11 }, { witnesses: 10, results: 1 });
    expect(r.errors.join("\n")).toContain("SHRINK");
  });
});
