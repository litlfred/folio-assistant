import { describe, expect, test } from "bun:test";
import { drainSubprocess } from "./helpers";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { readdirSync } from "fs";
import {
  loadProcessModel,
  UnsupportedBpmn,
  type ProcessModel,
} from "../../src/workflow/process-model";
import { complete, enabled, startInstance, WorkflowError } from "../../src/workflow/instance";
import { instanceId, loadInstance, saveInstance } from "../../src/workflow/store";

/**
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

const WORKFLOW_DIR = resolve(import.meta.dir, "../../processes");
const bpmn = (stem: string): string => join(WORKFLOW_DIR, `${stem}.bpmn`);

const names = (model: ProcessModel, ids: string[]): string[] =>
  ids.map((id) => model.nodes.get(id)!.name).sort();

describe("every shipped diagram is interpretable", () => {
  const files = readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith(".bpmn"));

  test("there are diagrams to interpret", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const f of files) {
    test(`${f} parses, and every flow connects two known nodes`, async () => {
      const model = await loadProcessModel(join(WORKFLOW_DIR, f));
      expect(model.id).toMatch(/^Process_/);
      expect(model.startNodes.length).toBeGreaterThan(0);
      for (const flow of model.flows.values()) {
        expect(model.nodes.has(flow.from)).toBe(true);
        expect(model.nodes.has(flow.to)).toBe(true);
      }
      // Every activity sits in a lane, i.e. some role owns it. An activity in
      // no lane is a step nobody is accountable for.
      for (const n of model.nodes.values()) {
        if (n.kind === "activity") expect(n.lane).toBeDefined();
      }
    });
  }
});

describe("the model carries what the diagram already knew", () => {
  test("skills and work-plan marks come off the folio: extensions", async () => {
    const model = await loadProcessModel(bpmn("editing-hci-validation"));
    const draft = model.nodes.get("Task_DraftEdit")!;
    expect(draft.skills).toEqual(["content-author"]);
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

describe("unsupported BPMN is refused, not skipped", () => {
  test("an element the interpreter cannot walk throws and names itself", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wf-unsupported-"));
    const file = join(dir, "has-timer.bpmn");
    await Bun.write(
      file,
      `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="D" targetNamespace="t">
  <bpmn:process id="Process_T" name="T" isExecutable="false">
    <bpmn:startEvent id="S"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:intermediateCatchEvent id="Wait">
      <bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing>
      <bpmn:timerEventDefinition id="TD" />
    </bpmn:intermediateCatchEvent>
    <bpmn:endEvent id="E"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="S" targetRef="Wait" />
    <bpmn:sequenceFlow id="F2" sourceRef="Wait" targetRef="E" />
  </bpmn:process>
</bpmn:definitions>
`,
    );
    await expect(loadProcessModel(file)).rejects.toThrow(UnsupportedBpmn);
    await expect(loadProcessModel(file)).rejects.toThrow(/IntermediateCatchEvent/);
    rmSync(dir, { recursive: true, force: true });
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

describe("a committed instance records its diagram REPO-RELATIVELY — bean `chq5`", () => {
  // `beans/workflows/` is committed precisely so a sibling session sees the
  // same position, and `loadProcessModel` keeps whatever path its caller
  // passed. `crdm--issue-607-kg-to-cdn-portal.json` and its two children were
  // found carrying `/home/user/folio-assistant/...`, which resolves on one
  // container and nowhere else — against a sibling instance that recorded the
  // same diagram relatively.

  /** The smallest instance shape `saveInstance` will write. */
  const inst = (source: string, children?: Record<string, unknown>) =>
    ({
      id: "t--subject",
      processId: "Process_T",
      source,
      subject: "subject",
      tokens: [],
      arrivals: {},
      history: [],
      status: "running",
      startedAt: "2026-09-21T00:00:00.000Z",
      updatedAt: "2026-09-21T00:00:00.000Z",
      ...(children ? { children } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

  test("an absolute path inside the repo is written relative", () => {
    const repo = mkdtempSync(join(tmpdir(), "wf-rel-"));
    saveInstance(repo, inst(join(repo, "cat-harness/workflows/x.bpmn")));
    expect(loadInstance(repo, "t--subject")?.source).toBe("cat-harness/workflows/x.bpmn");
    rmSync(repo, { recursive: true, force: true });
  });

  test("CHILDREN are normalised too — the defect was one field deeper", () => {
    // A fix applied only at the top level would have left every child carrying
    // the absolute path, which is where the real corpus had two of its three.
    const repo = mkdtempSync(join(tmpdir(), "wf-rel-"));
    saveInstance(
      repo,
      inst(join(repo, "a/parent.bpmn"), {
        Call_One: inst(join(repo, "a/one.bpmn"), {
          Call_Deep: inst(join(repo, "a/deep.bpmn")),
        }),
      }),
    );
    const back = loadInstance(repo, "t--subject");
    expect(back?.source).toBe("a/parent.bpmn");
    expect(back?.children?.Call_One?.source).toBe("a/one.bpmn");
    expect(back?.children?.Call_One?.children?.Call_Deep?.source).toBe("a/deep.bpmn");
    rmSync(repo, { recursive: true, force: true });
  });

  test("an already-relative path is left exactly as it is", () => {
    const repo = mkdtempSync(join(tmpdir(), "wf-rel-"));
    saveInstance(repo, inst("cat-harness/workflows/x.bpmn"));
    expect(loadInstance(repo, "t--subject")?.source).toBe("cat-harness/workflows/x.bpmn");
    rmSync(repo, { recursive: true, force: true });
  });

  test("a path OUTSIDE the repository is left alone, not turned into ../..", () => {
    // `relative()` would make it a run of `../` — a path that resolves
    // somewhere, differently on every machine, and looks deliberate. An
    // absolute path at least fails honestly and says whose checkout it is.
    const repo = mkdtempSync(join(tmpdir(), "wf-rel-"));
    const outside = resolve("/etc/elsewhere/x.bpmn");
    saveInstance(repo, inst(outside));
    const back = loadInstance(repo, "t--subject");
    expect(back?.source).toBe(outside);
    expect(back?.source).not.toContain("..");
    rmSync(repo, { recursive: true, force: true });
  });

  test("normalising on WRITE repairs a file that was already wrong", () => {
    // The same principle `$schema` follows here: a file from before the rule
    // gains it the next time anything touches it, so no migration is needed.
    const repo = mkdtempSync(join(tmpdir(), "wf-rel-"));
    saveInstance(repo, inst(join(repo, "a/parent.bpmn")));
    const loaded = loadInstance(repo, "t--subject")!;
    // Re-save what came back; it must stay relative and stay stable.
    saveInstance(repo, loaded);
    expect(loadInstance(repo, "t--subject")?.source).toBe("a/parent.bpmn");
    rmSync(repo, { recursive: true, force: true });
  });
});
