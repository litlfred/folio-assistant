/**
 * Tests for the CatHarness root declaration — issue #223, Phase 0.3.
 *
 * The shape under test: an instance declares the directories it scans and the
 * graph kind each holds, and a downstream instance INHERITS its dependencies'
 * directories without restating them.
 */
import { describe, it, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import { registerFolioGraphKind } from "./folio-graph-kind";
import { THEMES } from "./themes";
import { BEAN_GRAPH_FILE } from "./bean-graph";
import { TODO_GRAPH_FILE } from "./todo-graph";
import { defaultGraphKinds, GraphKindRegistry, graphLayer, isContentGraph, isContextGraph, isStateGraph, processMayWrite, graphKindsOfLayer, BASE_GRAPH_KINDS, GraphKindConflictError, isRenderable, readDeclaration, keepMarker, materialiseDirectories, renderableDirectories, DEFAULT_DIRECTORIES, declaredKinds, directoryForGraph, directoriesForGraph, resolveDirectories, resolveGraphKind, ContentDirectorySchema, GraphNodeDirectorySchema, instanceRootsIn, toJsonLd, type ResolvedDirectory } from "./cat-harness";
import { writeDeclaration } from "../test/support/instance-fixture.js";

const TMP = join(import.meta.dir, "__test_agent_harness__");
const INSTANCE_ROOT = resolve(import.meta.dir, "..");
const HARNESS = join(TMP, "agentic-harness");
/** This repository itself — the instance that declares all seven. */
const ROOT = resolve(import.meta.dir, "..");
const CORE = join(TMP, "folio-assist-core");
const RELOCATED = join(TMP, "relocated");
const BROKEN = join(TMP, "broken");

beforeAll(() => {
  mkdirSync(HARNESS, { recursive: true });
  writeDeclaration(HARNESS, JSON.stringify({
      name: "agentic-harness",
      directories: [
        { id: "tools", path: "tools/", dependents: "reproduce", graphKinds: ["tools"] },
        { id: "kg", path: "kg/", dependents: "reproduce", graphKinds: ["kg"] },
        { id: "schemas", path: "schemas/", dependents: "reproduce", graphKinds: ["schemas"] },
      ],
    }));

  // core declares ONLY folio/ — the other three are inherited.
  mkdirSync(CORE, { recursive: true });
  writeDeclaration(CORE, JSON.stringify({ name: "folio-assist-core", directories: [{ id: "folio", path: "folio/", dependents: "reproduce", graphKinds: ["folio"] }] }));

  // An instance that moves its knowledge graph somewhere else.
  mkdirSync(RELOCATED, { recursive: true });
  writeDeclaration(RELOCATED, JSON.stringify({ name: "relocated", directories: [{ id: "kg", path: "graph/knowledge/", dependents: "reproduce", graphKinds: ["kg"] }] }));

  mkdirSync(BROKEN, { recursive: true });
  writeDeclaration(BROKEN, "{ not json", "broken");
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

  it("names the entries missing `dependents`, rather than dumping the Zod error", () => {
    // THE REAL CASE, reproduced. `dependents` is required, so a branch that
    // adds a directory entry without knowing the field exists produces a
    // declaration that will not parse once the two meet. Main added
    // `methodology-crdm` and `methodology-raci` while the field was in review,
    // and CI on the merged tree reported 166 failures and 35 errors whose only
    // visible cause was a raw Zod dump repeated across every test that reads a
    // declaration. Nothing was wrong with either side.
    const bad = join(TMP, "missing-dependents");
    mkdirSync(bad, { recursive: true });
    writeDeclaration(bad, JSON.stringify({
        name: "x",
        directories: [
          { id: "uploads", path: "uploads/", dependents: "reproduce", graphKinds: ["uploads"] },
          { id: "methodology-raci", path: "methodologies/raci/", graphKinds: ["cat-harness"] },
          { id: "methodology-crdm", path: "methodologies/crdm/", graphKinds: ["cat-harness"] },
        ],
      }));
    let err: unknown;
    try {
      readDeclaration(bad);
    } catch (e) {
      err = e;
    }
    const msg = (err as Error).message;
    // It must name WHICH entries — the author's next action is editing those
    // two lines, and a count alone does not point at them.
    const named = msg.split("\n")[0]!;
    expect(named).toContain("methodology-raci");
    expect(named).toContain("methodology-crdm");
    // ...and NOT the entry that is fine, or the reader edits the wrong line.
    // Scoped to the first line on purpose: the guidance below it cites
    // `uploads/` as an EXAMPLE of a `reproduce` directory, so asserting over
    // the whole message would be asserting against the help text.
    expect(named).not.toContain("uploads");
    // Both values, because the whole difficulty is knowing which to write.
    expect(msg).toContain('"dependents": "reproduce"');
    expect(msg).toContain('"dependents": "skip"');
  });

  it("rejects an unknown graph kind rather than accepting it", () => {
    const bad = join(TMP, "bad-kind");
    mkdirSync(bad, { recursive: true });
    writeDeclaration(bad, JSON.stringify({ name: "x", directories: [{ id: "a", path: "a/", dependents: "reproduce", graphKinds: ["wishful"] }] }));
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
    writeDeclaration(ld, JSON.stringify(toJsonLd(readDeclaration(HARNESS)!)));
    const back = readDeclaration(ld)!;
    // The fixture declares `id: "kg"` with `graphKinds: ["kg"]`, the pre-rename
    // spelling.
    //
    // **The id survives and the kind CANONICALISES**, and the asymmetry is
    // right. An id is the instance's own handle — `AGENTS.md` requires it to
    // be stable across a relocation — so a projection must hand it back
    // unchanged. A graph KIND is projected as its type IRI, and the IRI is
    // the identity: `kg` and `cat-harness` are two spellings of
    // `cat:KGraph`, of which only one is current. Reading the
    // projection back resolves the IRI to the current name.
    //
    // That makes project-and-read-back a MIGRATION PATH for a downstream
    // declaration written against the old vocabulary, rather than a way to
    // lose information.
    expect(back.directories.map((d) => d.id).sort()).toEqual(["kg", "schemas", "tools"]);
    expect(back.directories.find((d) => d.id === "kg")!.graphKinds).toEqual(["cat-harness"]);
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
      expect([name, graphLayer(name)]).toEqual([name, expect.stringMatching(/^(content|context|state|derived)$/)]);
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

  it("the four layers partition the registry and none is empty", () => {
    // No pinned counts: the property is that every kind lands on exactly one
    // layer. A count would break on the change that was correct — which is
    // what the two roster assertions above did when `memory` arrived, and
    // again when `derived` did (bean `hqku`).
    //
    // The ARITY is still pinned, deliberately: adding a layer must be a
    // deliberate edit here, not something a registry change does quietly.
    const layers = (["content", "context", "state", "derived"] as const).map((l) => graphKindsOfLayer(l));
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
      // `library`, which is what ingestion produced — and the two are STILL
      // different after `library` moved to `derived` (bean `hqku`): a queue is
      // live state a step drains, a library section is a produced artefact
      // nobody edits in place.
      uploads: graphLayer("uploads"),
      // `content` until 2026-09-20. The owner's ruling: *"library is static
      // (only if we materialize assets or not)"*, *"can duplicate asset into a
      // folio and work there"* — so a sweep must skip it, and a QA finding
      // against a section belongs to the ingestion that produced it.
      //
      // NOT `context`, and that was eliminated by a rule: `context` means a
      // step writing to it is a defect, and `document-ingestion.bpmn` writes
      // `library/`.
      library: graphLayer("library"),
    }).toEqual({
      memory: "context",
      todos: "state",
      "fsh-guts": "context",
      qa: "state",
      health: "state",
      uploads: "state",
      library: "derived",
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
    graphKinds: ["kg"],
    // The fixture default. A case that is ABOUT `dependents` overrides it
    // through `extra`; every other case should not have to mention it.
    dependents: "reproduce",
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

  describe("`dependents` decides what an INHERITED entry does here", () => {
    // The whole point, and both directions are needed: a test that only checks
    // the `skip` case passes equally well for a change that materialises
    // nothing at all.
    test("an inherited `skip` entry is not created", () => {
      const root = tmpRoot();
      const out = materialiseDirectories(
        [resolved("schemas", "schemas/", { own: false, dependents: "skip" })],
        root,
      );
      expect(existsSync(join(root, "schemas"))).toBe(false);
      expect(out).toEqual([]);
    });

    test("an inherited `reproduce` entry IS created", () => {
      const root = tmpRoot();
      const out = materialiseDirectories(
        [resolved("uploads", "uploads/", { own: false, dependents: "reproduce" })],
        root,
      );
      expect(existsSync(join(root, "uploads"))).toBe(true);
      expect(out[0]!.created).toBe(true);
    });

    test("an instance's OWN `skip` entry is still created — it declared it", () => {
      // `dependents` says what a DEPENDENT does, never what the declaring
      // instance does about its own directory. Without this, marking
      // `schemas/` as `skip` would stop the platform creating its own.
      const root = tmpRoot();
      const out = materialiseDirectories(
        [resolved("schemas", "schemas/", { own: true, dependents: "skip" })],
        root,
      );
      expect(existsSync(join(root, "schemas"))).toBe(true);
      expect(out[0]!.created).toBe(true);
    });

    test("a `skip` entry is still RESOLVED — only materialisation is suppressed", () => {
      // The overlay reads a dependency's skills through the resolved list, so
      // suppressing resolution instead of creation would break `skill_fetch`
      // to fix a directory-creation problem.
      const dirs = [
        resolved("schemas", "schemas/", { own: false, dependents: "skip" }),
        resolved("uploads", "uploads/", { own: false, dependents: "reproduce" }),
      ];
      expect(dirs.map((d) => d.id)).toEqual(["schemas", "uploads"]);
      expect(materialiseDirectories(dirs, tmpRoot()).map((m) => m.id)).toEqual(["uploads"]);
    });
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

  test("this instance declares uploads, and reaches a library", () => {
    // The declaration half of the bean: without an entry at each end the
    // materialiser has nothing to create, and the ingestion pipeline's two
    // stages stay described in prose and declared nowhere.
    //
    // The two ends are no longer symmetric. `uploads` is still the platform's
    // own — the queue is where a file arrives before anything knows what it
    // is, and that is a platform concern. `library` is NOT: bean `frs5` moved
    // the corpus into `who-iris/` and `folio-assistant-sci/`, and the platform's
    // own `library` entry was REMOVED rather than left pointing at an emptied
    // directory, which is the `dh4f` defect.
    //
    // So this asserts on the GRAPH rather than on an id. An id is a name
    // somebody chose; the graph is what the pipeline needs to find, and it
    // keeps being found however many instances declare one or whatever they
    // call their entries.
    const dirs = resolveDirectories([{ name: "folio-assistant", root: INSTANCE_ROOT, own: true }]);
    expect(dirs.map((d) => d.id)).toContain("uploads");
    const libraries = dirs.filter((d) => d.graphKinds.includes("library"));
    expect(libraries.length, "no library graph reachable from the platform root").toBeGreaterThan(0);

    // SEVERAL, and that is the assertion. The platform declares `library` and
    // HOLDS NOTHING IN IT: bean `frs5` moved all four entries out, and the
    // entry came back on the owner's 2026-09-20 ruling because `wwi6` pins
    // the guarantee that a DEPENDENT folio materialises its own `uploads/`
    // and `library/`, which it gets by inheriting the convention the harness
    // declares. Remove it and every downstream folio silently loses a library.
    //
    // This asserted `not.toContain("library")` for a few hours — the platform
    // owning no content, stated as a rule. The rule is not wrong; the entry
    // is no longer a claim about what this instance HOLDS. What replaces it is
    // the check that the corpus is reachable and is NOT here: at least two
    // libraries resolve, and the platform's own is not one of the two that
    // carry documents.
    const ids = libraries.map((d) => d.id);
    expect(ids).toContain("library");
    expect(libraries.length).toBeGreaterThan(1);
    // The platform's own library EXISTS and is EMPTY. It was absent for a few
    // hours between `frs5` and the owner's ruling; `harness:dirs:check`
    // reports a declared-but-missing directory, so re-declaring it required
    // re-creating it. Emptiness is the assertion — existence is what the
    // declaration demands, and holding nothing is what the platform rule does.
    const own = libraries.find((d) => d.id === "library")!.absPath;
    expect(existsSync(own)).toBe(true);
    expect(readdirSync(own).filter((f) => !f.startsWith("."))).toEqual([]);
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
    writeDeclaration(old, JSON.stringify({ name: "downstream", directories: [{ id: "kg", path: "skills/", dependents: "reproduce", graphKinds: ["kg"] }] }));
    const d = readDeclaration(old);
    expect(d).toBeDefined();
    expect(d!.directories[0]!.graphKinds).toEqual(["kg"]);
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
    writeDeclaration(inst, JSON.stringify({ name: "minimal" }));

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
    writeDeclaration(moved, JSON.stringify({
        name: "relocated",
        directories: [{ id: "cat-harness", path: "graph/knowledge/", dependents: "reproduce", graphKinds: ["cat-harness"] }],
      }));
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
    expect(mine.every((x) => x.declaredBy === "cat-harness")).toBe(true);
  });

  it("no default claims a kind the harness registry does not know", () => {
    // `folio` is CORE's and is registered at load; the harness cannot default
    // a directory to a kind it has never heard of, or `readDeclaration` would
    // refuse its own defaults.
    const bare = new GraphKindRegistry();
    for (const d of DEFAULT_DIRECTORIES) {
      for (const g of d.graphKinds) expect(bare.has(g)).toBe(true);
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
        { id: "shared", path: "shared/", dependents: "reproduce", graphKinds: ["beans"], declaredBy: "(t)", absPath: "", own: true },
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
        { id: "own", path: "own/", dependents: "reproduce", graphKinds: ["beans"], declaredBy: "(t)", absPath: "", own: true },
      ] as unknown as Parameters<typeof materialiseDirectories>[0];
      const out = materialiseDirectories(dirs, instance);
      expect(out[0]?.created).toBe(true);
      expect(existsSync(join(instance, "own"))).toBe(true);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe("directoryForGraph refuses an ambiguous kind rather than picking one", () => {
  /**
   * Bean `wggr`, as a guard rather than as a story.
   *
   * `directoryForGraph` returned the FIRST directory declaring a kind, under a
   * doc comment calling itself "the accessor for the single-home case". The
   * precondition was stated and enforced by nothing — this repository's own
   * rule broken in one line: an unavoidable duplicate is fine, an UNCHECKED
   * one is not.
   *
   * What it cost: a by-graph lookup for `cat-harness` resolves to `schemas/`
   * rather than `skills/`, because `schemas/` declares
   * `["schemas", "cat-harness"]` and comes first. An audit walked `schemas/`,
   * wrote 37 sidecars against the wrong subjects, and exited 0.
   *
   * Fixtures rather than the real tree, deliberately. Asserting that THIS
   * repository has an ambiguous `cat-harness` pins today's declaration: the
   * test would go green the day somebody removed `cat-harness` from
   * `schemas/`, which is a change to the subject rather than to the code.
   */
  function twoHomes(): string {
    const root = mkdtempSync(join(tmpdir(), "amb-"));
    mkdirSync(join(root, "a"), { recursive: true });
    mkdirSync(join(root, "b"), { recursive: true });
    writeDeclaration(root, JSON.stringify({
        name: "amb",
        directories: [
          { id: "first", path: "a/", dependents: "reproduce", graphKinds: ["schemas", "cat-harness"] },
          { id: "second", path: "b/", dependents: "reproduce", graphKinds: ["cat-harness"] },
        ],
      }));
    return root;
  }

  test("two homes → it throws, and the message names both", () => {
    const root = twoHomes();
    try {
      expect(() => directoryForGraph(root, "cat-harness")).toThrow(/declared by 2 directories/);
      // Naming the candidates is what makes the throw actionable rather than
      // merely loud: the caller has to pick one, and cannot without knowing
      // what there is to pick from.
      expect(() => directoryForGraph(root, "cat-harness")).toThrow(/first \(a\/\)/);
      expect(() => directoryForGraph(root, "cat-harness")).toThrow(/second \(b\/\)/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("...and it does NOT silently return the first, which is the whole defect", () => {
    // Stated as its own assertion because a throw and a wrong answer are the
    // same shape to a caller that does not check: the old behaviour returned
    // `a/` here and nothing anywhere said so.
    const root = twoHomes();
    try {
      let returned: string | undefined | symbol = Symbol("not reached");
      try {
        returned = directoryForGraph(root, "cat-harness");
      } catch {
        returned = Symbol("threw");
      }
      expect(returned).not.toBe(join(root, "a"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a single-homed kind in the SAME declaration still resolves", () => {
    // The throw must be scoped to the ambiguous kind, not to a declaration
    // that happens to contain one. `schemas` lives only in `a/` here.
    const root = twoHomes();
    try {
      expect(directoryForGraph(root, "schemas")).toBe(join(root, "a"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("directoriesForGraph returns every home, in declaration order", () => {
    const root = twoHomes();
    try {
      expect(directoriesForGraph(root, "cat-harness")).toEqual([join(root, "a"), join(root, "b")]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a kind the instance declares nowhere is empty, not a throw", () => {
    // The third state its sibling already documents: undeclared is not the
    // same as declared-at-the-convention, and defaulting here would hand a
    // caller a path to a directory that is not there.
    const root = twoHomes();
    try {
      expect(directoriesForGraph(root, "voices")).toEqual([]);
      expect(directoryForGraph(root, "voices")).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("a nested declaration is named by its KIND, not by its directory", () => {
  /**
   * The disagreement this closes was live and silent.
   *
   * `declaredKinds` computed the nested filename as `${basename(path)}.json`.
   * `bean-graph.ts` holds the opposite, and holds it as a design property:
   * *"moving `beans/` to `work/` requires editing nothing inside it."* Both
   * statements were true of today's layout and contradict each other on the
   * first relocation — the walk looks for `work/work.json`, the file is still
   * `work/beans.json`, and the nested kinds drop out of `declared` with
   * nothing said. An under-count, which then manufactures an `undeclared`
   * finding somewhere else.
   *
   * The owner settled the general rule on 2026-09-20 — each type declares its
   * own filename — and `GraphKindDef.declarationFile` is that rule at the
   * graph-kind level.
   */
  function withNested(dirPath: string, fileName: string): string {
    const root = mkdtempSync(join(tmpdir(), "nested-"));
    const dir = join(root, dirPath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, fileName),
      JSON.stringify({
        name: "n",
        directories: [{ id: "defs", path: "defs", dependents: "reproduce", graphKinds: ["bean-defs"] }],
      }),
    );
    writeDeclaration(root, JSON.stringify({
        name: "n",
        directories: [{ id: "beans", path: `${dirPath}/`, dependents: "reproduce", graphKinds: ["beans"] }],
      }));
    return root;
  }

  test("at the conventional path, the nested kinds are found", () => {
    const root = withNested("beans", "beans.json");
    try {
      const decl = readDeclaration(root)!;
      expect([...declaredKinds(root, decl)].sort()).toEqual(["bean-defs", "beans"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("RELOCATED to `work/`, the file keeps its name and the kinds are STILL found", () => {
    // The case the two readers disagreed about, and the reason for the field.
    // Before this, `declaredKinds` looked for `work/work.json`, found nothing,
    // and returned `beans` alone — silently dropping `bean-defs`.
    const root = withNested("work", "beans.json");
    try {
      const decl = readDeclaration(root)!;
      expect([...declaredKinds(root, decl)].sort()).toEqual(["bean-defs", "beans"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("the directory-name convention still works for a kind declaring no filename", () => {
    // Unmigrated is not broken. A graph whose kind names no declaration file
    // falls back to `${dirName}.json`, so an instance that never relocates
    // behaves exactly as it did.
    const root = mkdtempSync(join(tmpdir(), "nested-conv-"));
    try {
      mkdirSync(join(root, "qa"), { recursive: true });
      writeFileSync(
        join(root, "qa", "qa.json"),
        JSON.stringify({ name: "n", directories: [{ id: "x", path: "x", dependents: "reproduce", graphKinds: ["health"] }] }),
      );
      writeDeclaration(root, JSON.stringify({ name: "n", directories: [{ id: "qa", path: "qa/", dependents: "reproduce", graphKinds: ["qa"] }] }));
      const decl = readDeclaration(root)!;
      expect([...declaredKinds(root, decl)].sort()).toEqual(["health", "qa"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("the two modules' constants agree with the kinds, because they are derived", () => {
    // The duplicate is removed rather than merely checked — but assert it, so
    // reintroducing a literal in either module fails here rather than on
    // somebody's relocation.
    // Compared as a pair rather than with `?.` on each side: an accessor that
    // returned `undefined` for both would otherwise make this pass over
    // nothing, which is the vacuous-assertion shape this repository keeps
    // paying for.
    expect({
      beans: defaultGraphKinds.get("beans")?.declarationFile,
      todos: defaultGraphKinds.get("todos")?.declarationFile,
    }).toEqual({ beans: BEAN_GRAPH_FILE, todos: TODO_GRAPH_FILE });
    expect(BEAN_GRAPH_FILE).toBe("beans.json");
    expect(TODO_GRAPH_FILE).toBe("todos.json");
  });
});

describe("instanceRootsIn — discovered, never listed", () => {
  it("finds the root itself and every declaring subdirectory, root first", () => {
    const base = mkdtempSync(join(tmpdir(), "roots-"));
    const decl = JSON.stringify({ name: "x", directories: [] });
    writeDeclaration(base, decl);
    for (const d of ["beta", "alpha"]) {
      mkdirSync(join(base, d), { recursive: true });
      writeDeclaration(join(base, d), decl);
    }
    // declares nothing — present, but not an instance
    mkdirSync(join(base, "plain"), { recursive: true });

    expect(instanceRootsIn(base)).toEqual([
      resolve(base),
      join(resolve(base), "alpha"),
      join(resolve(base), "beta"),
    ]);
    rmSync(base, { recursive: true, force: true });
  });

  it("omits the root when the root does not declare", () => {
    const base = mkdtempSync(join(tmpdir(), "roots-"));
    mkdirSync(join(base, "only"), { recursive: true });
    writeDeclaration(join(base, "only"), JSON.stringify({ name: "only", directories: [] }));
    expect(instanceRootsIn(base)).toEqual([join(resolve(base), "only")]);
    rmSync(base, { recursive: true, force: true });
  });

  it("skips dot-prefixed directories, like every other path guard here", () => {
    const base = mkdtempSync(join(tmpdir(), "roots-"));
    mkdirSync(join(base, ".hidden"), { recursive: true });
    writeDeclaration(join(base, ".hidden"), JSON.stringify({ name: "hidden", directories: [] }));
    expect(instanceRootsIn(base)).toEqual([]);
    rmSync(base, { recursive: true, force: true });
  });

  it("does not descend — a declaration two levels down is not an instance here", () => {
    const base = mkdtempSync(join(tmpdir(), "roots-"));
    mkdirSync(join(base, "outer", "inner"), { recursive: true });
    writeDeclaration(join(base, "outer", "inner"), JSON.stringify({ name: "inner", directories: [] }));
    expect(instanceRootsIn(base)).toEqual([]);
    rmSync(base, { recursive: true, force: true });
  });

  it("finds EVERY instance of THIS repository, which is the defect it fixes", () => {
    // The gates carried `["cat-harness", "bootstrap"]`. Asserting against the
    // real repository is the point: a fixture would have passed for the whole
    // period the literal was wrong. If an instance is added or removed this
    // test SHOULD fail — that is the signal the literal never gave.
    //
    // It fired as designed on 2026-09-20 and the list below is the updated
    // truth, not a widened assertion: seven instances arrived on one branch
    // (`who-iris`, `who-style-guide`, `folio-assistant-sci`, `kg-navigation`,
    // `detangle`, `large-datasets`, `agent-skills`) and `folio-assist-core`
    // became `folio-assistant-core` under the owner's ruling that cat-harness,
    // folio-assistant-core and folio-assistant are three distinct instances.
    // Four of eleven is what the old literal would have gone on reporting.
    const repo = resolve(import.meta.dir, "..", "..");
    const found = instanceRootsIn(repo).map((r) => r.slice(repo.length + 1) || ".");
    expect(found).toEqual([
      ".",
      "agent-skills",
      "bootstrap",
      "bootstrap-tools",
      "cat-harness",
      "detangle",
      // Alphabetical, and the ORDER moved with the rename: `folio-assist-sci`
      // sorted BEFORE `folio-assistant-core` ("assist-" < "assista"), and
      // `folio-assistant-sci` sorts after it. The list is the assertion, so
      // the swap is the visible half of the rename.
      "folio-assistant-core",
      "folio-assistant-sci",
      "kg-navigation",
      "large-datasets",
      // Added 2026-09-21 with the FHIR IG artefact-index ingest (issue #689).
      // It fired as designed, which is what this list is for: `smart-trust/`
      // declares a `harness.json` and is therefore an instance, sorting
      // between `large-datasets` and `who-iris`. `smart-kg/` is NOT here and
      // that is correct — it declares no `harness.json`, so it is a directory
      // rather than an instance.
      // Added 2026-09-21 with the second ingested IG (bean qrnz). PROVISIONAL:
      // the owner has since ruled that a per-IG harness should not exist at all
      // (bean nsbb), so this entry and `smart-trust` below are both expected to
      // collapse into a `smart-base` instance. It is listed because it EXISTS
      // today, which is the only thing this assertion is about.
      "smart-immunizations",
      "smart-trust",
      "who-iris",
      "who-style-guide",
    ]);
    // The two the literal named, pinned individually: the repository root is
    // the entry that was `"."` and then silently stopped resolving, and
    // `folio-assistant-core` is the rename that would otherwise read as a
    // deletion plus an addition.
    expect(found).toContain("folio-assistant-core");
    expect(found).toContain(".");
  });
});

describe("`graphKinds` was `graphs` until 2026-09-21, and the old key still reads", () => {
  // WHY AN ALIAS RATHER THAN A SWEEP. Every in-tree declaration was migrated by
  // the commit that renamed the field, so none of this fires here. A DOWNSTREAM
  // folio's declaration was not, and `readDeclaration` throws on a
  // present-but-unreadable declaration rather than falling back — so without the
  // alias an unmigrated folio stops resolving its own directories on upgrade.
  // Same failure `GRAPH_KIND_ALIASES` prevents one layer down, for the same
  // kind of rename.
  const base = { id: "voices", path: "voices/", dependents: "reproduce" } as const;

  for (const [name, schema] of [
    ["GraphNodeDirectorySchema", GraphNodeDirectorySchema],
    ["ContentDirectorySchema", ContentDirectorySchema],
  ] as const) {
    it(`${name} reads a legacy \`graphs\` key as \`graphKinds\``, () => {
      const r = schema.safeParse({ ...base, graphs: ["voices"] });
      expect(r.success).toBe(true);
      if (r.success) expect((r.data as { graphKinds: string[] }).graphKinds).toEqual(["voices"]);
    });

    it(`${name} takes the canonical key unchanged`, () => {
      const r = schema.safeParse({ ...base, graphKinds: ["voices"] });
      expect(r.success).toBe(true);
      if (r.success) expect((r.data as { graphKinds: string[] }).graphKinds).toEqual(["voices"]);
    });

    it(`${name} lets \`graphKinds\` WIN when a declaration carries both`, () => {
      // Deliberately not a merge. Two spellings that disagree is the one case
      // where guessing which is current would be worse than either answer, so
      // the canonical key is taken and the legacy one ignored.
      const r = schema.safeParse({ ...base, graphs: ["stale"], graphKinds: ["voices"] });
      expect(r.success).toBe(true);
      if (r.success) expect((r.data as { graphKinds: string[] }).graphKinds).toEqual(["voices"]);
    });
  }

  it("still refuses an entry carrying NEITHER key", () => {
    // The alias must not turn a missing field into an empty one: a directory
    // that names no kind is a declaration with nothing to resolve, and it fails
    // here rather than scanning as a clean run over nothing (bean `dh4f`).
    expect(GraphNodeDirectorySchema.safeParse(base).success).toBe(false);
  });
});

describe("a directory declares the theme it renders on (owner, 2026-09-20)", () => {
  it("is optional — absent means the instance's own theme", () => {
    const r = ContentDirectorySchema.safeParse({
      id: "x", path: "x/", dependents: "skip", graphKinds: ["cat-harness"],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.theme).toBeUndefined();
  });

  it("refuses an empty theme — absent and blank are different claims", () => {
    expect(
      ContentDirectorySchema.safeParse({
        id: "x", path: "x/", dependents: "skip", graphKinds: ["cat-harness"], theme: "",
      }).success,
    ).toBe(false);
  });

  it("THE METHODOLOGIES TAKE `analyst`, and the theme id is real", () => {
    // Against the real declaration and the real theme table, so a typo in
    // either is caught. Asserting the id exists is the half that matters: a
    // misspelled theme parses (it is an open string by design) and would fall
    // back silently at render time.
    const repo = resolve(import.meta.dir, "..", "..");
    const decl = readDeclaration(join(repo, "cat-harness"));
    const themed = (decl?.directories ?? []).filter((d) => d.theme !== undefined);
    expect(themed.map((d) => d.id).sort()).toEqual([
      "methodologies", "methodology-crdm", "methodology-raci", "smart-kg-methodologies",
    ]);
    for (const d of themed) expect(d.theme).toBe("analyst");
    expect(THEMES.map((t) => t.id)).toContain("analyst");
  });

  it("and NOTHING else is themed — a field that fires on every subject means nothing", () => {
    const repo = resolve(import.meta.dir, "..", "..");
    const decl = readDeclaration(join(repo, "cat-harness"));
    const all = decl?.directories ?? [];
    expect(all.filter((d) => d.theme !== undefined).length).toBeLessThan(all.length);
  });
});
