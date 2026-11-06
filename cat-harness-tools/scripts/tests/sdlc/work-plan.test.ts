/**
 * A work plan is an epic or milestone that names the process it instantiates
 * (work item folio-assistant-exrp; owner 2026-11-05, "Epic is the plan").
 */
import { describe, expect, test } from "bun:test";
import { workPlanFindings, workPlanOf } from "../../../schemas/sdlc/work-plan.ts";

describe("a work item's plan, read from its tags", () => {
  test("a process tag makes it a plan; a proposal tag says where it came from", () => {
    expect(workPlanOf(["vocabulary", "process:Process_ContentLifecycle", "proposal:docs/proposals/x.md"])).toEqual({
      processes: ["Process_ContentLifecycle"],
      proposal: "docs/proposals/x.md",
    });
  });

  test("no process tag, no plan — a proposal alone is not yet one", () => {
    expect(workPlanOf(["proposal:docs/proposals/x.md"])).toBeUndefined();
    expect(workPlanOf([])).toBeUndefined();
    expect(workPlanOf(undefined)).toBeUndefined();
  });

  test("several processes, in order, once each; an empty value is no value", () => {
    expect(workPlanOf(["process:A", "process: B ", "process:A", "process:"])?.processes).toEqual(["A", "B"]);
  });
});

describe("work-plan findings: reported, never fatal", () => {
  test("a plan filed as a feature, and a proposal with no process", () => {
    const f = workPlanFindings([
      { id: "a", type: "epic", tags: ["process:P"] },
      { id: "b", type: "milestone", tags: ["process:P"] },
      { id: "c", type: "feature", tags: ["process:P"] },
      { id: "d", type: "epic", tags: ["proposal:docs/proposals/x.md"] },
      { id: "e", type: "task", tags: ["vocabulary"] },
    ]);
    expect(f.map((x) => x.id)).toEqual(["c", "d"]);
  });
});

describe("an instance names its plan", () => {
  test("startInstance records `plan` when given, and writes no key when not", async () => {
    const { startInstance } = await import("../../../src/workflow/instance.ts");
    const { loadProcessModel } = await import("../../../src/workflow/process-model.ts");
    const { workflowFile } = await import("../../known-skills.ts");
    const { HARNESS_ROOT } = await import("../../lib/roots.ts");
    const model = await loadProcessModel(workflowFile(HARNESS_ROOT, "bean-drain.bpmn"));
    const withPlan = startInstance(model, { id: "plan-yes", subject: "x", bean: "abcd", plan: "epic1" });
    expect(withPlan.plan).toBe("epic1");
    const without = startInstance(model, { id: "plan-no", subject: "x", bean: "abcd" });
    expect("plan" in without).toBe(false);
  });
});
