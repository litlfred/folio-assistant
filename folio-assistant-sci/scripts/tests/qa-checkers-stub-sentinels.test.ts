import { describe, expect, test } from "bun:test";
import type { CheckerResult } from "../../../cat-harness-tools/schemas/sdlc/block-qa.ts";
import {
  checkProofNoAxiomGrowth,
  checkProofBuildGreen,
  EXTENDED_AUTOMATED_CHECKERS,
} from "../../pipeline/qa-checkers-extended";
import { USES_AUTOMATED_CHECKERS } from "../../pipeline/qa-checkers-uses";

const EXPECTED_SENTINEL: CheckerResult = {
  result: "n/a",
  hits: [],
  notes: "not implemented: stub checker",
};

describe("Paper QA stub checkers return distinguishable sentinel notes (folio-assistant-89wq)", () => {
  test("noAxiomGrowthReturnsSentinel", () => {
    expect(checkProofNoAxiomGrowth(undefined)).toEqual(EXPECTED_SENTINEL);
    expect(checkProofNoAxiomGrowth("some/path/to/block.lean")).toEqual(EXPECTED_SENTINEL);
  });

  test("buildGreenReturnsSentinel", () => {
    expect(checkProofBuildGreen(undefined)).toEqual(EXPECTED_SENTINEL);
    expect(checkProofBuildGreen("some/path/to/block.lean")).toEqual(EXPECTED_SENTINEL);
  });

  test("exposesAll23PaperCriteria", () => {
    expect(Object.keys(USES_AUTOMATED_CHECKERS).sort()).toEqual([
      "lean-ref-owns-decl",
      "uses-formal-coverage",
    ]);
    expect(Object.keys(EXTENDED_AUTOMATED_CHECKERS).length).toBe(21);
  });
});
