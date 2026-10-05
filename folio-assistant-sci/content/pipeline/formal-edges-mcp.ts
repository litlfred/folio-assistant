/**
 * The `lean_formal_edges` MCP tool — folio-assistant-sci's formal-edge
 * extractor, served because its Tool node (`lean-formal-edges` in this
 * instance's `tools/index.ts`) names this module.
 *
 * Neither server names this instance: both serve every Tool node in the
 * folio's dependency tree (bean riit, 3c), so the tool reaches a folio exactly
 * when the folio depends on this layer. That is the owner's cut, "f-a-core has
 * high level processes only, no tooling". It reached the servers as a
 * `contributes` tool group until then.
 *
 * The tool is a thin wrapper over `runFormalEdges`, which the CLI also uses,
 * so the two cannot drift. It reports `could-not-determine` as such, never as
 * an empty edge set.
 *
 * @module folio-assistant-sci/content/pipeline/formal-edges-mcp
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describeResult, runFormalEdges } from "./formal-edges";

export const FORMAL_EDGES_TOOL = "lean_formal_edges";

export function registerFormalEdgesTools(server: unknown): void {
  (server as McpServer).tool(
    FORMAL_EDGES_TOOL,
    "Extract ELABORATED formal dependencies between a folio's lean.ref declarations " +
      "(LeanArchitect's rule over the folio's own lean.ref set; no attributes, no " +
      "LeanArchitect). Needs a Lean toolchain and a built Lake project. Tagged " +
      "declarations missing from the build are reported, never recorded as dependency-free. " +
      "With ingest=true the result is recorded in the formal cache as source \"elaborated\".",
    {
      lake_dir: z.string().describe("The folio's Lake project directory (holds lakefile.* and .lake/)"),
      root: z.string().optional().describe("Content root to collect lean.ref targets from (default: the folio's declared one)"),
      ingest: z.boolean().default(false).describe("Record the result in the formal cache as source \"elaborated\""),
    },
    async ({ lake_dir, root, ingest }) => {
      const r = runFormalEdges({ lakeDir: lake_dir, root, ingest });
      return {
        content: [{ type: "text" as const, text: describeResult(r) }],
        isError: r.state !== "extracted",
      };
    },
  );
}
