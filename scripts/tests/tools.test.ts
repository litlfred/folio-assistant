/**
 * Tool nodes are real, well-formed, and reachable from the graph.
 *
 * Five Tool nodes were DESCRIBED across four skills and the harness analysis
 * before any existed. This is what makes the skill/Tool separation checkable
 * rather than asserted.
 */
import { describe, expect, test } from "bun:test";

import { tools } from "../../tools/index.js";
import { ToolDefinitionSchema } from "../../schemas/tool.js";
import { TOOL_TYPES } from "../../schemas/tool-types.js";
import { checkTools, knownSkills } from "../check-tools.js";
import { buildToolTypes, buildToolSchema } from "../harness-schema-export.js";

const BASE = "https://example.invalid/fa";

describe("tools", () => {
  test("there are tools to check — otherwise everything below is vacuous", () => {
    expect(tools().length).toBeGreaterThanOrEqual(4);
  });

  test("every satisfies names a skill that exists", () => {
    // The constraint a schema cannot express: Zod can require `satisfies` to be
    // non-empty, but it does not get to read the tree.
    expect(checkTools().danglingSatisfies).toEqual([]);
  });

  test("every io port references a type the shared vocabulary declares", () => {
    expect(checkTools().unknownTypes).toEqual([]);
  });

  test("io references are absolute IRIs into the published types document", () => {
    // Relative would resolve differently depending on where a consumer fetched
    // the Tool, so two consumers could disagree about what a tool accepts.
    const doc = buildToolTypes({ baseUrl: BASE });
    const defs = new Set(Object.keys(doc.$defs as Record<string, unknown>));
    expect(defs.size).toBe(Object.keys(TOOL_TYPES).length);
    for (const t of tools()) {
      for (const p of [...t.io.inputs, ...t.io.outputs]) {
        expect(p.schema.startsWith("https://")).toBe(true);
        expect(defs.has(p.schema.split("#/$defs/")[1] ?? "")).toBe(true);
      }
    }
  });

  test("a Tool reachable only over MCP is rejected", () => {
    // The harness assumes no MCP server, so a Tool whose ONLY arm is `mcp` is
    // not usable by the layer that defines it — and projecting it would emit a
    // server that proxies itself. Rejected at parse time, not at review.
    const mcpOnly = {
      id: "mcp-only", title: "x", summary: "y",
      install: { none: true as const },
      invoke: { mcp: { tool: "something" } },
      io: { inputs: [], outputs: [] },
      satisfies: ["todo-manager"],
    };
    expect(ToolDefinitionSchema.safeParse(mcpOnly).success).toBe(false);
    // The same Tool WITH a shell arm is fine — mcp is an extra, not a defect.
    expect(ToolDefinitionSchema.safeParse({ ...mcpOnly, invoke: { ...mcpOnly.invoke, shell: "x" } }).success).toBe(true);
  });

  test("a Tool satisfying nothing is rejected", () => {
    const orphan = {
      id: "orphan", title: "x", summary: "y",
      install: { none: true as const }, invoke: { shell: "x" },
      io: { inputs: [], outputs: [] }, satisfies: [],
    };
    expect(ToolDefinitionSchema.safeParse(orphan).success).toBe(false);
  });

  test("the beans pair satisfies exactly the same skills", () => {
    // The point of two beans Tools: an agent in a fresh container with no CLI
    // must still find a mechanism. If the fallback covered fewer skills it
    // would be the degraded mode `skills-and-tools` says it is not.
    const byId = new Map(tools().map((t) => [t.id, t]));
    const cli = byId.get("beans-cli")!;
    const manual = byId.get("beans-manual")!;
    expect([...manual.satisfies].sort()).toEqual([...cli.satisfies].sort());
  });

  test("the generated schemas carry an absolute $id", () => {
    expect(buildToolSchema({ baseUrl: BASE }).$id).toBe(`${BASE}/kg/tool.schema.json`);
    expect(buildToolTypes({ baseUrl: BASE }).$id).toBe(`${BASE}/kg/tool-types.schema.json`);
  });

  test("skill discovery is not a hardcoded list", () => {
    // Four hardcoded corpus paths have been wrong in this repo already; this
    // asserts the check sees the packages a list would have missed.
    const s = knownSkills();
    expect(s.has("smart-base-tools")).toBe(true); // skills/authoring-who-smart-guidelines
    expect(s.has("lean-formalization")).toBe(true); // schemas/skills/<name>/
    expect(s.has("kg-export")).toBe(true); // skills/folio-core
  });
});
