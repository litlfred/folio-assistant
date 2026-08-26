import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import {
  DecisionError,
  evaluate,
  loadDecisionTable,
  possibleOutcomes,
  unaryTest,
  UnsupportedDmn,
} from "../../src/workflow/decision-table";
import { loadProcessModel, UnsupportedBpmn } from "../../src/workflow/process-model";
import { complete, enabled, startInstance, WorkflowError } from "../../src/workflow/instance";

/**
 * Four of the ten exclusive gateways across the BPMN diagrams are not judgement
 * calls at all — they are arithmetic over tool output. Two of those have tools
 * that exist today, and now have DMN tables: the agent reports numbers and the
 * table returns the branch.
 *
 * These tests are about the difference between computing and choosing. The
 * sharp one is that a computed gateway *refuses* a hand-supplied outcome: being
 * able to assert the answer would defeat the whole mechanism.
 */

const WF = resolve(import.meta.dir, "../../docs/workflows");
const DEC = join(WF, "decisions");

describe("the FEEL subset", () => {
  test("reads the tests the tables actually use", () => {
    expect(unaryTest("-", 42)).toBe(true);
    expect(unaryTest("", "anything")).toBe(true);
    expect(unaryTest("0", 0)).toBe(true);
    expect(unaryTest("0", 1)).toBe(false);
    expect(unaryTest("> 0", 3)).toBe(true);
    expect(unaryTest("> 0", 0)).toBe(false);
    expect(unaryTest(">= 3", 3)).toBe(true);
    expect(unaryTest("< 10", 9)).toBe(true);
    expect(unaryTest("<= 2", 3)).toBe(false);
    expect(unaryTest("false", false)).toBe(true);
    expect(unaryTest("false", true)).toBe(false);
    expect(unaryTest('"green"', "green")).toBe(true);
    expect(unaryTest("1, 2, 3", 2)).toBe(true);
    expect(unaryTest("1, 2, 3", 4)).toBe(false);
    expect(unaryTest('"a", "b"', "b")).toBe(true);
  });

  test("a test it cannot read throws rather than quietly not matching", () => {
    // The failure mode this guards: an unimplemented expression evaluating to
    // `false` looks exactly like a rule that legitimately did not apply, and
    // the table then answers on the rules that are left.
    expect(() => unaryTest("[1..5]", 3)).toThrow(UnsupportedDmn);
    expect(() => unaryTest("not(0)", 3)).toThrow(UnsupportedDmn);
    expect(() => unaryTest("date(x)", 3)).toThrow(UnsupportedDmn);
  });

  test("comparing a number test against a non-number is an error, not false", () => {
    expect(() => unaryTest("> 0", "lots")).toThrow(DecisionError);
  });
});

describe("the shipped tables", () => {
  test("the Lean gate distinguishes deferred sorries from conjectural ones", async () => {
    const t = await loadDecisionTable(join(DEC, "lean-build-gate.dmn"), "Decision_LeanBuildGate");
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

  test("the draft QA gate blocks on critical and major, and says so by rule", async () => {
    const t = await loadDecisionTable(join(DEC, "draft-qa-gate.dmn"), "Decision_DraftQaGate");
    expect(evaluate(t, { failCritical: 1, failMajor: 0 }).rule).toBe("Rule_Critical");
    expect(evaluate(t, { failCritical: 0, failMajor: 2 }).rule).toBe("Rule_Major");
    expect(evaluate(t, { failCritical: 0, failMajor: 0 }).outcome).toBe("yes");
  });

  test("a fact the table needs but did not get is an error, not a default", async () => {
    const t = await loadDecisionTable(join(DEC, "draft-qa-gate.dmn"), "Decision_DraftQaGate");
    // A gate that answers on data it never received is the failure the whole
    // mechanism exists to remove.
    expect(() => evaluate(t, { failCritical: 0 })).toThrow(DecisionError);
    expect(() => evaluate(t, { failCritical: 0 })).toThrow(/failMajor/);
  });

  test("possibleOutcomes reads the rules, not a particular evaluation", async () => {
    const t = await loadDecisionTable(join(DEC, "lean-build-gate.dmn"), "Decision_LeanBuildGate");
    expect(possibleOutcomes(t).sort()).toEqual(["green", "not yet"]);
  });
});

describe("a table must be able to route the gateway it backs", () => {
  test("an outcome with no matching branch fails at load, not at decision time", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dmn-route-"));
    writeFileSync(
      join(dir, "bad.dmn"),
      `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" id="D" name="D" namespace="urn:x">
  <decision id="Decision_Bad" name="Bad">
    <decisionTable id="T" hitPolicy="FIRST">
      <input id="i"><inputExpression id="e" typeRef="number"><text>n</text></inputExpression></input>
      <output id="o" name="outcome" typeRef="string" />
      <rule id="r1"><inputEntry id="ie1"><text>-</text></inputEntry><outputEntry id="oe1"><text>"passed"</text></outputEntry></rule>
    </decisionTable>
  </decision>
</definitions>
`,
    );
    writeFileSync(
      join(dir, "bad.bpmn"),
      `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"
                  id="D" targetNamespace="urn:x">
  <bpmn:process id="Process_Bad" name="Bad" isExecutable="false">
    <bpmn:startEvent id="S"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:exclusiveGateway id="G" name="Gate?">
      <bpmn:extensionElements><folio:decision ref="bad.dmn#Decision_Bad" /></bpmn:extensionElements>
      <bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing><bpmn:outgoing>F3</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:endEvent id="E1"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:endEvent id="E2"><bpmn:incoming>F3</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="S" targetRef="G" />
    <bpmn:sequenceFlow id="F2" name="yes" sourceRef="G" targetRef="E1" />
    <bpmn:sequenceFlow id="F3" name="no" sourceRef="G" targetRef="E2" />
  </bpmn:process>
</bpmn:definitions>
`,
    );
    // "passed" is not `yes` or `no`. Discovering that when a decision is needed
    // would be the worst possible time.
    await expect(loadProcessModel(join(dir, "bad.bpmn"))).rejects.toThrow(UnsupportedBpmn);
    await expect(loadProcessModel(join(dir, "bad.bpmn"))).rejects.toThrow(/passed/);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("computed gateways in a running process", () => {
  const paper = async () => loadProcessModel(join(WF, "authoring-a-paper.bpmn"));

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

  test("gateways without a table are still chosen, not computed", async () => {
    const model = await loadProcessModel(join(WF, "editing-hci-validation.bpmn"));
    const state = startInstance(model, { id: "d2", subject: "def:x" });
    complete(model, state, "Task_DescribeChange");
    complete(model, state, "Task_ClaimBean");
    complete(model, state, "Task_DraftEdit");
    const judgement = enabled(model, state).find((e) => e.node === "Gateway_ReviewerKind");
    expect(judgement?.kind === "decision" && judgement.computed).toBeUndefined();
    complete(model, state, "Gateway_ReviewerKind", { outcome: "yes" });
    expect(enabled(model, state).some((e) => e.node === "Task_SmeReview")).toBe(true);
  });
});
