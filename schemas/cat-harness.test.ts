/**
 * Tests for the CatHarness root declaration — issue #223, Phase 0.3.
 *
 * The shape under test: an instance declares the directories it scans and the
 * graph kind each holds, and a downstream instance INHERITS its dependencies'
 * directories without restating them.
 */
import { describe, it, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
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
  keepMarker,
  materialiseDirectories,
  renderableDirectories,
  resolveDirectories,
  resolveGraphKind,
  toJsonLd,
  type ResolvedDirectory,
} from "./cat-harness";

const TMP = join(import.meta.dir, "__test_agent_harness__");
const REPO_ROOT = resolve(import.meta.dir, "..");
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
        { id: "tools", path: "tools/", graphs: ["tools"] },
        { id: "kg", path: "kg/", graphs: ["kg"] },
        { id: "schemas", path: "schemas/", graphs: ["schemas"] },
      ],
    }),
    "utf-8",
  );

  // core declares ONLY folio/ — the other three are inherited.
  mkdirSync(CORE, { recursive: true });
  writeFileSync(
    join(CORE, DECLARATION_FILENAME),
    JSON.stringify({ name: "folio-assist-core", directories: [{ id: "folio", path: "folio/", graphs: ["folio"] }] }),
    "utf-8",
  );

  // An instance that moves its knowledge graph somewhere else.
  mkdirSync(RELOCATED, { recursive: true });
  writeFileSync(
    join(RELOCATED, DECLARATION_FILENAME),
    JSON.stringify({ name: "relocated", directories: [{ id: "kg", path: "graph/knowledge/", graphs: ["kg"] }] }),
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
      JSON.stringify({ name: "x", directories: [{ id: "a", path: "a/", graphs: ["wishful"] }] }),
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
    // The fixture declares `id: "kg"` with `graphs: ["kg"]`, the pre-rename
    // spelling.
    //
    // **The id survives and the kind CANONICALISES**, and the asymmetry is
    // right. An id is the instance's own handle — `AGENTS.md` requires it to
    // be stable across a relocation — so a projection must hand it back
    // unchanged. A graph KIND is projected as its type IRI, and the IRI is
    // the identity: `kg` and `cat-harness` are two spellings of
    // `fa:KnowledgeGraph`, of which only one is current. Reading the
    // projection back resolves the IRI to the current name.
    //
    // That makes project-and-read-back a MIGRATION PATH for a downstream
    // declaration written against the old vocabulary, rather than a way to
    // lose information.
    expect(back.directories.map((d) => d.id).sort()).toEqual(["kg", "schemas", "tools"]);
    expect(back.directories.find((d) => d.id === "kg")!.graphs).toEqual(["cat-harness"]);
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
    const src = readFileSync(join(import.meta.dir, "cat-harness.ts"), "utf-8");
    expect(src).not.toMatch(/from "\.\/jsonld"/);
    expect(src).not.toMatch(/from "\.\/block-kinds"/);
    expect(src).toMatch(/from "\.\/namespaces"/);
  });
});

describe("graph kinds — the harness declares twelve, core adds folio", () => {
  it("the harness's own vocabulary contains no renderable kind", () => {
    // The whole point of the re-siting: cat-harness is NOT self-documenting,
    // so a layer that cannot render must not own the renderable kind.
    expect(Object.keys(BASE_GRAPH_KINDS).sort()).toEqual([
      "bean-defs",
      "beans",
      // Renamed from `kg` on 2026-09-19: named for the LAYER that defines it,
      // like every other harness concept. `kg` still READS, as a deprecated
      // alias — see the alias test below.
      "cat-harness",
      // The two stages of the ingestion pipeline, declared separately because
      // they are not interchangeable: the corpus checklist greps `library/`
      // and not `uploads/`.
      "library",
      "schemas",
      // The todo graph: human actors' outstanding work. NOT a second work
      // plan — `beans` is the agent work plan — but the harness owns the KIND
      // while a folio owns the directory, exactly as with `beans`.
      "todo-feedback",
      "todo-items",
      "todos",
      "tools",
      "uploads",
      "voices",
      "workflow-state",
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
    expect(bare.names().sort()).toEqual([
      "bean-defs", "beans", "cat-harness", "library", "schemas",
      "todo-feedback", "todo-items", "todos",
      "tools", "uploads", "voices", "workflow-state",
    ]);
  });

  it("core's registration adds it, and it is the renderable one", () => {
    const reg = new GraphKindRegistry();
    registerFolioGraphKind(reg);
    expect(reg.has("folio")).toBe(true);
    expect(isRenderable("folio", reg)).toBe(true);
    for (const k of ["tools", "cat-harness", "schemas", "beans", "bean-defs", "workflow-state"]) {
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

// ── Materialisation (bean `4q5x`) ────────────────────────────────

describe("materialiseDirectories", () => {
  function tmpRoot(): string {
    return mkdtempSync(join(tmpdir(), "materialise-"));
  }
  const resolved = (
    id: string,
    path: string,
    extra: Partial<ResolvedDirectory> = {},
  ): ResolvedDirectory => ({
    id,
    path,
    graphs: ["kg"],
    declaredBy: "test",
    absPath: path,
    own: true,
    ...extra,
  });

  test("creates a declared directory that does not exist", () => {
    const root = tmpRoot();
    const out = materialiseDirectories([resolved("library", "library/")], root);
    expect(existsSync(join(root, "library"))).toBe(true);
    expect(out[0]!.created).toBe(true);
  });

  test("is a no-op on the second run", () => {
    const root = tmpRoot();
    const dirs = [resolved("library", "library/")];
    materialiseDirectories(dirs, root);
    const again = materialiseDirectories(dirs, root);
    expect(again[0]!.created).toBe(false);
    expect(again[0]!.markerWritten).toBe(false);
  });

  test("never overwrites an existing keep-marker — a folio may have added rules", () => {
    const root = tmpRoot();
    const dirs = [resolved("uploads", "uploads/")];
    materialiseDirectories(dirs, root);
    const marker = join(root, "uploads", ".gitignore");
    writeFileSync(marker, "*.tmp\n");
    materialiseDirectories(dirs, root);
    expect(readFileSync(marker, "utf-8")).toBe("*.tmp\n");
  });

  test("writes no marker into a directory that already holds files", () => {
    const root = tmpRoot();
    mkdirSync(join(root, "skills"), { recursive: true });
    writeFileSync(join(root, "skills", "a-skill.md"), "# skill\n");
    const out = materialiseDirectories([resolved("kg", "skills/")], root);
    expect(out[0]!.markerWritten).toBe(false);
    expect(existsSync(join(root, "skills", ".gitignore"))).toBe(false);
  });

  test("the keep-marker ignores nothing — only comments", () => {
    // Ignoring uploads/ would reproduce the defect the two-stage pipeline
    // exists to prevent, and library/ is corpus that must stay greppable.
    const body = keepMarker({ id: "uploads", description: "the incoming queue" });
    const rules = body
      .split("\n")
      .filter((l) => l.trim() !== "" && !l.startsWith("#"));
    expect(rules).toEqual([]);
    expect(body).toContain("do not delete me");
    expect(body).toContain("the incoming queue");
  });

  test("RESOLVES AGAINST THE INSTANCE, not the declaring dependency", () => {
    // The inherited case: a dependency declares `library/` and its `absPath`
    // points into the dependency's own checkout. Writing there would be the
    // equivalent of creating folders inside node_modules.
    const root = tmpRoot();
    const depCheckout = tmpRoot();
    const out = materialiseDirectories(
      [
        resolved("library", "library/", {
          declaredBy: "folio-assist-core",
          own: false,
          absPath: join(depCheckout, "library"),
        }),
      ],
      root,
    );
    expect(out[0]!.absPath).toBe(join(root, "library"));
    expect(existsSync(join(root, "library"))).toBe(true);
    expect(existsSync(join(depCheckout, "library"))).toBe(false);
  });

  test("refuses a path that escapes the instance root", () => {
    const root = tmpRoot();
    expect(() =>
      materialiseDirectories([resolved("escape", "../elsewhere/")], root),
    ).toThrow(/outside the instance/);
  });

  test("--dry-run reports without creating", () => {
    const root = tmpRoot();
    const out = materialiseDirectories([resolved("library", "library/")], root, {
      dryRun: true,
    });
    expect(out[0]!.created).toBe(true);
    expect(existsSync(join(root, "library"))).toBe(false);
  });

  test("this instance declares uploads and library", () => {
    // The declaration half of the bean: without these two entries the
    // materialiser has nothing to create, and the ingestion pipeline's two
    // stages stay described in prose and declared nowhere.
    const ids = resolveDirectories([
      { name: "folio-assistant", root: REPO_ROOT, own: true },
    ]).map((d) => d.id);
    expect(ids).toContain("uploads");
    expect(ids).toContain("library");
  });
});

describe("the `kg` → `cat-harness` rename keeps old declarations working", () => {
  /**
   * The rename is a CROSS-INSTANCE breaking change, and the alias is what
   * makes it survivable.
   *
   * `AGENTS.md`: overrides match on the entry's `id`, not its `path`, because
   * "matching on path makes two knowledge graphs out of one relocation, and
   * every consumer then scans a directory that is not there". The same
   * property makes renaming an id dangerous in the other direction — a
   * downstream instance overriding `kg` overrides nothing once the kind is
   * called something else, and the failure is SILENT: it scans, finds
   * nothing, reports a clean run. That is the `dh4f` shape, delivered to
   * somebody else's repository.
   */
  it("a registry resolves the deprecated spelling to the new kind", () => {
    const reg = new GraphKindRegistry();
    expect(reg.has("kg")).toBe(true);
    expect(reg.get("kg")).toBe(reg.get("cat-harness"));
    // And it is an alias, not a second entry: `names()` lists what EXISTS.
    expect(reg.names()).toContain("cat-harness");
    expect(reg.names()).not.toContain("kg");
  });

  it("resolveGraphKind says WHICH spelling was used, so a caller can warn", () => {
    // The deprecation has to be reportable. An alias that resolves silently
    // is an alias nobody ever removes.
    expect(resolveGraphKind("kg")).toEqual({ kind: "cat-harness", deprecated: "kg" });
    expect(resolveGraphKind("cat-harness")).toEqual({ kind: "cat-harness" });
    expect(resolveGraphKind("tools")).toEqual({ kind: "tools" });
  });

  it("a declaration written against the OLD vocabulary still loads", () => {
    // The migration guarantee, end to end: this is verbatim what a downstream
    // instance's `cat-harness.json` looked like before the rename.
    const old = join(TMP, "old-vocabulary");
    mkdirSync(join(old, "skills"), { recursive: true });
    writeFileSync(
      join(old, DECLARATION_FILENAME),
      JSON.stringify({ name: "downstream", directories: [{ id: "kg", path: "skills/", graphs: ["kg"] }] }),
      "utf-8",
    );
    const d = readDeclaration(old);
    expect(d).toBeDefined();
    expect(d!.directories[0]!.graphs).toEqual(["kg"]);
  });
});
