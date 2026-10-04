/**
 * The server's tools are READ from the harness's Tool nodes (bean `zmdo`,
 * owner 2026-10-04: "isn't it just presence in the KG?"). These tests hold
 * the two sides to each other: every in-process MCP Tool node resolves to a
 * registrar, and each registrar registers exactly the MCP names the KG
 * declares for its module — so a tool can neither be declared and not served,
 * nor served and not declared.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { tools } from "../tools/index.js";
import { registerDeclaredToolGroups, toolGroupsFromNodes } from "./tool-groups.js";

const ROOT = resolve(import.meta.dir, "..");

/** A stand-in server that records the names registered on it. */
function recordingServer() {
  const names: string[] = [];
  return { names, server: { tool: (name: string) => { names.push(name); } } };
}

describe("tool groups derived from Tool nodes (zmdo)", () => {
  const nodes = tools();
  const groups = toolGroupsFromNodes(nodes);

  test("one group per module, and only for nodes served in-process over MCP", () => {
    const modules = groups.map((g) => g.module);
    expect(new Set(modules).size).toBe(modules.length);
    const served = nodes.filter((n) => n.invoke?.inProcess && n.invoke?.mcp);
    expect(new Set(served.map((n) => n.invoke!.inProcess!.module))).toEqual(new Set(modules));
  });

  test("each module registers exactly the MCP names its Tool nodes declare", async () => {
    for (const g of groups) {
      const { names, server } = recordingServer();
      const [o] = await registerDeclaredToolGroups(server, [g], ROOT, [ROOT]);
      expect(o).toEqual({ id: g.id, state: "registered" });
      const declared = nodes
        .filter((n) => n.invoke?.inProcess?.module === g.module && n.invoke?.mcp)
        .map((n) => n.invoke!.mcp!.tool)
        .sort();
      expect({ module: g.module, names: names.sort() }).toEqual({ module: g.module, names: declared });
    }
  });

  test("a module with no register… export is reported as failed, not guessed", async () => {
    const [o] = await registerDeclaredToolGroups({}, [{ id: "none", module: "src/no-content-adapter.ts", layer: "harness" }], ROOT);
    expect(o.state).toBe("failed");
    expect(o.state === "failed" && o.detail).toContain("exports no register");
  });
});
