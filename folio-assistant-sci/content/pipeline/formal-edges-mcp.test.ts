/**
 * `lean_formal_edges` reaches a server through the REAL contribution path:
 * the folio's declared dependencies → folio-assistant-sci's
 * `contributes` module → `ContributionRegistry.registerTools`. That is the
 * path the MCP server now calls (folio-assistant#1492). Before it,
 * `registerTools` had no production caller, and a contributed tool reached no
 * server at all, which a test of the registrar alone would not have noticed.
 */

import { describe, expect, test } from "bun:test";
import { join } from "path";
import { loadContributions } from "../../../cat-harness/schemas/harness-config";
import { ContributionRegistry, type FolioContribution } from "../../../cat-harness/schemas/contributions";
import { FORMAL_EDGES_TOOL } from "./formal-edges-mcp";

// The FOLIO root, which is what the server loads from (findContentRepoRoot()).
// In this repository that is the repository root, whose declaration lists
// folio-assistant-sci as a dependency. `cat-harness/` alone lists none, which is
// the trap this test's first draft fell into, and the server's first draft too.
const FOLIO_ROOT = join(import.meta.dir, "..", "..", "..");

/** A server stand-in that records what is registered on it. */
function recordingServer() {
  const tools: Array<{ name: string; handler: (args: Record<string, unknown>) => Promise<unknown> }> = [];
  return {
    tools,
    tool: (name: string, ...rest: unknown[]) => {
      tools.push({ name, handler: rest[rest.length - 1] as never });
    },
  };
}

describe("lean_formal_edges is contributed, not declared", () => {
  test("loading the folio's declared dependencies yields the tool", async () => {
    const reg = await loadContributions<FolioContribution, ContributionRegistry>(FOLIO_ROOT, new ContributionRegistry());
    expect(reg.contributedTools()).toContain(FORMAL_EDGES_TOOL);
  });

  test("registerTools puts it on the server", async () => {
    const reg = await loadContributions<FolioContribution, ContributionRegistry>(FOLIO_ROOT, new ContributionRegistry());
    const server = recordingServer();
    reg.registerTools(server);
    expect(server.tools.map((t) => t.name)).toContain(FORMAL_EDGES_TOOL);
  });

  test("an unbuilt project is reported as could-not-determine and flagged isError", async () => {
    const reg = await loadContributions<FolioContribution, ContributionRegistry>(FOLIO_ROOT, new ContributionRegistry());
    const server = recordingServer();
    reg.registerTools(server);
    const tool = server.tools.find((t) => t.name === FORMAL_EDGES_TOOL)!;
    const res = (await tool.handler({ lake_dir: join(import.meta.dir, "__no_such_lake__"), ingest: false })) as {
      content: Array<{ text: string }>;
      isError: boolean;
    };
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("could not determine formal edges");
  });
});
