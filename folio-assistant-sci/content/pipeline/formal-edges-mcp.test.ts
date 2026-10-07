/**
 * `lean_formal_edges` reaches a server through its Tool node: the node in
 * folio-assistant-sci's `tools/` names `content/pipeline/formal-edges-mcp.ts`,
 * and both MCP servers register every Tool node in the folio's dependency
 * tree (`registerServedToolGroups`, bean riit 3c). It was a `contributes` tool
 * group until then (folio-assistant#1492); this test pins the path that
 * replaced it, through the real dependency walk rather than the registrar
 * alone — a test of the registrar alone would not notice the tool reaching no
 * server, which is what #1492 found.
 */

import { describe, expect, test } from "bun:test";
import { join } from "path";
import { registerServedToolGroups, servedToolGroups } from "../../../cat-harness-tools/src/tool-groups";
import { FORMAL_EDGES_TOOL } from "./formal-edges-mcp";
import { sciConsumerRoot } from "../../scripts/tests/sci-consumer";

// The FOLIO root, which is what the server walks from: a folio whose
// dependency tree includes folio-assistant-sci. Not the checkout root above
// this layer, which standing alone is no folio at all.
const FOLIO_ROOT = sciConsumerRoot();

/** A server stand-in that records what is registered on it. */
function recordingServer() {
  const tools: Array<{ name: string; handler: (args: Record<string, unknown>) => Promise<unknown> }> = [];
  return {
    tools,
    tool: (name: string, ...rest: unknown[]) => {
      tools.push({ name, handler: rest[rest.length - 1] as never });
    },
    registerTool: (name: string, ...rest: unknown[]) => {
      tools.push({ name, handler: rest[rest.length - 1] as never });
    },
  };
}

describe("lean_formal_edges is served from its Tool node", () => {
  test("the folio's dependency tree yields sci's group for it", () => {
    const sci = servedToolGroups(FOLIO_ROOT).sets.find((s) => s.instance === "folio-assistant-sci");
    expect(sci?.groups.map((g) => g.module)).toContain("content/pipeline/formal-edges-mcp.ts");
  });

  test("registerServedToolGroups puts it on the server", async () => {
    const server = recordingServer();
    const { outcomes, failures } = await registerServedToolGroups(server, FOLIO_ROOT, [FOLIO_ROOT]);
    expect(failures).toEqual([]);
    expect(outcomes.filter((o) => o.state !== "registered")).toEqual([]);
    expect(server.tools.map((t) => t.name)).toContain(FORMAL_EDGES_TOOL);
  });

  test("an unbuilt project is reported as could-not-determine and flagged isError", async () => {
    const server = recordingServer();
    await registerServedToolGroups(server, FOLIO_ROOT, [FOLIO_ROOT]);
    const tool = server.tools.find((t) => t.name === FORMAL_EDGES_TOOL)!;
    const res = (await tool.handler({ lake_dir: join(import.meta.dir, "__no_such_lake__"), ingest: false })) as {
      content: Array<{ text: string }>;
      isError: boolean;
    };
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("could not determine formal edges");
  });
});
