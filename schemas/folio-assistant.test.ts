/**
 * Tests for the FolioAssistant root declaration — issue #223, Phase 0.3.
 *
 * The shape under test: an instance declares the directories it scans and the
 * graph kind each holds, and a downstream instance INHERITS its dependencies'
 * directories without restating them.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  DECLARATION_FILENAME,
  GRAPH_KIND_NAMES,
  isRenderable,
  readDeclaration,
  renderableDirectories,
  resolveDirectories,
  toJsonLd,
} from "./folio-assistant";

const TMP = join(import.meta.dir, "__test_folio_assistant__");
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
    expect(() => readDeclaration(bad)).toThrow(/not a valid FolioAssistant declaration/);
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

describe("graph kinds", () => {
  it("folio is the renderable kind; the others are graphs tools read", () => {
    expect(isRenderable("folio")).toBe(true);
    for (const k of GRAPH_KIND_NAMES.filter((k) => k !== "folio")) {
      expect(isRenderable(k)).toBe(false);
    }
  });

  it("every graph kind projects to a distinct @type in the folio namespace", () => {
    const decl = { name: "x", directories: GRAPH_KIND_NAMES.map((g) => ({ id: g, path: `${g}/`, graph: g })) };
    const types = (toJsonLd(decl).directories as Array<{ "@type": string }>).map((d) => d["@type"]);
    expect(new Set(types).size).toBe(GRAPH_KIND_NAMES.length);
    for (const t of types) expect(t).toContain("folio-assistant");
  });
});
