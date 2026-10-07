/**
 * DMN-backed gateways against folio-assistant-core's own diagrams — moved
 * here from `cat-harness/scripts/tests/decision-table.test.ts` (bean `ho66`).
 * The decision-table engine is cat-harness code and its fixture tests stay
 * there; `draft-qa-gate.dmn` and `editing-hci-validation.bpmn` are this
 * instance's, so standing alone cat-harness has neither to read.
 *
 * These tests are about the difference between computing and choosing.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { drainSubprocess } from "../../../cat-harness/scripts/tests/helpers";
import { DecisionError, evaluate, loadDecisionTable } from "../../../cat-harness/src/workflow/decision-table";
import { loadProcessModel } from "../../../cat-harness/src/workflow/process-model";
import { complete, enabled, startInstance } from "../../../cat-harness/src/workflow/instance";
import { workflowFile } from "../../../cat-harness/scripts/known-skills.ts";

/** This instance's root; its diagrams are found by NAME through its declared `processes` graphs (bean `63wl`). */
const HERE = resolve(import.meta.dir, "../..");

describe("the shipped tables", () => {
  test("the draft QA gate blocks on critical and major, and says so by rule", async () => {
    const t = await loadDecisionTable(workflowFile(HERE, "draft-qa-gate.dmn"), "Decision_DraftQaGate");
    expect(evaluate(t, { failCritical: 1, failMajor: 0 }).rule).toBe("Rule_Critical");
    expect(evaluate(t, { failCritical: 0, failMajor: 2 }).rule).toBe("Rule_Major");
    expect(evaluate(t, { failCritical: 0, failMajor: 0 }).outcome).toBe("yes");
  });

  test("a fact the table needs but did not get is an error, not a default", async () => {
    const t = await loadDecisionTable(workflowFile(HERE, "draft-qa-gate.dmn"), "Decision_DraftQaGate");
    // A gate that answers on data it never received is the failure the whole
    // mechanism exists to remove.
    expect(() => evaluate(t, { failCritical: 0 })).toThrow(DecisionError);
    expect(() => evaluate(t, { failCritical: 0 })).toThrow(/failMajor/);
  });
});

describe("computed gateways in a running process", () => {
  test("gateways without a table are still chosen, not computed", async () => {
    const model = await loadProcessModel(workflowFile(HERE, "editing-hci-validation.bpmn"));
    const state = startInstance(model, { id: "d2", subject: "def:x" });
    complete(model, state, "Task_DescribeChange");
    complete(model, state, "Task_ClaimBean");
    drainSubprocess(model, state, "CallActivity_Evidence");
    complete(model, state, "Task_DraftEdit");
    const judgement = enabled(model, state).find((e) => e.node === "Gateway_ReviewerKind");
    expect(judgement?.kind === "decision" && judgement.computed).toBeUndefined();
    complete(model, state, "Gateway_ReviewerKind", { outcome: "yes" });
    expect(enabled(model, state).some((e) => e.node === "Task_SmeReview")).toBe(true);
  });
});
