/**
 * Which render target a content profile validates against — declared as data,
 * resolved at runtime.
 *
 * ## The defect this replaces
 *
 * `content/pipeline/validate.ts` Phase 3 is "AST validation (render → parse)",
 * and it read:
 *
 * ```ts
 * const latex = renderBlock(block, mdContent);
 * const astResult = validateLatexAst(latex);
 * ```
 *
 * The GENERIC validator, rendering every block to LaTeX. That is wrong twice:
 *
 * 1. **On a document folio it is a category error.** `AGENTS.md` is explicit
 *    that the document render path takes no TeX — `render-markdown.ts`
 *    assembles one Markdown file and `document_render_*` takes it through
 *    pandoc, never falling back to `latexmk`, deliberately, so that a PDF
 *    cannot silently misreport what the folio needs to build. A `LaTeX AST:`
 *    error raised against output the folio will never produce is noise a
 *    document author cannot act on.
 * 2. **It is a wrong-direction dependency.** The LaTeX renderer belongs to the
 *    science layer, and the generic validator naming it is core → sci.
 *
 * ## Why a table and not an import
 *
 * The same reasoning as `content/pipeline/qa-checker-discovery.ts`: a module
 * path held as DATA is resolved with a variable specifier, so this file
 * depends on neither renderer and `repo-partition` records no edge. The
 * platform's own targets are declared here for the same reason the platform's
 * own block kinds are declared in `block-kinds.ts` — a dependency contributes
 * *additional* targets through `RendererContribution`, and the built-ins are
 * not a special case of that mechanism but the thing it extends.
 *
 * ## No target is a real state
 *
 * A profile absent from this table has **no structural check**, and a caller
 * must report that as not-checked rather than as a pass. Same rule as
 * `readme-sections`' third state and `ci-health`'s: "could not determine" is
 * never rendered as green.
 *
 * @module schemas/render-targets
 * @graphNode schema
 */

import type { ContentProfile } from "./block-kinds";

/** Where a profile's renderer lives and what it exports. */
export interface RenderTargetDeclaration {
  /** Output format — `latex`, `markdown`. */
  format: string;
  /** Repo-relative module holding the renderer. Resolved by variable path. */
  module: string;
  /** Export rendering one block manifest plus its Markdown body to `format`. */
  renderExport: string;
  /**
   * How that export takes its two inputs.
   *
   * - `"positional"` — `(block, markdown)`, the LaTeX renderer's shape.
   * - `"entry"` — `({ block, mdContent })`, the Markdown renderer's shape.
   *
   * Declared rather than sniffed. A resolver that inspected `fn.length` or
   * tried one shape and fell back to the other would call a renderer with the
   * wrong argument and get a plausible-looking string out of it — this is the
   * same class of silent mismatch that `QaCriterionDefinition.subject` exists
   * to prevent on the checker side, and it is cheaper to write the shape down
   * than to detect having got it wrong.
   */
  argStyle: "positional" | "entry";
  /**
   * Export checking rendered output is structurally sound, if there is one.
   *
   * Absent is not a gap to fill with a weaker check. Markdown assembled from
   * blocks has no structural invariant the way a LaTeX environment stack does
   * — an unbalanced `\begin` is malformed, an odd-looking heading is not — and
   * inventing one would produce findings no author could act on. The honest
   * report is that this target is not structurally checked.
   */
  validateExport?: string;
}

/**
 * The platform's built-in render targets, by content profile.
 *
 * Keyed by PROFILE rather than by adapter, and the distinction is the one
 * `AGENTS.md` warns is costly to conflate. Adapters (`paper`, `dak`) partition
 * kinds into disjoint namespaces; profiles (`document`, `paper`) nest, and it
 * is the profile that decides what a folio RENDERS TO — a `theorem` is a valid
 * `theorem` whatever folio holds it, but only a paper folio has a TeX
 * toolchain to typeset it with.
 */
export const RENDER_TARGETS: Partial<Record<ContentProfile, RenderTargetDeclaration>> = {
  paper: {
    format: "latex",
    module: "content/pipeline/render-latex.ts",
    renderExport: "renderBlock",
    argStyle: "positional",
    validateExport: "validateLatexAst",
  },
  document: {
    format: "markdown",
    module: "content/pipeline/render-markdown.ts",
    renderExport: "renderBlockMarkdown",
    argStyle: "entry",
  },
};
