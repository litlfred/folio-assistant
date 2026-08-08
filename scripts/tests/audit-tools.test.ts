/**
 * Hermetic test for the read-only audit MCP tool module: verifies every audit
 * tool registers with a handler (no real pipeline spawn).
 */
import { test, expect, describe } from "bun:test";
import { registerAuditTools } from "../../adapters/paper/tools/audit.ts";

/** An MCP tool handler, as the registration stubs below see it. */
type ToolHandler = (
  ...args: unknown[]
) => Promise<{ content: Array<{ type: string; text: string }> }>;


describe("registerAuditTools", () => {
  const reg: Record<string, { desc: string; handler: ToolHandler }> = {};
  registerAuditTools({ tool(name: string, desc: string, _s: any, handler: ToolHandler) { reg[name] = { desc, handler }; } } as any);

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
