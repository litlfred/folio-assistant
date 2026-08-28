/**
 * Paper Content Adapter — a {@link DocumentContentAdapter} that additionally
 * knows about Lean and LaTeX.
 *
 * ## A paper is a document plus Lean-bearing blocks
 *
 * That sentence is the whole design. A paper folio and a document folio have
 * the same content model (a tree of chapters and sections over `.ts` + `.md`
 * block pairs), the same editorial `uses[]` graph, the same QA sidecars, the
 * same HCI validation gate, the same feedback and review workflow, and the
 * same publication lifecycle. What a paper adds is:
 *
 * - **block kinds whose assertion is a formal claim** — `definition`,
 *   `theorem`, `lemma`, `proposition`, `corollary`, `conjecture`, `proof`
 *   (`MATH_BLOCK_KINDS` in `schemas/block-kinds.ts`), each backed by a
 *   `.lean` sibling; and
 * - **two toolchains** to serve them: the Lean lifecycle (`lean_setup`,
 *   `lean_build`, `lean_check`, `lean_status`) and the LaTeX renderer
 *   (`paper_render_pdf`, `paper_render_html`, `formula_render`).
 *
 * Everything else is inherited, which is why this file is short. If a change
 * belongs in both content types, it belongs in the base class; if it needs a
 * TeX or Lean installation, it belongs here.
 *
 * @module folio-assistant/adapters/paper
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { DocumentContentAdapter } from "../document/index.js";
import { registerLeanTools } from "./tools/lean.js";
import { registerLatexRenderTools } from "../document/tools/render.js";

export class PaperContentAdapter extends DocumentContentAdapter {
  readonly type: string = "paper";
  readonly name: string = "Paper Assistant";

  /**
   * The document tools, plus the two toolchains a paper needs.
   *
   * `super` first and by design: a paper folio keeps `document_render_md` and
   * `document_render_html` alongside `paper_render_pdf`. The Markdown path
   * needs no TeX, so it stays available on a machine where the LaTeX build
   * cannot run — which is the common case when an agent is drafting rather
   * than publishing.
   */
  protected override registerContentTools(server: McpServer): void {
    super.registerContentTools(server);
    registerLatexRenderTools(server);
    registerLeanTools(server);
  }
}
