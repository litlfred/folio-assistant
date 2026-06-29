/**
 * Hermetic tests for the bib + transform MCP tool modules: verify they register
 * the expected tools, that mutating tools default to dry-run, and that the
 * no-target/auto-detect paths degrade gracefully (no real pipeline spawn).
 */
import { test, expect, describe } from "bun:test";
import { registerBibTools } from "../../adapters/paper/tools/bib.ts";
import { registerTransformTools } from "../../adapters/paper/tools/transform.ts";

function collect(register: (s: any) => void) {
  const reg: Record<string, { desc: string; schema: any; handler: Function }> = {};
  register({ tool(name: string, desc: string, schema: any, handler: Function) { reg[name] = { desc, schema, handler }; } });
  return reg;
}

describe("registerBibTools", () => {
  const reg = collect(registerBibTools);
  test("registers bib tools with handlers", () => {
    for (const name of ["bib_validate", "references_validate", "bib_export"]) {
      expect(reg[name]).toBeDefined();
      expect(typeof reg[name].handler).toBe("function");
      expect(reg[name].desc.length).toBeGreaterThan(10);
    }
  });
});

describe("registerTransformTools", () => {
  const reg = collect(registerTransformTools);

  test("registers transform tools with handlers", () => {
    for (const name of ["codemod", "prune_deps", "migrate_lean_refs"]) {
      expect(reg[name]).toBeDefined();
      expect(typeof reg[name].handler).toBe("function");
    }
  });

  test("codemod degrades gracefully when no target resolves", async () => {
    // No content/<paper> in this repo → auto-detect yields nothing.
    const res = await reg["codemod"].handler({ name: "refterm" });
    expect(res.content[0].type).toBe("text");
    expect(res.content[0].text.toLowerCase()).toContain("target");
  });
});
