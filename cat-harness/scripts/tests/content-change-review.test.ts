import { describe, expect, test } from "bun:test";
import { join, resolve } from "path";
import { drainSubprocess } from "./helpers";
import { loadProcessModel } from "../../src/workflow/process-model";
import { complete, enabled, startInstance } from "../../src/workflow/instance";

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

const WF = resolve(import.meta.dir, "../../processes");
const model = () => loadProcessModel(join(WF, "content-change-review.bpmn"));
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

  test("an unreviewed changed block sends the review back to slicing", async () => {
    const { m, s } = await toCoverageGate();
    complete(m, s, "GW_Covered", { facts: { uncoveredBlocks: 2, openDefects: 0 } });
    expect(at(m, s)).toEqual(["Task_SliceAndAssign"]);
  });

  test("an open defect does too, whatever the block count says", async () => {
    const { m, s } = await toCoverageGate();
    complete(m, s, "GW_Covered", { facts: { uncoveredBlocks: 0, openDefects: 1 } });
    expect(at(m, s)).toEqual(["Task_SliceAndAssign"]);
  });

  test("the gate is computed: asserting the answer is refused", async () => {
    const { m, s } = await toCoverageGate();
    expect(() => complete(m, s, "GW_Covered", { outcome: "yes" })).toThrow();
  });

  test("covered goes on to sign-off, where approve and merge are separate steps", async () => {
    const { m, s } = await toCoverageGate();
    complete(m, s, "GW_Covered", { facts: { uncoveredBlocks: 0, openDefects: 0 } });
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
