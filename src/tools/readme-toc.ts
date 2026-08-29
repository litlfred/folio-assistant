/**
 * `readme_toc` — regenerate the folio README's contents table.
 *
 * Generic, not adapter-scoped: a document folio has chapters and a README for
 * the same reason a paper folio does, and the block kinds never enter into it.
 *
 * The work lives in `content/pipeline/readme-toc.ts`; this is the MCP surface
 * over it, so an agent can refresh the table after adding a chapter without
 * knowing the script's path or flag spelling.
 *
 * @module src/tools/readme-toc
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { runReadmeToc } from "../../content/pipeline/readme-toc";

export function registerReadmeTocTools(server: McpServer): void {
  server.tool(
    "readme_toc",
    "Regenerate the folio README's contents table — one section per paper in " +
      "the folio, listing every chapter with a link to its source directory " +
      "and, when one has been published, its standalone PDF. PDF links are " +
      "verified against the publish ref (default `gh-pages`) rather than " +
      "composed by convention, so an unpublished chapter renders '—' instead " +
      "of a dead link. Writes between the `<!-- folio:toc:begin -->` and " +
      "`<!-- folio:toc:end -->` comments in README.md.",
    {
      check: z
        .boolean()
        .default(false)
        .describe("Report whether the table is stale without writing. Fails when it is."),
      stdout: z
        .boolean()
        .default(false)
        .describe("Return the Markdown instead of writing it into the README."),
      link_style: z
        .enum(["blob", "pages", "raw"])
        .optional()
        .describe(
          "Override folio.config.json's `readme.linkStyle`. 'blob' " +
            "(github.com/<owner>/<repo>/blob/<ref>/<path>) is the only one that " +
            "resolves for a PRIVATE repository — GitHub Pages needs a public site, " +
            "and raw.githubusercontent.com 404s without a token.",
        ),
      fetch: z
        .boolean()
        .default(false)
        .describe(
          "Fetch the publish ref first. Needed in a shallow clone, which has no " +
            "gh-pages and would otherwise render every PDF cell as '—'.",
        ),
      dir: z
        .string()
        .optional()
        .describe("Folio root. Defaults to the repo the server was pointed at."),
    },
    async ({ check, stdout, link_style, fetch, dir }) => {
      try {
        const result = runReadmeToc({
          root: dir,
          check,
          stdout,
          fetch,
          linkStyle: link_style,
        });
        return {
          content: [{ type: "text" as const, text: result.text }],
          isError: result.exitCode !== 0,
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text" as const,
              text: `readme_toc failed: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
