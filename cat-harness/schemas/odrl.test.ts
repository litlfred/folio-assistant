/**
 * ODRL 2.2 policies (issue #1180): the schema refuses what it cannot mean, the
 * migration moved every actor's permissions without losing or adding one, and
 * `permits()` answers three ways.
 */
import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import {
  ANYONE,
  OdrlPolicySchema,
  actionGraph,
  broaderOrSelf,
  effectiveRules,
  permits,
  readPolicies,
  readPolicyGrants,
  type OdrlPolicy,
} from "./odrl.ts";
import { ProvActivitySchema } from "./prov.ts";
import { readActors, readPermissions } from "./role-graph.ts";

const INSTANCE = resolve(import.meta.dir, "..");
const REPO = resolve(INSTANCE, "..");
const POLICY_DIR = join(INSTANCE, "policies");
const ACTOR_DIR = join(REPO, ".claude", "skills", "actors");

/**
 * Each actor's `permissions` list as the actor files carried it before the
 * migration (2026-09-23), copied from the files before they were edited.
 * The migration must reproduce it exactly: a permission lost or gained in a
 * file move is a permission change nobody decided.
 */
const BEFORE: Record<string, string[]> = {
  admin: ["admin-settings", "role-management", "release-authorization"],
  author: ["content-authoring"],
  "authoring-agent": ["content-authoring"],
  "board-renderer": [],
  "ci-health-watcher": ["qa-reporting"],
  "ci-pipeline": ["qa-reporting"],
  "clinical-sme": ["clinical-validation"],
  "content-reviewer": ["approval-authority", "adjudication"],
  "end-user": ["adjudication"],
  "evidence-agent": ["content-authoring"],
  "ig-publisher-service": ["qa-reporting"],
  "ingestion-agent": ["content-authoring"],
  librarian: ["content-authoring"],
  "local-sweep": ["qa-reporting"],
  "onboarding-agent": ["content-authoring"],
  "platform-boundary-guard": ["qa-reporting"],
  "programme-manager": ["project-governance", "release-authorization"],
  "publication-manager": ["release-management"],
  "qc-reviewer": ["qa-reporting"],
  "review-agent": ["review-comments"],
  reviewer: ["review-comments"],
  "technical-officer": ["first-pass-review", "sme-coordination"],
  translator: ["translation"],
  "untainted-adjudicator": ["qa-reporting", "adjudication"],
  "untainted-checker": [],
};

const POLICIES = readPolicies(POLICY_DIR);
const DEFAULTS = [...POLICIES.values()][0]!;
const GRAPH = actionGraph(readPermissions(join(INSTANCE, "skills"))!.permissions);

function policy(over: Partial<OdrlPolicy> & Record<string, unknown> = {}): OdrlPolicy {
  return OdrlPolicySchema.parse({
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Set",
    uid: "urn:test",
    profile: "urn:folio-odrl",
    ...over,
  });
}
const one = (p: OdrlPolicy) => new Map([[p.uid, p]]);

describe("the policies in this repository", () => {
  test("there is a policy, and it parses (vacuity guard)", () => {
    expect(POLICIES.size).toBeGreaterThan(0);
  });

  test("no actor file still carries its own permissions list", () => {
    const stale = readActors(ACTOR_DIR).filter((a) => a.permissions !== undefined).map((a) => a.id);
    expect(stale).toEqual([]);
  });

  test("the migration moved every permission, and added none", () => {
    const grants = readPolicyGrants(POLICY_DIR);
    const after = Object.fromEntries(
      readActors(ACTOR_DIR, grants)
        .filter((a) => a.id in BEFORE)
        .map((a) => [a.id, [...(a.permissions ?? [])].sort()]),
    );
    const before = Object.fromEntries(Object.entries(BEFORE).map(([k, v]) => [k, [...v].sort()]));
    expect(after).toEqual(before);
  });

  test("every assignee is an actor or anyone, and every action is in the profile", () => {
    const ids = new Set(readActors(ACTOR_DIR).map((a) => a.id));
    const { permission, prohibition } = effectiveRules(DEFAULTS, POLICIES);
    const bad = [...permission, ...prohibition].flatMap((r) => [
      ...(r.assignee === ANYONE || ids.has(r.assignee) ? [] : [`assignee ${r.assignee}`]),
      ...(GRAPH.has(r.action) ? [] : [`action ${r.action}`]),
    ]);
    expect(bad).toEqual([]);
  });

  test("every profile action reaches odrl:use", () => {
    const stranded = [...GRAPH.keys()].filter((a) => !broaderOrSelf(a, GRAPH).has("odrl:use"));
    expect(stranded).toEqual([]);
  });

  test("an unauthenticated reader may visualize and render, and nothing else (owner, 2026-09-23)", () => {
    const anon = (action: string) => permits({ actor: null, action }, DEFAULTS, POLICIES, GRAPH);
    expect(anon("visualize")).toBe("permit");
    expect(anon("render")).toBe("permit");
    const others = [...GRAPH.keys()].filter((a) => !["visualize", "render"].includes(a) && !a.startsWith("odrl:"));
    expect(others.filter((a) => anon(a) === "permit")).toEqual([]);
  });

  test("a migrated grant still holds: admin may administer roles, author may not", () => {
    expect(permits({ actor: "admin", action: "role-management" }, DEFAULTS, POLICIES, GRAPH)).toBe("permit");
    expect(permits({ actor: "author", action: "role-management" }, DEFAULTS, POLICIES, GRAPH)).toBe("unknown");
  });
});

describe("permits(): three answers", () => {
  const g = actionGraph([
    { id: "perform-task", includedIn: ["odrl:execute"] },
    { id: "approve", includedIn: ["perform-task"] },
  ]);

  test("a grant of a broader action permits the actions included in it, not the reverse", () => {
    const broad = policy({ permission: [{ assignee: "a", action: "perform-task" }] });
    expect(permits({ actor: "a", action: "approve" }, broad, one(broad), g)).toBe("permit");
    const narrow = policy({ permission: [{ assignee: "a", action: "approve" }] });
    expect(permits({ actor: "a", action: "perform-task" }, narrow, one(narrow), g)).toBe("unknown");
  });

  test("no rule is unknown, never permit", () => {
    const p = policy();
    expect(permits({ actor: "a", action: "approve" }, p, one(p), g)).toBe("unknown");
  });

  test("a scoped grant holds only in its scope, and an unstated scope does not satisfy it", () => {
    const p = policy({
      permission: [
        {
          assignee: "a",
          action: "approve",
          constraint: [{ leftOperand: "cat-harness:process", operator: "odrl:eq", rightOperand: "release" }],
        },
      ],
    });
    const ask = (scope?: Record<string, string>) => permits({ actor: "a", action: "approve", scope }, p, one(p), g);
    expect(ask({ "cat-harness:process": "release" })).toBe("permit");
    expect(ask({ "cat-harness:process": "authoring" })).toBe("unknown");
    expect(ask()).toBe("unknown");
  });

  test("performing a task in a lane needs the lane's role as well as the permission", () => {
    const p = policy({ permission: [{ assignee: "a", action: "approve" }] });
    const ask = (roles: string[]) =>
      permits({ actor: "a", actorRoles: roles, action: "approve", scope: { "cat-harness:role": "reviewer" } }, p, one(p), g);
    expect(ask(["reviewer"])).toBe("permit");
    expect(ask(["author"])).toBe("deny");
    expect(ask([])).toBe("permit"); // no roles declared = unconstrained (ActorDef.roles)
  });

  test("permission and prohibition together: prohibit by default, perm when the policy says so, invalid voids", () => {
    const rules = {
      permission: [{ assignee: "a", action: "approve" }],
      prohibition: [{ assignee: "a", action: "approve" }],
    };
    const ask = (p: OdrlPolicy) => permits({ actor: "a", action: "approve" }, p, one(p), g);
    expect(ask(policy(rules))).toBe("deny");
    expect(ask(policy({ ...rules, conflict: "odrl:perm" }))).toBe("permit");
    expect(ask(policy({ ...rules, conflict: "odrl:invalid" }))).toBe("deny");
  });

  test("an includedIn cycle does not hang, and the graph need not have one root", () => {
    const cyc = actionGraph([
      { id: "x", includedIn: ["y"] },
      { id: "y", includedIn: ["x", "odrl:use"] },
    ]);
    expect([...broaderOrSelf("x", cyc)].sort()).toEqual(["odrl:use", "x", "y"]);
  });

  test("inheritFrom brings the parent's rules; a dangling one throws", () => {
    const parent = policy({ uid: "urn:parent", permission: [{ assignee: "a", action: "approve" }] });
    const child = policy({ uid: "urn:child", inheritFrom: ["urn:parent"] });
    const all = new Map([
      [parent.uid, parent],
      [child.uid, child],
    ]);
    expect(permits({ actor: "a", action: "approve" }, child, all, g)).toBe("permit");
    const orphan = policy({ uid: "urn:orphan", inheritFrom: ["urn:nowhere"] });
    expect(() => effectiveRules(orphan, one(orphan))).toThrow(/not declared/);
  });
});

describe("the schema refuses what it cannot mean", () => {
  const bad = (v: Record<string, unknown>) => OdrlPolicySchema.safeParse({
    "@context": "x", "@type": "Set", uid: "u", profile: "p", ...v,
  }).success;

  test("an unknown key on a rule is refused, not dropped", () => {
    expect(bad({ permission: [{ assignee: "a", action: "b", duty: [] }] })).toBe(false);
  });
  test("an Agreement names its assigner", () => {
    expect(bad({ "@type": "Agreement" })).toBe(false);
    expect(bad({ "@type": "Agreement", assigner: "org:x" })).toBe(true);
  });
  test("isAnyOf takes a list and eq takes one value", () => {
    const c = (operator: string, rightOperand: unknown) =>
      bad({ permission: [{ assignee: "a", action: "b", constraint: [{ leftOperand: "cat-harness:task", operator, rightOperand }] }] });
    expect(c("odrl:isAnyOf", "t")).toBe(false);
    expect(c("odrl:isAnyOf", ["t"])).toBe(true);
    expect(c("odrl:eq", ["t"])).toBe(false);
  });
  test("a scope outside Process, Task and Role is refused", () => {
    expect(bad({ permission: [{ assignee: "a", action: "b", constraint: [{ leftOperand: "odrl:spatial", operator: "odrl:eq", rightOperand: "x" }] }] })).toBe(false);
  });
});

describe("PROV-O activity", () => {
  const run = {
    "@type": "prov:Activity",
    "@id": "urn:run:1",
    "prov:startedAtTime": "2026-09-23T19:36:08Z",
    "prov:qualifiedAssociation": {
      "prov:agent": "authoring-agent",
      "prov:hadRole": "author",
      "prov:hadPlan": "content-lifecycle#Task_author",
    },
    "cat-harness:underPolicy": "https://litlfred.github.io/folio-assistant/policies/folio-defaults",
  };
  test("a task run parses", () => {
    expect(ProvActivitySchema.safeParse(run).success).toBe(true);
  });
  test("hadPlan must name a BPMN process and task", () => {
    const r = { ...run, "prov:qualifiedAssociation": { ...run["prov:qualifiedAssociation"], "prov:hadPlan": "author" } };
    expect(ProvActivitySchema.safeParse(r).success).toBe(false);
  });
  test("a run under no policy cannot be checked, so it is refused", () => {
    const { "cat-harness:underPolicy": _drop, ...r } = run;
    expect(ProvActivitySchema.safeParse(r).success).toBe(false);
  });
  test("it cannot end before it starts", () => {
    expect(ProvActivitySchema.safeParse({ ...run, "prov:endedAtTime": "2026-09-23T19:00:00Z" }).success).toBe(false);
  });
});
