import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { applyWorkPlanOp, findBean, listBeans } from "../../src/workflow/bean-link";
import { loadProcessModel, UnsupportedBpmn } from "../../src/workflow/process-model";

/**
 * `.beans/` says what is being worked on; an instance says where it got to.
 * Kept apart they diverge. These tests are about the operations that keep them
 * one record — and about the one that deliberately refuses to fire.
 *
 * They write to a temp repo, never the real `.beans/`.
 */

let repo: string;

const bean = (id: string, title: string, status: string, body = "Original body.\n"): void => {
  writeFileSync(
    join(repo, ".beans", `${id}--${title.toLowerCase().replace(/\W+/g, "-")}.md`),
    `---\n# ${id}\ntitle: ${title}\nstatus: ${status}\ntype: task\n` +
      `created_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\n---\n\n${body}`,
  );
};

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "bean-link-"));
  mkdirSync(join(repo, ".beans"), { recursive: true });
});
afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe("reading the store", () => {
  test("a bean is found by id, not by a filename prefix that merely starts the same", () => {
    bean("fq0b", "Real bean", "todo");
    bean("fq0bx", "Different bean", "todo");
    expect(findBean(repo, "fq0b")?.title).toBe("Real bean");
    expect(findBean(repo, "fq0bx")?.title).toBe("Different bean");
    expect(listBeans(repo)).toHaveLength(2);
  });

  test("a missing bean is undefined, not an error", () => {
    expect(findBean(repo, "nope")).toBeUndefined();
    expect(listBeans(repo)).toEqual([]);
  });
});

describe("claim", () => {
  test("moves the bean to in-progress and bumps updated_at", () => {
    bean("aaaa", "Some work", "todo");
    const r = applyWorkPlanOp(repo, "aaaa", "claim");
    expect(r.summary).toBe("bean aaaa: todo → in-progress");
    const body = readFileSync(findBean(repo, "aaaa")!.path, "utf8");
    expect(body).toContain("status: in-progress");
    expect(body).not.toContain("updated_at: 2026-01-01T00:00:00Z");
  });

  test("is idempotent — re-entering the step does not churn the file", () => {
    bean("aaaa", "Some work", "in-progress");
    const before = readFileSync(findBean(repo, "aaaa")!.path, "utf8");
    expect(applyWorkPlanOp(repo, "aaaa", "claim").summary).toBe("bean aaaa already in-progress");
    expect(readFileSync(findBean(repo, "aaaa")!.path, "utf8")).toBe(before);
  });
});

describe("note", () => {
  test("appends to the body and leaves the status alone", () => {
    bean("bbbb", "Some work", "in-progress");
    applyWorkPlanOp(repo, "bbbb", "note", { note: "3 findings, 1 critical." });
    const body = readFileSync(findBean(repo, "bbbb")!.path, "utf8");
    expect(body).toContain("3 findings, 1 critical.");
    expect(body).toContain("Original body.");
    expect(body).toContain("status: in-progress");
  });
});

describe("resolve", () => {
  test("does NOT close the bean while the process it tracks is still running", () => {
    bean("cccc", "Some work", "in-progress");
    // "Resolve or re-open the bean" is a judgement about whether work is done,
    // and AGENTS.md is explicit that a bean is not closed on someone else's
    // say-so. The only thing that settles it here is the process finishing.
    const r = applyWorkPlanOp(repo, "cccc", "resolve", { instanceCompleted: false });
    expect(r.summary).toContain("left in-progress");
    expect(readFileSync(findBean(repo, "cccc")!.path, "utf8")).toContain("status: in-progress");
  });

  test("closes it once the instance has completed", () => {
    bean("cccc", "Some work", "in-progress");
    const r = applyWorkPlanOp(repo, "cccc", "resolve", {
      instanceCompleted: true,
      note: "Landed clean.",
    });
    expect(r.summary).toBe("bean cccc: in-progress → completed");
    const body = readFileSync(findBean(repo, "cccc")!.path, "utf8");
    expect(body).toContain("status: completed");
    expect(body).toContain("Landed clean.");
  });
});

describe("an instance with no bean", () => {
  test("says so rather than silently doing nothing", () => {
    // Silence is how the two records drift apart again without anyone noticing.
    const r = applyWorkPlanOp(repo, undefined, "claim");
    expect(r.summary).toContain("no bean on this instance");
    expect(r.bean).toBeUndefined();
  });

  test("a bean id that is not in the store is reported, not invented", () => {
    expect(applyWorkPlanOp(repo, "zzzz", "claim").summary).toContain("not in .beans/");
  });
});

describe("the diagrams declare which operation each step performs", () => {
  test("every bean-marked activity in the shipped diagrams names an op", async () => {
    const dir = resolve(import.meta.dir, "../../docs/workflows");
    let marked = 0;
    for (const f of ["editing-hci-validation", "draft-to-publication", "content-lifecycle",
                     "authoring-a-paper", "l2-dak-authoring", "l3-fhir-pipeline"]) {
      const model = await loadProcessModel(join(dir, `${f}.bpmn`));
      for (const n of model.nodes.values()) {
        if (!n.touchesWorkPlan) continue;
        marked++;
        // Asserted as a defined string, not just "one of these": an activity
        // marked as touching the plan whose op is absent would silently do
        // nothing, and `toContain(undefined)` would not say so clearly.
        expect(n.workPlanOp).toBeDefined();
        expect(["claim", "note", "resolve"]).toContain(n.workPlanOp!);
      }
    }
    expect(marked).toBe(11);
  });

  test("the editing process claims, notes, then resolves — in that order", async () => {
    const model = await loadProcessModel(
      resolve(import.meta.dir, "../../docs/workflows/editing-hci-validation.bpmn"),
    );
    expect(model.nodes.get("Task_ClaimBean")!.workPlanOp).toBe("claim");
    expect(model.nodes.get("Task_LogFindings")!.workPlanOp).toBe("note");
    expect(model.nodes.get("Task_ResolveBean")!.workPlanOp).toBe("resolve");
  });

  test("an op this build does not implement is refused, not ignored", async () => {
    const dir = mkdtempSync(join(tmpdir(), "bean-op-"));
    writeFileSync(
      join(dir, "bad.bpmn"),
      `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"
                  id="D" targetNamespace="urn:x">
  <bpmn:process id="Process_Bad" name="Bad" isExecutable="false">
    <bpmn:startEvent id="S"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="T" name="Do">
      <bpmn:extensionElements><folio:bean store=".beans/" op="obliterate" /></bpmn:extensionElements>
      <bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="E"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="S" targetRef="T" />
    <bpmn:sequenceFlow id="F2" sourceRef="T" targetRef="E" />
  </bpmn:process>
</bpmn:definitions>
`,
    );
    // A step that claims to touch the work plan and quietly does nothing is the
    // divergence this whole extension exists to close.
    await expect(loadProcessModel(join(dir, "bad.bpmn"))).rejects.toThrow(UnsupportedBpmn);
    await expect(loadProcessModel(join(dir, "bad.bpmn"))).rejects.toThrow(/obliterate/);
    rmSync(dir, { recursive: true, force: true });
  });
});
