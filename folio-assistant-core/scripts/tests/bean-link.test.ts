/**
 * The work-plan operations folio-assistant-core's editing process declares —
 * moved here from `cat-harness/scripts/tests/bean-link.test.ts` (bean
 * `ho66`). The bean link is cat-harness code and its tests stay there;
 * `editing-hci-validation.bpmn` is this instance's.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { workflowFile } from "../../../cat-harness/scripts/known-skills.ts";
import { loadProcessModel } from "../../../cat-harness/src/workflow/process-model";

describe("the diagrams declare which operation each step performs", () => {
  test("the editing process claims, notes, then resolves — in that order", async () => {
    const model = await loadProcessModel(
      workflowFile(resolve(import.meta.dir, "../.."), "editing-hci-validation.bpmn"),
    );
    expect(model.nodes.get("Task_ClaimBean")!.workPlanOp).toBe("claim");
    expect(model.nodes.get("Task_LogFindings")!.workPlanOp).toBe("note");
    expect(model.nodes.get("Task_ResolveBean")!.workPlanOp).toBe("resolve");
  });
});
