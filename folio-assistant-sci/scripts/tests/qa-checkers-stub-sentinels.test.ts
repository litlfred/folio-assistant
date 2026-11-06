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
  test("checkProofNoAxiomGrowth returns distinguishable stub sentinel", () => {
    expect(checkProofNoAxiomGrowth(undefined)).toEqual(EXPECTED_SENTINEL);
    expect(checkProofNoAxiomGrowth("some/path/to/block.lean")).toEqual(EXPECTED_SENTINEL);
  });

  test("checkProofBuildGreen returns distinguishable stub sentinel", () => {
    expect(checkProofBuildGreen(undefined)).toEqual(EXPECTED_SENTINEL);
    expect(checkProofBuildGreen("some/path/to/block.lean")).toEqual(EXPECTED_SENTINEL);
  });

  test("USES_AUTOMATED_CHECKERS and EXTENDED_AUTOMATED_CHECKERS expose all 23 paper criteria", () => {
    expect(Object.keys(USES_AUTOMATED_CHECKERS).sort()).toEqual([
      "lean-ref-owns-decl",
      "uses-formal-coverage",
    ]);
    expect(Object.keys(EXTENDED_AUTOMATED_CHECKERS).length).toBe(21);
  });
});
