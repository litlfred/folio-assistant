import { describe, expect, test } from "bun:test";
import {
  compareLeanVersions,
  isApplicableAt,
  type RefactorStrategy,
} from "../../schemas/refactor-strategy";
import { loadStrategies } from "../../content/pipeline/refactor-strategy";

const strat = (over: Partial<RefactorStrategy> = {}): RefactorStrategy => ({
  id: "t",
  description: "d",
  objectives: ["length"],
  confidence: "verified",
  lean: { min: "4.0.0" },
  example: { before: "a", after: "b" },
  ...over,
});

describe("compareLeanVersions", () => {
  test("compares numerically, not lexically", () => {
    // The whole reason this helper exists: string comparison puts
    // "4.9.0" AFTER "4.24.0", which is the range folio actually lives in.
    expect("4.9.0" > "4.24.0").toBe(true); // the trap
    expect(compareLeanVersions("4.9.0", "4.24.0")).toBe(-1);
    expect(compareLeanVersions("4.24.0", "4.9.0")).toBe(1);
  });

  test("equal versions compare equal", () => {
    expect(compareLeanVersions("4.24.0", "4.24.0")).toBe(0);
  });

  test("missing components are treated as zero", () => {
    expect(compareLeanVersions("4.24", "4.24.0")).toBe(0);
    expect(compareLeanVersions("4.24", "4.24.1")).toBe(-1);
  });

  test("major version dominates", () => {
    expect(compareLeanVersions("5.0.0", "4.99.0")).toBe(1);
  });
});

describe("isApplicableAt", () => {
  test("min bound is inclusive", () => {
    const s = strat({ lean: { min: "4.17.0" } });
    expect(isApplicableAt(s, "4.17.0")).toBe(true);
    expect(isApplicableAt(s, "4.16.9")).toBe(false);
  });

  test("max bound is exclusive", () => {
    const s = strat({ lean: { min: "4.0.0", max: "4.30.0" } });
    expect(isApplicableAt(s, "4.29.9")).toBe(true);
    expect(isApplicableAt(s, "4.30.0")).toBe(false);
  });

  test("an unbounded strategy is NOT applicable under strict gating", () => {
    // Fail-closed is the point: silently applying a strategy with no
    // declared range is the breakage the metadata exists to prevent.
    const s = strat({ lean: {} });
    expect(isApplicableAt(s, "4.24.0")).toBe(false);
    expect(isApplicableAt(s, "4.24.0", false)).toBe(true);
  });

  test("deprecated is never applicable, even in range", () => {
    const s = strat({ confidence: "deprecated", lean: { min: "4.0.0" } });
    expect(isApplicableAt(s, "4.24.0")).toBe(false);
    expect(isApplicableAt(s, "4.24.0", false)).toBe(false);
  });
});

describe("shipped strategy database", () => {
  const all = loadStrategies();

  test("loads the mechanical family", () => {
    expect(all.length).toBeGreaterThan(0);
  });

  test("every strategy declares a Lean range", () => {
    // An unbounded strategy would be silently dropped by strict gating,
    // i.e. shipped but dead. Catch that here rather than in a sweep.
    const unbounded = all.filter((s) => !s.lean?.min && !s.lean?.max);
    expect(unbounded.map((s) => s.id)).toEqual([]);
  });

  test("ids are unique", () => {
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every strategy carries a worked example", () => {
    const missing = all.filter((s) => !s.example?.before || !s.example?.after);
    expect(missing.map((s) => s.id)).toEqual([]);
  });

  test("non-obvious rewrites carry a caveat", () => {
    // `proposed` means unproven here; shipping one with no stated risk
    // invites an agent to apply it as though it were verified.
    const proposedNoCaveat = all.filter(
      (s) => s.confidence === "proposed" && !s.caveat,
    );
    expect(proposedNoCaveat.map((s) => s.id)).toEqual([]);
  });

  test("superseded_by, where present, resolves to a known strategy", () => {
    const ids = new Set(all.map((s) => s.id));
    const dangling = all
      .filter((s) => s.superseded_by && !ids.has(s.superseded_by))
      .map((s) => s.id);
    expect(dangling).toEqual([]);
  });
});
