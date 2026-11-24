import { describe, expect, test } from "bun:test";
import { EXTENDED_AUTOMATED_CHECKERS } from "../../pipeline/qa-checkers-extended";
import { USES_AUTOMATED_CHECKERS } from "../../pipeline/qa-checkers-uses";

// folio-assistant-89wq gave the stub checkers a distinguishable sentinel note.
// The two proof stubs (proof-build-green, proof-no-axiom-growth) were then
// retired on 2026-11-21 (litlfred/qou#8914, bean 3t8p): no input could change
// their verdict. This guards that they stay retired rather than returning as
// stubs, and pins the paper checker count.
describe("Paper QA checkers: the retired proof stubs stay retired (folio-assistant-89wq)", () => {
  test("retiredProofStubsAreNotRegistered", () => {
    expect(Object.keys(EXTENDED_AUTOMATED_CHECKERS)).not.toContain("proof-build-green");
    expect(Object.keys(EXTENDED_AUTOMATED_CHECKERS)).not.toContain("proof-no-axiom-growth");
  });

  test("exposesAll21PaperCriteria", () => {
    expect(Object.keys(USES_AUTOMATED_CHECKERS).sort()).toEqual([
      "lean-ref-owns-decl",
      "uses-formal-coverage",
    ]);
    expect(Object.keys(EXTENDED_AUTOMATED_CHECKERS).length).toBe(19);
  });
});
