/**
 * A lane may DECLARE that its performer varies, and the audit reads it.
 *
 * @module scripts/tests/variable-performer.test
 *
 * Bean `ug4r`. `log-message.bpmn`'s `Actor` lane binds no role on purpose —
 * the actor is whoever called the sub-process — but until 2026-09-21 that
 * decision lived only in a prose `_comment` inside
 * `bootstrap/skills/roles/roles.json`. No tool read it, so "deliberately
 * unbound" and "nobody got round to it" were the same fact to every consumer,
 * and `lane-binds-role` (severity `major`) would report a correct modelling
 * decision as a defect for ever.
 *
 * These assert the three things that has to be true for the flag to be worth
 * having: it PARSES, it SUPPRESSES the finding, and it does not suppress a
 * finding on an ordinary unbound lane — which is the failure mode that would
 * turn the fix into a way of hiding real defects.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { laneBinding, type RoleGraph } from "../../schemas/role-graph.ts";
import { loadProcessModel } from "../../src/workflow/process-model.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const LOG_MESSAGE = join(REPO, "bootstrap", "workflows", "log-message.bpmn");

/** `loadProcessModel` takes a path, so a mutated diagram needs a file. */
async function modelOf(xml: string) {
  const dir = mkdtempSync(join(tmpdir(), "varperf-"));
  const file = join(dir, "log-message.bpmn");
  writeFileSync(file, xml);
  try {
    return await loadProcessModel(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("a lane declaring <folio:role variable=\"true\"/>", () => {
  test("the real diagram carries the declaration and it parses", async () => {
    const m = await loadProcessModel(LOG_MESSAGE);
    const actor = m.lanes.find((l) => l.id === "Lane_Actor");
    expect(actor).toBeDefined();
    expect(actor!.performerVaries).toBe(true);
    // And it binds no role — the two together are the whole point.
    expect(actor!.roleRef).toBeUndefined();
  });

  test("a lane that binds a role is NOT read as varying", async () => {
    const m = await loadProcessModel(LOG_MESSAGE);
    const logger = m.lanes.find((l) => l.id === "Lane_Logger");
    expect(logger).toBeDefined();
    // `undefined` or `false` both mean "not declared"; what must never happen
    // is the flag leaking onto a lane that did not declare it, which would
    // silence `lane-binds-role` across the corpus.
    expect(logger!.performerVaries ?? false).toBe(false);
  });

  test("only the exact string \"true\" counts", async () => {
    const xml = readFileSync(LOG_MESSAGE, "utf-8").replace(
      '<folio:role variable="true"/>',
      '<folio:role variable="yes"/>',
    );
    const m = await modelOf(xml);
    // Reading a typo as a declaration is how a defect quietly becomes an
    // exemption. "yes" is not the attribute value, so the lane is unbound and
    // the audit is entitled to say so.
    expect(m.lanes.find((l) => l.id === "Lane_Actor")!.performerVaries).toBe(false);
  });

  test("a lane with neither ref nor the flag stays unflagged", async () => {
    const xml = readFileSync(LOG_MESSAGE, "utf-8").replace(
      '<bpmn:extensionElements><folio:role variable="true"/></bpmn:extensionElements>\n        ',
      "",
    );
    const m = await modelOf(xml);
    const actor = m.lanes.find((l) => l.id === "Lane_Actor");
    expect(actor!.performerVaries).toBe(false);
    expect(actor!.roleRef).toBeUndefined();
  });
});

describe("laneBinding — the five answers the audit judges", () => {
  const graph: RoleGraph = {
    name: "test",
    roles: [
      {
        id: "logger",
        title: "Logger",
        description: "Records and decides nothing.",
        actorKinds: ["system"],
        lanes: ["Logger"],
        skills: [],
      },
    ],
  };

  test("a lane whose name a role claims is BOUND", () => {
    expect(laneBinding(graph, { name: "Logger" })).toEqual({ kind: "bound", role: graph.roles[0]! });
  });

  test("a lane with neither a match nor a declaration is UNBOUND — still a finding", () => {
    // The failure mode that would make this whole change a way of hiding real
    // defects: if declaring the flag anywhere silenced ordinary unbound lanes.
    expect(laneBinding(graph, { name: "Nobody" })).toEqual({ kind: "unbound" });
  });

  test("a ref naming an undeclared role is DANGLING, not unbound", () => {
    // Different fix: a typo to correct, versus a binding to add.
    expect(laneBinding(graph, { name: "X", roleRef: "ghost" })).toEqual({
      kind: "dangling",
      ref: "ghost",
    });
  });

  test("a declared varying performer is its own answer, not an absence", () => {
    expect(laneBinding(graph, { name: "Actor", performerVaries: true })).toEqual({ kind: "variable" });
  });

  test("declaring BOTH is contradictory, and is refused before the graph is read", () => {
    // Checked first and without the graph on purpose: a lane saying two
    // contradictory things is wrong whatever the graph contains, and resolving
    // either would make the other silently have no effect.
    expect(laneBinding(undefined, { name: "Logger", roleRef: "logger", performerVaries: true })).toEqual({
      kind: "contradictory",
      ref: "logger",
    });
  });

  test("with no graph at all, a plain lane is unbound rather than bound", () => {
    // `could not read the graph` must never resolve as a pass.
    expect(laneBinding(undefined, { name: "Logger" })).toEqual({ kind: "unbound" });
  });
});
