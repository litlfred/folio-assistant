import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { loadProcessModel } from "../../src/workflow/process-model";
import { complete, startInstance } from "../../src/workflow/instance";
import {
  checkGate,
  loadRelaxations,
  PolicyError,
  validateRelaxations,
  type Relaxation,
} from "../../src/workflow/gate";

/**
 * The decision in bean `bcnl`: **strict at the base, relaxable by content
 * packages that say so.**
 *
 * The content-agnostic processes enforce. A per-content-type process is
 * advisory, because what counts as adequate review of a Lean proof and of a
 * FHIR profile are different questions and the package that knows the domain
 * should answer them.
 *
 * What makes that a policy rather than a loophole is what these tests pin: a
 * relaxation needs a stated reason, it must name something real, and it cannot
 * name the gate itself.
 */

const WF = resolve(import.meta.dir, "../../docs/workflows");
const REPO = resolve(import.meta.dir, "../..");
const editing = () => loadProcessModel(join(WF, "editing-hci-validation.bpmn"));

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
      expect((await loadProcessModel(join(WF, `${f}.bpmn`))).enforcement).toBe("strict");
    }
  });

  test("the three per-content-type processes are advisory", async () => {
    for (const f of ["authoring-a-paper", "l2-dak-authoring", "l3-fhir-pipeline"]) {
      expect((await loadProcessModel(join(WF, `${f}.bpmn`))).enforcement).toBe("advisory");
    }
  });

  test("an advisory process allows a step that is not enabled, and says why", async () => {
    const model = await loadProcessModel(join(WF, "authoring-a-paper.bpmn"));
    const state = startInstance(model, { id: "g0", subject: "paper" });
    const v = checkGate(model, state, "Task_Publish", []);
    expect(v.allowed).toBe(true);
    expect(v.reason).toContain("advisory");
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
    const model = await loadProcessModel(join(WF, "draft-to-publication.bpmn"));
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

describe("reading the package policy files", () => {
  test("a relaxation with no reason does not load", () => {
    const repo = mkdtempSync(join(tmpdir(), "policy-"));
    mkdirSync(join(repo, "skills", "pkg"), { recursive: true });
    writeFileSync(
      join(repo, "skills", "pkg", "workflow-policy.json"),
      JSON.stringify({ relaxations: [{ process: "Process_Editing", activity: "Task_SmeReview" }] }),
    );
    // An unexplained relaxation is a loophole, not a policy.
    expect(() => loadRelaxations(repo)).toThrow(PolicyError);
    expect(() => loadRelaxations(repo)).toThrow(/reason/);
    rmSync(repo, { recursive: true, force: true });
  });

  test("a policy file claiming to be a different package does not load", () => {
    const repo = mkdtempSync(join(tmpdir(), "policy-"));
    mkdirSync(join(repo, "skills", "pkg"), { recursive: true });
    writeFileSync(
      join(repo, "skills", "pkg", "workflow-policy.json"),
      JSON.stringify({ package: "somewhere-else", relaxations: [] }),
    );
    expect(() => loadRelaxations(repo)).toThrow(/declares package/);
    rmSync(repo, { recursive: true, force: true });
  });

  test("a package with no policy file relaxes nothing", () => {
    const repo = mkdtempSync(join(tmpdir(), "policy-"));
    mkdirSync(join(repo, "skills", "quiet"), { recursive: true });
    expect(loadRelaxations(repo)).toEqual([]);
    rmSync(repo, { recursive: true, force: true });
  });
});

describe("the relaxations this repo actually ships", () => {
  test("all of them are legal against the real processes", async () => {
    const models = await Promise.all(
      ["editing-hci-validation", "draft-to-publication", "content-lifecycle",
       "authoring-a-paper", "l2-dak-authoring", "l3-fhir-pipeline"].map((f) =>
        loadProcessModel(join(WF, `${f}.bpmn`)),
      ),
    );
    const relaxations = loadRelaxations(REPO);
    expect(() => validateRelaxations(relaxations, models)).not.toThrow();
    // Every one is attributed and explained — the file is the record.
    for (const r of relaxations) {
      expect(r.package).toBeTruthy();
      expect(r.reason.length).toBeGreaterThan(20);
    }
  });
});
