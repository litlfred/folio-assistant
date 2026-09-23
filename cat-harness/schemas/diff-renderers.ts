/**
 * The diff renderers a reviewer chooses between on the review page. Bean
 * `d903`, epic `q4jm`.
 *
 * @module schemas/diff-renderers
 * @graphNode schema
 *
 * ## Why a registry
 *
 * The owner asked to *"select different diff rednerers/viz"*. A single "the
 * diff" gets it wrong for at least one block kind: a word diff of a table's
 * Markdown is unreadable, and a side-by-side view of a one-word edit hides the
 * word. So each renderer is declared here as DATA (what it needs, which block
 * kinds it defaults for), and the page offers every renderer that can run on
 * a block, with a default chosen by that block's kind.
 *
 * ## Why here and not in core
 *
 * The epic's design review (R5) settled that the registry describes RENDERING
 * TOOLS, and core's own AGENTS.md puts schemas for skills, workflows, roles
 * and tools in the harness. The page that uses it (`gen-review-page.ts`) is
 * harness code too.
 *
 * ## What a renderer NEEDS decides whether it is offered
 *
 * - `text`: the block's prose on the sides it has (`changeset-text.json`).
 * - `pages`: a URL for each side (the preview, and `main` from
 *   `staging.json`).
 * - `screenshots`: a picture of the block on each side, from the
 *   `folio-block-screenshots` Tool's `visual-diff.json` (bean `0rxe`).
 *
 * A renderer whose input is missing for a block is still LISTED, disabled,
 * with the reason. An option that silently vanishes reads as "this renderer
 * does not exist".
 *
 * ## Shipped, and not
 *
 * Word diff, inline rendered diff, side-by-side and the visual diff ship.
 * The DAK structural diff is a child bean, and is NOT listed here: a
 * registry entry with nothing behind it is a declared-but-absent Tool.
 */
import { z } from "zod";

export const DIFF_RENDERER_INPUTS = ["text", "pages", "screenshots"] as const;

export const DiffRendererSchema = z.object({
  /** Stable, and what a viewer's saved choice refers to. */
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  /** What the selector shows. Words, never an icon alone. */
  label: z.string().min(1),
  /** One sentence: what the reviewer will see. */
  description: z.string().min(1),
  needs: z.array(z.enum(DIFF_RENDERER_INPUTS)).min(1),
  /**
   * Block kinds this renderer is the DEFAULT for, from `BLOCK_KINDS`. `*` is
   * the fallback, and exactly one renderer carries it. Two renderers may list
   * the same kind: order is preference, and the page takes the first one
   * that can run on the block. A test holds every
   * other entry to a kind that exists, so a renamed kind cannot silently
   * lose its default.
   */
  defaultFor: z.array(z.string().min(1)),
});
export type DiffRenderer = z.infer<typeof DiffRendererSchema>;

export const DIFF_RENDERERS: readonly DiffRenderer[] = z.array(DiffRendererSchema).parse([
  {
    id: "word",
    label: "Word diff of the source",
    description: "The block's Markdown with removed words struck through and added words marked. Shows exactly what the author typed.",
    needs: ["text"],
    defaultFor: ["*"],
  },
  {
    id: "inline",
    label: "Inline, as rendered",
    description: "The block as a reader sees it now, with added words marked and removed words struck through where they were.",
    needs: ["text"],
    defaultFor: ["prose", "remark", "definition", "example"],
  },
  {
    id: "visual",
    label: "Pictures, before and after",
    description: "A picture of the block on the published page and on this preview, with a slider between them and a view that marks every changed pixel. For figures, diagrams and tables, whose markup says little.",
    needs: ["screenshots"],
    defaultFor: ["table", "figure", "diagram", "equation", "simulator"],
  },
  {
    id: "side-by-side",
    label: "Side by side",
    description: "The published page and this preview next to each other, each scrolled to the block. For tables, figures and anything whose layout is the change.",
    needs: ["pages"],
    // The second choice for the same kinds: the page opens a block on the
    // FIRST renderer that lists its kind and can run, so a build that
    // published no pictures opens tables side by side, not on a word diff.
    defaultFor: ["table", "figure", "diagram", "equation", "simulator"],
  },
]);

/** The renderer a block of `kind` opens with. */
export function defaultRendererFor(kind: string, renderers: readonly DiffRenderer[] = DIFF_RENDERERS): DiffRenderer {
  return (
    renderers.find((r) => r.defaultFor.includes(kind)) ??
    renderers.find((r) => r.defaultFor.includes("*")) ??
    renderers[0]!
  );
}
