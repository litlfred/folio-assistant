/**
 * check:derived-from, seen failing on planted violations (bean nama, step 2):
 * an edge between derived graphs is only checkable if a wrong one is refused.
 */
import { describe, expect, it } from "bun:test";

import { analyse, type Inst, judge, ratchet } from "../check-derived-from.ts";

const dir = (id: string, index: number, derivedFrom?: string[], derived = true) => ({
  id,
  index,
  derived,
  ...(derivedFrom ? { derivedFrom } : {}),
});

// base ← mid ← top, and a sibling `side` that top does not need.
const world = (topDirs: Inst["dirs"]): Inst[] => [
  { name: "base", ancestors: [], dirs: [dir("chrome", 0, undefined, false), dir("lib", 1, undefined, false)] },
  { name: "mid", ancestors: ["base"], dirs: [dir("lib", 0, undefined, false), dir("index", 1, ["lib"])] },
  { name: "side", ancestors: [], dirs: [dir("styling", 0, undefined, false)] },
  { name: "top", ancestors: ["mid", "base"], dirs: topDirs },
];

describe("resolution", () => {
  it("an id resolves to the NEAREST declaring instance, and the edge says which", () => {
    const j = judge(world([dir("pages", 0, ["lib", "chrome"])]));
    expect(j.findings).toEqual([]);
    expect(j.edges).toContainEqual({ from: "top/pages", to: "mid/lib" });
    expect(j.edges).toContainEqual({ from: "top/pages", to: "base/chrome" });
  });
  it("an id declared nowhere is refused", () => {
    const j = judge(world([dir("pages", 0, ["nothing"])]));
    expect(j.findings).toEqual([{ kind: "unknown-id", instance: "top", directory: "pages", target: "nothing" }]);
  });
  it("an id only a non-needed instance declares is a LAYERING GAP, not an unknown id", () => {
    const j = judge(world([dir("pages", 0, ["styling"])]));
    expect(j.findings).toEqual([
      { kind: "layering-gap", instance: "top", directory: "pages", target: "styling", declaredBy: ["side"] },
    ]);
  });
});

describe("the interim order: declaration order is rendering order", () => {
  it("a consumer declared before its same-instance source is refused", () => {
    const j = judge(world([dir("pages", 0, ["ast"]), dir("ast", 1, undefined)]));
    expect(j.findings.map((f) => f.kind)).toEqual(["order"]);
  });
  it("the same pair in source-first order passes", () => {
    expect(judge(world([dir("ast", 0, undefined), dir("pages", 1, ["ast"])])).findings).toEqual([]);
  });
});

describe("cycles", () => {
  it("a two-node cycle is refused once", () => {
    const j = judge(world([dir("a", 0, ["b"]), dir("b", 1, ["a"])]));
    expect(j.findings.filter((f) => f.kind === "cycle")).toHaveLength(1);
  });
  it("a self-edge is a cycle", () => {
    const j = judge(world([dir("a", 0, ["a"])]));
    expect(j.findings.some((f) => f.kind === "cycle")).toBe(true);
  });
});

describe("the ratchet over layering gaps", () => {
  const gap = judge(world([dir("pages", 0, ["styling"])])).findings;
  const entry = { instance: "top", directory: "pages", target: "styling", reason: "planted", bean: "nama" };
  it("an unbaselined gap regresses", () => {
    expect(ratchet(gap, []).regressions).toHaveLength(1);
  });
  it("a baselined gap passes", () => {
    expect(ratchet(gap, [entry])).toEqual({ regressions: [], stale: [] });
  });
  it("a baseline entry that is no longer a gap is stale", () => {
    expect(ratchet([], [entry]).stale).toEqual([entry]);
  });
});

describe("advisory", () => {
  it("a derived directory naming no derivedFrom is counted, not refused", () => {
    const j = judge(world([dir("pages", 0, undefined)]));
    expect(j.findings).toEqual([]);
    expect(j.undeclared).toContain("top/pages");
  });
});

describe("this checkout", () => {
  it("reads every instance and finds nothing hard", () => {
    const j = analyse();
    expect(j.findings.filter((f) => f.kind !== "layering-gap")).toEqual([]);
  });
});
