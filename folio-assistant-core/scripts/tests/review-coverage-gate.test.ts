/**
 * `review-coverage-gate.dmn`, evaluated by the engine `workflow_complete`
 * uses, over facts shaped exactly as `review-coverage` emits them (bean `bnjs`).
 */
import { describe, expect, it } from "bun:test";
import { join } from "node:path";

import { evaluate, loadDecisionTable, unreadableExpressions } from "../../../cat-harness/src/workflow/decision-table.js";

const table = await loadDecisionTable(join(import.meta.dir, "../../processes/content/decisions/review-coverage-gate.dmn"), "Decision_ReviewCoverageGate");
const clean = { uncoveredBlocks: 0, openDefects: 0, rendered: "known", unreviewedPages: 0, undeterminedInputs: 0, measured: "known", missedPages: 0 };
const decide = (f: Partial<typeof clean>) => evaluate(table, { ...clean, ...f });

describe("review-coverage-gate.dmn", () => {
  it("every expression in it can be read by the engine", () => {
    expect(unreadableExpressions(table)).toEqual([]);
  });

  it("covered when nothing is owed", () => {
    expect(decide({}).outcome).toBe("yes");
  });

  it("each count it reads keeps the review open, and says which rule", () => {
    expect(decide({ uncoveredBlocks: 1 }).rule).toBe("Rule_Uncovered");
    expect(decide({ openDefects: 1 }).rule).toBe("Rule_OpenDefect");
    expect(decide({ unreviewedPages: 2 }).rule).toBe("Rule_UnreviewedPage");
    expect(decide({ undeterminedInputs: 1 }).rule).toBe("Rule_Undetermined");
    expect(decide({ missedPages: 1 }).rule).toBe("Rule_Missed");
    for (const f of [{ unreviewedPages: 2 }, { undeterminedInputs: 1 }, { missedPages: 1 }]) expect(decide(f).outcome).toBe("no");
  });

  it("a page count that was not computed is not read: an absent rendered impact or a not-base measurement", () => {
    expect(decide({ rendered: "absent", unreviewedPages: 0, undeterminedInputs: 0 }).outcome).toBe("yes");
    expect(decide({ measured: "not-base", missedPages: 3 }).outcome).toBe("yes");
    expect(decide({ measured: "absent", missedPages: 0 }).outcome).toBe("yes");
  });

  it("refuses to decide without every fact, rather than reading a missing one as 0", () => {
    expect(() => evaluate(table, { uncoveredBlocks: 0, openDefects: 0 })).toThrow();
  });
});
