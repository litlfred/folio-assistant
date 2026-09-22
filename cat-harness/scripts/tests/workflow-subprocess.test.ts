/**
 * Subprocess descent — a call activity IS the process it names.
 *
 * Before this, a `callActivity` was an opaque box the caller completed in one
 * step, which meant a decomposed diagram was strictly WORSE than a flat one: it
 * read better and gated less. These tests pin the opposite property — that
 * decomposing a process moves its steps into a child rather than deleting them.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { complete, enabled, positionOf, startInstance, WorkflowError } from "../../src/workflow/instance";
import { checkGate } from "../../src/workflow/gate";
import { findInModel, loadProcessModel, UnsupportedBpmn } from "../../src/workflow/process-model";

const WORKFLOWS = resolve(import.meta.dir, "../../processes");
const bpmn = (stem: string): string => join(WORKFLOWS, `${stem}.bpmn`);

describe("a call activity resolves to the process it names", () => {
  test("document-ingestion's four phases are loaded, not left as bare ids", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const called = [...model.nodes.values()].filter((n) => n.calledElement).map((n) => n.id);
    expect(called.length).toBeGreaterThan(0);
    for (const id of called) {
      expect(model.children.get(id)?.id).toBe(model.nodes.get(id)!.calledElement!);
    }
  });

  test("a call activity naming a process no file defines stays opaque", async () => {
    // Legitimate: a folio may call out to a process it does not host. The step
    // is then a single step again — which is what it was before descent.
    const dir = mkdtempSync(join(tmpdir(), "wf-opaque-"));
    try {
      writeFileSync(
        join(dir, "p.bpmn"),
        `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="D" targetNamespace="urn:t">
  <bpmn:process id="Process_Opaque">
    <bpmn:startEvent id="S"/>
    <bpmn:callActivity id="Call_Away" name="Off to somewhere else" calledElement="Process_Elsewhere"/>
    <bpmn:endEvent id="E"/>
    <bpmn:sequenceFlow id="F1" sourceRef="S" targetRef="Call_Away"/>
    <bpmn:sequenceFlow id="F2" sourceRef="Call_Away" targetRef="E"/>
  </bpmn:process>
</bpmn:definitions>`,
      );
      const model = await loadProcessModel(join(dir, "p.bpmn"));
      expect(model.children.size).toBe(0);

      const state = startInstance(model, { id: "opaque", subject: "x" });
      expect(enabled(model, state).map((e) => e.node)).toEqual(["Call_Away"]);
      complete(model, state, "Call_Away");
      expect(state.status).toBe("completed");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a call-activity cycle is refused at load, not discovered at run time", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wf-cycle-"));
    try {
      const proc = (id: string, calls: string): string =>
        `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="D_${id}" targetNamespace="urn:t">
  <bpmn:process id="${id}">
    <bpmn:startEvent id="S_${id}"/>
    <bpmn:callActivity id="Call_${id}" name="on" calledElement="${calls}"/>
    <bpmn:endEvent id="E_${id}"/>
    <bpmn:sequenceFlow id="F1_${id}" sourceRef="S_${id}" targetRef="Call_${id}"/>
    <bpmn:sequenceFlow id="F2_${id}" sourceRef="Call_${id}" targetRef="E_${id}"/>
  </bpmn:process>
</bpmn:definitions>`;
      writeFileSync(join(dir, "a.bpmn"), proc("Process_A", "Process_B"));
      writeFileSync(join(dir, "b.bpmn"), proc("Process_B", "Process_A"));
      await expect(loadProcessModel(join(dir, "a.bpmn"))).rejects.toThrow(UnsupportedBpmn);
      await expect(loadProcessModel(join(dir, "a.bpmn"))).rejects.toThrow(/already[\s\S]*call path/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("entering a subprocess", () => {
  test("the phase opens by itself, and its steps are what is enabled", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const state = startInstance(model, { id: "ing-1", subject: "uploads/a.pdf" });
    complete(model, state, "Task_Detect");

    // The parent's token sits on the call activity …
    expect(state.tokens).toEqual(["CallActivity_Extract"]);
    // … and the child opened without being asked to.
    expect(state.children?.CallActivity_Extract?.status).toBe("running");

    const open = enabled(model, state);
    expect(open.map((e) => e.node)).not.toContain("CallActivity_Extract");
    expect(open.length).toBeGreaterThan(0);
    for (const e of open) {
      expect(e.phase?.[0]).toBe(model.nodes.get("CallActivity_Extract")!.name);
    }
  });

  test("completing the call activity itself is refused, and it says what to do instead", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const state = startInstance(model, { id: "ing-2", subject: "uploads/a.pdf" });
    complete(model, state, "Task_Detect");
    const inside = enabled(model, state).map((e) => e.node);

    expect(() => complete(model, state, "CallActivity_Extract")).toThrow(WorkflowError);
    try {
      complete(model, state, "CallActivity_Extract");
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toContain("is a subprocess, not a step");
      for (const node of inside) expect(message).toContain(node);
    }
  });

  test("the parent advances when the child finishes, and keeps the record", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const state = startInstance(model, { id: "ing-3", subject: "uploads/a.pdf" });
    complete(model, state, "Task_Detect");

    for (let guard = 0; state.tokens.includes("CallActivity_Extract"); guard++) {
      if (guard > 50) throw new Error("the extract phase did not finish");
      const step = enabled(model, state)[0];
      complete(model, state, step.node, step.kind === "decision" ? { outcome: step.outcomes[0] } : {});
    }

    expect(state.children?.CallActivity_Extract?.status).toBe("completed");
    expect(state.tokens).not.toContain("CallActivity_Extract");
    // The parent records the phase as done, as it records any other step.
    expect(state.history.some((h) => h.node === "CallActivity_Extract")).toBe(true);
  });
});

describe("the step a caller names is the leaf", () => {
  test("completing a child's step by its own id works from the parent", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const state = startInstance(model, { id: "ing-4", subject: "uploads/a.pdf" });
    complete(model, state, "Task_Detect");

    const leaf = enabled(model, state)[0];
    // The leaf is not a node of the PARENT process at all.
    expect(model.nodes.has(leaf.node)).toBe(false);
    complete(model, state, leaf.node, leaf.kind === "decision" ? { outcome: leaf.outcomes[0] } : {});
    expect(
      state.children!.CallActivity_Extract.history.some((h) => h.node === leaf.node),
    ).toBe(true);
  });

  test("a step that is enabled nowhere is still refused", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const state = startInstance(model, { id: "ing-5", subject: "uploads/a.pdf" });
    expect(() => complete(model, state, "Task_Promote")).toThrow(/not enabled/);
    expect(() => complete(model, state, "No_Such_Node")).toThrow(/no such node/);
  });
});

describe("the gate answers for a step inside a phase", () => {
  test("a subprocess step is allowed when it is enabled, and says which phase", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const state = startInstance(model, { id: "ing-6", subject: "uploads/a.pdf" });
    complete(model, state, "Task_Detect");
    const leaf = enabled(model, state)[0];

    const verdict = checkGate(model, state, leaf.node, []);
    expect(verdict.allowed).toBe(true);
    expect(verdict.reason).toContain(model.nodes.get("CallActivity_Extract")!.name);
  });

  test("a step of a phase not yet entered is refused, not reported as unknown", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const state = startInstance(model, { id: "ing-7", subject: "uploads/a.pdf" });
    complete(model, state, "Task_Detect");
    const later = [...model.children.get("CallActivity_Gate")!.nodes.values()].find(
      (n) => n.kind === "activity",
    )!;

    const verdict = checkGate(model, state, later.id, []);
    expect(verdict.allowed).toBe(false);
    // Not "is not a step in Process_Ingestion" — it IS a step, just not now.
    expect(verdict.reason).not.toContain("is not a step in");
  });
});

describe("positionOf", () => {
  test("reports the leaf and the phases above it, from state alone", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));
    const state = startInstance(model, { id: "ing-8", subject: "uploads/a.pdf" });
    complete(model, state, "Task_Detect");

    const position = positionOf(state);
    expect(position.length).toBeGreaterThan(0);
    for (const p of position) {
      expect(p.startsWith("CallActivity_Extract ▸ ")).toBe(true);
      expect(p).not.toBe("CallActivity_Extract");
    }
  });
});

describe("a bean-marked step in a phase is still a work-plan write", () => {
  test("findInModel reaches it — a parent-only lookup would find nothing", async () => {
    const model = await loadProcessModel(bpmn("document-ingestion"));

    // Every bean-marked step of this process lives in one of its phases; none
    // is a node of the parent. A lookup that only knew the parent would perform
    // no work-plan operation at all, silently.
    const marked = [...model.children.values()].flatMap((child) =>
      [...child.nodes.values()].filter((n) => n.workPlanOp).map((n) => n.id),
    );
    expect(marked.length).toBeGreaterThan(0);
    for (const id of marked) {
      expect(model.nodes.has(id)).toBe(false);
      expect(findInModel(model, id)?.model.nodes.get(id)?.workPlanOp).toBeDefined();
    }
  });
});
