import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ROOT_CHAPTER,
  activeBeansByLabel,
  chapterOf,
  computeMathHeat,
  formatMathHeat,
  readRegister,
  type HeatBlock,
  type MathHeatInput,
} from "../math-heat.ts";

const blk = (chapter: string, kind: string, label: string, sorryFree: boolean | null = null, external = false): HeatBlock => ({
  chapter,
  kind,
  label,
  sorryFree,
  external,
});

const none: Omit<MathHeatInput, "blocks"> = { lean: null, register: null, activeBeans: null, qa: null };

describe("computeMathHeat", () => {
  const blocks = [
    blk("ch1", "theorem", "thm:a", true),
    blk("ch1", "lemma", "lem:b", false),
    blk("ch1", "corollary", "cor:c", null),
    blk("ch1", "definition", "def:d"),
    blk("ch1", "conjecture", "conj:own"),
    blk("ch1", "conjecture", "conj:famous", null, true),
    blk("ch2", "conjecture", "conj:done"),
    blk("ch2", "conjecture", "conj:new"),
    blk(ROOT_CHAPTER, "remark", "rem:x"),
  ];

  test("provedCountsSorryFreeProvables", () => {
    const h = computeMathHeat({ ...none, blocks });
    const ch1 = h.rows.find((r) => r.chapter === "ch1")!;
    expect(ch1).toMatchObject({ provable: 3, proved: 1, conjectures: 1 });
  });

  test("missingSourcesNullNotZero", () => {
    const h = computeMathHeat({ ...none, blocks });
    expect(h).toMatchObject({ hasLean: false, hasRegister: false, hasBeans: false, hasQa: false });
    for (const r of h.rows) {
      expect(r.sorries).toBeNull();
      expect(r.axioms).toBeNull();
      expect(r.conjecturesOpen).toBeNull();
      expect(r.conjecturesUnregistered).toBeNull();
      expect(r.activeBeans).toBeNull();
      expect(r.verdicts).toBeNull();
    }
  });

  test("noBlocksNoRows", () => {
    expect(computeMathHeat({ ...none, blocks: null }).rows).toEqual([]);
  });

  test("leanCountsOnTheirChapter", () => {
    const h = computeMathHeat({ ...none, blocks, lean: [{ chapter: "ch1", totalSorries: 4, axiomCount: 2 }] });
    expect(h.rows.find((r) => r.chapter === "ch1")).toMatchObject({ sorries: 4, axioms: 2 });
    expect(h.rows.find((r) => r.chapter === "ch2")).toMatchObject({ sorries: null, axioms: null });
  });

  test("openConjecturesFollowRegister", () => {
    const h = computeMathHeat({
      ...none,
      blocks,
      register: [
        { sourceBlock: "conj:own", status: "attempted" },
        { sourceBlock: "conj:done", status: "proved" },
        { sourceBlock: "conj:famous", status: "open" },
      ],
    });
    expect(h.rows.find((r) => r.chapter === "ch1")).toMatchObject({ conjectures: 1, conjecturesOpen: 1, conjecturesUnregistered: 0 });
    expect(h.rows.find((r) => r.chapter === "ch2")).toMatchObject({ conjectures: 2, conjecturesOpen: 0, conjecturesUnregistered: 1 });
  });

  test("activeBeansDistinctPerChapter", () => {
    const h = computeMathHeat({ ...none, blocks, activeBeans: { "thm:a": ["b1", "b2"], "lem:b": ["b1"], "conj:new": ["b3"] } });
    expect(h.rows.find((r) => r.chapter === "ch1")!.activeBeans).toEqual(["b1", "b2"]);
    expect(h.rows.find((r) => r.chapter === "ch2")!.activeBeans).toEqual(["b3"]);
    expect(h.rows.find((r) => r.chapter === ROOT_CHAPTER)!.activeBeans).toEqual([]);
  });

  test("verdictsSplitByQaState", () => {
    const h = computeMathHeat({
      ...none,
      blocks,
      qa: { "thm:a": { state: "passing" }, "lem:b": { state: "failing" }, "cor:c": { state: "stale" }, "def:d": { state: "unaudited" } },
    });
    expect(h.rows.find((r) => r.chapter === "ch1")!.verdicts).toEqual({ failing: 1, stale: 1, unaudited: 1, passing: 1, noRecord: 2 });
  });

  test("rowsByNameRootLast", () => {
    expect(computeMathHeat({ ...none, blocks }).rows.map((r) => r.chapter)).toEqual(["ch1", "ch2", ROOT_CHAPTER]);
  });
});

describe("helpers", () => {
  test("chapterOfFirstDirUnderPaper", () => {
    expect(chapterOf("/r/content/qou/ch3-spectra/sec1/thm.ts", "/r/content/qou")).toBe("ch3-spectra");
    expect(chapterOf("/r/content/qou/intro.ts", "/r/content/qou")).toBe(ROOT_CHAPTER);
  });

  test("activeBeansKeepsInProgressResolved", () => {
    const out = activeBeansByLabel({
      beans: [
        { id: "a", status: "in-progress", targets: [{ blockLabel: "thm:x" }, { blockLabel: "thm:x" }, {}] },
        { id: "b", status: "todo", targets: [{ blockLabel: "thm:x" }] },
      ],
    });
    expect(out).toEqual({ "thm:x": ["a"] });
  });

  test("readRegisterSkipsOtherJson", () => {
    const dir = mkdtempSync(join(tmpdir(), "math-heat-"));
    try {
      writeFileSync(
        join(dir, "conj-a.json"),
        JSON.stringify({ $schema: "folio-conjecture-register/v1", id: "conj-a", sourceBlock: "conj:a", status: "open" }),
      );
      writeFileSync(join(dir, "other.json"), JSON.stringify({ $schema: "something-else/v1" }));
      writeFileSync(join(dir, "notes.md"), "not json");
      expect(readRegister(dir)).toEqual([{ sourceBlock: "conj:a", status: "open" }]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("tableShowsUnknownAsQuestionMark", () => {
    const h = computeMathHeat({ ...none, blocks: [blk("ch1", "theorem", "thm:a", true)] });
    const text = formatMathHeat(h, { blocks: "ok", lean: "no Lean tree", register: "ok", beans: "ok", qa: "no --qa file given" });
    expect(text).toContain("1/1");
    expect(text).toContain("? = no data (not zero):");
    expect(text).toContain("lean: no Lean tree");
    expect(text).not.toContain("register:");
  });
});
