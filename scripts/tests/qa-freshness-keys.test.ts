import { describe, test, expect } from "bun:test";
import { entryIsFresh, freshnessKeys } from "../../content/pipeline/qa-utils";
import { QA_CRITERIA_BY_ID } from "../../content/pipeline/qa-criteria-registry";
import type { QaCriterionEntry } from "../../schemas/block-qa";

/**
 * `depends_on` carries two meanings — applicability and freshness — and
 * they come apart for any criterion that READS a file it must not GATE on.
 * `also_invalidated_by` is the freshness half on its own.
 *
 * The live bug these pin: `voice-scholarly-default` scans Lean docstrings
 * but listed only `["md"]`, so a Lean-only edit could not clear its own
 * stale `fail` (qou #4673). The naive fix — adding `"lean"` to
 * `depends_on` — is a WORSE bug: it `n/a`s every prose-only block.
 */

const scriptEntry = (
  field_hash: Record<string, string | undefined>,
  result: QaCriterionEntry["result"] = "fail",
): QaCriterionEntry =>
  ({
    field_hash,
    result,
    reviewer: { kind: "script", id: "test" },
    reviewed_at: "2026-01-01T00:00:00.000Z",
  }) as unknown as QaCriterionEntry;

describe("freshnessKeys", () => {
  test("is depends_on when nothing extra is declared", () => {
    expect(freshnessKeys({ depends_on: ["md", "ts"] }).sort()).toEqual(["md", "ts"]);
  });

  test("unions in also_invalidated_by", () => {
    expect(
      freshnessKeys({ depends_on: ["md"], also_invalidated_by: ["lean"] }).sort(),
    ).toEqual(["lean", "md"]);
  });

  test("de-duplicates an overlapping declaration", () => {
    expect(
      freshnessKeys({ depends_on: ["md", "lean"], also_invalidated_by: ["lean"] }).sort(),
    ).toEqual(["lean", "md"]);
  });
});

describe("entryIsFresh honours also_invalidated_by", () => {
  const def = { depends_on: ["md"] as Array<"md">, also_invalidated_by: ["lean"] as Array<"lean"> };

  test("a Lean-only edit makes the entry STALE (the bug)", () => {
    const entry = scriptEntry({ md: "aaa", lean: "old" });
    const current = { md: "aaa", lean: "new" };
    // Under the old behaviour (depends_on alone) this returned `true`,
    // so a corrected docstring kept serving the stale verdict.
    expect(entryIsFresh(entry, current, ["md"])).toBe(true);
    expect(entryIsFresh(entry, current, freshnessKeys(def))).toBe(false);
  });

  test("an untouched Lean file leaves the entry fresh", () => {
    const entry = scriptEntry({ md: "aaa", lean: "same" });
    expect(
      entryIsFresh(entry, { md: "aaa", lean: "same" }, freshnessKeys(def)),
    ).toBe(true);
  });

  test("a prose-only block stays fresh — no .lean on either side", () => {
    // The `!expected && !actual` branch: absent then, absent now.
    const entry = scriptEntry({ md: "aaa" });
    expect(entryIsFresh(entry, { md: "aaa" }, freshnessKeys(def))).toBe(true);
  });

  test("gaining a .lean sibling invalidates", () => {
    const entry = scriptEntry({ md: "aaa" });
    expect(entryIsFresh(entry, { md: "aaa", lean: "new" }, freshnessKeys(def))).toBe(false);
  });
});

describe("voice-scholarly-default registry wiring", () => {
  const def = QA_CRITERIA_BY_ID["voice-scholarly-default"];

  test("is registered", () => {
    expect(def).toBeDefined();
  });

  test("does NOT gate applicability on .lean — prose-only blocks must still run", () => {
    // This is the regression guard. `qa-sweep` writes an `n/a` and skips
    // the checker for any block missing a `depends_on` file, so listing
    // "lean" here would silently stop checking prose-only blocks.
    expect(def.depends_on).not.toContain("lean");
    expect(def.depends_on).toContain("md");
  });

  test("but DOES invalidate on .lean, because the checker reads docstrings", () => {
    expect(def.also_invalidated_by ?? []).toContain("lean");
  });

  test("so its freshness key set covers both files", () => {
    expect(freshnessKeys(def).sort()).toEqual(["lean", "md"]);
  });
});

describe("registry invariant", () => {
  test("no criterion lists a file in both depends_on and also_invalidated_by", () => {
    // Harmless (freshnessKeys de-dupes) but always a mistake: it means the
    // author was unsure which half they wanted.
    const offenders = Object.values(QA_CRITERIA_BY_ID)
      .filter((d) => (d.also_invalidated_by ?? []).some((k) => d.depends_on.includes(k)))
      .map((d) => d.id);
    expect(offenders).toEqual([]);
  });
});
