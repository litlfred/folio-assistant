/**
 * The workflow gate against folio-assistant-sci's own process — moved here
 * from `cat-harness/scripts/tests/workflow-gate.test.ts` (bean `ho66`).
 * `authoring-a-paper.bpmn` is this instance's, so standing alone cat-harness
 * has no advisory diagram of its own to run the gate on.
 *
 * A per-content-type process is advisory, because what counts as adequate
 * review of a Lean proof and of a FHIR profile are different questions and the
 * package that knows the domain should answer them (bean `bcnl`).
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { loadProcessModel } from "../../../cat-harness/src/workflow/process-model";
import { startInstance } from "../../../cat-harness/src/workflow/instance";
import { checkGate } from "../../../cat-harness/src/workflow/gate";
import { workflowFile } from "../../../cat-harness/scripts/known-skills.ts";

/** This instance's root; its diagrams are found by NAME through its declared `processes` graphs (bean `63wl`). */
const HERE = resolve(import.meta.dir, "../..");

describe("the base is strict and the content-type processes are not", () => {
  test("an advisory process allows a step that is not enabled, and says why", async () => {
    const model = await loadProcessModel(workflowFile(HERE, "authoring-a-paper.bpmn"));
    const state = startInstance(model, { id: "g0", subject: "paper" });
    const v = checkGate(model, state, "Task_Publish", []);
    expect(v.allowed).toBe(true);
    expect(v.reason).toContain("advisory");
  });
});
