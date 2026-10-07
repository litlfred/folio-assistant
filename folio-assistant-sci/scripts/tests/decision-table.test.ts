/**
 * DMN-backed gateways against folio-assistant-sci's own diagrams — moved here
 * from `cat-harness/scripts/tests/decision-table.test.ts` (bean `ho66`). The
 * decision-table engine is cat-harness code and its fixture tests stay there;
 * `lean-build-gate.dmn` and the `authoring-a-paper.bpmn` it backs are this
 * instance's, so standing alone cat-harness has neither to read.
 *
 * These tests are about the difference between computing and choosing. The
 * sharp one is that a computed gateway *refuses* a hand-supplied outcome: being
 * able to assert the answer would defeat the whole mechanism.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { evaluate, loadDecisionTable, possibleOutcomes } from "../../../cat-harness/src/workflow/decision-table";
import { loadProcessModel } from "../../../cat-harness/src/workflow/process-model";
import { complete, enabled, startInstance, WorkflowError } from "../../../cat-harness/src/workflow/instance";
import { workflowFile } from "../../../cat-harness/scripts/known-skills.ts";

/** This instance's root; its diagrams are found by NAME through its declared `processes` graphs (bean `63wl`). */
const HERE = resolve(import.meta.dir, "../..");

describe("the shipped tables", () => {
  test("the Lean gate distinguishes deferred sorries from conjectural ones", async () => {
    const t = await loadDecisionTable(workflowFile(HERE, "lean-build-gate.dmn"), "Decision_LeanBuildGate");
    expect(t.hitPolicy).toBe("FIRST");
    expect(t.inputs.map((i) => i.expression)).toEqual(["buildOk", "deferredSorries"]);

    // A red build never reads as green, whatever the sorry count.
    expect(evaluate(t, { buildOk: false, deferredSorries: 0 }).outcome).toBe("not yet");
    // Deferred sorries hold it.
    expect(evaluate(t, { buildOk: true, deferredSorries: 4 }).outcome).toBe("not yet");
    // Green: build ok, nothing closeable left. Conjectural sorries are not
    // counted into `deferredSorries`, which is the point of the split.
    const green = evaluate(t, { buildOk: true, deferredSorries: 0 });
    expect(green.outcome).toBe("green");
    expect(green.rule).toBe("Rule_Green");
  });

  test("possibleOutcomes reads the rules, not a particular evaluation", async () => {
    const t = await loadDecisionTable(workflowFile(HERE, "lean-build-gate.dmn"), "Decision_LeanBuildGate");
    expect(possibleOutcomes(t).sort()).toEqual(["green", "not yet"]);
  });
});

describe("computed gateways in a running process", () => {
  const paper = async () => loadProcessModel(workflowFile(HERE, "authoring-a-paper.bpmn"));

  const upToLeanGate = async () => {
    const model = await paper();
    const state = startInstance(model, { id: "d1", subject: "paper" });
    for (const n of ["Task_Plan", "Task_SeedPlan", "Task_Scaffold", "Task_AuthorBlocks", "Task_Formalize"]) {
      complete(model, state, n);
    }
    return { model, state };
  };

  test("workflow_next reports which facts the table reads", async () => {
    const { model, state } = await upToLeanGate();
    const gate = enabled(model, state).find((e) => e.node === "Gateway_LeanGreen");
    expect(gate?.kind).toBe("decision");
    expect(gate?.kind === "decision" && gate.computed).toEqual({
      decision: "Decision_LeanBuildGate",
      facts: ["buildOk", "deferredSorries"],
    });
  });

  test("the outcome is computed from facts, and the rule is recorded", async () => {
    const { model, state } = await upToLeanGate();
    complete(model, state, "Gateway_LeanGreen", { facts: { buildOk: true, deferredSorries: 0 } });

    expect(enabled(model, state).map((e) => e.node)).toEqual(["Task_Validate"]);
    const entry = state.history.find((h) => h.node === "Gateway_LeanGreen")!;
    expect(entry.outcome).toBe("green");
    // The audit trail says which table decided and on which rule.
    expect(entry.note).toContain("Decision_LeanBuildGate → green by Rule_Green");
  });

  test("a red build routes back to formalisation", async () => {
    const { model, state } = await upToLeanGate();
    complete(model, state, "Gateway_LeanGreen", { facts: { buildOk: false, deferredSorries: 0 } });
    expect(enabled(model, state).map((e) => e.node)).toEqual(["Task_Formalize"]);
  });

  test("a hand-supplied outcome is REFUSED on a computed gateway", async () => {
    const { model, state } = await upToLeanGate();
    // Being able to assert the answer would defeat the mechanism entirely.
    expect(() => complete(model, state, "Gateway_LeanGreen", { outcome: "green" })).toThrow(
      WorkflowError,
    );
    expect(() => complete(model, state, "Gateway_LeanGreen", { outcome: "green" })).toThrow(
      /computed by Decision_LeanBuildGate, not chosen/,
    );
  });

  test("omitting the facts refuses and names them", async () => {
    const { model, state } = await upToLeanGate();
    expect(() => complete(model, state, "Gateway_LeanGreen")).toThrow(/buildOk.*deferredSorries/s);
  });
});
