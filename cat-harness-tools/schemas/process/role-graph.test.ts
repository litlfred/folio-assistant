/**
 * The joins in "an actor performs a task in a process as a role, using that
 * role's skills" — one test per join, plus the two compositions that are
 * deliberately NOT the same thing.
 */
import { readPolicyGrants } from "../content/odrl.ts";
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  readRoleGraph,
  actorsDir,
  capabilitiesDir,
  readActors,
  resolveRoleSkills,
  resolveRoleStack,
  roleForLane,
  laneRoleRef,
  laneBinding,
  isMechanicalRole,
  audienceProblem,
  readPermissions,
  findRole,
  toJsonLd,
  ROLE_GRAPH_DIR,
  ROLE_GRAPH_FILENAME,
  ACTOR_KINDS,
  JUDGEMENT_KINDS,
  MECHANICAL_KINDS,
  fulfilmentKindsForBpmnType,
  type RoleGraph,
} from "./role-graph";

import { requireHarnessRoot } from "../harness-root.ts";
function withKg(graph: unknown): string {
  const root = mkdtempSync(join(tmpdir(), "role-graph-"));
  mkdirSync(join(root, ROLE_GRAPH_DIR), { recursive: true });
  writeFileSync(join(root, ROLE_GRAPH_DIR, ROLE_GRAPH_FILENAME), JSON.stringify(graph));
  return root;
}

const base = {
  name: "t",
  roles: [
    { id: "viewer", title: "Viewer", description: "reads", actorKinds: ["person"], skills: ["read"] },
    {
      id: "reviewer",
      title: "Reviewer",
      description: "judges",
      actorKinds: ["person"],
      skills: ["review"],
      inherits: ["viewer"],
    },
    {
      id: "editor",
      title: "Editor",
      description: "decides",
      actorKinds: ["person"],
      skills: ["commit"],
      inherits: ["reviewer"],
    },
  ],
};

/** The minimal valid role, spread by the fixtures that vary one key. */
const ROLE_A = { id: "a", title: "A", description: "s", actorKinds: ["person"], skills: [] };

describe("readRoleGraph", () => {
  test("absent declaration is undefined, not an error", () => {
    const root = mkdtempSync(join(tmpdir(), "role-graph-"));
    expect(readRoleGraph(root)).toBeUndefined();
    rmSync(root, { recursive: true, force: true });
  });

  test("a declaration nobody can parse throws rather than reading as empty", () => {
    const root = mkdtempSync(join(tmpdir(), "role-graph-"));
    mkdirSync(join(root, ROLE_GRAPH_DIR), { recursive: true });
    writeFileSync(join(root, ROLE_GRAPH_DIR, ROLE_GRAPH_FILENAME), "{ not json");
    expect(() => readRoleGraph(root)).toThrow(/not valid JSON/);
    rmSync(root, { recursive: true, force: true });
  });

  test("a dangling `inherits` is refused at read, so no closure is silently short", () => {
    const root = withKg({
      name: "t",
      roles: [{ id: "a", title: "A", description: "s", actorKinds: ["person"], skills: [], inherits: ["ghost"] }],
    });
    expect(() => readRoleGraph(root)).toThrow(/inherits "ghost"/);
    rmSync(root, { recursive: true, force: true });
  });

  test("a role carrying `voice` or `useCases` is refused — each points at the role now (#1168)", () => {
    for (const key of ["voice", "useCases"]) {
      const root = withKg({ name: "t", roles: [{ ...ROLE_A, [key]: key === "voice" ? "Plain." : ["x"] }] });
      expect(() => readRoleGraph(root)).toThrow(new RegExp(`${key}|not a valid role graph`));
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("an unknown key on a ROLE is refused, not stripped", () => {
    // Bean `ghx3`. A plain `z.object` drops what it does not recognise, so a
    // field an author wrote parses, type-checks, and reaches no graph — bean
    // `zdrf`'s class, of which the `persona`/`voice`/`useCases` comment on
    // the schema was only the half already known.
    //
    // It is not hypothetical. `role-model.md` said to write a `summary` —
    // not a field, since `title`/`description` are the two labels every kg
    // node carries — and PR #453 gave all three bootstrap roles one.
    const root = withKg({
      name: "t",
      roles: [{ ...ROLE_A, summary: "a field that does not exist" }],
    });
    expect(() => readRoleGraph(root)).toThrow(/summary|not a valid role graph/);
    rmSync(root, { recursive: true, force: true });
  });

  test("a `_`-prefixed documentation key is legal, on a role and above it", () => {
    // What makes `.strict()` affordable: there is a spelling for a key MEANT
    // not to be read. The convention is established rather than invented for
    // this test — `_comment` in this graph, `_comment`/`_title` in
    // harness.json, `_lanes_comment` in bootstrap's graph.
    const root = withKg({
      _comment: "why this graph exists",
      _lanes_comment: "why no lanes",
      name: "t",
      roles: [{ ...ROLE_A, _comment: "why this role exists" }],
    });
    const g = readRoleGraph(root);
    expect(g?.roles.map((r) => r.id)).toEqual(["a"]);
    // Stripped from the parsed value, not carried through as data.
    expect((g?.roles[0] as unknown as Record<string, unknown>)._comment).toBeUndefined();
    rmSync(root, { recursive: true, force: true });
  });

  test("a duplicate role id is refused", () => {
    const root = withKg({
      name: "t",
      roles: [
        { id: "a", title: "A", description: "s", actorKinds: ["person"], skills: [] },
        { id: "a", title: "A2", description: "s", actorKinds: ["person"], skills: [] },
      ],
    });
    expect(() => readRoleGraph(root)).toThrow(/declared twice/);
    rmSync(root, { recursive: true, force: true });
  });

  test("an inheritance cycle is refused rather than defended against at call sites", () => {
    const root = withKg({
      name: "t",
      roles: [
        { id: "a", title: "A", description: "s", actorKinds: ["person"], skills: [], inherits: ["b"] },
        { id: "b", title: "B", description: "s", actorKinds: ["person"], skills: [], inherits: ["a"] },
      ],
    });
    expect(() => readRoleGraph(root)).toThrow(/cycle/);
    rmSync(root, { recursive: true, force: true });
  });

  test("an unknown actorKind is rejected, not accepted and ignored", () => {
    const root = withKg({
      name: "t",
      roles: [{ id: "a", title: "A", description: "s", actorKinds: ["wizard"], skills: [] }],
    });
    expect(() => readRoleGraph(root)).toThrow();
    rmSync(root, { recursive: true, force: true });
  });
});

describe("resolveRoleSkills", () => {
  const g = base as unknown as RoleGraph;

  test("closes over `inherits` transitively", () => {
    expect(resolveRoleSkills(g, "editor").map((s) => s.skill)).toEqual(["commit", "read", "review"]);
  });

  test("reports which role supplied each skill, nearest ancestor first", () => {
    const via = Object.fromEntries(resolveRoleSkills(g, "editor").map((s) => [s.skill, s.via]));
    expect(via).toEqual({ commit: "editor", review: "reviewer", read: "viewer" });
  });

  test("an unknown role resolves to nothing rather than throwing", () => {
    expect(resolveRoleSkills(g, "ghost")).toEqual([]);
  });
});

describe("resolveRoleStack — subprocess composition is NOT inheritance", () => {
  const g = base as unknown as RoleGraph;

  test("an actor descending into a subprocess keeps the outer role's skills", () => {
    const stack = resolveRoleStack(g, ["editor", "viewer"]);
    expect(stack.skills.map((s) => s.skill)).toEqual(["commit", "read", "review"]);
  });

  test("the inner role does not permanently acquire the caller's skills", () => {
    resolveRoleStack(g, ["editor", "viewer"]);
    // `viewer` on its own is unchanged — the union was scoped to the call.
    expect(resolveRoleSkills(g, "viewer").map((s) => s.skill)).toEqual(["read"]);
  });

  test("an unresolvable role in the path is kept and flagged, not dropped", () => {
    const stack = resolveRoleStack(g, ["editor", "ghost"]);
    expect(stack.unresolved).toEqual(["ghost"]);
    expect(stack.path).toEqual(["editor", "ghost"]);
  });
});

describe("roleForLane", () => {
  const g = base as unknown as RoleGraph;

  test("a lane's name alone binds nothing: roles list no lanes (#1168)", () => {
    expect(roleForLane(g, "Reviewer")).toBeUndefined();
  });

  test("the lane's explicit role ref is what binds it", () => {
    expect(roleForLane(g, "Review Committee", "editor")?.id).toBe("editor");
  });

  test("an explicit ref naming no role resolves to nothing — it is not silently name-matched", () => {
    expect(roleForLane(g, "Review Committee", "ghost")).toBeUndefined();
  });

  test("an unbound lane name is undefined, which is the finding the audit reports", () => {
    expect(roleForLane(g, "Some New Lane")).toBeUndefined();
  });
});

describe("laneRoleRef — a lane names its Role by partitionElementRef (owner, 2026-10-16)", () => {
  test("partitionElementRef, resolved by moddle to the <bpmn:resource>, is the role id", () => {
    const r = laneRoleRef({ id: "L", partitionElementRef: { $type: "bpmn:Resource", id: "build-pipeline" } });
    expect(r).toEqual({ ref: "build-pipeline", source: "partitionElementRef", performerVaries: false });
  });

  test("an unresolved partitionElementRef id string reads the same", () => {
    expect(laneRoleRef({ partitionElementRef: "editor" }).ref).toBe("editor");
  });

  test("the legacy <bootstrap.processes:role ref> is still read, with a warning", () => {
    const r = laneRoleRef({ id: "L", extensionElements: { values: [{ $type: "bootstrap.processes:role", ref: "editor" }] } });
    expect(r.ref).toBe("editor");
    expect(r.source).toBe("legacy-role-ref");
    expect(r.warning).toContain("deprecated");
  });

  test("the legacy element is matched by local name, whatever prefix the reader registered", () => {
    expect(laneRoleRef({ extensionElements: { values: [{ $type: "folio:role", ref: "editor" }] } }).source).toBe("legacy-role-ref");
  });

  test("partitionElementRef wins over a disagreeing legacy ref, and says so", () => {
    const r = laneRoleRef({
      partitionElementRef: "editor",
      extensionElements: { values: [{ $type: "folio:role", ref: "reviewer" }] },
    });
    expect(r.ref).toBe("editor");
    expect(r.warning).toContain("partitionElementRef wins");
  });

  test("variable=\"true\" is a declaration, not a legacy binding", () => {
    const r = laneRoleRef({ extensionElements: { values: [{ $type: "bootstrap.processes:role", variable: "true" }] } });
    expect(r).toEqual({ source: "none", performerVaries: true });
  });

  test("feeds laneBinding unchanged", () => {
    const g = base as unknown as RoleGraph;
    const r = laneRoleRef({ partitionElementRef: "editor" });
    expect(laneBinding(g, { roleRef: r.ref, performerVaries: r.performerVaries }).kind).toBe("bound");
  });
});

describe("mechanical roles are real roles (owner, 2026-10-16)", () => {
  const g = readRoleGraph(join(requireHarnessRoot(), "scenarios"))!;

  test("no role carries the retired `actedUpon`; a layer still carrying it loads, with the flag dropped", () => {
    expect(g.roles.some((r) => "actedUpon" in r)).toBe(false);
    const dir = mkdtempSync(join(tmpdir(), "roles-"));
    writeFileSync(
      join(dir, "roles.json"),
      JSON.stringify({ name: "t", roles: [{ id: "c", title: "C", description: "a store", actorKinds: ["system"], skills: ["s"], actedUpon: true }] }),
    );
    const read = readRoleGraph(dir)!;
    expect(read.roles.map((r) => r.id)).toEqual(["c"]);
    expect("actedUpon" in read.roles[0]!).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });

  test("every mechanical role carries at least one skill — its contract", () => {
    const empty = g.roles.filter((r) => isMechanicalRole(r) && r.skills.length === 0).map((r) => r.id);
    expect(empty).toEqual([]);
  });

  test("a mechanical role is not an audience; a performed one is", () => {
    expect(audienceProblem(g, "corpus")).toContain("mechanical");
    expect(audienceProblem(g, "author")).toBeUndefined();
  });
});

describe("readActors", () => {
  test("maps the legacy `type` field and flags entries that are really roles", () => {
    const dir = mkdtempSync(join(tmpdir(), "actors-"));
    writeFileSync(join(dir, "a.json"), JSON.stringify({ id: "a", title: "A", type: "person", inherits: ["b"] }));
    writeFileSync(join(dir, "b.json"), JSON.stringify({ id: "b", title: "B", type: "system" }));
    const actors = readActors(dir);
    expect(actors.map((a) => a.kind)).toEqual(["person", "system"]);
    expect(actors.map((a) => a.looksLikeRole)).toEqual([true, false]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("an absent directory is empty, not an error", () => {
    expect(readActors(join(tmpdir(), "no-such-actors-dir"))).toEqual([]);
  });
});

describe("this repository's own role graph", () => {
  const g = readRoleGraph(join(requireHarnessRoot(), "scenarios"));

  test("is declared and loads", () => {
    expect(g).toBeDefined();
  });

  test("every role's summary says what the position is, not just its name", () => {
    for (const r of g!.roles) expect(r.description.length).toBeGreaterThan(20);
  });

  test("findRole and toJsonLd agree on the declared set", () => {
    expect(findRole(g!, "author")?.title).toBe("Author");
    const ld = toJsonLd(g!) as { roles: { "@id": string }[] };
    expect(ld.roles.length).toBe(g!.roles.length);
    expect(ld.roles[0]!["@id"]).toBe("#user");
  });
});

describe("this repository's actor registry, after the roles[] migration", () => {
  const actors = readActors(actorsDir(join(import.meta.dir, "..", "..", ".."))!);
  const g = readRoleGraph(join(requireHarnessRoot(), "scenarios"))!;

  test("no entry still carries the deprecated `inherits`", () => {
    expect(actors.filter((a) => a.looksLikeRole).map((a) => a.id)).toEqual([]);
  });

  test("every role an actor lists is declared", () => {
    const declared = new Set(g.roles.map((r) => r.id));
    const bad = actors.flatMap((a) => (a.roles ?? []).filter((r) => !declared.has(r)).map((r) => `${a.id}→${r}`));
    expect(bad).toEqual([]);
  });

  test("every role has an actor who can take it on, but for the known mechanical gaps", () => {
    // Until 2026-10-16 these six were `actedUpon` and exempt. A mechanical
    // role is a real role now (owner, 2026-10-16), so "what plays the corpus"
    // is a fair question — and nothing in `scenarios/actors/` answers it yet.
    // `role-has-actor` reports each one; this list makes a NEW gap fail here
    // rather than join them unnoticed. Shrink it as actors are declared.
    const KNOWN = ["corpus", "external-registry", "log", "publish-target", "session-record", "work-plan"];
    const covered = new Set(actors.flatMap((a) => a.roles ?? []));
    const uncovered = g.roles.filter((r) => !covered.has(r.id)).map((r) => r.id).sort();
    expect(uncovered).toEqual(KNOWN);
  });

  test("`roles: []` is kept distinct from an absent `roles`", () => {
    // `viewer` is the read-only identity that never appears in a swimlane. It
    // must say so with an empty list, not by omitting the field — omitting it
    // asserts nothing, which is a different claim.
    const viewer = actors.find((a) => a.id === "viewer");
    expect(viewer?.roles).toEqual([]);
  });
});

describe("permissions are an actor property, not a role property", () => {
  const kg = join(requireHarnessRoot(), "skills");
  const actorsDirPath = actorsDir(join(import.meta.dir, "..", "..", ".."))!;

  test("the vocabulary is declared and every id is unique", () => {
    const v = readPermissions(kg);
    expect(v).toBeDefined();
    expect(new Set(v!.permissions.map((p) => p.id)).size).toBe(v!.permissions.length);
  });

  test("every permission an actor claims is declared", () => {
    const declared = new Set((readPermissions(kg)?.permissions ?? []).map((p) => p.id));
    const bad = readActors(actorsDirPath).flatMap((a) =>
      (a.permissions ?? []).filter((p) => !declared.has(p)).map((p) => `${a.id}→${p}`),
    );
    expect(bad).toEqual([]);
  });

  test("`capabilities[]` now holds probes only — no permission and no skill leaked back in", async () => {
    const { readdirSync } = await import("node:fs");
    const probes = new Set(
      readdirSync(capabilitiesDir(join(import.meta.dir, "..", "..", ".."))!).map((f: string) =>
        f.replace(/\.json$/, ""),
      ),
    );
    const bad = readActors(actorsDirPath).flatMap((a) =>
      (a.capabilities ?? []).filter((c) => !probes.has(c)).map((c) => `${a.id}→${c}`),
    );
    expect(bad).toEqual([]);
  });

  test("a permission genuinely cross-cuts roles — which is why it cannot live on Role", () => {
    // This is the measurement that falsified the obvious design. If a future
    // change makes every permission role-uniform, revisit the model; until
    // then, moving them to Role reintroduces the 36 conflicts. The grants are
    // read from the ODRL policies since issue #1180; the measurement is the same.
    const actors = readActors(actorsDirPath, readPolicyGrants(join(requireHarnessRoot(), "policies")));
    const rolesOf = (perm: string) =>
      new Set(actors.filter((a) => (a.permissions ?? []).includes(perm)).flatMap((a) => a.roles ?? []));
    expect(rolesOf("content-authoring").size).toBeGreaterThan(1);
    expect(rolesOf("qa-reporting").size).toBeGreaterThan(1);
  });

  test("an unparseable vocabulary throws rather than reading as empty", () => {
    const root = mkdtempSync(join(tmpdir(), "perms-"));
    mkdirSync(join(root, "permissions"), { recursive: true });
    writeFileSync(join(root, "permissions", "permissions.json"), "{ not json");
    expect(() => readPermissions(root)).toThrow(/not valid JSON/);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("the actor kind is three-way: human, agentic, mechanical", () => {
  const actorsDirPath = actorsDir(join(import.meta.dir, "..", "..", ".."))!;

  function withActor(entry: unknown): string {
    const dir = mkdtempSync(join(tmpdir(), "actors-"));
    writeFileSync(join(dir, "a.json"), JSON.stringify(entry));
    return dir;
  }

  test("agentic and mechanical are distinguishable in this repository's registry", () => {
    // The measurement the split exists for. Before it every non-person actor
    // read `system`, so the agentic set was EMPTY and "can this actor be
    // handed a judgement" had no answer for eight of twenty-four entries.
    const actors = readActors(actorsDirPath);
    const by = (k: string) => actors.filter((a) => a.kind === k).map((a) => a.id).sort();
    expect(by("agent").length).toBeGreaterThan(0);
    // Named rather than counted: a bare count in a test is a claim that goes
    // stale silently. These are mechanical for reasons stated in their own
    // descriptions — a fixed program with nothing to decide.
    //
    // `ci-health-watcher` arrived from a sibling branch while this split was
    // being written, carrying the legacy `type` field, and this assertion is
    // what caught it: the naming is the point. A count would have absorbed a
    // new actor silently, and the legacy field would have reached the
    // registry schema, which — unlike `readActors` — has no fallback. Its own
    // description settles the classification: "a mechanical participant … it
    // runs a fixed program and exercises no judgement".
    // `attestation-service` (bean `folio-assistant-r0rq`) is mechanical for
    // the same reason: it holds a key and signs what it is given. The lane
    // that exercises judgement about whether a report SHOULD be signed is the
    // human one, and the two are separate lanes precisely so that is visible.
    // `board-renderer` is mechanical for the same reason and is deliberately
    // NOT `ci-pipeline`: it runs where the reader is, once per click, and
    // publishes nothing. Folding a reader-facing renderer into the build
    // actor would put a person's click behind a build.
    // `local-sweep` (bean `a58y`) is the same QA sweep programs as
    // `ci-pipeline`, run on a contributor's machine — mechanical by the same
    // test, and a SEPARATE actor for a reason that is not bookkeeping: a CI
    // verdict is reproducible from the `reviewed_sha` it records, while a
    // local one may rest on an uncommitted edit, so the same sha addresses a
    // tree that produced something else. Folding the two together would make
    // `reviewed_sha` a decoration rather than an address.
    // `crdm-detect-signals` (bean `folio-assistant-ff09`) is the phrase-signal
    // detector declared as a system under test for dogfood plan #1: a fixed
    // function from issue text to a classification, nothing to decide.
    expect(by("system")).toEqual([
      "attestation-service", "board-renderer", "ci-health-watcher", "ci-pipeline",
      "crdm-detect-signals", "local-sweep",
    ]);
  });

  test("an unrecognised `kind` throws rather than being coerced", () => {
    // Coercing it would quietly disqualify the actor from every judgement task
    // it exists to perform, and nothing downstream would report it.
    const dir = withActor({ id: "x", title: "X", kind: "robot" });
    expect(() => readActors(dir)).toThrow(/not an actor kind/);
    rmSync(dir, { recursive: true, force: true });
  });

  test("a legacy `type` still loads, and is never read as agentic", () => {
    // An unmigrated downstream registry must keep working. It has not said
    // whether its non-person actors exercise judgement, so they are read as
    // mechanical — the reading that REFUSES a judgement task rather than
    // granting one on a guess. The id below ends in `-agent` on purpose.
    const dir = withActor({ id: "some-agent", title: "S", type: "system" });
    expect(readActors(dir)[0]!.kind).toBe("system");
    rmSync(dir, { recursive: true, force: true });
    const p = withActor({ id: "p", title: "P", type: "person" });
    expect(readActors(p)[0]!.kind).toBe("person");
    rmSync(p, { recursive: true, force: true });
  });
});

describe("which actor kinds may fulfil an activity", () => {
  test("BPMN's own semantics are read, not restated", () => {
    // A userTask is "performed by a human being"; a serviceTask runs without
    // one. Both answers come from the spec, which is why no diagram has to
    // declare them and why the criterion covers the corpus on day one.
    expect(fulfilmentKindsForBpmnType("bpmn:UserTask")).toEqual(["person"]);
    expect(fulfilmentKindsForBpmnType("bpmn:ServiceTask")).toEqual(["agent", "system"]);
  });

  test("an abstract task and a call activity assert NOTHING, which is not allowing nothing", () => {
    // `undefined`, never `[]`. An empty list would read as "no kind may
    // perform this" and fail every activity drawn as a plain task — the third
    // state this repository insists on, in the place it is easiest to lose.
    expect(fulfilmentKindsForBpmnType("bpmn:Task")).toBeUndefined();
    expect(fulfilmentKindsForBpmnType("bpmn:CallActivity")).toBeUndefined();
  });

  test("the judgement kinds are derived from the vocabulary, not written out again", () => {
    // So a kind added to ACTOR_KINDS cannot go unclassified — the rule
    // DOCUMENT_BLOCK_KINDS follows against BLOCK_KINDS.
    expect([...JUDGEMENT_KINDS, ...MECHANICAL_KINDS].every((k) => ACTOR_KINDS.includes(k))).toBe(true);
    expect(JUDGEMENT_KINDS).toEqual(["person", "agent"]);
    expect(MECHANICAL_KINDS).toEqual(["system"]);
  });
});

describe("readRoleGraph — a role inherits a role of an instance it needs", () => {
  /** A directory of sibling instances, each with a declaration and a role graph at the conventional `scenarios/`. */
  function instances(defs: { name: string; needs?: string[]; roles: unknown[] }[]): string {
    const repo = mkdtempSync(join(tmpdir(), "role-graph-needs-"));
    for (const d of defs) {
      const root = join(repo, d.name);
      mkdirSync(join(root, "scenarios"), { recursive: true });
      writeFileSync(
        join(root, `${d.name}.json`),
        JSON.stringify({
          name: d.name,
          ...(d.needs ? { needs: d.needs } : {}),
        }),
      );
      writeFileSync(join(root, "scenarios", ROLE_GRAPH_FILENAME), JSON.stringify({ name: d.name, roles: d.roles }));
    }
    return repo;
  }
  const role = (id: string, inherits?: string[]) => ({
    id,
    title: id,
    description: "s",
    actorKinds: ["person"],
    skills: [],
    ...(inherits ? { inherits } : {}),
  });

  test("through `needs`, transitively, with no `lower` passed by the caller", () => {
    const repo = instances([
      { name: "base", roles: [role("reviewer")] },
      { name: "mid", needs: ["base"], roles: [] },
      { name: "top", needs: ["mid"], roles: [role("checker", ["reviewer"])] },
    ]);
    try {
      expect(readRoleGraph(join(repo, "top", "scenarios"))?.roles.map((r) => r.id)).toEqual(["checker"]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test("never from an instance it does not need — a sibling or a dependent stays refused", () => {
    const repo = instances([
      { name: "base", roles: [role("reviewer")] },
      { name: "side", roles: [role("auditor")] },
      { name: "top", needs: ["base"], roles: [role("checker", ["auditor"])] },
    ]);
    try {
      expect(() => readRoleGraph(join(repo, "top", "scenarios"))).toThrow(/inherits "auditor", which is not declared/);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});
