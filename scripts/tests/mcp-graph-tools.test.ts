/**
 * The MCP graph tools' handlers, driven the way the server drives them.
 *
 * These lived inside `server.ts`'s `executeTool` — a nested function in a
 * request handler — so the wiring between a declared tool and its
 * implementation was covered by `tsc` and nothing else. That is exactly where
 * the last two defects in this work were: an `@id` placeholder that collided
 * twelve real blocks, and a `paths` object that never carried the companions
 * the type system had learned about. Both typechecked cleanly.
 *
 * So the handlers moved to `tools/graph.ts` and these tests call them.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  executeGraphTool,
  isGraphTool,
  invalidateGraphIndex,
  GRAPH_TOOL_NAMES,
} from "../../adapters/mcp-server/tools/graph";

const ROOT = mkdtempSync(join(tmpdir(), "mcp-graph-"));
const CONTENT = join(ROOT, "content", "qou", "ch01");
const LIBRARY = join(ROOT, "library", "doc-1", "blocks");
const ROOTS = [
  { name: "content", dir: join(ROOT, "content") },
  { name: "library", dir: join(ROOT, "library") },
];

const call = (name: string, input: Record<string, unknown> = {}) =>
  JSON.parse(executeGraphTool(name, input, ROOTS)!);

beforeAll(() => {
  mkdirSync(CONTENT, { recursive: true });
  mkdirSync(LIBRARY, { recursive: true });
  const w = (dir: string, n: string, d: Record<string, unknown>) =>
    writeFileSync(join(dir, `${n}.jsonld`), JSON.stringify(d, null, 2));

  w(CONTENT, "def-widget", {
    "@id": "papers/qou/blocks/def-widget",
    label: "def:widget",
    kind: "definition",
    title: "A widget",
    provenance: "authored",
  });
  w(CONTENT, "thm-main", {
    "@id": "papers/qou/blocks/thm-main",
    label: "thm:main",
    kind: "theorem",
    title: "Widget theorem",
    uses: ["papers/qou/blocks/def-widget"],
    provenance: "authored",
  });
  w(LIBRARY, "prose-sec-000", {
    "@id": "library/doc-1/blocks/prose-sec-000",
    kind: "prose",
    title: "Introduction to widgets",
    provenance: "ingested",
  });

  invalidateGraphIndex();
});

afterAll(() => {
  try {
    rmSync(ROOT, { recursive: true, force: true });
  } catch {}
  invalidateGraphIndex();
});

describe("dispatch", () => {
  test("owns exactly the three declared tools", () => {
    expect([...GRAPH_TOOL_NAMES].sort()).toEqual([
      "get_graph_stats",
      "get_neighbors",
      "search_graph",
    ]);
    for (const n of GRAPH_TOOL_NAMES) expect(isGraphTool(n)).toBe(true);
  });

  test("returns undefined for a tool it does not own, rather than guessing", () => {
    expect(executeGraphTool("get_block", {}, ROOTS)).toBeUndefined();
  });

  test("every handler returns parseable JSON", () => {
    for (const n of GRAPH_TOOL_NAMES) {
      expect(() => JSON.parse(executeGraphTool(n, { query: "x", id: "def:widget" }, ROOTS)!)).not.toThrow();
    }
  });
});

describe("search_graph", () => {
  test("spans both populations — the thing search_blocks cannot do", () => {
    const r = call("search_graph", { query: "widget" });
    expect(r.hits.map((h: { provenance: string }) => h.provenance).sort()).toEqual([
      "authored",
      "authored",
      "ingested",
    ]);
  });

  test("provenance narrows to one population", () => {
    expect(call("search_graph", { query: "widget", provenance: "ingested" }).hits).toHaveLength(1);
  });

  test("truncation is reported, never silent", () => {
    const r = call("search_graph", { query: "widget", limit: 1 });
    expect(r.hits).toHaveLength(1);
    expect(r.totalMatches).toBe(3);
  });

  test("a missing query returns an empty result rather than everything", () => {
    expect(call("search_graph", {}).hits).toEqual([]);
  });
});

describe("get_neighbors", () => {
  test("resolves an authored label, not just an @id", () => {
    expect(call("get_neighbors", { id: "thm:main" }).seed).toBe("papers/qou/blocks/thm-main");
  });

  test("direction 'in' answers what breaks if this changes", () => {
    const r = call("get_neighbors", { id: "def:widget", direction: "in" });
    expect(r.edges.map((e: { from: string }) => e.from)).toEqual(["papers/qou/blocks/thm-main"]);
  });

  test("an unknown seed is an error, not an empty neighbourhood", () => {
    expect(call("get_neighbors", { id: "def:nope" }).error).toContain("No node");
  });

  test("an unknown edge term is reported, not silently dropped", () => {
    // Dropping it would answer a narrower question than the caller asked.
    const r = call("get_neighbors", { id: "thm:main", edges: ["uses", "bogus"] });
    expect(r.error).toContain("bogus");
    expect(r.known).toContain("uses");
  });

  test("a valid edge filter still works", () => {
    expect(call("get_neighbors", { id: "thm:main", edges: ["uses"] }).edges).toHaveLength(1);
  });
});

describe("get_graph_stats", () => {
  test("reports both roots and their counts", () => {
    const s = call("get_graph_stats");
    expect(s.nodes).toBe(3);
    expect(s.byProvenance).toEqual({ authored: 2, ingested: 1 });
  });

  test("an absent root is reported absent, so 'not built' differs from 'no match'", () => {
    const s = JSON.parse(
      executeGraphTool("get_graph_stats", { refresh: true }, [
        { name: "content", dir: join(ROOT, "content") },
        { name: "library", dir: join(ROOT, "nope") },
      ])!,
    );
    expect(s.roots.find((r: { name: string }) => r.name === "library").present).toBe(false);
    invalidateGraphIndex();
  });
});
