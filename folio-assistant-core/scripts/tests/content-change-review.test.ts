import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { drainSubprocess } from "../../../cat-harness/scripts/tests/helpers";
import { loadProcessModel } from "../../../cat-harness/src/workflow/process-model";
import { complete, enabled, startInstance } from "../../../cat-harness/src/workflow/instance";
import { workflowFile } from "../../../cat-harness/scripts/known-skills.ts";

/**
 * This instance's root; diagrams are found by NAME through its declared `processes` graphs (bean `63wl`).
 * The test lives in folio-assistant-core because the diagram does (bean `ho66`).
 */
const HARNESS = resolve(import.meta.dir, "../..");

/**
 * The review half of `content-change-review.bpmn`, run on a fixture. Bean
 * `en2d`: the owner ruled to extend this diagram rather than draw a separate
 * large-document one, and to give slicing and coverage their own lane, the
 * review coordinator, apart from the editor who decides.
 *
 * What is held here:
 * - the coverage gate is COMPUTED from two counts, and a hand-supplied
 *   answer is refused;
 * - "not covered" loops back to slicing, so review cannot reach sign-off
 *   while a changed block is unread or a defect is open;
 * - approve and merge are two steps, and merge is the last one.
 */

const model = () => loadProcessModel(workflowFile(HARNESS, "content-change-review.bpmn"));
const at = (m: Awaited<ReturnType<typeof model>>, s: ReturnType<typeof startInstance>) =>
  enabled(m, s).map((e) => e.node);

/** From the reviewer's start to the coverage gate, with no withdrawal and no dispute. */
async function toCoverageGate() {
  const m = await model();
  const s = startInstance(m, { id: "ccr1", subject: "fixture", startNode: "Start_Reviewer" });
  complete(m, s, "Task_CompareBeforeAfter");
  complete(m, s, "Task_IngestComments");
  complete(m, s, "Task_SliceAndAssign");
  drainSubprocess(m, s, "Call_ReviewSlices");
  complete(m, s, "GW_Withdraw", { outcome: "No" });
  complete(m, s, "GW_Disputed", { outcome: "No" });
  expect(at(m, s)).toEqual(["GW_Covered"]);
  return { m, s };
}

describe("content-change-review: sliced review and the coverage gate", () => {
  test("ingest and slicing are the coordinator's; the slices are reviewed in review-task", async () => {
    const m = await model();
    expect(m.nodes.get("Task_IngestComments")?.lane).toBe("Review Coordinator");
    expect(m.nodes.get("Task_SliceAndAssign")?.lane).toBe("Review Coordinator");
    expect(m.nodes.get("GW_Covered")?.lane).toBe("Review Coordinator");
    expect(m.nodes.get("Call_ReviewSlices")?.calledElement).toBe("Process_Review");
    expect(m.nodes.get("Call_Adjudication")?.calledElement).toBe("Process_Adjudication");
  });

  // Every fact, as `review-coverage` emits them: the engine refuses a missing one.
  const facts = (f: Record<string, unknown>) => ({
    uncoveredBlocks: 0, openDefects: 0, rendered: "known", unreviewedPages: 0, undeterminedInputs: 0, measured: "known", missedPages: 0, ...f,
  });

  test("an unreviewed changed block sends the review back to slicing", async () => {
    const { m, s } = await toCoverageGate();
    complete(m, s, "GW_Covered", { facts: facts({ uncoveredBlocks: 2 }) });
    expect(at(m, s)).toEqual(["Task_SliceAndAssign"]);
  });

  test("an open defect does too, whatever the block count says", async () => {
    const { m, s } = await toCoverageGate();
    complete(m, s, "GW_Covered", { facts: facts({ openDefects: 1 }) });
    expect(at(m, s)).toEqual(["Task_SliceAndAssign"]);
  });

  test("an unreviewed rendered page sends it back too (bean bnjs)", async () => {
    const { m, s } = await toCoverageGate();
    complete(m, s, "GW_Covered", { facts: facts({ unreviewedPages: 1 }) });
    expect(at(m, s)).toEqual(["Task_SliceAndAssign"]);
  });

  test("the gate is computed: asserting the answer is refused", async () => {
    const { m, s } = await toCoverageGate();
    expect(() => complete(m, s, "GW_Covered", { outcome: "yes" })).toThrow();
  });

  test("covered goes on to sign-off, where approve and merge are separate steps", async () => {
    const { m, s } = await toCoverageGate();
    complete(m, s, "GW_Covered", { facts: facts({}) });
    // The editorial-dependency review arrived here from the harness's
    // `review-narrative` (placement PR3, bean `63wl`), ahead of the impact review.
    expect(at(m, s)).toEqual(["Task_ReviewUses"]);
    complete(m, s, "Task_ReviewUses");
    expect(at(m, s)).toEqual(["Task_ReviewImpact"]);
    complete(m, s, "Task_ReviewImpact");
    complete(m, s, "GW_Approved", { outcome: "Yes" });
    expect(at(m, s)).toEqual(["Task_Approve"]);
    complete(m, s, "Task_Approve");
    expect(at(m, s)).toEqual(["Task_Merge"]);
  });

  test("a withdrawal and a dispute each take their own step before the gate", async () => {
    const m = await model();
    const s = startInstance(m, { id: "ccr2", subject: "fixture", startNode: "Start_Reviewer" });
    complete(m, s, "Task_CompareBeforeAfter");
    complete(m, s, "Task_IngestComments");
    complete(m, s, "Task_SliceAndAssign");
    drainSubprocess(m, s, "Call_ReviewSlices");
    complete(m, s, "GW_Withdraw", { outcome: "Yes" });
    expect(at(m, s)).toEqual(["Task_WithdrawComment"]);
    complete(m, s, "Task_WithdrawComment");
    complete(m, s, "GW_Disputed", { outcome: "Yes" });
    drainSubprocess(m, s, "Call_Adjudication");
    expect(at(m, s)).toEqual(["GW_Covered"]);
  });
});
