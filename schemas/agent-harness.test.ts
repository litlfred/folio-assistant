/**
 * Tests for the AgentHarness root declaration — issue #223, Phase 0.3.
 *
 * The shape under test: an instance declares the directories it scans and the
 * graph kind each holds, and a downstream instance INHERITS its dependencies'
 * directories without restating them.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { registerFolioGraphKind } from "./folio-graph-kind";
import {
  BASE_GRAPH_KINDS,
  defaultGraphKinds,
  GraphKindRegistry,
  GraphKindConflictError,
  DECLARATION_FILENAME,
  isRenderable,
  readDeclaration,
  renderableDirectories,
  resolveDirectories,
  toJsonLd,
} from "./agent-harness";

const TMP = join(import.meta.dir, "__test_agent_harness__");
const HARNESS = join(TMP, "agentic-harness");
const CORE = join(TMP, "folio-assist-core");
const RELOCATED = join(TMP, "relocated");
const BROKEN = join(TMP, "broken");

beforeAll(() => {
  mkdirSync(HARNESS, { recursive: true });
  writeFileSync(
    join(HARNESS, DECLARATION_FILENAME),
    JSON.stringify({
      name: "agentic-harness",
      directories: [
        { id: "tools", path: "tools/", graph: "tools" },
        { id: "kg", path: "kg/", graph: "kg" },
        { id: "schemas", path: "schemas/", graph: "schemas" },
      ],
    }),
    "utf-8",
  );

  // core declares ONLY folio/ — the other three are inherited.
  mkdirSync(CORE, { recursive: true });
  writeFileSync(
    join(CORE, DECLARATION_FILENAME),
    JSON.stringify({ name: "folio-assist-core", directories: [{ id: "folio", path: "folio/", graph: "folio" }] }),
    "utf-8",
  );

  // An instance that moves its knowledge graph somewhere else.
  mkdirSync(RELOCATED, { recursive: true });
  writeFileSync(
    join(RELOCATED, DECLARATION_FILENAME),
    JSON.stringify({ name: "relocated", directories: [{ id: "kg", path: "graph/knowledge/", graph: "kg" }] }),
    "utf-8",
  );

  mkdirSync(BROKEN, { recursive: true });
  writeFileSync(join(BROKEN, DECLARATION_FILENAME), "{ not json", "utf-8");
});

afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("reading a declaration", () => {
  it("reads directories and their graph kinds", () => {
    const d = readDeclaration(HARNESS)!;
    expect(d.name).toBe("agentic-harness");
    expect(d.directories.map((x) => x.id).sort()).toEqual(["kg", "schemas", "tools"]);
  });

  it("an absent declaration is undefined, not an error", () => {
    // An instance not yet migrated is ordinary; callers fall back to today's
    // conventions rather than failing.
    expect(readDeclaration(join(TMP, "no-such-instance"))).toBeUndefined();
  });

  it("a present but unreadable declaration throws", () => {
    // Worse than absent: every consumer would scan the wrong directories.
    expect(() => readDeclaration(BROKEN)).toThrow(/not valid JSON/);
  });

  it("rejects an unknown graph kind rather than accepting it", () => {
    const bad = join(TMP, "bad-kind");
    mkdirSync(bad, { recursive: true });
    writeFileSync(
      join(bad, DECLARATION_FILENAME),
      JSON.stringify({ name: "x", directories: [{ id: "a", path: "a/", graph: "wishful" }] }),
      "utf-8",
    );
    // The message must name the offending kind AND what is known, so the
    // author can see whether they typo'd or forgot to register a dependency's
    // contribution — those need different fixes.
    let err: unknown;
    try {
      readDeclaration(bad);
    } catch (e) {
      err = e;
    }
    expect((err as Error).message).toContain('unknown graph kind "wishful"');
    expect((err as Error).message).toContain("Known kinds:");
    expect((err as Error).message).toContain("tools");
  });

  it("accepts the JSON-LD projection as input, not just the authored form", () => {
    const ld = join(TMP, "ld");
    mkdirSync(ld, { recursive: true });
    writeFileSync(join(ld, DECLARATION_FILENAME), JSON.stringify(toJsonLd(readDeclaration(HARNESS)!)), "utf-8");
    const back = readDeclaration(ld)!;
    expect(back.directories.map((d) => d.id).sort()).toEqual(["kg", "schemas", "tools"]);
    expect(back.directories.find((d) => d.id === "kg")!.graph).toBe("kg");
  });
});

describe("inheritance — the Phase 0.3 gate", () => {
  it("core scans its own folio/ AND the three it inherits from the harness", () => {
    const dirs = resolveDirectories([
      { name: "agentic-harness", root: HARNESS },
      { name: "folio-assist-core", root: CORE, own: true },
    ]);
    expect(dirs.map((d) => d.id).sort()).toEqual(["folio", "kg", "schemas", "tools"]);

    const folio = dirs.find((d) => d.id === "folio")!;
    expect(folio.own).toBe(true);
    expect(folio.declaredBy).toBe("folio-assist-core");

    const tools = dirs.find((d) => d.id === "tools")!;
    expect(tools.own).toBe(false);
    expect(tools.declaredBy).toBe("agentic-harness");
    // Inherited paths resolve against the instance that DECLARED them.
    expect(tools.absPath).toBe(join(HARNESS, "tools"));
  });

  it("an instance with no folio/ is ordinary — agentic-harness is exactly that", () => {
    const dirs = resolveDirectories([{ name: "agentic-harness", root: HARNESS, own: true }]);
    expect(renderableDirectories(dirs)).toEqual([]);
    expect(dirs).toHaveLength(3);
  });

  it("overriding matches on id, not path — a relocation replaces, never duplicates", () => {
    // Matching on path would make two knowledge graphs out of one move, and
    // every consumer would scan a directory that is not there.
    const dirs = resolveDirectories([
      { name: "agentic-harness", root: HARNESS },
      { name: "relocated", root: RELOCATED, own: true },
    ]);
    const kg = dirs.filter((d) => d.id === "kg");
    expect(kg).toHaveLength(1);
    expect(kg[0]!.path).toBe("graph/knowledge/");
    expect(kg[0]!.declaredBy).toBe("relocated");
  });

  it("an override keeps the inherited position rather than reshuffling the scan order", () => {
    const dirs = resolveDirectories([
      { name: "agentic-harness", root: HARNESS },
      { name: "relocated", root: RELOCATED, own: true },
    ]);
    expect(dirs.map((d) => d.id)).toEqual(["tools", "kg", "schemas"]);
  });

  it("a chain of instances with no declarations resolves to nothing, not an error", () => {
    expect(resolveDirectories([{ name: "bare", root: join(TMP, "nope"), own: true }])).toEqual([]);
  });
});

describe("layering", () => {
  it("does not import the content vocabulary", () => {
    // The property, pinned structurally rather than by a drift guard: this is
    // a HARNESS-layer module, and `schemas/jsonld.ts` is folio-assist-core's
    // content vocabulary (block kinds, DoCO types, SPAR citation terms).
    // Importing it would make agentic-harness depend on the content model for
    // its own type IRIs — a harness -> core edge, already the largest
    // wrong-direction group, and the coupling the split exists to undo.
    // The namespace comes from the leaf `./namespaces` instead.
    const src = readFileSync(join(import.meta.dir, "agent-harness.ts"), "utf-8");
    expect(src).not.toMatch(/from "\.\/jsonld"/);
    expect(src).not.toMatch(/from "\.\/block-kinds"/);
    expect(src).toMatch(/from "\.\/namespaces"/);
  });
});

describe("graph kinds — the harness declares five, core adds folio", () => {
  it("the harness's own vocabulary contains no renderable kind", () => {
    // The whole point of the re-siting: agent-harness is NOT self-documenting,
    // so a layer that cannot render must not own the renderable kind.
    expect(Object.keys(BASE_GRAPH_KINDS).sort()).toEqual([
      "kg",
      "process-state",
      "schemas",
      "tools",
      "workplan",
    ]);
    for (const def of Object.values(BASE_GRAPH_KINDS)) {
      expect(def.renderable).toBe(false);
    }
  });

  it("a bare harness registry does not know `folio` at all", () => {
    // Not merely "documented as core's" — genuinely absent. A declaration
    // naming it against a bare registry is refused.
    const bare = new GraphKindRegistry();
    expect(bare.has("folio")).toBe(false);
    expect(bare.names().sort()).toEqual(["kg", "process-state", "schemas", "tools", "workplan"]);
  });

  it("core's registration adds it, and it is the renderable one", () => {
    const reg = new GraphKindRegistry();
    registerFolioGraphKind(reg);
    expect(reg.has("folio")).toBe(true);
    expect(isRenderable("folio", reg)).toBe(true);
    for (const k of ["tools", "kg", "schemas", "workplan", "process-state"]) {
      expect(isRenderable(k, reg)).toBe(false);
    }
  });

  it("importing core registers folio into the shared registry", () => {
    // folio-graph-kind.ts registers on import; this file imports it.
    expect(defaultGraphKinds.has("folio")).toBe(true);
  });

  it("registering the same kind twice is a no-op — a diamond is not a conflict", () => {
    const reg = new GraphKindRegistry();
    registerFolioGraphKind(reg);
    expect(() => registerFolioGraphKind(reg)).not.toThrow();
  });

  it("registering a DIFFERENT definition under one name throws", () => {
    const reg = new GraphKindRegistry();
    registerFolioGraphKind(reg);
    expect(() => reg.register("folio", { type: "urn:other", renderable: false, summary: "x" }))
      .toThrow(GraphKindConflictError);
  });

  it("every registered kind projects to a distinct @type", () => {
    const names = defaultGraphKinds.names();
    const types = names.map((n) => defaultGraphKinds.get(n)!.type);
    expect(new Set(types).size).toBe(names.length);
  });
});
