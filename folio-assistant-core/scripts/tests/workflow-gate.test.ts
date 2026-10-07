/**
 * The workflow gate against folio-assistant-core's own processes — moved here
 * from `cat-harness/scripts/tests/workflow-gate.test.ts` (bean `ho66`). The
 * gate is cat-harness code and its fixture-only tests stay there; these pin
 * what `editing-hci-validation`, `draft-to-publication` and
 * `content-lifecycle` declare, and those diagrams are this instance's, so
 * standing alone cat-harness has nothing for them to read.
 *
 * The decision in bean `bcnl`: **strict at the base, relaxable by content
 * packages that say so.** A relaxation needs a stated reason, it must name
 * something real, and it cannot name the gate itself.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { drainSubprocess } from "../../../cat-harness/scripts/tests/helpers";
import { loadProcessModel } from "../../../cat-harness/src/workflow/process-model";
import { complete, startInstance } from "../../../cat-harness/src/workflow/instance";
import {
  checkGate,
  PolicyError,
  validateRelaxations,
  type Relaxation,
} from "../../../cat-harness/src/workflow/gate";
import { workflowFile } from "../../../cat-harness/scripts/known-skills.ts";

/** This instance's root; its diagrams are found by NAME through its declared `processes` graphs (bean `63wl`). */
const CORE = resolve(import.meta.dir, "../..");
const editing = () => loadProcessModel(workflowFile(CORE, "editing-hci-validation.bpmn"));

const relax = (over: Partial<Relaxation> = {}): Relaxation => ({
  process: "Process_Editing",
  activity: "Task_SmeReview",
  reason: "test",
  package: "authoring-math",
  ...over,
});

describe("the base is strict and the content-type processes are not", () => {
  test("the three content-agnostic processes enforce", async () => {
    for (const f of ["editing-hci-validation", "draft-to-publication", "content-lifecycle"]) {
      expect((await loadProcessModel(workflowFile(CORE, `${f}.bpmn`))).enforcement).toBe("strict");
    }
  });
});

describe("a strict process refuses a step it has not reached", () => {
  test("committing before the findings gate is refused, with what to do about it", async () => {
    const model = await editing();
    const state = startInstance(model, { id: "g1", subject: "def:x" });
    const v = checkGate(model, state, "Task_Commit", []);
    expect(v.allowed).toBe(false);
    expect(v.reason).toContain("not enabled");
    // The refusal names the escape hatch and then closes it for this step.
    expect(v.reason).toContain("workflow-policy.json");
    expect(v.reason).toContain('cannot be');
  });

  test("an enabled step is allowed", async () => {
    const model = await editing();
    const state = startInstance(model, { id: "g2", subject: "def:x" });
    expect(checkGate(model, state, "Task_DescribeChange", []).allowed).toBe(true);
  });
});

describe("a declared relaxation permits a step, and is attributed", () => {
  test("the SME branch may be skipped where a package declared it", async () => {
    const model = await editing();
    const state = startInstance(model, { id: "g3", subject: "def:x" });
    complete(model, state, "Task_DescribeChange");
    complete(model, state, "Task_ClaimBean");
    drainSubprocess(model, state, "CallActivity_Evidence");
    complete(model, state, "Task_DraftEdit");
    complete(model, state, "Gateway_ReviewerKind", { outcome: "no" });

    // Task_SmeReview was never reached: the routing went to the agent branch.
    expect(checkGate(model, state, "Task_SmeReview", []).allowed).toBe(false);

    const v = checkGate(model, state, "Task_SmeReview", [relax({ reason: "no clinical SME here" })]);
    expect(v.allowed).toBe(true);
    expect(v.relaxedBy?.package).toBe("authoring-math");
    expect(v.reason).toContain("no clinical SME here");
  });

  test("a relaxation for a different process does not apply", async () => {
    const model = await editing();
    const state = startInstance(model, { id: "g4", subject: "def:x" });
    const other = relax({ process: "Process_Publication", activity: "Task_SmeReview" });
    expect(checkGate(model, state, "Task_SmeReview", [other]).allowed).toBe(false);
  });
});

describe("what a package may NOT relax", () => {
  test("the steps that are the gate refuse to be named", async () => {
    const model = await editing();
    // If these were negotiable the base would not be strict, it would be a
    // suggestion: the editor seeing the findings, the decision, and the write.
    for (const activity of ["Task_ReviewFindings", "Gateway_EditorDecision", "Task_Commit"]) {
      expect(() => validateRelaxations([relax({ activity })], [model])).toThrow(PolicyError);
      expect(() => validateRelaxations([relax({ activity })], [model])).toThrow(/relaxable="false"/);
    }
  });

  test("release authorisation cannot be relaxed either", async () => {
    const model = await loadProcessModel(workflowFile(CORE, "draft-to-publication.bpmn"));
    const r = relax({ process: "Process_Publication", activity: "Task_AuthorizeRelease" });
    expect(() => validateRelaxations([r], [model])).toThrow(/relaxable="false"/);
  });

  test("a relaxation naming a process or activity that is not there fails at load", async () => {
    const model = await editing();
    // Otherwise it sits in the file looking like policy while permitting
    // nothing, and nobody finds out until the day it matters.
    expect(() => validateRelaxations([relax({ process: "Process_Nope" })], [model])).toThrow(
      /not a process here/,
    );
    expect(() => validateRelaxations([relax({ activity: "Task_Nope" })], [model])).toThrow(
      /no such node/,
    );
  });
});
