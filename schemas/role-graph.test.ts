/**
 * The joins in "an actor performs a task in a process as a role, using that
 * role's skills" — one test per join, plus the two compositions that are
 * deliberately NOT the same thing.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  readRoleGraph,
  readActors,
  resolveRoleSkills,
  resolveRoleStack,
  roleForLane,
  boundLaneNames,
  findRole,
  toJsonLd,
  ROLE_GRAPH_DIR,
  ROLE_GRAPH_FILENAME,
  type RoleGraph,
} from "./role-graph";

function withKg(graph: unknown): string {
  const root = mkdtempSync(join(tmpdir(), "role-graph-"));
  mkdirSync(join(root, ROLE_GRAPH_DIR), { recursive: true });
  writeFileSync(join(root, ROLE_GRAPH_DIR, ROLE_GRAPH_FILENAME), JSON.stringify(graph));
  return root;
}

const base = {
  name: "t",
  roles: [
    { id: "viewer", name: "Viewer", summary: "reads", actorKind: "person", lanes: ["Viewer"], skills: ["read"] },
    {
      id: "reviewer",
      name: "Reviewer",
      summary: "judges",
      actorKind: "person",
      lanes: ["Reviewer / SME", "Review Committee"],
      skills: ["review"],
      inherits: ["viewer"],
    },
    {
      id: "editor",
      name: "Editor",
      summary: "decides",
      actorKind: "person",
      lanes: ["Editor"],
      skills: ["commit"],
      inherits: ["reviewer"],
    },
  ],
};

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
      roles: [{ id: "a", name: "A", summary: "s", actorKind: "person", lanes: [], skills: [], inherits: ["ghost"] }],
    });
    expect(() => readRoleGraph(root)).toThrow(/inherits "ghost"/);
    rmSync(root, { recursive: true, force: true });
  });

  test("a duplicate role id is refused", () => {
    const root = withKg({
      name: "t",
      roles: [
        { id: "a", name: "A", summary: "s", actorKind: "person", lanes: [], skills: [] },
        { id: "a", name: "A2", summary: "s", actorKind: "person", lanes: [], skills: [] },
      ],
    });
    expect(() => readRoleGraph(root)).toThrow(/declared twice/);
    rmSync(root, { recursive: true, force: true });
  });

  test("an inheritance cycle is refused rather than defended against at call sites", () => {
    const root = withKg({
      name: "t",
      roles: [
        { id: "a", name: "A", summary: "s", actorKind: "person", lanes: [], skills: [], inherits: ["b"] },
        { id: "b", name: "B", summary: "s", actorKind: "person", lanes: [], skills: [], inherits: ["a"] },
      ],
    });
    expect(() => readRoleGraph(root)).toThrow(/cycle/);
    rmSync(root, { recursive: true, force: true });
  });

  test("an unknown actorKind is rejected, not accepted and ignored", () => {
    const root = withKg({
      name: "t",
      roles: [{ id: "a", name: "A", summary: "s", actorKind: "wizard", lanes: [], skills: [] }],
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

  test("matches a lane by its exact free-text name", () => {
    expect(roleForLane(g, "Review Committee")?.id).toBe("reviewer");
  });

  test("an explicit <folio:role ref> wins over name matching", () => {
    expect(roleForLane(g, "Review Committee", "editor")?.id).toBe("editor");
  });

  test("an explicit ref naming no role resolves to nothing — it is not silently name-matched", () => {
    expect(roleForLane(g, "Review Committee", "ghost")).toBeUndefined();
  });

  test("an unbound lane name is undefined, which is the finding the audit reports", () => {
    expect(roleForLane(g, "Some New Lane")).toBeUndefined();
  });

  test("boundLaneNames is the denominator for lane coverage", () => {
    expect(boundLaneNames(g).size).toBe(4);
  });
});

describe("readActors", () => {
  test("maps the legacy `type` field and flags entries that are really roles", () => {
    const dir = mkdtempSync(join(tmpdir(), "actors-"));
    writeFileSync(join(dir, "a.json"), JSON.stringify({ id: "a", name: "A", type: "person", inherits: ["b"] }));
    writeFileSync(join(dir, "b.json"), JSON.stringify({ id: "b", name: "B", type: "system" }));
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
  const g = readRoleGraph(join(import.meta.dir, "..", "skills"));

  test("is declared and loads", () => {
    expect(g).toBeDefined();
  });

  test("every role's summary says what the position is, not just its name", () => {
    for (const r of g!.roles) expect(r.summary.length).toBeGreaterThan(20);
  });

  test("findRole and toJsonLd agree on the declared set", () => {
    expect(findRole(g!, "author")?.name).toBe("Author");
    const ld = toJsonLd(g!) as { roles: { "@id": string }[] };
    expect(ld.roles.length).toBe(g!.roles.length);
    expect(ld.roles[0]!["@id"]).toBe("#user");
  });
});
