/**
 * Hermetic test for the read-only audit MCP tool module: verifies every audit
 * tool registers with a handler (no real pipeline spawn).
 */
import { test, expect, describe } from "bun:test";
import { registerAuditTools } from "../../adapters/document/tools/audit.ts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** An MCP tool handler, as the registration stubs below see it. */
type ToolHandler = (
  ...args: unknown[]
) => Promise<{ content: Array<{ type: string; text: string }> }>;


/**
 * A stand-in for `McpServer` that records what a `register*Tools` call
 * registers. Only `tool` is exercised, so the cast to `McpServer` at each use
 * is narrowed through `unknown` rather than `any` — the recorder itself stays
 * typed, and a change to the `tool` signature still breaks here.
 */
interface ToolRecorder {
  tool(name: string, desc: string, schema: unknown, handler: ToolHandler): void;
}

describe("registerAuditTools", () => {
  const reg: Record<string, { desc: string; handler: ToolHandler }> = {};
  const recorder: ToolRecorder = {
    tool(name, desc, _schema, handler) { reg[name] = { desc, handler }; },
  };
  registerAuditTools(recorder as unknown as McpServer);

  const expected = [
    "latex_overfull", "qa_staleness", "tex_source_audit", "dangling_remarks",
    "conditional_class_audit", "section_title_audit", "wall_violations",
    "defterm_validate", "value_validate", "glossary_candidates", "lean_compile_audit",
    "wiring_audit", "conjectural_propagation", "trivial_skeleton_audit",
    "tex_validate", "proof_narrative_equiv", "status_sections_audit",
  ];

  test("registers all audit tools with handlers + descriptions", () => {
    for (const name of expected) {
      expect(reg[name]).toBeDefined();
      expect(typeof reg[name].handler).toBe("function");
      expect(reg[name].desc.toLowerCase()).toContain("read-only");
    }
    expect(Object.keys(reg).length).toBe(expected.length);
  });
});
