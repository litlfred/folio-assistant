/**
 * Hermetic test for the read-only audit MCP tool module: verifies every audit
 * tool registers with a handler (no real pipeline spawn).
 */
import { test, expect, describe } from "bun:test";
import { registerAuditTools } from "../../adapters/paper/tools/audit.ts";

describe("registerAuditTools", () => {
  const reg: Record<string, { desc: string; handler: Function }> = {};
  registerAuditTools({ tool(name: string, desc: string, _s: any, handler: Function) { reg[name] = { desc, handler }; } } as any);

  const expected = [
    "latex_overfull", "qa_staleness", "tex_source_audit", "dangling_remarks",
    "conditional_class_audit", "section_title_audit", "wall_violations",
    "defterm_validate", "value_validate", "glossary_candidates", "lean_compile_audit",
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
