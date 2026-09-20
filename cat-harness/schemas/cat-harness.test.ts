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
  defaultGraphKinds,
  GraphKindRegistry,
  graphLayer,
  isContentGraph,
  isContextGraph,
  isStateGraph,
  processMayWrite,
  graphKindsOfLayer,
  BASE_GRAPH_KINDS,
  GraphKindConflictError,
  DECLARATION_FILENAME,
  isRenderable,
  readDeclaration,
  keepMarker,
  materialiseDirectories,
  renderableDirectories,
  DEFAULT_DIRECTORIES,
  resolveDirectories,
  resolveGraphKind,
  toJsonLd,
  type ResolvedDirectory,
  CatHarnessDeclarationSchema
} from "./cat-harness";

const TMP = join(import.meta.dir, "__test_agent_harness__");
const REPO_ROOT = resolve(import.meta.dir, "..");
const HARNESS = join(TMP, "agentic-harness");
/** This repository itself — the instance that declares all seven. */
const ROOT = resolve(import.meta.dir, "..");
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

describe("graph kinds — the harness declares its own, core adds folio", () => {
  it("the harness owns exactly one renderable kind — the one it can serve", () => {
    // The whole point of the re-siting: cat-harness is NOT self-documenting,
    // so a layer that cannot render must not own the renderable kind.
    //
    // This ENUMERATED all sixteen until 2026-09-20, which asserted a roster
    // the test's own name does not claim — so adding `memory` broke it, on the
    // change that was correct, and the failure said "the list differs" rather
    // than "something renderable appeared". Same pinned-count antipattern this
    // repo keeps paying for, one level along: a list nothing derives it from.
    const renderable = Object.entries(BASE_GRAPH_KINDS)
      .filter(([, def]) => def.renderable)
      .map(([name]) => name);
    // `docs` was added 2026-09-20 and IS renderable, which is why this is no
    // longer empty. The rule the empty list stood for was "a layer that cannot
    // render must not own the renderable kind"; the harness now ships a plain
    // just-the-docs renderer, so the rule reads in its true form — A LAYER OWNS
    // THE KINDS IT CAN RENDER — and `docs` is the one it can serve.
    expect(renderable).toEqual(["docs"]);
    // `folio` is STILL genuinely not here, and that is the same rule applied
    // rather than an exception to it: it needs block viewers, LaTeX, QA badges
    // and translation overlays, none of which the harness has.
    expect(Object.keys(BASE_GRAPH_KINDS)).not.toContain("folio");
  });

  it("a bare harness registry does not know `folio` at all", () => {
    // Not merely "documented as core's" — genuinely absent. A declaration
    // naming it against a bare registry is refused.
    const bare = new GraphKindRegistry();
    expect(bare.has("folio")).toBe(false);
    expect(bare.get("folio")).toBeUndefined();
    // A bare registry is exactly the harness's own vocabulary and nothing
    // more. Derived rather than listed, for the reason above.
    expect(bare.names().sort()).toEqual(Object.keys(BASE_GRAPH_KINDS).sort());
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
    expect(() => reg.register("folio", { type: "urn:other", renderable: false, holds: "content", summary: "x" }))
      .toThrow(GraphKindConflictError);
  });

  it("every registered kind says what a process does with it", () => {
    // `tsc` enforces this for a kind written as a literal; this catches one
    // built dynamically, where the type is erased. A kind that has not said is
    // the `dh4f` shape on a new axis: every consumer asking for content is
    // handed it, and reports a clean run.
    for (const name of defaultGraphKinds.names()) {
      expect([name, graphLayer(name)]).toEqual([name, expect.stringMatching(/^(content|context|state)$/)]);
    }
  });

  it("the predicates are not each other's negations", () => {
    // An unregistered kind has not said `content` — it has not said anything.
    // Collapsing that is how somebody asking for a skill is handed a QA
    // verdict.
    expect(graphLayer("not-a-kind")).toBeUndefined();
    expect(isContentGraph("not-a-kind")).toBe(false);
    expect(isContextGraph("not-a-kind")).toBe(false);
    expect(isStateGraph("not-a-kind")).toBe(false);
    expect(processMayWrite("not-a-kind")).toBe(false);
    // ...and `context` is not a flavour of `state`. `isStateGraph` answered
    // for every non-content kind until `context` landed, so a caller asking
    // "may a step write this" got `true` for a memory entry.
    expect(isStateGraph("memory")).toBe(false);
    expect(isContextGraph("memory")).toBe(true);
  });

  it("the three layers partition the registry and none is empty", () => {
    // No pinned counts: the property is that every kind lands on exactly one
    // layer. A count would break on the change that was correct — which is
    // what the two roster assertions above did when `memory` arrived.
    const layers = (["content", "context", "state"] as const).map((l) => graphKindsOfLayer(l));
    expect(layers.flat().length).toBe(defaultGraphKinds.names().length);
    expect(new Set(layers.flat()).size).toBe(layers.flat().length);
    for (const l of layers) expect(l.length).toBeGreaterThan(0);
  });

  it("only `state` is writable by a running step", () => {
    // The property `context` exists for. A step writing to a context graph is
    // a defect, and this is what lets a consumer ask.
    for (const name of defaultGraphKinds.names()) {
      expect([name, processMayWrite(name)]).toEqual([name, graphLayer(name) === "state"]);
    }
  });

  it("the classification of the kinds a reader would guess wrong is pinned", () => {
    // Named individually rather than counted, so a failure says WHICH moved.
    // Reasoning: skills/folio-core/content-context-and-state-graphs.md.
    expect({
      // Read during a process, never written by one. The owner's ruling on
      // bean `mhh9`, 2026-09-20 — and the kind the third layer exists for.
      memory: graphLayer("memory"),
      // Its mirror in the todos/ 2x2, and the axis cuts ACROSS that row: a
      // todo is an outstanding item a process CLOSES.
      todos: graphLayer("todos"),
      // Renderable in principle and withheld on purpose, and nothing mid-
      // process writes it — relocating something there is a human-directed
      // act. `state` for a few hours until `mhh9` was settled.
      "fsh-guts": graphLayer("fsh-guts"),
      // A verdict is where a REVIEW got to, and the sweep writes it.
      qa: graphLayer("qa"),
      // The same shape about the repository rather than its artefacts.
      health: graphLayer("health"),
      // A QUEUE that ingestion drains. Same file, different layer from
      // `library`, which is what ingestion produced.
      uploads: graphLayer("uploads"),
      library: graphLayer("library"),
    }).toEqual({
      memory: "context",
      todos: "state",
      "fsh-guts": "context",
      qa: "state",
      health: "state",
      uploads: "state",
      library: "content",
    });
  });

  it("a diamond differing only in `holds` is a CONFLICT, not a no-op", () => {
    // REGRESSION GUARD for the hole the axis opened. `register`'s diamond
    // check compared `type` and `renderable` only, so two layers registering
    // one name on opposite sides of the line would have passed and the first
    // would silently have won — the "one name, two answers" failure the
    // registry throws to prevent, reintroduced by the field added to end it.
    const reg = new GraphKindRegistry();
    const def = { type: "urn:probe", renderable: false, holds: "content", summary: "x" } as const;
    reg.register("probe", def);
    expect(() => reg.register("probe", def)).not.toThrow();
    expect(() => reg.register("probe", { ...def, holds: "state" })).toThrow(GraphKindConflictError);
    // ...while prose differing is still a diamond: `summary` is descriptive.
    expect(() => reg.register("probe", { ...def, summary: "worded differently" })).not.toThrow();
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
    // instance's `harness.json` looked like before the rename.
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

describe("default directories — inherit the convention, declare only the deviation", () => {
  /**
   * The owner, 2026-09-19: "inherit, set default dirs/graphs in container
   * schema definitions." An instance that follows the convention should
   * declare NOTHING; before this, every instance restated the same seven
   * entries, which is seven chances to disagree with the platform about what
   * `beans/` is.
   */
  const inst = join(TMP, "defaults-instance");

  it("an instance declaring nothing inherits the directories it actually has", () => {
    mkdirSync(join(inst, "skills"), { recursive: true });
    mkdirSync(join(inst, "beans"), { recursive: true });
    mkdirSync(join(inst, "tools"), { recursive: true });
    writeFileSync(join(inst, DECLARATION_FILENAME), JSON.stringify({ name: "minimal" }), "utf-8");

    const d = resolveDirectories([{ name: "minimal", root: inst, own: true }]);
    expect(d.map((x) => x.id).sort()).toEqual(["beans", "cat-harness", "tools"]);
    // `(default)` rather than the instance's name: a consumer can tell an
    // inherited convention from something this instance chose.
    expect(d.every((x) => x.declaredBy === "(default)")).toBe(true);
    expect(d.find((x) => x.id === "cat-harness")!.path).toBe("skills/");
  });

  it("a default whose directory is ABSENT is not seeded", () => {
    // The `dh4f` defect, and the reason defaults are existence-filtered:
    // "a declared-but-absent directory is where a consumer scans nothing and
    // reports a clean run over it". Seeding `voices/` into an instance with no
    // voices would manufacture that in every instance at once.
    const d = resolveDirectories([{ name: "minimal", root: inst, own: true }]);
    for (const absent of ["voices", "library", "uploads", "todos", "schemas"]) {
      expect(d.find((x) => x.id === absent)).toBeUndefined();
      expect(existsSync(join(inst, absent))).toBe(false);
    }
  });

  it("an explicit entry overrides the default of the same id", () => {
    // Defaults are the OUTERMOST link of the chain, not a special case: the
    // same override-by-id rule that lets a dependent relocate an inherited
    // directory lets an instance relocate a defaulted one.
    const moved = join(TMP, "defaults-override");
    mkdirSync(join(moved, "graph", "knowledge"), { recursive: true });
    mkdirSync(join(moved, "tools"), { recursive: true });
    writeFileSync(
      join(moved, DECLARATION_FILENAME),
      JSON.stringify({
        name: "relocated",
        directories: [{ id: "cat-harness", path: "graph/knowledge/", graphs: ["cat-harness"] }],
      }),
      "utf-8",
    );
    const d = resolveDirectories([{ name: "relocated", root: moved, own: true }]);
    expect(d.find((x) => x.id === "cat-harness")!.path).toBe("graph/knowledge/");
    expect(d.find((x) => x.id === "cat-harness")!.declaredBy).toBe("relocated");
    // ...and the defaults it did NOT override are still there.
    expect(d.find((x) => x.id === "tools")!.declaredBy).toBe("(default)");
  });

  it("an instance that declares everything is unaffected", () => {
    // This repository declares all seven. Nothing should read `(default)`,
    // because nothing was left to the convention — the defaults must not
    // quietly replace an explicit declaration.
    const mine = resolveDirectories([{ name: "folio-assistant", root: ROOT, own: true }]);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((x) => x.declaredBy === "folio-assistant")).toBe(true);
  });

  it("no default claims a kind the harness registry does not know", () => {
    // `folio` is CORE's and is registered at load; the harness cannot default
    // a directory to a kind it has never heard of, or `readDeclaration` would
    // refuse its own defaults.
    const bare = new GraphKindRegistry();
    for (const d of DEFAULT_DIRECTORIES) {
      for (const g of d.graphs) expect(bare.has(g)).toBe(true);
    }
  });
});

describe("the scope trap", () => {
  it("refuses to materialise an empty twin beside a directory that has content", () => {
    // REGRESSION, 2026-09-20, and the defect was mine. `scope` is optional and
    // its ABSENCE is meaningful — the path resolves against the instance
    // rather than the repository. Omitting it on an entry that meant
    // `repository` made the declaration name a different directory, and
    // `materialiseDirectories` then CREATED that directory with a keep
    // marker: declared-but-absent became declared-and-empty, which is the
    // `dh4f` false pass manufactured by the tool written to prevent it. It
    // stood for about an hour with every gate green.
    const repo = mkdtempSync(join(tmpdir(), "scope-trap-"));
    const instance = join(repo, "inst");
    mkdirSync(join(repo, "shared"), { recursive: true });
    writeFileSync(join(repo, "shared", "real.json"), "{}", "utf-8");
    mkdirSync(instance, { recursive: true });
    try {
      // The content is at the REPOSITORY root; the entry omits `scope`.
      const dirs = [
        { id: "shared", path: "shared/", graphs: ["beans"], declaredBy: "(t)", absPath: "", own: true },
      ] as unknown as Parameters<typeof materialiseDirectories>[0];
      expect(() => materialiseDirectories(dirs, instance)).toThrow(/scope/);
      // ...and it did not create the twin on the way to throwing.
      expect(existsSync(join(instance, "shared"))).toBe(false);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("materialises normally when there is no twin to be confused with", () => {
    // The guard must not fire on the ordinary case, or it becomes the thing
    // somebody turns off.
    const repo = mkdtempSync(join(tmpdir(), "scope-ok-"));
    const instance = join(repo, "inst");
    mkdirSync(instance, { recursive: true });
    try {
      const dirs = [
        { id: "own", path: "own/", graphs: ["beans"], declaredBy: "(t)", absPath: "", own: true },
      ] as unknown as Parameters<typeof materialiseDirectories>[0];
      const out = materialiseDirectories(dirs, instance);
      expect(out[0]?.created).toBe(true);
      expect(existsSync(join(instance, "own"))).toBe(true);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe("remote graphs — a graph this instance knows about and does not hold", () => {
  const decl = (extra: Record<string, unknown>) => ({
    name: "x",
    directories: [{ id: "kg", path: "skills/", graphs: ["cat-harness"] }],
    ...extra,
  });

  it("round-trips a declared remote graph", () => {
    const d = CatHarnessDeclarationSchema.parse(
      decl({ remoteGraphs: [{ id: "sci", url: "https://example.org/folio-asst-sci.jsonld", graphs: ["cat-harness"] }] }),
    );
    expect(d.remoteGraphs).toHaveLength(1);
    expect(d.remoteGraphs[0]!.url).toBe("https://example.org/folio-asst-sci.jsonld");
  });

  it("defaults to none, so an instance that declares no remote graph has an empty list rather than undefined", () => {
    expect(CatHarnessDeclarationSchema.parse(decl({})).remoteGraphs).toEqual([]);
  });

  it("refuses a remote graph with no url — the whole point is that it says where", () => {
    expect(
      CatHarnessDeclarationSchema.safeParse(decl({ remoteGraphs: [{ id: "sci", graphs: ["cat-harness"] }] })).success,
    ).toBe(false);
  });

  it("refuses a path on a remote graph — a remote graph is NOT a directory", () => {
    // The first cut modelled this as `ContentDirectory` with an optional
    // `path`. That loosened `bean-graph.ts` and `todo-graph.ts`, which reuse
    // ContentDirectorySchema for their own nodes and are never remote, and the
    // compiler said so in twenty-four errors. A remote graph has no directory.
    expect(
      CatHarnessDeclarationSchema.safeParse(
        decl({ remoteGraphs: [{ id: "sci", url: "https://example.org/x.jsonld", path: "sci/", graphs: ["cat-harness"] }] }),
      ).success,
    ).toBe(false);
  });

  it("a ContentDirectory still REQUIRES a path — the loosening was reverted", () => {
    expect(
      CatHarnessDeclarationSchema.safeParse({ name: "x", directories: [{ id: "kg", graphs: ["cat-harness"] }] }).success,
    ).toBe(false);
  });
});
