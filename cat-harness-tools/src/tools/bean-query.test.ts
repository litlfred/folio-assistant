import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBeanQueryTool } from "./bean-query.ts";

describe("bean-query MCP tool", () => {
  test("registers bean_query tool on McpServer", async () => {
    const server = new McpServer({ name: "test-server", version: "1.0.0" });
    registerBeanQueryTool(server, resolve("."));

    // Server tools should contain bean_query
    const tools = (server as any)._registeredTools;
    expect(tools).toBeDefined();
    expect(tools["bean_query"]).toBeDefined();
  });

  test("executes default safe_drain_candidates query", async () => {
    const server = new McpServer({ name: "test-server", version: "1.0.0" });
    registerBeanQueryTool(server, resolve("."));

    const tool = (server as any)._registeredTools["bean_query"];
    const result = await tool.handler({ named: "safe_drain_candidates", format: "json" });
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });
});
