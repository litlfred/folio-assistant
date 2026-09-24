/**
 * The engine writes a `prov:Activity` as it records a step (bean `n2l9`,
 * issues #1180 and #1207): the authenticated agent, the lane's role, the plan
 * and every policy in force — and invents nothing.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { loadProcessModel } from "../../src/workflow/process-model.js";
import { complete, enabled, startInstance } from "../../src/workflow/instance.js";
import { provActivityFor } from "../../src/workflow/prov-record.js";
import { loadAccessContext, type Principal } from "../../src/core/access.js";
import { ProvActivitySchema } from "../../schemas/prov.js";
import { reportInstance } from "../prov-qaqc.js";
import { roleGraphFor } from "../known-skills.js";
import type { TaskAuthVerdict } from "../../src/workflow/authorize.js";

const ROOT = join(import.meta.dir, "..", "..");
const CTX = loadAccessContext(ROOT);
const GITHUB: Principal = { actor: "collaborator", authenticatedBy: "github", account: "octo" };

async function firstRoledStep() {
  const model = await loadProcessModel(join(ROOT, "processes", "getting-started.bpmn"));
  const state = startInstance(model, { id: "t", subject: "s" });
  const e = enabled(model, state).find((x) => x.kind === "activity" && model.nodes.get(x.node)?.roleRef);
  return { model, state, node: model.nodes.get(e!.node)! };
}

describe("complete() writes the activity as it records the step", () => {
  test("an allowed step under a GitHub principal carries a valid prov:Activity", async () => {
    const { model, state, node } = await firstRoledStep();
    const next = complete(model, state, node.id, {
      authz: { ctx: CTX, principal: GITHUB, target: "block-1", mode: "strict" },
    });
    const entry = next.history.at(-1)!;
    expect(entry.prov).toBeDefined();
    expect(ProvActivitySchema.safeParse(entry.prov).success).toBe(true);
    expect(entry.prov!["prov:qualifiedAssociation"]).toEqual({
      "prov:agent": "collaborator",
      "prov:hadRole": node.roleRef!,
      "prov:hadPlan": `getting-started#${node.id}`,
    });
    expect(entry.prov!["prov:used"]).toEqual(["block-1"]);
    // Every policy in force, because decide() evaluated every one.
    const under = entry.prov!["cat-harness:underPolicy"];
    expect(Array.isArray(under) ? under.length : 1).toBe(CTX.policies.size);
  });

  test("no authorization context, no activity: nothing is recorded that was not decided", async () => {
    const { model, state, node } = await firstRoledStep();
    const next = complete(model, state, node.id, {});
    expect(next.history.at(-1)!.prov).toBeUndefined();
  });
});

describe("provActivityFor invents nothing", () => {
  const verdict = (over: Partial<TaskAuthVerdict>): TaskAuthVerdict => ({
    allowed: true,
    mode: "strict",
    authenticatedBy: "github",
    actor: "owner",
    role: "author",
    assignment: "unconstrained",
    authorized: "permit",
    findings: [],
    ...over,
  });
  const base = { id: "i#0", at: "2026-09-24T00:00:00.000Z", source: "p.bpmn", node: "Task_A", policies: ["urn:p"] };

  test("a refused step, a step with no actor, and a step with no lane role get no activity", () => {
    expect(provActivityFor({ ...base, verdict: verdict({ allowed: false }) })).toBeUndefined();
    expect(provActivityFor({ ...base, verdict: verdict({ actor: null }) })).toBeUndefined();
    expect(provActivityFor({ ...base, verdict: verdict({ role: undefined }) })).toBeUndefined();
    expect(provActivityFor({ ...base, policies: [], verdict: verdict({}) })).toBeUndefined();
  });

  test("one policy is written as a string, several as a sorted array", () => {
    expect(provActivityFor({ ...base, verdict: verdict({}) })!["cat-harness:underPolicy"]).toBe("urn:p");
    expect(provActivityFor({ ...base, policies: ["urn:b", "urn:a"], verdict: verdict({}) })!["cat-harness:underPolicy"]).toEqual(["urn:a", "urn:b"]);
  });
});

describe("the after-check reads the engine's record", () => {
  test("it re-checks the recorded principal, not a login in `actor`, and emits the recorded activity", async () => {
    const { model, state, node } = await firstRoledStep();
    // The caller typed a GitHub login as `actor`; GitHub vouched for `collaborator`.
    const next = complete(model, state, node.id, {
      actor: "octo",
      authz: { ctx: CTX, principal: GITHUB, mode: "strict" },
    });
    const r = reportInstance("t", next, model, roleGraphFor(ROOT), CTX);
    expect(r.findings.filter((f) => f.kind === "undeclared-actor")).toEqual([]);
    expect(r.activities).toContainEqual(next.history.at(-1)!.prov!);
  });
});
