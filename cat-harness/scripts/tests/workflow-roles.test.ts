/**
 * The interpreter reports what an agent is acting AS, not only which box the
 * step was drawn in.
 *
 * `enabled()` took `(model, state)` and returned the lane's free-text name.
 * That is not an answer to "who performs this" — sixty lane strings spell two
 * dozen positions — so an agent handed a step could not find out what skills
 * its performer carries. These pin the join, and the fallback that keeps an
 * unmigrated instance working.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { loadProcessModel } from "../../src/workflow/process-model.js";
import { enabled, startInstance, describe as renderInstance } from "../../src/workflow/instance.js";
import { readRoleGraph, resolveRoleSkills } from "../../schemas/role-graph.js";

const ROOT = join(import.meta.dir, "..", "..");
const graph = readRoleGraph(join(ROOT, "scenarios"));

describe("enabled() joins a lane to its declared role", () => {
  test("reports the role, not only the lane's spelling", async () => {
    const model = await loadProcessModel(join(ROOT, "processes", "getting-started.bpmn"));
    const state = startInstance(model, { id: "test-instance", subject: "test-subject" });
    const open = enabled(model, state, graph);
    expect(open.length).toBeGreaterThan(0);
    for (const e of open) {
      if (!e.lane) continue;
      expect(e.role, `lane "${e.lane}" bound no role`).toBeDefined();
    }
  });

  test("an activity's roleSkills is the role's closure, not the activity's own refs", async () => {
    const model = await loadProcessModel(join(ROOT, "processes", "editing-hci-validation.bpmn"));
    const state = startInstance(model, { id: "test-instance", subject: "test-subject" });
    for (const e of enabled(model, state, graph)) {
      if (e.kind !== "activity" || !e.role) continue;
      expect(e.roleSkills).toEqual(resolveRoleSkills(graph!, e.role).map((s) => s.skill));
    }
  });

  test("without a role graph the interpreter still works — unmigrated is not broken", async () => {
    const model = await loadProcessModel(join(ROOT, "processes", "getting-started.bpmn"));
    const state = startInstance(model, { id: "test-instance", subject: "test-subject" });
    const open = enabled(model, state);
    expect(open.length).toBeGreaterThan(0);
    for (const e of open) {
      expect(e.role).toBeUndefined();
      if (e.kind === "activity") expect(e.roleSkills).toBeUndefined();
    }
  });

  test("describe() and enabled() cannot disagree about who performs a step", async () => {
    const model = await loadProcessModel(join(ROOT, "processes", "getting-started.bpmn"));
    const state = startInstance(model, { id: "test-instance", subject: "test-subject" });
    const rendered = renderInstance(model, state, graph);
    for (const e of enabled(model, state, graph)) {
      if (e.role) expect(rendered).toContain(e.role);
    }
  });
});

describe("every activity in every diagram is performed by a declared role", () => {
  test("no enabled step in any process would report an unbound lane", async () => {
    const dir = join(ROOT, "processes");
    const { readdirSync } = await import("node:fs");
    const unbound: string[] = [];
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".bpmn"))) {
      const model = await loadProcessModel(join(dir, f));
      for (const lane of model.lanes) {
        const role = graph!.roles.find(
          (r) => (lane.roleRef ? r.id === lane.roleRef : lane.name !== undefined && r.lanes.includes(lane.name)),
        );
        if (!role) unbound.push(`${f}: ${lane.name ?? lane.id}`);
      }
    }
    expect(unbound).toEqual([]);
  });
});
