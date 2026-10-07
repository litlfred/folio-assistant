/**
 * The workflow interpreter against folio-assistant-core's own diagrams —
 * moved here from `cat-harness/scripts/tests/workflow-interpreter.test.ts`
 * (bean `ho66`). The interpreter is cat-harness code, and its tests over
 * synthetic diagrams and over every shipped diagram stay there; these pin
 * what `editing-hci-validation` and `content-lifecycle` declare, and those
 * diagrams are this instance's.
 *
 * The workflow diagrams are the normative picture of how a change reaches the
 * corpus. These tests are about the claim that reading them at runtime buys
 * something an agent's good intentions do not: that `Commit into the corpus`
 * *cannot* be reported done before the editor has seen the validation findings,
 * because there is no token on it until then.
 *
 * They run against the real `.bpmn` files, not fixtures. A test that passes on
 * a synthetic process while the shipped one has drifted is the failure this
 * repo keeps finding.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { drainSubprocess } from "../../../cat-harness/scripts/tests/helpers";
import { loadProcessModel, type ProcessModel } from "../../../cat-harness/src/workflow/process-model";
import { complete, enabled, startInstance, WorkflowError } from "../../../cat-harness/src/workflow/instance";
import { instanceId, loadInstance, saveInstance } from "../../../cat-harness/src/workflow/store";
import { workflowFile } from "../../../cat-harness/scripts/known-skills.ts";

/** This instance's root; its diagrams are found by NAME through its declared `processes` graphs (bean `63wl`). */
const CORE = resolve(import.meta.dir, "../..");

const bpmn = (stem: string): string => workflowFile(CORE, `${stem}.bpmn`);

const names = (model: ProcessModel, ids: string[]): string[] =>
  ids.map((id) => model.nodes.get(id)!.name).sort();

describe("the model carries what the diagram already knew", () => {
  test("skills and work-plan marks come off the folio: extensions", async () => {
    const model = await loadProcessModel(bpmn("editing-hci-validation"));
    const draft = model.nodes.get("Task_DraftEdit")!;
    expect(draft.skills).toEqual(["content-author", "before-after-preview"]);
    expect(draft.lane).toContain("Authoring agent");
    // The `[skill]` line is for the SVG reader; the model takes it from the
    // extension and trims the name back to the activity.
    expect(draft.name).toBe("Draft the block edit");

    const bean = model.nodes.get("Task_ClaimBean")!;
    expect(bean.touchesWorkPlan).toBe(true);
  });

  test("a call activity reports the process it expands into", async () => {
    const model = await loadProcessModel(bpmn("content-lifecycle"));
    expect(model.nodes.get("CallActivity_Editing")!.calledElement).toBe("Process_Editing");
  });
});

describe("the HCI validation gate holds", () => {
  const editing = async () => loadProcessModel(bpmn("editing-hci-validation"));

  test("a fresh instance enables exactly the first step", async () => {
    const model = await editing();
    const state = startInstance(model, { id: "t1", subject: "def:x" });
    expect(names(model, enabled(model, state).map((e) => e.node))).toEqual([
      "Describe the intended change",
    ]);
  });

  test("committing cannot be reported before the editor has decided", async () => {
    const model = await editing();
    const state = startInstance(model, { id: "t2", subject: "def:x" });
    // The whole point. Nothing has been drafted, let alone validated.
    expect(() => complete(model, state, "Task_Commit")).toThrow(WorkflowError);
    expect(() => complete(model, state, "Task_Commit")).toThrow(/not enabled/);
  });

  test("both validation branches must report before the findings are collated", async () => {
    const model = await editing();
    const state = startInstance(model, { id: "t3", subject: "def:x" });
    const step = (n: string, outcome?: string) => complete(model, state, n, { outcome });

    step("Task_DescribeChange");
    step("Task_ClaimBean");
    drainSubprocess(model, state, "CallActivity_Evidence");
    step("Task_DraftEdit");

    // The parallel fork put a token on each mechanical check AND on the
    // non-mechanical decision.
    const open = enabled(model, state);
    expect(open.filter((e) => e.kind === "decision").map((e) => e.name)).toEqual([
      "Judgement call?",
    ]);
    expect(names(model, open.filter((e) => e.kind === "activity").map((e) => e.node))).toEqual([
      "Build and QA gates",
      "Schema and constraint checks",
      "Syntax, spelling and links",
    ]);

    step("Task_SchemaValidate");
    step("Task_SyntaxSpell");
    step("Task_BuildGates");
    // Mechanical is done, but the join has not fired: the review branch is out.
    expect(names(model, enabled(model, state).map((e) => e.node))).toEqual(["Judgement call?"]);

    step("Gateway_ReviewerKind", "no");
    step("Task_AgentReview");
    // Now the join fires and the findings reach the editor.
    expect(names(model, enabled(model, state).map((e) => e.node))).toEqual([
      "Collate findings into a report",
    ]);
  });

  test("accept reaches the corpus; discard does not", async () => {
    const run = async (decision: string) => {
      const model = await editing();
      const state = startInstance(model, { id: `t-${decision}`, subject: "def:x" });
      const step = (n: string, outcome?: string) => complete(model, state, n, { outcome });
      step("Task_DescribeChange");
      step("Task_ClaimBean");
      drainSubprocess(model, state, "CallActivity_Evidence");
      step("Task_DraftEdit");
      step("Task_SchemaValidate");
      step("Task_SyntaxSpell");
      step("Task_BuildGates");
      step("Gateway_ReviewerKind", "yes");
      step("Task_SmeReview");
      step("Task_CollateFindings");
      step("Task_LogFindings");
      step("Task_ReviewFindings");
      // `u4hs`: the options analysis is interposed here. Ordinary edits take
      // `GW_Trigger`'s "no", the early exit the subprocess documents.
      drainSubprocess(model, state, "Call_OptionsAnalysis", { GW_Trigger: "no" });
      step("Task_RecordDecision");
      step("Gateway_EditorDecision", decision);
      return { model, state };
    };

    const accepted = await run("accept");
    expect(names(accepted.model, enabled(accepted.model, accepted.state).map((e) => e.node))).toEqual(
      ["Commit into the corpus"],
    );

    const discarded = await run("discard");
    // The end event consumed the only token: nothing left, and no commit.
    expect(enabled(discarded.model, discarded.state)).toEqual([]);
    expect(discarded.state.status).toBe("completed");
    expect(discarded.state.history.some((h) => h.node === "Task_Commit")).toBe(false);
  });

  test("revise loops back to the agent and re-runs validation", async () => {
    const model = await editing();
    const state = startInstance(model, { id: "t5", subject: "def:x" });
    const step = (n: string, outcome?: string) => complete(model, state, n, { outcome });
    step("Task_DescribeChange");
    step("Task_ClaimBean");
    drainSubprocess(model, state, "CallActivity_Evidence");
    step("Task_DraftEdit");
    step("Task_SchemaValidate");
    step("Task_SyntaxSpell");
    step("Task_BuildGates");
    step("Gateway_ReviewerKind", "no");
    step("Task_AgentReview");
    step("Task_CollateFindings");
    step("Task_LogFindings");
    step("Task_ReviewFindings");
    // `u4hs`: the options analysis is interposed here. Ordinary edits take
    // `GW_Trigger`'s "no", the early exit the subprocess documents.
    drainSubprocess(model, state, "Call_OptionsAnalysis", { GW_Trigger: "no" });
    step("Task_RecordDecision");
    step("Gateway_EditorDecision", "revise");

    expect(names(model, enabled(model, state).map((e) => e.node))).toEqual([
      "Revise the proposed change",
    ]);
    step("Task_ReviseEdit");
    // Round two: the mechanical checks are enabled again, not skipped because
    // they passed the first time.
    expect(
      names(model, enabled(model, state).filter((e) => e.kind === "activity").map((e) => e.node)),
    ).toEqual(["Build and QA gates", "Schema and constraint checks", "Syntax, spelling and links"]);
  });
});

describe("decisions are asked for, not guessed", () => {
  test("completing a gateway without an outcome refuses, and lists the outcomes", async () => {
    const model = await loadProcessModel(bpmn("editing-hci-validation"));
    const state = startInstance(model, { id: "t6", subject: "def:x" });
    complete(model, state, "Task_DescribeChange");
    complete(model, state, "Task_ClaimBean");
    drainSubprocess(model, state, "CallActivity_Evidence");
    complete(model, state, "Task_DraftEdit");

    expect(() => complete(model, state, "Gateway_ReviewerKind")).toThrow(/is a decision/);
    expect(() => complete(model, state, "Gateway_ReviewerKind", { outcome: "maybe" })).toThrow(
      /Valid: no, yes/,
    );
  });
});

describe("instance state survives the process it was made in", () => {
  test("an instance round-trips through the store under a derived id", async () => {
    const repo = mkdtempSync(join(tmpdir(), "wf-store-"));
    const model = await loadProcessModel(bpmn("editing-hci-validation"));
    const id = instanceId(model.id, "def:carbon-valence");
    // Derived, not random — re-running a step for the same block must find the
    // instance that exists rather than mint a second.
    expect(id).toBe("editing--def-carbon-valence");
    expect(instanceId(model.id, "def:carbon-valence")).toBe(id);

    const state = startInstance(model, { id, subject: "def:carbon-valence", bean: "fq0b" });
    complete(model, state, "Task_DescribeChange");
    saveInstance(repo, state);

    const back = loadInstance(repo, id)!;
    expect(back.bean).toBe("fq0b");
    expect(back.tokens).toEqual(state.tokens);
    expect(enabled(model, back).map((e) => e.node)).toEqual(["Task_ClaimBean"]);
    rmSync(repo, { recursive: true, force: true });
  });
});
