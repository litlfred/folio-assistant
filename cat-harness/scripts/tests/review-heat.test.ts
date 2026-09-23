/** The review heat map's numbers (bean qbfi). */
import { describe, expect, test } from "bun:test";

import { computeHeat, heatBucket } from "../review-heat.js";

const change = (label: string, section: string) => ({ label, head: { section } });
const comment = (targetLabel: string, status: string, kind: string, blockHash: string | null, orphaned = false) => ({
  targetLabel, status, review: { kind, blockHash, orphaned },
});

describe("computeHeat", () => {
  const changes = [change("a", "doc::sec:one"), change("b", "doc::sec:one"), change("c", "doc::sec:two")];
  const blocks = {
    a: { hash: "a2", section: "doc::sec:one" },
    b: { hash: "b1", section: "doc::sec:one" },
    c: { hash: "c1", section: "doc::sec:two" },
    u: { hash: "u1", section: "doc::sec:three" },
  };

  test("counts changes, open comments, defects and stale comments per section, in reading order", () => {
    const h = computeHeat({
      changes,
      blocks,
      comments: [
        comment("a", "open", "defect", "a1"), // block changed since: stale
        comment("b", "addressed", "question", "b1"),
        comment("b", "resolved", "defect", "b1"), // closed: not counted
        comment("u", "open", "editorial", "u1"), // unchanged block, own section
      ],
    });
    expect(h.rows).toEqual([
      { section: "doc::sec:one", changed: 2, open: 2, defects: 1, stale: 1, qaFailing: 0, qaWorst: null, qaStale: 0, qaUnaudited: 0, qaBlocks: 0 },
      { section: "doc::sec:two", changed: 1, open: 0, defects: 0, stale: 0, qaFailing: 0, qaWorst: null, qaStale: 0, qaUnaudited: 0, qaBlocks: 0 },
      { section: "doc::sec:three", changed: 0, open: 1, defects: 0, stale: 0, qaFailing: 0, qaWorst: null, qaStale: 0, qaUnaudited: 0, qaBlocks: 0 },
    ]);
  });

  test("an orphaned open comment is still counted, under no section, last", () => {
    const h = computeHeat({ changes, blocks, comments: [comment("gone", "open", "question", "g1", true)] });
    expect(h.rows.at(-1)).toEqual({ section: "(listed in no section)", changed: 0, open: 1, defects: 0, stale: 0, qaFailing: 0, qaWorst: null, qaStale: 0, qaUnaudited: 0, qaBlocks: 0 });
  });

  test("QA: a failing or stale block is counted in its section; a clean unchanged section gets no row", () => {
    const h = computeHeat({
      changes,
      blocks,
      comments: [],
      qa: {
        a: { state: "failing", worst: "major" },
        b: { state: "failing", worst: "critical" },
        c: { state: "passing", worst: null },
        u: { state: "passing", worst: null },
      },
    });
    expect(h.hasQa).toBe(true);
    expect(h.rows.map((r) => r.section)).toEqual(["doc::sec:one", "doc::sec:two"]);
    expect(h.rows[0]).toMatchObject({ qaFailing: 2, qaWorst: "critical", qaBlocks: 2 });
    expect(h.rows[1]).toMatchObject({ qaFailing: 0, qaBlocks: 1 });
  });

  test("QA: a stale verdict in an unchanged section IS a place to look, and is not a pass", () => {
    const h = computeHeat({ changes, blocks, comments: [], qa: { u: { state: "stale", worst: null } } });
    expect(h.rows.at(-1)).toMatchObject({ section: "doc::sec:three", qaStale: 1, qaFailing: 0 });
  });

  test("QA without blocks.json cannot be placed, so it is not published rather than guessed", () => {
    expect(computeHeat({ changes, blocks: null, comments: [], qa: { a: { state: "failing", worst: "major" } } }).hasQa).toBe(false);
  });

  test("no comment file and no blocks file are SAID, not zeroed", () => {
    const h = computeHeat({ changes, blocks: null, comments: null });
    expect(h.hasComments).toBe(false);
    expect(h.hasBlocks).toBe(false);
  });

  test("is self-contained, so the page can embed exactly this function", () => {
    // eslint-disable-next-line no-new-func
    const embedded = new Function(`return (${computeHeat.toString()})`)() as typeof computeHeat;
    expect(embedded({ changes, blocks, comments: [] })).toEqual(computeHeat({ changes, blocks, comments: [] }));
  });
});

describe("heatBucket", () => {
  test("zero is no fill; the rest are tertiles of the column's maximum", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((v) => heatBucket(v, 6))).toEqual([0, 1, 1, 2, 2, 3, 3]);
    expect(heatBucket(3, 0)).toBe(0);
  });
});
